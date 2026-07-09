process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { PartyService } from '@/services/partyService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        const { data: defenseParty, error } = await supabaseServer
            .from('pvp_defense_parties')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[PvP Defense GET] Fetch error:', error);
            return NextResponse.json({ error: '防衛情報の取得に失敗しました。' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            party: defenseParty ? defenseParty.snapshot_data : null
        });

    } catch (err: any) {
        console.error('[PvP Defense GET] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // 1. ユーザープロフィール取得
        const { data: profile, error: profileError } = await supabaseServer
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'ユーザープロフィールが見つかりません。' }, { status: 404 });
        }

        // 2. パーティメンバー（NPC）の取得（PartyServiceでマスタデータ等を解決）
        const enrichedMembers = await PartyService.getEnrichedPartyMembers(userId);

        // 3. 装備品およびスキルデッキの取得
        const [inventoryResult, userSkillsResult] = await Promise.all([
            supabaseServer
                .from('inventory')
                .select('id, item_id, is_equipped, is_skill, quantity, items!inner(id, name, slug, type, effect_data, linked_card_id)')
                .eq('user_id', userId)
                .eq('is_equipped', true),
            supabaseServer
                .from('user_skills')
                .select(`
                    id,
                    is_equipped,
                    skills!inner (
                        id,
                        slug,
                        name,
                        card_id,
                        cards (
                            id,
                            slug,
                            name,
                            type,
                            effect_val,
                            ap_cost,
                            cost_type,
                            effect_id,
                            target_type,
                            image_url,
                            description
                        )
                    )
                `)
                .eq('user_id', userId)
                .eq('is_equipped', true)
        ]);

        if (inventoryResult.error) {
            console.error('[PvP Defense] Inventory fetch error:', inventoryResult.error);
            return NextResponse.json({ error: 'インベントリの取得に失敗しました。' }, { status: 500 });
        }

        if (userSkillsResult.error) {
            console.error('[PvP Defense] User skills fetch error:', userSkillsResult.error);
        }

        const equippedItems = (inventoryResult.data || [])
            .filter(i => (i as any).items && (i as any).items.type === 'equipment')
            .map(i => ({
                id: String(i.item_id),
                name: (i as any).items.name,
                type: (i as any).items.type,
                effect_data: (i as any).items.effect_data,
            }));

        const skillDeck = (userSkillsResult.data || [])
            .map((entry: any) => {
                const skill = entry.skills;
                if (!skill) return null;
                const card = skill.cards;
                if (!card) return null;
                return {
                    id: String(card.id),
                    slug: card.slug,
                    name: card.name,
                    type: card.type || 'Skill',
                    effect_val: card.effect_val || 0,
                    ap_cost: card.ap_cost ?? 1,
                    cost_type: card.cost_type || undefined,
                    effect_id: card.effect_id || undefined,
                    target_type: card.target_type || undefined,
                    image_url: card.image_url || undefined,
                    description: card.description || '',
                };
            })
            .filter(Boolean);

        // 4. プレイヤー自身の装備ボーナスおよび戦闘スコア計算
        const equipBonus = { atk: 0, def: 0, hp: 0 };
        for (const item of equippedItems) {
            const effect = item.effect_data;
            if (effect) {
                equipBonus.atk += effect.atk_bonus || 0;
                equipBonus.def += effect.def_bonus || 0;
                equipBonus.hp += effect.hp_bonus || 0;
            }
        }

        const playerFinalHp = (profile.hp ?? 100) + equipBonus.hp;
        const playerFinalAtk = (profile.atk ?? 10) + equipBonus.atk;
        const playerFinalDef = (profile.def ?? 10) + equipBonus.def;

        const playerCS = playerFinalHp + (playerFinalAtk * 10) + (playerFinalDef * 10);

        // 5. パーティメンバーのカード解決用ID集計
        const memberCardIds = new Set<number>();
        for (const m of enrichedMembers) {
            if (m.inject_cards && Array.isArray(m.inject_cards)) {
                m.inject_cards.forEach((id: any) => memberCardIds.add(Number(id)));
            }
        }

        const cardMap = new Map<number, any>();
        if (memberCardIds.size > 0) {
            const { data: dbCards } = await supabaseServer
                .from('cards')
                .select('*')
                .in('id', Array.from(memberCardIds));
            if (dbCards) {
                dbCards.forEach(c => cardMap.set(c.id, c));
            }
        }

        // 6. パーティメンバーの戦闘スコア計算およびスナップショット構築
        let membersCS = 0;
        const membersSnapshot = enrichedMembers.map((m: any) => {
            const memberHp = m.max_durability || m.max_hp || m.hp || m.durability || 100;
            const memberAtk = m.atk ?? 10;
            const memberDef = m.def ?? 10;

            const memberCS = memberHp + (memberAtk * 10) + (memberDef * 10);
            membersCS += memberCS;

            const resolvedDeck = (m.inject_cards || [])
                .map((id: any) => {
                    const c = cardMap.get(Number(id));
                    if (!c) return null;
                    return {
                        id: String(c.id),
                        slug: c.slug,
                        name: c.name,
                        type: c.type,
                        description: c.description || '',
                        cost: 0,
                        power: c.effect_val || 0,
                        ap_cost: c.ap_cost ?? 1,
                        cost_type: c.cost_type || undefined,
                        effect_id: c.effect_id || undefined,
                        effect_duration: c.effect_duration || undefined,
                        target_type: c.target_type || undefined,
                        image_url: c.image_url || undefined,
                    };
                })
                .filter(Boolean);

            return {
                id: String(m.id),
                name: m.name,
                slug: m.slug || null,
                job_class: m.job_class,
                level: m.level ?? 1,
                hp: memberHp,
                max_hp: memberHp,
                atk: memberAtk,
                def: memberDef,
                inject_cards: m.inject_cards || [],
                signature_deck_snapshot: resolvedDeck, // 解決済みのスキルカード
                equipped_items_snapshot: m.snapshot_data?.equipped_items || m.equipped_items || [],
                icon_url: m.icon_url || null,
                image_url: m.image_url || null,
                sort_order: m.sort_order ?? 0,
                snapshot_data: m.snapshot_data || null
            };
        });

        // 6. パーティ合計スコアとマッチングランク判定
        const totalScore = playerCS + membersCS;
        let rankClass: 'C' | 'B' | 'A' | 'S' = 'C';
        if (totalScore >= 5500) rankClass = 'S';
        else if (totalScore >= 3000) rankClass = 'A';
        else if (totalScore >= 1500) rankClass = 'B';

        const newSnapshot = {
            user_id: userId,
            user_name: profile.name || '名もなき旅人',
            avatar_url: profile.avatar_url || null,
            battle_score: totalScore,
            defense_rank: rankClass,
            player_snapshot: {
                level: profile.level ?? 1,
                job_class: profile.job_class || 'Adventurer',
                hp: playerFinalHp,
                max_hp: playerFinalHp,
                atk: playerFinalAtk,
                def: playerFinalDef,
                avatar_url: profile.avatar_url || null,
            },
            party_members_snapshot: membersSnapshot,
            equipped_items_snapshot: equippedItems,
            skill_deck_snapshot: skillDeck,
        };

        // 7. 差分検知 (ディファレンシャル・アップデータによる無駄なWrite遮断)
        const { data: existingParty } = await supabaseServer
            .from('pvp_defense_parties')
            .select('snapshot_data')
            .eq('user_id', userId)
            .maybeSingle();

        let hasChanged = true;
        if (existingParty && existingParty.snapshot_data) {
            const ext = existingParty.snapshot_data;
            const oldJSON = JSON.stringify({
                battle_score: ext.battle_score,
                player_snapshot: ext.player_snapshot,
                party_members_snapshot: ext.party_members_snapshot?.map((m: any) => ({ id: m.id, level: m.level, hp: m.hp, atk: m.atk, def: m.def })),
                equipped_items_snapshot: ext.equipped_items_snapshot,
                skill_deck_snapshot: ext.skill_deck_snapshot
            });
            const newJSON = JSON.stringify({
                battle_score: totalScore,
                player_snapshot: newSnapshot.player_snapshot,
                party_members_snapshot: membersSnapshot.map((m: any) => ({ id: m.id, level: m.level, hp: m.hp, atk: m.atk, def: m.def })),
                equipped_items_snapshot: equippedItems,
                skill_deck_snapshot: skillDeck
            });
            if (oldJSON === newJSON) {
                hasChanged = false;
            }
        }

        if (hasChanged) {
            const { error: upsertError } = await supabaseServer
                .from('pvp_defense_parties')
                .upsert({
                    user_id: userId,
                    defender_rank: rankClass,
                    snapshot_data: newSnapshot,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (upsertError) {
                console.error('[PvP Defense] Upsert error:', upsertError);
                return NextResponse.json({ 
                    error: `防衛パーティの登録に失敗しました: [${upsertError.code}] ${upsertError.message}`
                }, { status: 500 });
            }
        } else {
            console.log('[PvP Defense] No changes detected. Upsert skipped.');
        }

        return NextResponse.json({ 
            success: true, 
            message: hasChanged ? '防衛パーティを登録・更新しました。' : '防衛パーティに変更はありませんでした。',
            score: totalScore,
            rank: rankClass
        });

    } catch (err: any) {
        console.error('[PvP Defense] API Error:', err);
        return NextResponse.json({ 
            error: `内部エラーが発生しました: ${err.message}`, 
            stack: err.stack 
        }, { status: 500 });
    }
}
