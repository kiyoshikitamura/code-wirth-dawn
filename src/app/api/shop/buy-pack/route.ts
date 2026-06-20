import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, checkEmbargo, AuthError } from '@/lib/shopAuth';

export const dynamic = 'force-dynamic';

const PACK_PRICE = 5000;
const REFUND_AMOUNT = 500;

// New 40 skills, excluding the 3 black market ones:
// 3121 (book_death_sentence), 3129 (book_pay_to_win), 3132 (book_ruin_pact)
const POOLS = {
    SR: [3101, 3116, 3119],
    R: [3107, 3109, 3112, 3113, 3124, 3125, 3139],
    U: [3102, 3103, 3105, 3110, 3114, 3115, 3118, 3120, 3126, 3131],
    C: [3104, 3106, 3108, 3111, 3117, 3122, 3123, 3127, 3128, 3130, 3133, 3134, 3135, 3136, 3137, 3138, 3140]
};

// Helper to roll one card based on rates:
// Slots 1-4: SR (3%), R (12%), U (25%), C (60%)
// Slot 5: SR (20%), R (80%) (Rare guaranteed)
function rollCard(guaranteedRare: boolean): { rarity: 'SR' | 'R' | 'U' | 'C'; skillId: number } {
    const rand = Math.random() * 100;
    let rarity: 'SR' | 'R' | 'U' | 'C' = 'C';
    
    if (guaranteedRare) {
        if (rand < 20) {
            rarity = 'SR';
        } else {
            rarity = 'R';
        }
    } else {
        if (rand < 3) {
            rarity = 'SR';
        } else if (rand < 15) { // 3 + 12
            rarity = 'R';
        } else if (rand < 40) { // 15 + 25
            rarity = 'U';
        } else {
            rarity = 'C';
        }
    }
    
    const pool = POOLS[rarity];
    const skillId = pool[Math.floor(Math.random() * pool.length)];
    return { rarity, skillId };
}

export async function POST(req: Request) {
    try {
        // 1. Authenticate user
        const profile = await getAuthenticatedProfile(req);
        
        // 2. Check reputation embargo
        await checkEmbargo(profile);

        // 2.5 Ensure the user is not in the Hub location (Hub does not have Magic Academy)
        const { data: hubState } = await supabaseService
            .from('user_hub_states')
            .select('is_in_hub')
            .eq('user_id', profile.id)
            .maybeSingle();

        if (hubState?.is_in_hub) {
            return NextResponse.json({ error: 'ハブ拠点では魔術学院は利用できません。' }, { status: 400 });
        }
        
        // 3. Double Check Gold
        if (profile.gold < PACK_PRICE) {
            return NextResponse.json({ error: 'ゴールドが不足しています。' }, { status: 400 });
        }
        
        // 4. Fetch player's current owned skills
        const { data: ownedSkillsResult, error: ownedSkillsError } = await supabaseService
            .from('user_skills')
            .select('skill_id')
            .eq('user_id', profile.id);
            
        if (ownedSkillsError) {
            throw ownedSkillsError;
        }
        
        const ownedSkillIdsSet = new Set<number>((ownedSkillsResult || []).map(s => Number(s.skill_id)));
        
        // 5. Roll 5 cards
        const rolled: { rarity: 'SR' | 'R' | 'U' | 'C'; skillId: number }[] = [];
        for (let i = 0; i < 4; i++) {
            rolled.push(rollCard(false));
        }
        rolled.push(rollCard(true)); // Slot 5 is rare or above guaranteed
        
        // 6. Duplicate check and cashback calculation
        const trackingSet = new Set<number>(ownedSkillIdsSet);
        let refundGold = 0;
        const insertSkillIds: number[] = [];
        
        const results = rolled.map(roll => {
            const isDuplicate = trackingSet.has(roll.skillId);
            if (isDuplicate) {
                refundGold += REFUND_AMOUNT;
            } else {
                trackingSet.add(roll.skillId);
                insertSkillIds.push(roll.skillId);
            }
            return {
                skill_id: roll.skillId,
                rarity: roll.rarity,
                is_duplicate: isDuplicate
            };
        });
        
        // Calculate final cost
        const netCost = PACK_PRICE - refundGold;
        
        // 7. Transaction to deduct gold safely
        const { error: goldError } = await supabaseService
            .rpc('increment_gold', { p_user_id: profile.id, p_amount: -netCost });
            
        if (goldError) {
            console.error('[Buy Pack API] Gold deduction failed:', goldError);
            return NextResponse.json({ error: 'ゴールドの減算に失敗しました。所持金が不足している可能性があります。' }, { status: 400 });
        }
        
        // 8. Insert new skills
        if (insertSkillIds.length > 0) {
            const inserts = insertSkillIds.map(sid => ({
                user_id: profile.id,
                skill_id: sid,
                is_equipped: false
            }));
            
            const { error: insertError } = await supabaseService
                .from('user_skills')
                .insert(inserts);
                
            if (insertError) {
                console.error('[Buy Pack API] Skills insertion failed:', insertError);
                // Refund gold
                await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: netCost });
                return NextResponse.json({ error: 'スキルの登録に失敗しました。' }, { status: 500 });
            }
        }

        // 8.5 Record pack purchase activity log
        try {
            const { error: logError } = await supabaseService
                .from('academy_pack_logs')
                .insert({
                    user_id: profile.id,
                    pack_series: 'chaos_and_rebellion',
                    gold_spent: netCost,
                    refund_gold: refundGold
                });
            if (logError) {
                console.error('[Buy Pack API] Failed to write academy_pack_logs:', logError);
            }
        } catch (logExc) {
            console.error('[Buy Pack API] Exception writing academy_pack_logs:', logExc);
        }
        
        // 9. Fetch card details for response
        const rolledIds = results.map(r => r.skill_id);
        const { data: skillDetails, error: detailsError } = await supabaseService
            .from('skills')
            .select(`
                id,
                name,
                slug,
                image_url,
                description,
                cards (
                    name,
                    description,
                    image_url
                )
            `)
            .in('id', rolledIds);
            
        if (detailsError) {
            console.error('[Buy Pack API] Details fetch failed:', detailsError);
        }
        
        const detailsMap = new Map<number, any>();
        for (const detail of (skillDetails || [])) {
            detailsMap.set(Number(detail.id), detail);
        }
        
        const cardsResponse = results.map(r => {
            const detail = detailsMap.get(r.skill_id);
            return {
                id: r.skill_id,
                name: detail?.name || '未知の教本',
                slug: detail?.slug || 'unknown_book',
                image_url: detail?.cards?.image_url || detail?.image_url || '/images/items/book_focus.png',
                description: detail?.cards?.description || detail?.description || '',
                rarity: r.rarity,
                isDuplicate: r.is_duplicate
            };
        });
        
        // Fetch new gold total to return
        const { data: finalProfile } = await supabaseService
            .from('user_profiles')
            .select('gold')
            .eq('id', profile.id)
            .single();
            
        return NextResponse.json({
            success: true,
            cards: cardsResponse,
            refund: refundGold,
            new_gold: finalProfile?.gold ?? (profile.gold - netCost)
        });
        
    } catch (err: any) {
        console.error('[Buy Pack API] Error:', err);
        const status = err instanceof AuthError ? err.status : 500;
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status });
    }
}
