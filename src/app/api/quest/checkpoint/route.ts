process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthClient } from '@/lib/supabase-auth';
import { calculateGrowth } from '@/services/questService';
import {
    grantRewardItems,
    consumeUsedItems,
    grantReputationChanges,
} from '@/services/questCompleteHelpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

export async function POST(req: Request) {
    try {
        if (!supabaseServiceKey) {
            console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Key' }, { status: 500 });
        }

        const body = await req.json();
        const { quest_id, loot_pool, consumed_items, reputation_changes } = body;

        const client = createAuthClient(req);
        const { data: { user: authUser } } = await client.auth.getUser();
        const user_id = authUser?.id;

        if (!quest_id || !user_id) {
            return NextResponse.json({ error: 'Missing parameters or authentication required' }, { status: 401 });
        }

        // 1. Get user profile
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Process consumed items (deduct from inventory)
        if (Array.isArray(consumed_items) && consumed_items.length > 0) {
            await consumeUsedItems(supabase, user_id, consumed_items);
        }

        // 3. Process reputation changes
        if (reputation_changes && typeof reputation_changes === 'object' && Object.keys(reputation_changes).length > 0) {
            await grantReputationChanges(supabase, user_id, reputation_changes, user.current_location_id);
        }

        // 4. Classify loot pool
        let earnedGold = 0;
        let earnedExp = 0;
        const itemsToGrant: string[] = [];
        const skillsToGrant: string[] = [];

        if (Array.isArray(loot_pool)) {
            for (const item of loot_pool) {
                if (!item || !item.itemId) continue;
                const itemIdStr = String(item.itemId).trim();
                if (itemIdStr === 'gold') {
                    earnedGold += Number(item.quantity || 0);
                } else if (itemIdStr === 'exp') {
                    earnedExp += Number(item.quantity || 0);
                } else if (item.type === 'skill') {
                    skillsToGrant.push(itemIdStr);
                } else {
                    itemsToGrant.push(itemIdStr);
                }
            }
        }

        // 5. Grant items and skills
        const lootSaved: any[] = [];
        if (itemsToGrant.length > 0 || skillsToGrant.length > 0) {
            await grantRewardItems(
                supabase,
                user_id,
                { items: itemsToGrant, skills: skillsToGrant },
                lootSaved
            );
        }

        // 6. Grant gold, experience & calculate level up
        const updates: any = {};
        updates.gold = Math.max(0, (user.gold || 0) + earnedGold);

        let levelUpOccurred = false;
        let levelUpInfo = null;

        if (earnedExp > 0) {
            const currentLevel = Number(user.level || 1);
            const currentExp = Number(user.exp || 0);
            const currentAtk = Number(user.atk || 1);
            const currentDef = Number(user.def || 1);
            const maxHp = Number(user.max_hp || 85);

            const growthResult = calculateGrowth(
                currentLevel,
                currentExp,
                earnedExp,
                currentAtk,
                currentDef,
                maxHp
            );

            updates.exp = growthResult.newExp;

            if (growthResult.levelInfo.level_up) {
                const info = growthResult.levelInfo;
                updates.level = info.new_level;
                updates.max_hp = info.new_max_hp;
                updates.hp = info.new_max_hp; // Recover full HP on level up
                updates.max_deck_cost = info.new_max_cost;
                updates.atk = currentAtk + info.atk_increase;
                updates.def = currentDef + info.def_increase;
                levelUpOccurred = true;
                levelUpInfo = info;
            }
        }

        // 7. Persist updates to DB
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user_id);

        if (updateError) {
            console.error('[Checkpoint] Profile update error:', updateError);
            return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
        }

        // Construct clean response log
        const responseLoot = [];
        if (earnedGold > 0) {
            responseLoot.push({ itemId: 'gold', name: 'ゴールド', quantity: earnedGold, type: 'item' });
        }
        if (earnedExp > 0) {
            responseLoot.push({ itemId: 'exp', name: '経験値', quantity: earnedExp, type: 'item' });
        }
        responseLoot.push(...lootSaved);

        return NextResponse.json({
            success: true,
            loot_saved: responseLoot,
            level_up: levelUpOccurred,
            level_info: levelUpInfo
        });

    } catch (e: any) {
        console.error('[Checkpoint] Unhandled error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
