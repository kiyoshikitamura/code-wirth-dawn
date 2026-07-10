process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { PartyService } from '@/services/partyService';

export const dynamic = 'force-dynamic';

// ─── NPCゴーストのプリセット定義 ───
const GHOST_PRESETS: Record<string, any[]> = {
    "C": [
        {
            "user_id": "ghost_c_1",
            "user_name": "レオ",
            "avatar_url": "/images/npcs/npc_roland_paladin_leo.png",
            "battle_score": 950,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 5,
                "job_class": "Warrior",
                "hp": 120,
                "max_hp": 120,
                "atk": 12,
                "def": 8
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_c_1_m1",
                    "name": "ハンス",
                    "job_class": "Guard",
                    "level": 4,
                    "hp": 100,
                    "max_hp": 100,
                    "atk": 8,
                    "def": 6,
                    "inject_cards": [4],
                    "image_url": "/images/npcs/npc_roland_guard_rookie.png",
                    "signature_deck_snapshot": [
                        { "id": "4", "name": "防御", "type": "Defense", "ap_cost": 1, "power": 10 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "150", "name": "鉄の短剣", "type": "equipment", "effect_data": { "atk_bonus": 2 } }
            ],
            "skill_deck_snapshot": [
                { "id": "1", "name": "強打", "type": "Skill", "ap_cost": 1, "power": 12 }
            ]
        },
        {
            "user_id": "ghost_c_2",
            "user_name": "サクラ",
            "avatar_url": "/images/npcs/npc_yato_miko_sakura.png",
            "battle_score": 1100,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 6,
                "job_class": "Miko",
                "hp": 110,
                "max_hp": 110,
                "atk": 9,
                "def": 10
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_c_2_m1",
                    "name": "エレナ",
                    "job_class": "Cleric",
                    "level": 5,
                    "hp": 90,
                    "max_hp": 90,
                    "atk": 6,
                    "def": 7,
                    "inject_cards": [13],
                    "image_url": "/images/npcs/npc_roland_elena.png",
                    "signature_deck_snapshot": [
                        { "id": "13", "name": "祈り", "type": "Heal", "ap_cost": 2, "power": 30 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "200", "name": "清らかな杖", "type": "equipment", "effect_data": { "def_bonus": 2 } }
            ],
            "skill_deck_snapshot": [
                { "id": "13", "name": "祈り", "type": "Heal", "ap_cost": 2, "power": 30 }
            ]
        },
        {
            "user_id": "ghost_c_3",
            "user_name": "クロヴィス",
            "avatar_url": "/images/npcs/npc_roland_scholar.png",
            "battle_score": 1250,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 7,
                "job_class": "Mage",
                "hp": 105,
                "max_hp": 105,
                "atk": 15,
                "def": 6
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_c_3_m1",
                    "name": "アレン",
                    "job_class": "Thief",
                    "level": 6,
                    "hp": 95,
                    "max_hp": 95,
                    "atk": 11,
                    "def": 5,
                    "inject_cards": [22],
                    "image_url": "/images/npcs/npc_free_adventurer_a.png",
                    "signature_deck_snapshot": [
                        { "id": "22", "name": "クナイ投げ", "type": "Skill", "ap_cost": 1, "power": 15 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "152", "name": "見習いの杖", "type": "equipment", "effect_data": { "atk_bonus": 3 } }
            ],
            "skill_deck_snapshot": [
                { "id": "66", "name": "氷槍", "type": "Magic", "ap_cost": 2, "power": 35 }
            ]
        },
        {
            "user_id": "ghost_c_4",
            "user_name": "サム",
            "avatar_url": "/images/npcs/npc_roland_hunter_sam.png",
            "battle_score": 1400,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 8,
                "job_class": "Hunter",
                "hp": 130,
                "max_hp": 130,
                "atk": 16,
                "def": 9
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_c_4_m1",
                    "name": "アレン",
                    "job_class": "Warrior",
                    "level": 7,
                    "hp": 140,
                    "max_hp": 140,
                    "atk": 18,
                    "def": 11,
                    "inject_cards": [3],
                    "image_url": "/images/npcs/npc_free_adventurer_a.png",
                    "signature_deck_snapshot": [
                        { "id": "3", "name": "突き", "type": "Skill", "ap_cost": 1, "power": 18 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "160", "name": "猟師の弓", "type": "equipment", "effect_data": { "atk_bonus": 6 } }
            ],
            "skill_deck_snapshot": [
                { "id": "7", "name": "集中", "type": "Support", "ap_cost": 2, "power": 0 }
            ]
        }
    ],
    "B": [
        {
            "user_id": "ghost_b_1",
            "user_name": "アレン",
            "avatar_url": "/images/npcs/npc_free_adventurer_a.png",
            "battle_score": 2400,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 12,
                "job_class": "Warrior",
                "hp": 210,
                "max_hp": 210,
                "atk": 22,
                "def": 18
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_b_1_m1",
                    "name": "レオ",
                    "job_class": "Paladin",
                    "level": 11,
                    "hp": 240,
                    "max_hp": 240,
                    "atk": 16,
                    "def": 25,
                    "inject_cards": [15],
                    "image_url": "/images/npcs/npc_roland_paladin_leo.png",
                    "signature_deck_snapshot": [
                        { "id": "15", "name": "聖壁", "type": "Defense", "ap_cost": 3, "power": 20 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "182", "name": "ブロードソード", "type": "equipment", "effect_data": { "atk_bonus": 8, "def_bonus": 3 } }
            ],
            "skill_deck_snapshot": [
                { "id": "1", "name": "強打", "type": "Skill", "ap_cost": 1, "power": 12 },
                { "id": "15", "name": "聖壁", "type": "Defense", "ap_cost": 3, "power": 20 }
            ]
        },
        {
            "user_id": "ghost_b_2",
            "user_name": "アベ",
            "avatar_url": "/images/npcs/npc_yato_onmyoji.png",
            "battle_score": 2600,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 13,
                "job_class": "Mage",
                "hp": 180,
                "max_hp": 180,
                "atk": 28,
                "def": 12
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_b_2_m1",
                    "name": "アレン",
                    "job_class": "Thief",
                    "level": 12,
                    "hp": 190,
                    "max_hp": 190,
                    "atk": 20,
                    "def": 14,
                    "inject_cards": [16],
                    "image_url": "/images/npcs/npc_free_adventurer_a.png",
                    "signature_deck_snapshot": [
                        { "id": "16", "name": "砂の罠", "type": "Support", "ap_cost": 1, "power": 0 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "184", "name": "賢者のローブ", "type": "equipment", "effect_data": { "def_bonus": 6, "hp_bonus": 20 } }
            ],
            "skill_deck_snapshot": [
                { "id": "67", "name": "雷撃", "type": "Magic", "ap_cost": 3, "power": 45 },
                { "id": "16", "name": "砂の罠", "type": "Support", "ap_cost": 1, "power": 0 }
            ]
        },
        {
            "user_id": "ghost_b_3",
            "user_name": "エレナ",
            "avatar_url": "/images/npcs/npc_roland_elena.png",
            "battle_score": 2800,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 14,
                "job_class": "Cleric",
                "hp": 230,
                "max_hp": 230,
                "atk": 15,
                "def": 22
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_b_3_m1",
                    "name": "アレン",
                    "job_class": "Warrior",
                    "level": 13,
                    "hp": 250,
                    "max_hp": 250,
                    "atk": 26,
                    "def": 16,
                    "inject_cards": [3],
                    "image_url": "/images/npcs/npc_free_adventurer_a.png",
                    "signature_deck_snapshot": [
                        { "id": "3", "name": "突き", "type": "Skill", "ap_cost": 1, "power": 18 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "186", "name": "ルーンシールド", "type": "equipment", "effect_data": { "def_bonus": 12 } }
            ],
            "skill_deck_snapshot": [
                { "id": "14", "name": "治癒", "type": "Heal", "ap_cost": 2, "power": 80 }
            ]
        }
    ],
    "A": [
        {
            "user_id": "ghost_a_1",
            "user_name": "サクラ",
            "avatar_url": "/images/npcs/npc_yato_miko_sakura.png",
            "battle_score": 4200,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 18,
                "job_class": "Sage",
                "hp": 290,
                "max_hp": 290,
                "atk": 35,
                "def": 20
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_a_1_m1",
                    "name": "クロヴィス",
                    "job_class": "Mage",
                    "level": 17,
                    "hp": 240,
                    "max_hp": 240,
                    "atk": 32,
                    "def": 14,
                    "inject_cards": [65],
                    "image_url": "/images/npcs/npc_roland_scholar.png",
                    "signature_deck_snapshot": [
                        { "id": "65", "name": "火球", "type": "Magic", "ap_cost": 2, "power": 40 }
                    ]
                },
                {
                    "id": "ghost_a_1_m2",
                    "name": "アレン",
                    "job_class": "Warrior",
                    "level": 17,
                    "hp": 310,
                    "max_hp": 310,
                    "atk": 30,
                    "def": 24,
                    "inject_cards": [6],
                    "image_url": "/images/npcs/npc_free_adventurer_a.png",
                    "signature_deck_snapshot": [
                        { "id": "6", "name": "シールドバッシュ", "type": "Defense", "ap_cost": 2, "power": 10 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "190", "name": "アークロッド", "type": "equipment", "effect_data": { "atk_bonus": 15 } }
            ],
            "skill_deck_snapshot": [
                { "id": "66", "name": "氷槍", "type": "Magic", "ap_cost": 2, "power": 35 },
                { "id": "65", "name": "火球", "type": "Magic", "ap_cost": 2, "power": 40 }
            ]
        },
        {
            "user_id": "ghost_a_2",
            "user_name": "レオ",
            "avatar_url": "/images/npcs/npc_roland_paladin_leo.png",
            "battle_score": 4500,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 20,
                "job_class": "DragonKnight",
                "hp": 380,
                "max_hp": 380,
                "atk": 42,
                "def": 28
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_a_2_m1",
                    "name": "ハンス",
                    "job_class": "Paladin",
                    "level": 19,
                    "hp": 360,
                    "max_hp": 360,
                    "atk": 25,
                    "def": 35,
                    "inject_cards": [35],
                    "image_url": "/images/npcs/npc_roland_guard_rookie.png",
                    "signature_deck_snapshot": [
                        { "id": "35", "name": "絶対防御", "type": "Defense", "ap_cost": 4, "power": 50 }
                    ]
                },
                {
                    "id": "ghost_a_2_m2",
                    "name": "エレナ",
                    "job_class": "Priest",
                    "level": 19,
                    "hp": 280,
                    "max_hp": 280,
                    "atk": 18,
                    "def": 26,
                    "inject_cards": [13],
                    "image_url": "/images/npcs/npc_roland_elena.png",
                    "signature_deck_snapshot": [
                        { "id": "13", "name": "祈り", "type": "Heal", "ap_cost": 2, "power": 30 }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                { "id": "195", "name": "ドラグーンランス", "type": "equipment", "effect_data": { "atk_bonus": 22 } }
            ],
            "skill_deck_snapshot": [
                { "id": "45", "name": "岩砕き", "type": "Skill", "ap_cost": 4, "power": 55 }
            ]
        }
    ],
    "S": [
        {
            "user_id": "ghost_s_volg",
            "user_name": "ヴォルグ",
            "avatar_url": "/images/npcs/npc_guest_volg.png",
            "battle_score": 6800,
            "defense_rank": "S",
            "is_ghost": true,
            "player_snapshot": {
                "level": 20,
                "job_class": "Civilian",
                "hp": 680,
                "max_hp": 680,
                "atk": 30,
                "def": 30
            },
            "party_members_snapshot": [],
            "equipped_items_snapshot": [
                { "id": "180", "name": "竜殺しの大剣", "type": "equipment", "effect_data": { "atk_bonus": 15, "def_bonus": 5 } }
            ],
            "skill_deck_snapshot": [
                { "id": "1", "name": "強打", "type": "Skill", "ap_cost": 1, "power": 12 },
                { "id": "28", "name": "鉄布衫", "type": "Defense", "ap_cost": 3, "power": 30 }
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

        // 1. 自身の最新ステータスとスコアを算出
        const { data: profile } = await supabaseServer
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({ error: 'ユーザープロフィールが見つかりません。' }, { status: 404 });
        }

        const myRate = profile.arena_rate ?? 1000;
        const myLevel = profile.level || 1;
        const myHp = profile.hp || 100;
        const myAtk = profile.atk || 10;
        const myDef = profile.def || 10;

        // 自身の防衛パーティ登録状態をチェック
        const defensePartyCheck = await supabaseServer
            .from('pvp_defense_parties')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        // 自身の同行者（NPC）を取得
        const enrichedMembers = await PartyService.getEnrichedPartyMembers(userId);

        let membersCS = 0;
        for (const m of enrichedMembers) {
            const memberHp = m.max_durability || m.max_hp || m.hp || m.durability || 100;
            const memberAtk = m.atk ?? 10;
            const memberDef = m.def ?? 10;
            membersCS += (memberHp + (memberAtk * 10) + (memberDef * 10));
        }

        const playerCS = myHp + (myAtk * 10) + (myDef * 10);
        const totalScore = playerCS + membersCS;

        // チャレンジャーのランク判定
        let rankClass: 'C' | 'B' | 'A' | 'S' = 'C';
        if (totalScore >= 8000) rankClass = 'S';
        else if (totalScore >= 4000) rankClass = 'A';
        else if (totalScore >= 2000) rankClass = 'B';

        // 2. 実在する他のユーザーの防衛デッキ（pvp_defense_parties）を優先取得
        // 重複排除のための seenUserIds セット (自分自身および本番テストユーザーを除外)
        const seenUserIds = new Set<string>();
        seenUserIds.add(userId);
        seenUserIds.add('c1cf67dd-527a-497e-bf88-ce10c2cb516f');
        seenUserIds.add('5ad434ec-763f-473e-939f-14a5e9e1cc93');

        // フェーズ1: 同ランク優先枠 (最大2枠)
        const { data: sameRankOpponents } = await supabaseServer
            .from('pvp_defense_parties')
            .select('user_id, defender_rank, updated_at, snapshot_data')
            .eq('defender_rank', rankClass)
            .neq('user_id', userId)
            .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
            .neq('user_id', '5ad434ec-763f-473e-939f-14a5e9e1cc93')
            .limit(10);

        const chosenSameRank: any[] = [];
        if (sameRankOpponents && sameRankOpponents.length > 0) {
            const shuffled = [...sameRankOpponents].sort(() => Math.random() - 0.5);
            for (const opp of shuffled) {
                if (chosenSameRank.length >= 2) break;
                if (!seenUserIds.has(opp.user_id)) {
                    chosenSameRank.push(opp);
                    seenUserIds.add(opp.user_id);
                }
            }
        }

        // フェーズ2: レンジランダム枠 (残りの枠)
        const slotsNeeded = 5 - chosenSameRank.length;
        const { data: rangeOpponents } = await supabaseServer
            .from('pvp_defense_parties')
            .select('user_id, defender_rank, updated_at, snapshot_data')
            .neq('user_id', userId)
            .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
            .neq('user_id', '5ad434ec-763f-473e-939f-14a5e9e1cc93')
            .limit(30);

        const chosenOthers: any[] = [];
        if (rangeOpponents && slotsNeeded > 0) {
            const shuffled = [...rangeOpponents].sort(() => Math.random() - 0.5);
            for (const opp of shuffled) {
                if (chosenOthers.length >= slotsNeeded) break;
                if (!seenUserIds.has(opp.user_id)) {
                    chosenOthers.push(opp);
                    seenUserIds.add(opp.user_id);
                }
            }
        }

        // 一覧用の軽量フォーマットに整形
        let opponentsList = [...chosenSameRank, ...chosenOthers].map(opp => {
            const snap = opp.snapshot_data || {};
            return {
                user_id: opp.user_id,
                user_name: snap.user_name || '名もなき旅人',
                avatar_url: snap.avatar_url || null,
                battle_score: snap.battle_score || 1000,
                defense_rank: opp.defender_rank,
                is_ghost: false,
                player_snapshot: {
                    level: snap.player_snapshot?.level || 1,
                    job_class: snap.player_snapshot?.job_class || 'Adventurer',
                    avatar_url: snap.avatar_url || null,
                },
                party_members_snapshot: (snap.party_members_snapshot || []).map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    job_class: m.job_class,
                    level: m.level,
                    hp: m.hp,
                    max_hp: m.max_hp,
                    atk: m.atk,
                    def: m.def,
                    image_url: m.image_url || m.icon_url || m.avatar_url || null,
                    icon_url: m.icon_url || m.image_url || m.avatar_url || null,
                    avatar_url: m.avatar_url || m.icon_url || m.image_url || null
                })),
                equipped_items_snapshot: undefined,
                skill_deck_snapshot: undefined,
                arena_rate: 1000
            };
        });

        // 3. 不足分をゴーストダミーデータで補填 (最大5件、seenUserIdsによる重複遮断)
        let ghostCountNeeded = 5 - opponentsList.length;
        if (ghostCountNeeded > 0) {
            // まずは同ランクのゴーストから補充
            const primaryPool = GHOST_PRESETS[rankClass] || GHOST_PRESETS.C;
            const shuffledPrimary = [...primaryPool].sort(() => Math.random() - 0.5);
            
            for (const g of shuffledPrimary) {
                if (ghostCountNeeded <= 0) break;
                if (!seenUserIds.has(g.user_id)) {
                    opponentsList.push({
                        ...g,
                        arena_rate: 1000
                    });
                    seenUserIds.add(g.user_id);
                    ghostCountNeeded--;
                }
            }
            
            // それでも足りない場合は、全ランクのゴーストプールから重複しないものを補充
            if (ghostCountNeeded > 0) {
                const allRanks: ('S' | 'A' | 'B' | 'C')[] = ['S', 'A', 'B', 'C'];
                for (const r of allRanks) {
                    if (ghostCountNeeded <= 0) break;
                    const fallbackPool = GHOST_PRESETS[r] || [];
                    const shuffledFallback = [...fallbackPool].sort(() => Math.random() - 0.5);
                    for (const g of shuffledFallback) {
                        if (ghostCountNeeded <= 0) break;
                        if (!seenUserIds.has(g.user_id)) {
                            opponentsList.push({
                                ...g,
                                arena_rate: 1000
                            });
                            seenUserIds.add(g.user_id);
                            ghostCountNeeded--;
                        }
                    }
                }
            }
        }

        // シャッフルして5件に制限
        opponentsList = [...opponentsList].sort(() => Math.random() - 0.5).slice(0, 5);

        // 各対戦相手の現在のアリーナレートを DB からピンポイント取得してマージ
        const targetUserIds = opponentsList.filter(o => !o.is_ghost).map(o => o.user_id);
        if (targetUserIds.length > 0) {
            const { data: rates } = await supabaseServer
                .from('user_profiles')
                .select('id, arena_rate')
                .in('id', targetUserIds);
            
            if (rates) {
                const rateMap = new Map(rates.map(r => [r.id, r.arena_rate]));
                opponentsList = opponentsList.map(o => {
                    if (!o.is_ghost && rateMap.has(o.user_id)) {
                        return {
                            ...o,
                            arena_rate: rateMap.get(o.user_id) ?? 1000
                        };
                    }
                    return o;
                });
            }
        }

        return NextResponse.json({
            success: true,
            challenger_score: totalScore,
            challenger_rank: rankClass,
            challenger_rating: myRate,
            has_defense_party: !!defensePartyCheck?.data,
            opponents: opponentsList
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });

    } catch (err: any) {
        console.error('[PvP Opponents] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
