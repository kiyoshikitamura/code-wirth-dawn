process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { PartyService } from '@/services/partyService';

export const dynamic = 'force-dynamic';

// ─── NPCゴーストのプリセット定義 ──────────────────────────
const GHOST_PRESETS: Record<string, any[]> = {
    "C": [
        {
            "user_id": "ghost_c_1",
            "user_name": "新米のレオ",
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
                    "inject_cards": [
                        2
                    ],
                    "image_url": "/images/npcs/npc_roland_guard_rookie.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "150",
                    "name": "鉄の短剣",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 2
                    }
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "2",
                    "name": "斬撃",
                    "type": "Skill",
                    "ap_cost": 1,
                    "power": 10
                }
            ]
        },
        {
            "user_id": "ghost_c_2",
            "user_name": "放浪 of サクラ",
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
                    "inject_cards": [
                        14
                    ],
                    "image_url": "/images/npcs/npc_roland_elena.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "191",
                    "name": "旅人の外套",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 3
                    }
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "14",
                    "name": "治癒",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": -15
                }
            ]
        },
        {
            "user_id": "2e3beb82-3fb8-4321-b13c-9eaa7a4ca897",
            "user_name": "将哉",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855",
            "battle_score": 833,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 21,
                "job_class": "Warrior",
                "hp": 353,
                "max_hp": 353,
                "atk": 23,
                "def": 25
            },
            "party_members_snapshot": [],
            "equipped_items_snapshot": [
                {
                    "id": "ca50250f-cdcf-475f-bca6-8e5a689a034b",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "214f0a08-f20d-48c1-8ba9-a2706fed07ce",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "dd4c45a5-ebe3-4d39-9437-1c8fac582619",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a31ca3a3-50e5-4eab-ad33-d1ae1d3e1921",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a373d93e-9afe-4021-974c-8276da353152",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "117",
                    "name": "ブレインスピン",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "2",
                    "name": "斬撃",
                    "type": "Skill",
                    "ap_cost": 1,
                    "power": 12
                },
                {
                    "id": "102",
                    "name": "傷口をえぐる",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 25
                },
                {
                    "id": "26",
                    "name": "氣の癒やし",
                    "type": "Heal",
                    "ap_cost": 2,
                    "power": 70
                },
                {
                    "id": "25",
                    "name": "居合切り",
                    "type": "Skill",
                    "ap_cost": 4,
                    "power": 100
                }
            ]
        },
        {
            "user_id": "44508458-016f-4d3f-810c-1c5a8827e17f",
            "user_name": "ななにく",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 522,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 14,
                "job_class": "Warrior",
                "hp": 242,
                "max_hp": 242,
                "atk": 19,
                "def": 9
            },
            "party_members_snapshot": [],
            "equipped_items_snapshot": [
                {
                    "id": "8080fdbd-509f-4da1-8129-d4336f66973c",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "4a5b357b-21a2-48e0-b4ef-1cfc94b69277",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "e437260f-9209-465e-b4cf-cfb9bc955306",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "116",
                    "name": "プロミネンス",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 50
                },
                {
                    "id": "49",
                    "name": "黒曜球",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 65
                },
                {
                    "id": "11",
                    "name": "聖剣",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 50
                }
            ]
        },
        {
            "user_id": "b1d58f98-e6ab-4363-bd2d-62f519592068",
            "user_name": "アルティス",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/b1d58f98-e6ab-4363-bd2d-62f519592068/avatar.png?t=1782371555600",
            "battle_score": 561,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 14,
                "job_class": "Warrior",
                "hp": 221,
                "max_hp": 221,
                "atk": 19,
                "def": 15
            },
            "party_members_snapshot": [],
            "equipped_items_snapshot": [
                {
                    "id": "5fef4ead-ee12-4d59-9109-9e1110e5df7f",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "67e951c3-87e2-46a5-921d-5e877aceafe9",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "27a65104-28bd-4889-81c8-1cd5c6b7dbf2",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "ad1a8aa5-baa4-4f10-88ef-2525eef148c6",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "83b2df90-d649-475b-b90b-77e67c7f4d27",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "49",
                    "name": "黒曜球",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 65
                },
                {
                    "id": "65",
                    "name": "火球",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 40
                },
                {
                    "id": "7",
                    "name": "集中",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "20",
                    "name": "オアシスの水",
                    "type": "Heal",
                    "ap_cost": 2,
                    "power": 60
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "136",
                    "name": "ファイアウェーブ",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 20
                }
            ]
        }
    ],
    "B": [
        {
            "user_id": "c7906aec-ba14-4e35-8102-b21c6bea529a",
            "user_name": "ベル",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c7906aec-ba14-4e35-8102-b21c6bea529a/avatar.jpeg?t=1781659829258",
            "battle_score": 2509,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 19,
                "job_class": "Warrior",
                "hp": 274,
                "max_hp": 274,
                "atk": 24,
                "def": 28
            },
            "party_members_snapshot": [
                {
                    "id": 1451,
                    "name": "ラヴィーネ",
                    "job_class": "Civilian",
                    "level": 13,
                    "hp": 401,
                    "max_hp": 401,
                    "atk": 18,
                    "def": 14,
                    "inject_cards": [
                        1,
                        13,
                        124,
                        37,
                        119,
                        114
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.jpg?t=1782300093251"
                },
                {
                    "id": 1317,
                    "name": "魔剣士 テリア",
                    "job_class": "Civilian",
                    "level": 20,
                    "hp": 584,
                    "max_hp": 584,
                    "atk": 19,
                    "def": 22,
                    "inject_cards": [
                        139,
                        16,
                        124,
                        27,
                        117,
                        119,
                        112,
                        64,
                        115
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1782498046183"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "7bb3d599-dee5-4bd2-8971-e6111240fae0",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "4f3950ef-0f46-4ab0-981f-1a4e42493964",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "d8e03521-18a1-4429-b7c4-d1b43f319070",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "3a57991a-b33c-49da-893c-32e9c118448a",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "29a1c9d9-15fb-4ef9-9709-feba7d5ed612",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "57",
                    "name": "闇の代償",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "c4a8cf70-6185-4725-8e07-810bb5a53d38",
            "user_name": "ラヴィーネ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.png?t=1783243446077",
            "battle_score": 2001,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 16,
                "job_class": "Warrior",
                "hp": 251,
                "max_hp": 251,
                "atk": 22,
                "def": 16
            },
            "party_members_snapshot": [
                {
                    "id": 1668,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        28,
                        29,
                        48,
                        25
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                },
                {
                    "id": 1792,
                    "name": "ゴリアテ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 390,
                    "max_hp": 390,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        1
                    ],
                    "image_url": "/images/npcs/npc_markand_slave_giant.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "66f4ab34-3d4e-4af5-b699-c1678324e20c",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "ec57dfe7-9331-4f7d-91a8-c4935e30cfcf",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "18e5d8ec-b309-4356-a6bd-4ad985fa9f27",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "4a3314d6-89b1-40d7-b64c-7f4cb655786f",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "db4f9e03-4db8-4113-80c4-7175580857e7",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "6",
                    "name": "シールドバッシュ",
                    "type": "Defense",
                    "ap_cost": 2,
                    "power": 10
                },
                {
                    "id": "1",
                    "name": "強打",
                    "type": "Skill",
                    "ap_cost": 1,
                    "power": 12
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                }
            ]
        },
        {
            "user_id": "0c4d9ee3-2b38-498a-ab23-823ae91dced5",
            "user_name": "ルキヤ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/0c4d9ee3-2b38-498a-ab23-823ae91dced5/avatar.png?t=1781605286950",
            "battle_score": 2662,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 16,
                "job_class": "Warrior",
                "hp": 242,
                "max_hp": 242,
                "atk": 25,
                "def": 17
            },
            "party_members_snapshot": [
                {
                    "id": 1808,
                    "name": "魔剣士 テリア",
                    "job_class": "Civilian",
                    "level": 25,
                    "hp": 730,
                    "max_hp": 730,
                    "atk": 88,
                    "def": 39,
                    "inject_cards": [
                        45,
                        57,
                        64,
                        6,
                        30,
                        124,
                        115,
                        134,
                        139,
                        130,
                        117,
                        120
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1782585034384"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "9c498754-3b12-4964-86f6-e2782c96f6c7",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "db0b9f85-046e-4d4f-985a-2401aa8cc453",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "3f34d98d-c875-4c53-8545-1488cf18dfe6",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "c105bcb0-3008-46ad-b32d-be932368bb47",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "331ad9e0-e2a7-4ea9-a43a-60a7e1868c30",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "117",
                    "name": "ブレインスピン",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "139",
                    "name": "タイムリバース",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "16",
                    "name": "砂の罠",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "1eb40aa6-7fb0-4d44-8e82-3a6da6234913",
            "user_name": "a",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 2575,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 16,
                "job_class": "Warrior",
                "hp": 249,
                "max_hp": 249,
                "atk": 16,
                "def": 21
            },
            "party_members_snapshot": [
                {
                    "id": 1959,
                    "name": "ゴウ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 299,
                    "max_hp": 299,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        9,
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_samurai_general.png"
                },
                {
                    "id": 1752,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        28,
                        29,
                        25,
                        48
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                },
                {
                    "id": 1995,
                    "name": "ケンジ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 234,
                    "max_hp": 234,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png"
                },
                {
                    "id": 1996,
                    "name": "ヤスマサ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 143,
                    "max_hp": 143,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        14,
                        24
                    ],
                    "image_url": "/images/npcs/npc_yato_kannushi.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "8f5661e6-d7d9-40d0-a8cc-a68751260fd4",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "24ecb559-2194-4fc9-bf08-cb72597965d9",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "7285ffbb-873d-4e95-891b-c2f630b95662",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "fe362cc3-a4e3-4070-b85f-38be73a4e2df",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "cf318d9b-9a10-4c2f-ae47-18bef42a7884",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "18",
                    "name": "毒刃",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 25
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "57",
                    "name": "闇の代償",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "e155794b-a049-4d34-a9ec-1b7086cba695",
            "user_name": "タクミ",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 2086,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 238,
                "max_hp": 238,
                "atk": 19,
                "def": 12
            },
            "party_members_snapshot": [
                {
                    "id": 620,
                    "name": "ケンジ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 180,
                    "max_hp": 180,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png"
                },
                {
                    "id": 672,
                    "name": "とらまる",
                    "job_class": "Civilian",
                    "level": 11,
                    "hp": 342,
                    "max_hp": 342,
                    "atk": 13,
                    "def": 12,
                    "inject_cards": [
                        37,
                        115,
                        135,
                        119,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/193c41b3-c6ee-4a72-bf73-0184d2976511/avatar.jpeg?t=1781883867183"
                },
                {
                    "id": 746,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 336,
                    "max_hp": 336,
                    "atk": 12,
                    "def": 16,
                    "inject_cards": [
                        114,
                        133,
                        135,
                        124,
                        117,
                        66
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "ee3dab97-2fbb-42f9-9628-3d1da4c73dc5",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "b8ebce8c-b9a7-4870-9872-812501879597",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "4fde46d6-cf5e-480e-9a01-6595d143f161",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "01946933-3277-4301-b0cc-f1c7ce8daeee",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "bcecfebc-05c9-46a4-b225-abd9a8f9372a",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "103",
                    "name": "無防備な獲物",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 40
                },
                {
                    "id": "29",
                    "name": "連撃",
                    "type": "Skill",
                    "ap_cost": 3,
                    "power": 40
                },
                {
                    "id": "116",
                    "name": "プロミネンス",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 50
                },
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "99ec1273-d758-4797-a5e3-ab6761eb5561",
            "user_name": "リマーナ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/99ec1273-d758-4797-a5e3-ab6761eb5561/avatar.png?t=1781631772227",
            "battle_score": 2513,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 243,
                "max_hp": 243,
                "atk": 22,
                "def": 12
            },
            "party_members_snapshot": [
                {
                    "id": 834,
                    "name": "レオ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 300,
                    "max_hp": 300,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        11,
                        14,
                        15
                    ],
                    "image_url": "/images/npcs/npc_roland_paladin_leo.png"
                },
                {
                    "id": 841,
                    "name": "ガッド",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 250,
                    "max_hp": 250,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        4,
                        6
                    ],
                    "image_url": "/images/npcs/npc_roland_knight_veteran.png"
                },
                {
                    "id": 897,
                    "name": "撫子",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 100,
                    "max_hp": 100,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        4,
                        14
                    ],
                    "image_url": "/images/npcs/npc_nadeshiko.png"
                },
                {
                    "id": 835,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        48,
                        25,
                        28,
                        29
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "20ee3898-4fd1-4252-a837-93808b511df8",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "738a243e-4d85-4a75-b452-e574e5d8c9bd",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "63e71f11-3997-4940-a4d6-aefaa0d9b6cb",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "3f6fa39b-863e-47d4-a6a8-4b6be985927f",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "bb57cd26-0c4d-4c8e-9a4a-cf4639c43cdf",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "8",
                    "name": "クイックステップ",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "65",
                    "name": "火球",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 40
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                }
            ]
        },
        {
            "user_id": "abb4d4f8-b86e-4d5f-af46-1c69933b2d3e",
            "user_name": "ションボリーヌ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/abb4d4f8-b86e-4d5f-af46-1c69933b2d3e/avatar.jpg?t=1782452623044",
            "battle_score": 2436,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 235,
                "max_hp": 235,
                "atk": 17,
                "def": 13
            },
            "party_members_snapshot": [
                {
                    "id": 1379,
                    "name": "アンナ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 100,
                    "max_hp": 100,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        13,
                        14
                    ],
                    "image_url": "/images/npcs/npc_roland_priest_anna.png"
                },
                {
                    "id": 1383,
                    "name": "Persepho",
                    "job_class": "Civilian",
                    "level": 8,
                    "hp": 281,
                    "max_hp": 281,
                    "atk": 11,
                    "def": 12,
                    "inject_cards": [
                        16,
                        119,
                        66,
                        133,
                        134,
                        137
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/abe8c1ff-5fb5-47dd-89cc-d20e217502a4/avatar.jpeg?t=1782293429456"
                },
                {
                    "id": 1405,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        48,
                        25,
                        28,
                        29
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                },
                {
                    "id": 1407,
                    "name": "バドル",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 160,
                    "max_hp": 160,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        18
                    ],
                    "image_url": "/images/npcs/npc_markand_merc_scimitar.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "fb850410-2f32-4fee-9c53-c41115e2eea6",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "ae4ed379-102a-4c58-a86c-6069f4db015e",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "981cd2f5-87cc-4806-a7c7-e2f4525160bc",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "16",
                    "name": "砂の罠",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "117",
                    "name": "ブレインスピン",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "40",
                    "name": "暗殺",
                    "type": "Skill",
                    "ap_cost": 3,
                    "power": 50
                }
            ]
        },
        {
            "user_id": "e8aaeff4-d6d4-43b7-aa62-31dcaf621157",
            "user_name": "シド・ザ・ブレンド",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e8aaeff4-d6d4-43b7-aa62-31dcaf621157/avatar.jpg?t=1782077585038",
            "battle_score": 2877,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 306,
                "max_hp": 306,
                "atk": 21,
                "def": 18
            },
            "party_members_snapshot": [
                {
                    "id": 1100,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 14,
                    "hp": 479,
                    "max_hp": 479,
                    "atk": 16,
                    "def": 15,
                    "inject_cards": [
                        21,
                        45,
                        7,
                        25,
                        26,
                        29,
                        64,
                        137
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855"
                },
                {
                    "id": 1138,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 460,
                    "max_hp": 460,
                    "atk": 16,
                    "def": 18,
                    "inject_cards": [
                        139,
                        14,
                        124,
                        66,
                        113,
                        114,
                        115
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040"
                },
                {
                    "id": 1104,
                    "name": "透",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 322,
                    "max_hp": 322,
                    "atk": 13,
                    "def": 14,
                    "inject_cards": [
                        128,
                        104,
                        108,
                        66,
                        67,
                        64,
                        134
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/6d4473c3-a03e-4938-9a5d-1e1f5fadcafd/avatar.png?t=1781963398206"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "459ed17b-1b38-4383-8646-081a08a84ce8",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "7236acac-26b2-4640-8a3b-f2c51219e6f7",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "f3b49524-c31d-4277-84ca-d8628b07f8a3",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "137",
                    "name": "クイックドロー",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "43",
                    "name": "獅子の心",
                    "type": "Support",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "58",
                    "name": "即死攻撃",
                    "type": "Skill",
                    "ap_cost": 4,
                    "power": 30
                },
                {
                    "id": "60",
                    "name": "魂の生贄",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 150
                }
            ]
        },
        {
            "user_id": "e55cce3b-9248-4b99-82bc-c7e05f479aec",
            "user_name": "TB",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 2698,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 14,
                "job_class": "Warrior",
                "hp": 278,
                "max_hp": 278,
                "atk": 26,
                "def": 17
            },
            "party_members_snapshot": [
                {
                    "id": 392,
                    "name": "ゴウ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 230,
                    "max_hp": 230,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        9,
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_samurai_general.png"
                },
                {
                    "id": 568,
                    "name": "ケンジ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 180,
                    "max_hp": 180,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png"
                },
                {
                    "id": 945,
                    "name": "レオ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 300,
                    "max_hp": 300,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        11,
                        14,
                        15
                    ],
                    "image_url": "/images/npcs/npc_roland_paladin_leo.png"
                },
                {
                    "id": 503,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        48,
                        25,
                        28,
                        29
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "d228b9b1-09ad-4c34-9bc2-bef8d6100e7f",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "81b2a984-9d76-4db6-a1e1-304e62d7d3b3",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "1b7648f1-6b4f-4641-8f5d-cabd3be86512",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "65659814-c323-499d-89c9-f24921b119cf",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "1dc3a492-d383-49a7-8b09-ce7fd7091f8e",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "1",
                    "name": "強打",
                    "type": "Skill",
                    "ap_cost": 1,
                    "power": 12
                },
                {
                    "id": "6",
                    "name": "シールドバッシュ",
                    "type": "Defense",
                    "ap_cost": 2,
                    "power": 10
                },
                {
                    "id": "8",
                    "name": "クイックステップ",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "44",
                    "name": "疾風術",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "3",
                    "name": "突き",
                    "type": "Skill",
                    "ap_cost": 1,
                    "power": 18
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "e50314d6-4b08-4e2a-b954-c81ff91e01f3",
            "user_name": "あめちぃ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e50314d6-4b08-4e2a-b954-c81ff91e01f3/avatar.jpg?t=1782257002786",
            "battle_score": 2462,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 14,
                "job_class": "Warrior",
                "hp": 234,
                "max_hp": 234,
                "atk": 19,
                "def": 15
            },
            "party_members_snapshot": [
                {
                    "id": 1216,
                    "name": "小野",
                    "job_class": "Civilian",
                    "level": 7,
                    "hp": 288,
                    "max_hp": 288,
                    "atk": 14,
                    "def": 8,
                    "inject_cards": [
                        40,
                        1,
                        12,
                        27
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c2494b75-13df-4189-9a94-de216ce0336e/avatar.png?t=1782407029074"
                },
                {
                    "id": 1218,
                    "name": "グリフォン",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 260,
                    "max_hp": 260,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        1,
                        29
                    ],
                    "image_url": "/images/npcs/npc_free_griffon.png"
                },
                {
                    "id": 1219,
                    "name": "ケンジ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 180,
                    "max_hp": 180,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png"
                },
                {
                    "id": 1271,
                    "name": "ドリミス",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 340,
                    "max_hp": 340,
                    "atk": 14,
                    "def": 16,
                    "inject_cards": [
                        24,
                        119,
                        65,
                        66,
                        134
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/defefa6d-87e6-4fb4-8649-4bea5220c607/avatar.png?t=1781692394005"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "a5e47108-d89a-4b62-87c3-39bc9ba258bb",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "c1a6cfc5-7982-4b1b-ab3d-430b98645490",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "7c8f54fe-2263-4e3d-b917-905c49507aff",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "29",
                    "name": "連撃",
                    "type": "Skill",
                    "ap_cost": 3,
                    "power": 40
                },
                {
                    "id": "21",
                    "name": "ツバメ返し",
                    "type": "Skill",
                    "ap_cost": 3,
                    "power": 60
                },
                {
                    "id": "116",
                    "name": "プロミネンス",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 50
                },
                {
                    "id": "112",
                    "name": "デトネーション",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 90
                }
            ]
        },
        {
            "user_id": "0be1a6b5-763f-4bcb-8e63-59b49a121e68",
            "user_name": "ナス",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/0be1a6b5-763f-4bcb-8e63-59b49a121e68/avatar.png?t=1781702598439",
            "battle_score": 2681,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 13,
                "job_class": "Warrior",
                "hp": 227,
                "max_hp": 227,
                "atk": 12,
                "def": 16
            },
            "party_members_snapshot": [
                {
                    "id": 556,
                    "name": "なかなかな",
                    "job_class": "Civilian",
                    "level": 9,
                    "hp": 296,
                    "max_hp": 296,
                    "atk": 11,
                    "def": 12,
                    "inject_cards": [
                        2,
                        3,
                        10,
                        7,
                        66,
                        5,
                        6,
                        22,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217"
                },
                {
                    "id": 707,
                    "name": "Jack ",
                    "job_class": "Civilian",
                    "level": 12,
                    "hp": 370,
                    "max_hp": 370,
                    "atk": 14,
                    "def": 14,
                    "inject_cards": [
                        21,
                        40,
                        2,
                        3,
                        7,
                        25,
                        26,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/bac4f137-a5fc-4ce2-977b-d64eaa4b0afc/avatar.jpeg?t=1781626808364"
                },
                {
                    "id": 766,
                    "name": "ゴウ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 230,
                    "max_hp": 230,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        9,
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_samurai_general.png"
                },
                {
                    "id": 815,
                    "name": "とらまる",
                    "job_class": "Civilian",
                    "level": 12,
                    "hp": 368,
                    "max_hp": 368,
                    "atk": 13,
                    "def": 12,
                    "inject_cards": [
                        37,
                        115,
                        138,
                        119,
                        12,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/193c41b3-c6ee-4a72-bf73-0184d2976511/avatar.jpeg?t=1781883867183"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "ab1d3183-e37c-45ae-8b4d-c0488e249f49",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "881bcc02-764d-44c1-a565-c9185a4ab986",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "c6f2e88a-f2be-4490-af5a-78403355ad8b",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "3",
                    "name": "突き",
                    "type": "Skill",
                    "ap_cost": 1,
                    "power": 18
                },
                {
                    "id": "66",
                    "name": "氷槍",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 35
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "112",
                    "name": "デトネーション",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 90
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "14",
                    "name": "治癒",
                    "type": "Heal",
                    "ap_cost": 2,
                    "power": 80
                }
            ]
        },
        {
            "user_id": "b4a20ab3-18d9-44d4-8837-bacd4fc711e9",
            "user_name": "ハヤト",
            "avatar_url": "/images/icons/observer_gem.png",
            "battle_score": 1904,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 13,
                "job_class": "Warrior",
                "hp": 468,
                "max_hp": 468,
                "atk": 16,
                "def": 15
            },
            "party_members_snapshot": [
                {
                    "id": 2015,
                    "name": "ヤスマサ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 143,
                    "max_hp": 143,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        14,
                        24
                    ],
                    "image_url": "/images/npcs/npc_yato_kannushi.png"
                },
                {
                    "id": 2017,
                    "name": "ケンジ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 234,
                    "max_hp": 234,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        25
                    ],
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png"
                },
                {
                    "id": 2018,
                    "name": "ゴウ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 299,
                    "max_hp": 299,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        25,
                        9
                    ],
                    "image_url": "/images/npcs/npc_yato_samurai_general.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "a922f7ab-c677-476b-b6b6-c47b20599d7a",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "c3166812-9ecd-4e9a-8659-5e53d9cd723b",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "ab955a77-8154-4eaa-8b08-8bacb181596a",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "152cbf46-e133-45b9-ada1-699199da9722",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "e14e76b3-ad9b-4346-88c6-d7adc89fae90",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "134",
                    "name": "プラズマシャワー",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 30
                },
                {
                    "id": "123",
                    "name": "フレイムバースト",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 15
                },
                {
                    "id": "116",
                    "name": "プロミネンス",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 50
                },
                {
                    "id": "112",
                    "name": "デトネーション",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 90
                },
                {
                    "id": "135",
                    "name": "アブソリュートゼロ",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 25
                }
            ]
        }
    ],
    "A": [
        {
            "user_id": "097ade0d-ff40-4b2f-a0cf-0f79076c5f77",
            "user_name": "オペラ座の暇人",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1783349233368",
            "battle_score": 3511,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 28,
                "job_class": "Warrior",
                "hp": 366,
                "max_hp": 366,
                "atk": 26,
                "def": 30
            },
            "party_members_snapshot": [
                {
                    "id": 1952,
                    "name": "ハンゾウ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 143,
                    "max_hp": 143,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        10,
                        22
                    ],
                    "image_url": "/images/npcs/npc_yato_ninja_hanzo.png"
                },
                {
                    "id": 1958,
                    "name": "ホウイチ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 143,
                    "max_hp": 143,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        1,
                        4
                    ],
                    "image_url": "/images/npcs/npc_yato_monk_hoichi.png"
                },
                {
                    "id": 1961,
                    "name": "なかなかな",
                    "job_class": "Civilian",
                    "level": 18,
                    "hp": 550,
                    "max_hp": 550,
                    "atk": 86,
                    "def": 40,
                    "inject_cards": [
                        45,
                        57,
                        59,
                        6,
                        67,
                        115,
                        137,
                        117,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217"
                },
                {
                    "id": 1968,
                    "name": "野犬",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 39,
                    "max_hp": 39,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        1,
                        8
                    ],
                    "image_url": "/images/npcs/npc_free_stray_dog.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "629bc909-26fd-4cdc-aa27-32d8878b775a",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "aee20ec8-48a2-4618-9855-5c4695f6f518",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "67d2f70e-7feb-4a4b-85d4-5bbe387f23a9",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "0b3f45ea-7f52-4f9b-8a76-356493db6e6a",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "41d656e5-cffe-406c-aa2e-555665f55ea0",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "30",
                    "name": "飛刀",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 25
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "6",
                    "name": "シールドバッシュ",
                    "type": "Defense",
                    "ap_cost": 2,
                    "power": 10
                },
                {
                    "id": "45",
                    "name": "岩砕き",
                    "type": "Skill",
                    "ap_cost": 4,
                    "power": 55
                },
                {
                    "id": "117",
                    "name": "ブレインスピン",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "139",
                    "name": "タイムリバース",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "205fca0d-0bc0-41b9-9687-50a00743fd0c",
            "user_name": "Melody",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040",
            "battle_score": 3658,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 17,
                "job_class": "Warrior",
                "hp": 270,
                "max_hp": 270,
                "atk": 20,
                "def": 20
            },
            "party_members_snapshot": [
                {
                    "id": 1672,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        28,
                        29,
                        48,
                        25
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                },
                {
                    "id": 1721,
                    "name": "なかなかな",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 477,
                    "max_hp": 477,
                    "atk": 84,
                    "def": 32,
                    "inject_cards": [
                        42,
                        57,
                        16,
                        6,
                        112,
                        115,
                        117,
                        137,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217"
                },
                {
                    "id": 1720,
                    "name": "クロヴィス",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 91,
                    "max_hp": 91,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        12
                    ],
                    "image_url": "/images/npcs/npc_roland_scholar.png"
                },
                {
                    "id": 1722,
                    "name": "アベ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 130,
                    "max_hp": 130,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        4,
                        23
                    ],
                    "image_url": "/images/npcs/npc_yato_onmyoji.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "8dfe51b3-dbfb-4c8f-93f8-b24834bc1475",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "eaaccb28-4031-41f6-997a-f41498945eb1",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "11770b89-7325-4c43-892b-008391a226a7",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "ccad9f89-69bf-4394-a091-ece8bde17e5c",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "fa90c77e-5583-467a-97d6-6f1239e5065b",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "114",
                    "name": "フリーズランサー",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 30
                },
                {
                    "id": "16",
                    "name": "砂の罠",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "139",
                    "name": "タイムリバース",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                }
            ]
        },
        {
            "user_id": "2d6d2a29-385c-4eab-a5f2-57218264f963",
            "user_name": "えの",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2d6d2a29-385c-4eab-a5f2-57218264f963/avatar.png?t=1781596098415",
            "battle_score": 4955,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 246,
                "max_hp": 246,
                "atk": 22,
                "def": 16
            },
            "party_members_snapshot": [
                {
                    "id": 1570,
                    "name": "ラヴィーネ",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 496,
                    "max_hp": 496,
                    "atk": 41,
                    "def": 38,
                    "inject_cards": [
                        1,
                        13,
                        37,
                        64,
                        114,
                        124,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.jpg?t=1782300093251"
                },
                {
                    "id": 1568,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 19,
                    "hp": 660,
                    "max_hp": 660,
                    "atk": 47,
                    "def": 45,
                    "inject_cards": [
                        2,
                        45,
                        7,
                        25,
                        26,
                        64,
                        102,
                        137,
                        122,
                        127
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855"
                },
                {
                    "id": 1734,
                    "name": "TB",
                    "job_class": "Civilian",
                    "level": 14,
                    "hp": 493,
                    "max_hp": 493,
                    "atk": 54,
                    "def": 43,
                    "inject_cards": [
                        1,
                        2,
                        3,
                        62,
                        16,
                        44,
                        8,
                        6,
                        126,
                        119
                    ],
                    "image_url": "/avatars/adventurer.jpg"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "b2e091a7-a004-404e-9419-6cf4854f47dd",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a08f8589-a243-4e35-a709-fc663fa71710",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "48717c0b-376a-4b50-b9dd-0fdf50c7f63b",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "314d29df-d379-4733-a99d-4055f9f7ea3c",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a5eac56c-9e15-4897-85e5-4bf00a6229c4",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "6",
                    "name": "シールドバッシュ",
                    "type": "Defense",
                    "ap_cost": 2,
                    "power": 10
                },
                {
                    "id": "16",
                    "name": "砂の罠",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "67",
                    "name": "雷撃",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 45
                },
                {
                    "id": "138",
                    "name": "タクティカルプラン",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "16bafcdc-a211-482b-8850-6b94031ed6ea",
            "user_name": "せな",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/16bafcdc-a211-482b-8850-6b94031ed6ea/avatar.png?t=1781626478030",
            "battle_score": 3731,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 289,
                "max_hp": 289,
                "atk": 20,
                "def": 15
            },
            "party_members_snapshot": [
                {
                    "id": 393,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        48,
                        25,
                        28,
                        29
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                },
                {
                    "id": 696,
                    "name": "ベル",
                    "job_class": "Civilian",
                    "level": 16,
                    "hp": 468,
                    "max_hp": 468,
                    "atk": 21,
                    "def": 26,
                    "inject_cards": [
                        37,
                        115,
                        119,
                        33,
                        57,
                        58
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c7906aec-ba14-4e35-8102-b21c6bea529a/avatar.jpeg?t=1781659829258"
                },
                {
                    "id": 956,
                    "name": "リンネ",
                    "job_class": "Civilian",
                    "level": 11,
                    "hp": 347,
                    "max_hp": 347,
                    "atk": 11,
                    "def": 10,
                    "inject_cards": [
                        115,
                        139,
                        119,
                        15,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e26223d4-36b2-446e-b8ae-aa2c92be8b47/avatar.png?t=1782007944627"
                },
                {
                    "id": 957,
                    "name": "リマーナ",
                    "job_class": "Civilian",
                    "level": 14,
                    "hp": 427,
                    "max_hp": 427,
                    "atk": 22,
                    "def": 12,
                    "inject_cards": [
                        40,
                        115,
                        133,
                        137,
                        119,
                        14,
                        65,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/99ec1273-d758-4797-a5e3-ab6761eb5561/avatar.png?t=1781631772227"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "b2e92945-9e52-4b58-a2c5-78b1bd2fc9e5",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "e0e421ea-b38c-43bd-9cce-c198b89bc85d",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "8e870e6f-ee69-4b14-8456-f3367197c742",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "20",
                    "name": "オアシスの水",
                    "type": "Heal",
                    "ap_cost": 2,
                    "power": 60
                },
                {
                    "id": "49",
                    "name": "黒曜球",
                    "type": "Magic",
                    "ap_cost": 4,
                    "power": 65
                },
                {
                    "id": "57",
                    "name": "闇の代償",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "127",
                    "name": "巨人の肉体",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "107",
                    "name": "不屈の防陣",
                    "type": "Defense",
                    "ap_cost": 3,
                    "power": 30
                }
            ]
        },
        {
            "user_id": "e26223d4-36b2-446e-b8ae-aa2c92be8b47",
            "user_name": "クロノ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e26223d4-36b2-446e-b8ae-aa2c92be8b47/avatar.png?t=1782598149931",
            "battle_score": 3089,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 14,
                "job_class": "Warrior",
                "hp": 228,
                "max_hp": 228,
                "atk": 15,
                "def": 14
            },
            "party_members_snapshot": [
                {
                    "id": 1546,
                    "name": "ラヴィーネ",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 476,
                    "max_hp": 476,
                    "atk": 41,
                    "def": 40,
                    "inject_cards": [
                        1,
                        13,
                        37,
                        64,
                        114,
                        124,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.jpg?t=1782300093251"
                },
                {
                    "id": 1564,
                    "name": "雅人",
                    "job_class": "Civilian",
                    "level": 17,
                    "hp": 525,
                    "max_hp": 525,
                    "atk": 33,
                    "def": 43,
                    "inject_cards": [
                        40,
                        1,
                        14,
                        16,
                        25,
                        27,
                        37,
                        64
                    ],
                    "image_url": "/avatars/adventurer.jpg"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "e253bc43-6080-4069-8586-1b802aa881ea",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a33a01c2-01c9-44a1-a743-4b6cc49a4a26",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a8d756cc-096a-4e0c-a068-45748f37d316",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "106f8cb6-fd7f-4e4f-8a7e-f61acdf75537",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "be85d998-2553-4a3c-ad4c-5395365f226f",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "33",
                    "name": "奇跡",
                    "type": "Heal",
                    "ap_cost": 5,
                    "power": 999
                },
                {
                    "id": "57",
                    "name": "闇の代償",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                }
            ]
        },
        {
            "user_id": "0f1c24a4-20e1-4d89-823a-7b0b20e1ab45",
            "user_name": "紅葉",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 3599,
            "defense_rank": "A",
            "is_ghost": true,
            "player_snapshot": {
                "level": 13,
                "job_class": "Warrior",
                "hp": 227,
                "max_hp": 227,
                "atk": 14,
                "def": 16
            },
            "party_members_snapshot": [
                {
                    "id": 1871,
                    "name": "ヴォルグ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 680,
                    "max_hp": 680,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        28,
                        29,
                        25,
                        48
                    ],
                    "image_url": "/images/npcs/npc_guest_volg.png"
                },
                {
                    "id": 1760,
                    "name": "ヤスマサ",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 143,
                    "max_hp": 143,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        14,
                        24
                    ],
                    "image_url": "/images/npcs/npc_yato_kannushi.png"
                },
                {
                    "id": 1826,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 20,
                    "hp": 629,
                    "max_hp": 629,
                    "atk": 102,
                    "def": 30,
                    "inject_cards": [
                        2,
                        45,
                        8,
                        64,
                        102,
                        25,
                        26,
                        122,
                        137,
                        42,
                        117
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "1b12a008-9b25-4878-9ce6-34c133b7e8a8",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "9ea2b62a-f50a-4f18-897b-20a8323d3751",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "1c94e928-dc72-456a-80d2-dd2f7253761f",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "b7c5f7e5-3f78-49df-a28a-347e46925314",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "3d7a381f-c079-4682-8a1a-8007e035148f",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "37",
                    "name": "メテオストライク",
                    "type": "Magic",
                    "ap_cost": 5,
                    "power": 100
                },
                {
                    "id": "64",
                    "name": "瞑想",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 3
                },
                {
                    "id": "134",
                    "name": "プラズマシャワー",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 30
                },
                {
                    "id": "139",
                    "name": "タイムリバース",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "16",
                    "name": "砂の罠",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                }
            ]
        }
    ],
    "S": [
        {
            "user_id": "5ad434ec-763f-473e-939f-14a5e9e1cc93",
            "user_name": "テスト",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 11200,
            "defense_rank": "S",
            "is_ghost": true,
            "player_snapshot": {
                "level": 20,
                "job_class": "Warrior",
                "hp": 1200,
                "max_hp": 1200,
                "atk": 500,
                "def": 500
            },
            "party_members_snapshot": [],
            "equipped_items_snapshot": [],
            "skill_deck_snapshot": []
        },
        {
            "user_id": "c1cf67dd-527a-497e-bf88-ce10c2cb516f",
            "user_name": "きたむ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c1cf67dd-527a-497e-bf88-ce10c2cb516f/avatar.jpeg?t=1781586725280",
            "battle_score": 12385,
            "defense_rank": "S",
            "is_ghost": true,
            "player_snapshot": {
                "level": 20,
                "job_class": "Warrior",
                "hp": 1200,
                "max_hp": 1200,
                "atk": 500,
                "def": 500
            },
            "party_members_snapshot": [
                {
                    "id": 1539,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 475,
                    "max_hp": 475,
                    "atk": 34,
                    "def": 37,
                    "inject_cards": [
                        139,
                        55,
                        113,
                        114,
                        115,
                        124
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "f7685080-09db-48c4-8cc9-2be57552b79d",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "21f9d8a1-822b-48eb-be2b-097bfa7c25b1",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "a843c67a-8da5-412f-ac92-bc14723136ac",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "08758288-b14a-4ba3-a340-55e75014c6ac",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "2c351879-f9ee-4888-ba24-053e62b7fb33",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "26",
                    "name": "氣の癒やし",
                    "type": "Heal",
                    "ap_cost": 2,
                    "power": 70
                },
                {
                    "id": "101",
                    "name": "カタルシス",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 30
                },
                {
                    "id": "102",
                    "name": "傷口をえぐる",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 25
                },
                {
                    "id": "103",
                    "name": "無防備な獲物",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 40
                },
                {
                    "id": "104",
                    "name": "伝染病の霧",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 15
                },
                {
                    "id": "136",
                    "name": "ファイアウェーブ",
                    "type": "Magic",
                    "ap_cost": 2,
                    "power": 20
                }
            ]
        },
        {
            "user_id": "fac65cfe-bbae-4ca2-b647-fa95ee6ad734",
            "user_name": "なかなかな",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217",
            "battle_score": 6343,
            "defense_rank": "S",
            "is_ghost": true,
            "player_snapshot": {
                "level": 18,
                "job_class": "Warrior",
                "hp": 265,
                "max_hp": 265,
                "atk": 23,
                "def": 26
            },
            "party_members_snapshot": [
                {
                    "id": 1878,
                    "name": "ラヴィーネ",
                    "job_class": "Civilian",
                    "level": 16,
                    "hp": 546,
                    "max_hp": 546,
                    "atk": 62,
                    "def": 51,
                    "inject_cards": [
                        37,
                        1,
                        64,
                        5,
                        6,
                        124,
                        114,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.png?t=1783243446077"
                },
                {
                    "id": 1879,
                    "name": "カシム",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 169,
                    "max_hp": 169,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        1,
                        16
                    ],
                    "image_url": "/images/npcs/npc_markand_bedouin.png"
                },
                {
                    "id": 1887,
                    "name": "ArcLine",
                    "job_class": "Civilian",
                    "level": 12,
                    "hp": 380,
                    "max_hp": 380,
                    "atk": 100,
                    "def": 22,
                    "inject_cards": [
                        57,
                        58,
                        55,
                        115,
                        129,
                        130
                    ],
                    "image_url": "/avatars/adventurer.jpg"
                },
                {
                    "id": 1885,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 21,
                    "hp": 653,
                    "max_hp": 653,
                    "atk": 103,
                    "def": 31,
                    "inject_cards": [
                        2,
                        45,
                        8,
                        64,
                        102,
                        25,
                        26,
                        122,
                        137,
                        42,
                        117
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "efeb78fe-1499-4b4f-b5f4-d1869add2dd4",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "dd85a295-4187-4f25-b520-d03449b61a71",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "416c2136-2693-4c0a-8d5a-7e6853dfaa40",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "c51e5148-28a7-43d7-817a-42b924096458",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "1319882f-631f-41aa-ba56-46c89c299a86",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "119",
                    "name": "ダブルキャスト",
                    "type": "Support",
                    "ap_cost": 2,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "67",
                    "name": "雷撃",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 45
                },
                {
                    "id": "45",
                    "name": "岩砕き",
                    "type": "Skill",
                    "ap_cost": 4,
                    "power": 55
                },
                {
                    "id": "57",
                    "name": "闇の代償",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "6",
                    "name": "シールドバッシュ",
                    "type": "Defense",
                    "ap_cost": 2,
                    "power": 10
                }
            ]
        },
        {
            "user_id": "a52c0e53-7c2c-4929-a58b-c3a8788cfa3d",
            "user_name": "ArcLine",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 8005,
            "defense_rank": "S",
            "is_ghost": true,
            "player_snapshot": {
                "level": 13,
                "job_class": "Warrior",
                "hp": 226,
                "max_hp": 226,
                "atk": 21,
                "def": 18
            },
            "party_members_snapshot": [
                {
                    "id": 1907,
                    "name": "なかなかな",
                    "job_class": "Civilian",
                    "level": 18,
                    "hp": 550,
                    "max_hp": 550,
                    "atk": 86,
                    "def": 40,
                    "inject_cards": [
                        45,
                        57,
                        59,
                        6,
                        67,
                        115,
                        137,
                        117,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217"
                },
                {
                    "id": 1882,
                    "name": "雅人",
                    "job_class": "Civilian",
                    "level": 21,
                    "hp": 640,
                    "max_hp": 640,
                    "atk": 59,
                    "def": 60,
                    "inject_cards": [
                        37,
                        54,
                        115,
                        134,
                        136
                    ],
                    "image_url": "/avatars/adventurer.jpg"
                },
                {
                    "id": 1880,
                    "name": "魔剣士 テリア",
                    "job_class": "Civilian",
                    "level": 26,
                    "hp": 754,
                    "max_hp": 754,
                    "atk": 84,
                    "def": 43,
                    "inject_cards": [
                        45,
                        57,
                        64,
                        6,
                        30,
                        124,
                        115,
                        137,
                        139,
                        130,
                        117,
                        120,
                        142
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1782585034384"
                },
                {
                    "id": 1881,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 17,
                    "hp": 575,
                    "max_hp": 575,
                    "atk": 63,
                    "def": 52,
                    "inject_cards": [
                        16,
                        57,
                        64,
                        124,
                        66,
                        114,
                        115,
                        137,
                        139
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "a3490a35-f1c1-4a5d-8f40-4efd45ced88b",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "4edcc474-df54-4bb2-9858-a052c4470e21",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "d785ea62-f30a-477f-ba9b-efe290d0d455",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "64460c3b-70e4-44ed-858f-aea06ed52642",
                    "type": "equipment",
                    "effect_data": {}
                },
                {
                    "id": "822b3cf5-7948-4315-9528-0bc596138fff",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "57",
                    "name": "闇の代償",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "58",
                    "name": "即死攻撃",
                    "type": "Skill",
                    "ap_cost": 4,
                    "power": 30
                },
                {
                    "id": "124",
                    "name": "凍てつく波動",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 0
                },
                {
                    "id": "115",
                    "name": "雷電の連鎖",
                    "type": "Magic",
                    "ap_cost": 3,
                    "power": 20
                },
                {
                    "id": "16",
                    "name": "砂の罠",
                    "type": "Support",
                    "ap_cost": 1,
                    "power": 0
                },
                {
                    "id": "32",
                    "name": "ドラゴンダイブ",
                    "type": "Skill",
                    "ap_cost": 5,
                    "power": 80
                }
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
