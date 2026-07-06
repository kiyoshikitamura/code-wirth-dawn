process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { PartyService } from '@/services/partyService';

export const dynamic = 'force-dynamic';

// ─── NPCゴーストのプリセット定義 ──────────────────────────
const GHOST_PRESETS: Record<string, any[]> = {
    C: [
        {
            user_id: 'ghost_c_1',
            user_name: '新米のレオ',
            avatar_url: '/images/npcs/apprentice_warrior.png',
            battle_score: 950,
            defense_rank: 'C',
            is_ghost: true,
            player_snapshot: { level: 5, job_class: 'Warrior', hp: 120, max_hp: 120, atk: 12, def: 8 },
            party_members_snapshot: [
                { id: 'ghost_c_1_m1', name: 'ハンス', job_class: 'Guard', level: 4, hp: 100, max_hp: 100, atk: 8, def: 6, inject_cards: [2], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '150', name: '鉄の短剣', type: 'equipment', effect_data: { atk_bonus: 2 } }
            ],
            skill_deck_snapshot: [
                { id: '2', name: '斬撃', type: 'Skill', ap_cost: 1, power: 10 }
            ]
        },
        {
            user_id: 'ghost_c_2',
            user_name: '放浪のサクラ',
            avatar_url: '/images/npcs/wandering_miko.png',
            battle_score: 1100,
            defense_rank: 'C',
            is_ghost: true,
            player_snapshot: { level: 6, job_class: 'Miko', hp: 110, max_hp: 110, atk: 9, def: 10 },
            party_members_snapshot: [
                { id: 'ghost_c_2_m1', name: 'エレナ', job_class: 'Cleric', level: 5, hp: 90, max_hp: 90, atk: 6, def: 7, inject_cards: [14], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '191', name: '旅人の外套', type: 'equipment', effect_data: { def_bonus: 3 } }
            ],
            skill_deck_snapshot: [
                { id: '14', name: '治癒', type: 'Skill', ap_cost: 2, power: -15 }
            ]
        }
    ],
    B: [
        {
            user_id: 'ghost_b_1',
            user_name: '堅牢のクロード',
            avatar_url: '/images/npcs/iron_knight.png',
            battle_score: 2200,
            defense_rank: 'B',
            is_ghost: true,
            player_snapshot: { level: 15, job_class: 'Knight', hp: 320, max_hp: 320, atk: 18, def: 22 },
            party_members_snapshot: [
                { id: 'ghost_b_1_m1', name: 'ガッツ', job_class: 'Mercenary', level: 14, hp: 280, max_hp: 280, atk: 22, def: 12, inject_cards: [1, 9], image_url: null },
                { id: 'ghost_b_1_m2', name: 'アンナ', job_class: 'Priest', level: 12, hp: 140, max_hp: 140, atk: 8, def: 10, inject_cards: [14], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '191', name: '騎士の盾', type: 'equipment', effect_data: { def_bonus: 10, hp_bonus: 50 } },
                { id: '192', name: '白銀の槍', type: 'equipment', effect_data: { atk_bonus: 8 } }
            ],
            skill_deck_snapshot: [
                { id: '1', name: '強打', type: 'Skill', ap_cost: 2, power: 25 },
                { id: '9', name: '挑発', type: 'Skill', ap_cost: 1, power: 0 }
            ]
        },
        {
            user_id: 'ghost_b_2',
            user_name: '風のレン',
            avatar_url: '/images/npcs/wind_ranger.png',
            battle_score: 2450,
            defense_rank: 'B',
            is_ghost: true,
            player_snapshot: { level: 18, job_class: 'Ranger', hp: 240, max_hp: 240, atk: 25, def: 14 },
            party_members_snapshot: [
                { id: 'ghost_b_2_m1', name: 'サム', job_class: 'Hunter', level: 16, hp: 200, max_hp: 200, atk: 24, def: 9, inject_cards: [3], image_url: null },
                { id: 'ghost_b_2_m2', name: 'ライラ', job_class: 'Dancer', level: 15, hp: 160, max_hp: 160, atk: 12, def: 8, inject_cards: [5], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '196', name: '冒険者の靴', type: 'equipment', effect_data: { atk_bonus: 5, def_bonus: 4 } }
            ],
            skill_deck_snapshot: [
                { id: '3', name: '突き', type: 'Skill', ap_cost: 1, power: 18 },
                { id: '8', name: 'クイックステップ', type: 'Skill', ap_cost: 1, power: 0 }
            ]
        }
    ],
    A: [
        {
            user_id: 'ghost_a_1',
            user_name: '賢者アルス',
            avatar_url: '/images/npcs/wise_mage.png',
            battle_score: 4100,
            defense_rank: 'A',
            is_ghost: true,
            player_snapshot: { level: 32, job_class: 'Sage', hp: 480, max_hp: 480, atk: 45, def: 28 },
            party_members_snapshot: [
                { id: 'ghost_a_1_m1', name: 'レオ', job_class: 'Paladin', level: 30, hp: 550, max_hp: 550, atk: 35, def: 32, inject_cards: [11, 15], image_url: null },
                { id: 'ghost_a_1_m2', name: 'クロヴィス', job_class: 'Scholar', level: 28, hp: 220, max_hp: 220, atk: 48, def: 18, inject_cards: [12], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '230', name: '大賢者の杖', type: 'equipment', effect_data: { atk_bonus: 20 } },
                { id: '194', name: '十字軍の指輪', type: 'equipment', effect_data: { hp_bonus: 80, def_bonus: 5 } }
            ],
            skill_deck_snapshot: [
                { id: '12', name: '裁き', type: 'Skill', ap_cost: 3, power: 55 },
                { id: '15', name: '聖壁', type: 'Skill', ap_cost: 2, power: 0 }
            ]
        },
        {
            user_id: 'ghost_a_2',
            user_name: '不知火のゲンジ',
            avatar_url: '/images/npcs/shadow_samurai.png',
            battle_score: 4500,
            defense_rank: 'A',
            is_ghost: true,
            player_snapshot: { level: 35, job_class: 'Samurai', hp: 580, max_hp: 580, atk: 62, def: 25 },
            party_members_snapshot: [
                { id: 'ghost_a_2_m1', name: 'ケンジ', job_class: 'Samurai', level: 32, hp: 480, max_hp: 480, atk: 58, def: 22, inject_cards: [25], image_url: null },
                { id: 'ghost_a_2_m2', name: 'アヤメ', job_class: 'Ninja', level: 30, hp: 320, max_hp: 320, atk: 42, def: 18, inject_cards: [18], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '206', name: '草薙の剣(模造)', type: 'equipment', effect_data: { atk_bonus: 28 } }
            ],
            skill_deck_snapshot: [
                { id: '25', name: '居合切り', type: 'Skill', ap_cost: 2, power: 45 }
            ]
        }
    ],
    S: [
        {
            user_id: 'ghost_s_1',
            user_name: '英霊王ヴォルグ',
            avatar_url: '/images/npcs/spirit_king.png',
            battle_score: 7500,
            defense_rank: 'S',
            is_ghost: true,
            player_snapshot: { level: 50, job_class: 'Hero', hp: 950, max_hp: 950, atk: 90, def: 65 },
            party_members_snapshot: [
                { id: 'ghost_s_1_m1', name: 'ヴォルグ', job_class: 'Mercenary', level: 50, hp: 1200, max_hp: 1200, atk: 85, def: 55, inject_cards: [29, 48], image_url: null },
                { id: 'ghost_s_1_m2', name: 'ガウェイン', job_class: 'Knight', level: 48, hp: 980, max_hp: 980, atk: 48, def: 75, inject_cards: [9, 71], image_url: null },
                { id: 'ghost_s_1_m3', name: 'レオ', job_class: 'Paladin', level: 45, hp: 800, max_hp: 800, atk: 52, def: 58, inject_cards: [15, 14], image_url: null }
            ],
            equipped_items_snapshot: [
                { id: '208', name: '青龍偃月刀', type: 'equipment', effect_data: { atk_bonus: 45 } },
                { id: '203', name: '当世具足', type: 'equipment', effect_data: { def_bonus: 30, hp_bonus: 200 } }
            ],
            skill_deck_snapshot: [
                { id: '48', name: '天翔斬', type: 'Skill', ap_cost: 3, power: 80 },
                { id: '71', name: '五星の加護', type: 'Skill', ap_cost: 2, power: 0 }
            ]
        }
    ]
};

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // 1. 挑戦者プレイヤーの現在戦闘スコアとランクの算出
        const [profileResult, enrichedMembers, inventoryResult, statsResult] = await Promise.all([
            supabaseServer
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(),
            PartyService.getEnrichedPartyMembers(userId),
            supabaseServer
                .from('inventory')
                .select('item_id, is_equipped, is_skill, items!inner(type, effect_data)')
                .eq('user_id', userId)
                .eq('is_equipped', true),
            supabaseServer
                .from('pvp_user_stats')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()
        ]);

        const profile = profileResult.data;
        if (!profile) {
            return NextResponse.json({ error: 'ユーザープロフィールが見つかりません。' }, { status: 404 });
        }

        // 装備ボーナス集計
        const equipBonus = { atk: 0, def: 0, hp: 0 };
        if (inventoryResult.data) {
            for (const item of inventoryResult.data) {
                const effect = (item as any).items?.effect_data;
                if (effect && (item as any).items?.type === 'equipment') {
                    equipBonus.atk += effect.atk_bonus || 0;
                    equipBonus.def += effect.def_bonus || 0;
                    equipBonus.hp += effect.hp_bonus || 0;
                }
            }
        }

        const playerFinalHp = (profile.hp ?? 100) + equipBonus.hp;
        const playerFinalAtk = (profile.atk ?? 10) + equipBonus.atk;
        const playerFinalDef = (profile.def ?? 10) + equipBonus.def;

        const playerCS = playerFinalHp + (playerFinalAtk * 10) + (playerFinalDef * 10);

        let membersCS = 0;
        for (const m of enrichedMembers) {
            const memberHp = m.max_durability || m.max_hp || m.hp || m.durability || 100;
            const memberAtk = m.atk ?? 10;
            const memberDef = m.def ?? 10;
            membersCS += (memberHp + (memberAtk * 10) + (memberDef * 10));
        }

        const totalScore = playerCS + membersCS;
        let rankClass: 'C' | 'B' | 'A' | 'S' = 'C';
        if (totalScore >= 5500) rankClass = 'S';
        else if (totalScore >= 3000) rankClass = 'A';
        else if (totalScore >= 1500) rankClass = 'B';

        console.log(`[PvP Matching] Challenger score: ${totalScore}, Rank: ${rankClass}`);

        // 2. DBから同じランクの防衛パーティを取得（自分は除く）
        const { data: dbOpponents, error: dbError } = await supabaseServer
            .from('pvp_defense_parties')
            .select('*')
            .eq('defense_rank', rankClass)
            .neq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(5);

        if (dbError) {
            console.error('[PvP Opponents] Database fetch error:', dbError);
            return NextResponse.json({ error: '対戦相手の取得に失敗しました。' }, { status: 500 });
        }

        let opponentsList = dbOpponents ? [...dbOpponents] : [];

        // 3. 不足分をゴーストデータで補填 (最大5件)
        const ghostCountNeeded = 5 - opponentsList.length;
        if (ghostCountNeeded > 0) {
            const presets = GHOST_PRESETS[rankClass] || [];
            // ランダムにプリセットから追加
            let addedCount = 0;
            // プリセットが少ない場合に備えてループするが、重複しすぎないように適宜インデックスを回す
            for (let i = 0; i < ghostCountNeeded && presets.length > 0; i++) {
                const presetIndex = i % presets.length;
                opponentsList.push(presets[presetIndex]);
                addedCount++;
            }
            console.log(`[PvP Matching] Filled list with ${addedCount} ghosts for rank ${rankClass}`);
        }

        return NextResponse.json({
            success: true,
            challenger_score: totalScore,
            challenger_rank: rankClass,
            challenger_stats: statsResult.data || { wins: 0, losses: 0, current_streak: 0, max_streak: 0, rating: 1500 },
            opponents: opponentsList
        });

    } catch (err: any) {
        console.error('[PvP Opponents] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
