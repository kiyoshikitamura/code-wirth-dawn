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
                    "id": "200",
                    "name": "魔法のランプ",
                    "type": "equipment",
                    "effect_data": {}
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "14",
                    "name": "治癒",
                    "type": "Heal",
                    "ap_cost": 2,
                    "power": 15
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
                    "id": "315",
                    "name": "村正",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 55,
                        "description": "所有者の血と魂をすする妖刀。圧倒的な攻撃力を与える代わりに、身を守るための警戒心を完全に奪い去る。",
                        "battle_start_buff": {
                            "duration": 99,
                            "buff_type": "def_down"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "0c4d9ee3-2b38-498a-ab23-823ae91dced5",
            "user_name": "ルキヤ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/0c4d9ee3-2b38-498a-ab23-823ae91dced5/avatar.png?t=1781605286950",
            "battle_score": 1492,
            "defense_rank": "C",
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
                    "hp": 340,
                    "max_hp": 340,
                    "atk": 22,
                    "def": 27,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1782585034384",
                    "snapshot_data": {
                        "hp": 340,
                        "atk": 22,
                        "def": 27,
                        "deck": [],
                        "level": 25,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 30,
                            "atk": 66,
                            "def": 12
                        },
                        "equipped_items": [
                            {
                                "name": "デーモンバスター",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_2"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
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
                            "id": "30",
                            "name": "飛刀",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
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
                            "id": "130",
                            "name": "ギャンブラーダイス",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 60
                        },
                        {
                            "id": "117",
                            "name": "ブレインスピン",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "120",
                            "name": "リサイクル",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "333",
                    "name": "疾風のアンクレット",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 2,
                        "description": "装備者の足取りを軽やかにし、必殺の一撃を出やすくする。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 99,
                            "buff_type": "crit_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "322",
                    "name": "魔導士の指輪",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 8,
                        "def_bonus": -2,
                        "description": "古代の魔力回路が組み込まれた指輪。スペルキャスターの魔力を増幅させ、呪文による破壊力を一時的に高める。",
                        "battle_start_buff": {
                            "value": 0.15,
                            "duration": 3,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "b4a20ab3-18d9-44d4-8837-bacd4fc711e9",
            "user_name": "ハヤト",
            "avatar_url": "/images/icons/observer_gem.png",
            "battle_score": 827,
            "defense_rank": "C",
            "is_ghost": true,
            "player_snapshot": {
                "level": 15,
                "job_class": "Warrior",
                "hp": 487,
                "max_hp": 487,
                "atk": 18,
                "def": 16
            },
            "party_members_snapshot": [],
            "equipped_items_snapshot": [
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "333",
                    "name": "疾風のアンクレット",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 2,
                        "description": "装備者の足取りを軽やかにし、必殺の一撃を出やすくする。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 99,
                            "buff_type": "crit_up"
                        }
                    }
                },
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "317",
                    "name": "聖霊のローブ",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 20,
                        "def_bonus": 8,
                        "description": "聖水と祝福された白糸で織り上げられたローブ。邪悪な魔力を霧散させる不可視の防壁を形成する。",
                        "battle_start_buff": {
                            "duration": 5,
                            "buff_type": "regen"
                        }
                    }
                },
                {
                    "id": "324",
                    "name": "守護のタリスマン",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 6,
                        "description": "聖堂の祝福を受けた銀のタリスマン。着用者の周囲に微小な衝撃吸収フィールドを発生させ、致命傷を防ぐ。",
                        "battle_start_buff": {
                            "value": 15,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
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
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "206",
                    "name": "神器:草薙(模造)",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 18,
                        "description": "夜刀神国の神話に登場する剣の模造品。それでも一振りで竹林を吹き飛ばす威力を秘めている。"
                    }
                },
                {
                    "id": "219",
                    "name": "重装鎧",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 12,
                        "description": "全身を鋼鉄で覆い隠す防御力重視の鎧。物理的な攻撃を大きく軽減する。"
                    }
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
                    "id": "351",
                    "name": "デーモンスレイヤー",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "次元深淵の魔王を討ち果たすために鍛え上げられた伝説の聖剣。手にするだけで邪悪を退ける神聖な加護が全身を包み込む。",
                        "battle_start_buff": [
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "319",
                    "name": "混沌の重鎧",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 40,
                        "description": "混沌の魔力により結晶化した未知の金属製プレートアーマー。圧倒的な防御力を提供する代償として、装備者の動作を著しく遅くする。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_down"
                        }
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "324",
                    "name": "守護のタリスマン",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 6,
                        "description": "聖堂の祝福を受けた銀のタリスマン。着用者の周囲に微小な衝撃吸収フィールドを発生させ、致命傷を防ぐ。",
                        "battle_start_buff": {
                            "value": 15,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
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
            "user_id": "ghost_b_1",
            "user_name": "鋼鉄のウォルグ",
            "avatar_url": "/images/npcs/npc_guest_volg.png",
            "battle_score": 1800,
            "defense_rank": "B",
            "is_ghost": true,
            "player_snapshot": {
                "level": 10,
                "job_class": "Warrior",
                "hp": 180,
                "max_hp": 180,
                "atk": 18,
                "def": 15
            },
            "party_members_snapshot": [
                {
                    "id": "ghost_b_1_m1",
                    "name": "ルキヤ",
                    "job_class": "Guard",
                    "level": 8,
                    "hp": 140,
                    "max_hp": 140,
                    "atk": 12,
                    "def": 12,
                    "inject_cards": [
                        9
                    ],
                    "image_url": "/images/npcs/npc_roland_guard_heavy.png"
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "153",
                    "name": "鋼鉄の大剣",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 8
                    }
                }
            ],
            "skill_deck_snapshot": [
                {
                    "id": "1",
                    "name": "強打",
                    "type": "Skill",
                    "ap_cost": 2,
                    "power": 25
                },
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
            "user_id": "097ade0d-ff40-4b2f-a0cf-0f79076c5f77",
            "user_name": "オペラ座の暇人",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1783349233368",
            "battle_score": 2703,
            "defense_rank": "B",
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
                    "image_url": "/images/npcs/npc_yato_monk_hoichi.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "4",
                            "name": "防御",
                            "type": "Defense",
                            "ap_cost": 1,
                            "power": 10
                        }
                    ]
                },
                {
                    "id": 2032,
                    "name": "鎧",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 390,
                    "max_hp": 390,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        42
                    ],
                    "image_url": "/images/npcs/npc_free_cursed_armor.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "42",
                            "name": "血の怒り",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_free_stray_dog.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "8",
                            "name": "クイックステップ",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                },
                {
                    "id": 1961,
                    "name": "なかなかな",
                    "job_class": "Civilian",
                    "level": 18,
                    "hp": 265,
                    "max_hp": 265,
                    "atk": 23,
                    "def": 26,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217",
                    "snapshot_data": {
                        "hp": 265,
                        "atk": 23,
                        "def": 26,
                        "deck": [],
                        "level": 18,
                        "blessing_data": {
                            "hp_pct": 0.1,
                            "ap_bonus": 1,
                            "expires_after_battle": true
                        },
                        "equipped_bonus": {
                            "hp": 30,
                            "atk": 63,
                            "def": 14
                        },
                        "equipped_items": [
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "デーモンバスター",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
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
                            "id": "59",
                            "name": "狂戦士の薬",
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
                        },
                        {
                            "id": "67",
                            "name": "雷撃",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 45
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        },
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "c7906aec-ba14-4e35-8102-b21c6bea529a",
            "user_name": "ベル",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c7906aec-ba14-4e35-8102-b21c6bea529a/avatar.jpeg?t=1781659829258",
            "battle_score": 2044,
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
                    "hp": 221,
                    "max_hp": 221,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.jpg?t=1782300093251",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "13",
                            "name": "祈り",
                            "type": "Heal",
                            "ap_cost": 2,
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
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 30
                        }
                    ]
                },
                {
                    "id": 1317,
                    "name": "魔剣士 テリア",
                    "job_class": "Civilian",
                    "level": 20,
                    "hp": 299,
                    "max_hp": 299,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1782498046183",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
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
                        },
                        {
                            "id": "124",
                            "name": "凍てつく波動",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 0
                        },
                        {
                            "id": "27",
                            "name": "龍の咆哮",
                            "type": "Support",
                            "ap_cost": 3,
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "112",
                            "name": "デトネーション",
                            "type": "Magic",
                            "ap_cost": 4,
                            "power": 90
                        },
                        {
                            "id": "64",
                            "name": "瞑想",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 3
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "602",
                    "name": "神の法衣",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "def_bonus": 12,
                        "description": "忘却の五英霊の力を封じた法衣。纏う者に神聖な加護を与え、致命的な一撃すら耐え凌ぐ強固な結界を張る。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 2,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "315",
                    "name": "村正",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 55,
                        "description": "所有者の血と魂をすする妖刀。圧倒的な攻撃力を与える代わりに、身を守るための警戒心を完全に奪い去る。",
                        "battle_start_buff": {
                            "duration": 99,
                            "buff_type": "def_down"
                        }
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "205fca0d-0bc0-41b9-9687-50a00743fd0c",
            "user_name": "Melody",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040",
            "battle_score": 2638,
            "defense_rank": "B",
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        },
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
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
                    "id": 1721,
                    "name": "なかなかな",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 237,
                    "max_hp": 237,
                    "atk": 18,
                    "def": 20,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217",
                    "snapshot_data": {
                        "hp": 237,
                        "atk": 18,
                        "def": 20,
                        "deck": [],
                        "level": 15,
                        "blessing_data": {
                            "hp_pct": 0.1,
                            "ap_bonus": 1,
                            "expires_after_battle": true
                        },
                        "equipped_bonus": {
                            "hp": 30,
                            "atk": 66,
                            "def": 12
                        },
                        "equipped_items": [
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "デーモンスレイヤー",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_2"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "42",
                            "name": "血の怒り",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "57",
                            "name": "闇の代償",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "16",
                            "name": "砂の罠",
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
                        },
                        {
                            "id": "112",
                            "name": "デトネーション",
                            "type": "Magic",
                            "ap_cost": 4,
                            "power": 90
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_roland_scholar.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "12",
                            "name": "裁き",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 50
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_yato_onmyoji.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "4",
                            "name": "防御",
                            "type": "Defense",
                            "ap_cost": 1,
                            "power": 10
                        },
                        {
                            "id": "23",
                            "name": "影縫い",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "316",
                    "name": "深淵の盾",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 15,
                        "description": "黒曜石とデーモンの骨を融合させて作られた盾。周囲の光を吸収する黒い霧を放ち、敵の攻撃の威力を大幅に減衰させる。",
                        "battle_start_buff": {
                            "value": 20,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "322",
                    "name": "魔導士の指輪",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 8,
                        "def_bonus": -2,
                        "description": "古代の魔力回路が組み込まれた指輪。スペルキャスターの魔力を増幅させ、呪文による破壊力を一時的に高める。",
                        "battle_start_buff": {
                            "value": 0.15,
                            "duration": 3,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "331",
                    "name": "氷結のブローチ",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 4,
                        "description": "決して溶けない永久氷雪が埋め込まれたブローチ。周囲の熱を急速に奪うことで、炎の攻撃や高熱の環境から装備者を守る。",
                        "battle_start_buff": {
                            "value": 30,
                            "duration": 3,
                            "buff_type": "absolute_barrier"
                        }
                    }
                },
                {
                    "id": "321",
                    "name": "深緑のアミュレット",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 25,
                        "def_bonus": 5,
                        "description": "豊かな大森林の生命の息吹を宿すお守り。装備者の体内に宿る自然治癒力を呼び覚まし、絶え間なく体力を回復させる。",
                        "battle_start_buff": {
                            "duration": 3,
                            "buff_type": "regen"
                        }
                    }
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
            "user_id": "c4a8cf70-6185-4725-8e07-810bb5a53d38",
            "user_name": "ラヴィーネ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.png?t=1783243446077",
            "battle_score": 2639,
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        },
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
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
                    "image_url": "/images/npcs/npc_markand_slave_giant.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        }
                    ]
                },
                {
                    "id": 2033,
                    "name": "バドル",
                    "job_class": "Civilian",
                    "level": 1,
                    "hp": 208,
                    "max_hp": 208,
                    "atk": 5,
                    "def": 10,
                    "inject_cards": [
                        18
                    ],
                    "image_url": "/images/npcs/npc_markand_merc_scimitar.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "18",
                            "name": "毒刃",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
                        }
                    ]
                },
                {
                    "id": 2034,
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
                    "image_url": "/images/npcs/npc_yato_onmyoji.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "4",
                            "name": "防御",
                            "type": "Defense",
                            "ap_cost": 1,
                            "power": 10
                        },
                        {
                            "id": "23",
                            "name": "影縫い",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "325",
                    "name": "怒りの腕輪",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 3,
                        "description": "怒りの念が込められた腕輪。着用者の肉体を頑強にし、相手を行動不能にする。",
                        "battle_start_buff": {
                            "duration": 3,
                            "buff_type": "stun_infuse"
                        }
                    }
                },
                {
                    "id": "602",
                    "name": "神の法衣",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "def_bonus": 12,
                        "description": "忘却の五英霊の力を封じた法衣。纏う者に神聖な加護を与え、致命的な一撃すら耐え凌ぐ強固な結界を張る。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 2,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "351",
                    "name": "デーモンスレイヤー",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "次元深淵の魔王を討ち果たすために鍛え上げられた伝説の聖剣。手にするだけで邪悪を退ける神聖な加護が全身を包み込む。",
                        "battle_start_buff": [
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
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
                    "image_url": "/images/npcs/npc_yato_samurai_general.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "9",
                            "name": "挑発",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
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
                    "image_url": "/images/npcs/npc_yato_kannushi.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "24",
                            "name": "清め",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 50
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "351",
                    "name": "デーモンスレイヤー",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "次元深淵の魔王を討ち果たすために鍛え上げられた伝説の聖剣。手にするだけで邪悪を退ける神聖な加護が全身を包み込む。",
                        "battle_start_buff": [
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
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
            "user_id": "2d6d2a29-385c-4eab-a5f2-57218264f963",
            "user_name": "えの",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2d6d2a29-385c-4eab-a5f2-57218264f963/avatar.png?t=1781596098415",
            "battle_score": 2700,
            "defense_rank": "B",
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
                    "hp": 241,
                    "max_hp": 241,
                    "atk": 20,
                    "def": 14,
                    "inject_cards": [
                        1,
                        13,
                        37,
                        64,
                        114,
                        124,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.jpg?t=1782300093251",
                    "snapshot_data": {
                        "hp": 241,
                        "atk": 20,
                        "def": 14,
                        "deck": [],
                        "level": 15,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 45,
                            "atk": 21,
                            "def": 24
                        },
                        "equipped_items": [
                            {
                                "name": "幸運のコイン",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "竜牙の剣",
                                "slot": "weapon"
                            },
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "狐火の護符",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "神の法衣",
                                "slot": "armor"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.2,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 10,
                                "duration": 3,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 2,
                                "buff_type": "evasion_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "13",
                            "name": "祈り",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 30
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
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                },
                {
                    "id": 1568,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 19,
                    "hp": 335,
                    "max_hp": 335,
                    "atk": 22,
                    "def": 23,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855",
                    "snapshot_data": {
                        "hp": 335,
                        "atk": 22,
                        "def": 23,
                        "deck": [],
                        "level": 19,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 55,
                            "atk": 25,
                            "def": 22
                        },
                        "equipped_items": [
                            {
                                "name": "神器:草薙(模造)",
                                "slot": "weapon"
                            },
                            {
                                "name": "狐火の護符",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "神の法衣",
                                "slot": "armor"
                            },
                            {
                                "name": "商人の鞄",
                                "slot": "accessory_1"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 10,
                                "duration": 3,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 2,
                                "buff_type": "evasion_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "2",
                            "name": "斬撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "45",
                            "name": "岩砕き",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 55
                        },
                        {
                            "id": "7",
                            "name": "集中",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "26",
                            "name": "氣の癒やし",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 70
                        },
                        {
                            "id": "64",
                            "name": "瞑想",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 3
                        },
                        {
                            "id": "102",
                            "name": "傷口をえぐる",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
                        },
                        {
                            "id": "137",
                            "name": "クイックドロー",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "122",
                            "name": "血の追撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 20
                        },
                        {
                            "id": "127",
                            "name": "巨人の肉体",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        }
                    ]
                },
                {
                    "id": 1734,
                    "name": "TB",
                    "job_class": "Civilian",
                    "level": 14,
                    "hp": 278,
                    "max_hp": 278,
                    "atk": 26,
                    "def": 17,
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
                    "image_url": "/avatars/adventurer.jpg",
                    "snapshot_data": {
                        "hp": 278,
                        "atk": 26,
                        "def": 17,
                        "deck": [],
                        "level": 14,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 20,
                            "atk": 28,
                            "def": 26
                        },
                        "equipped_items": [
                            {
                                "name": "英霊の鎖帷子",
                                "slot": "armor"
                            },
                            {
                                "name": "神器:草薙(模造)",
                                "slot": "weapon"
                            },
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "狐火の護符",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "黄金のサイコロ",
                                "slot": "accessory_3"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 10,
                                "duration": 3,
                                "buff_type": "def_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "2",
                            "name": "斬撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "3",
                            "name": "突き",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 18
                        },
                        {
                            "id": "62",
                            "name": "調毒",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 15
                        },
                        {
                            "id": "16",
                            "name": "砂の罠",
                            "type": "Support",
                            "ap_cost": 1,
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
                            "id": "8",
                            "name": "クイックステップ",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "6",
                            "name": "シールドバッシュ",
                            "type": "Defense",
                            "ap_cost": 2,
                            "power": 10
                        },
                        {
                            "id": "126",
                            "name": "リベンジシールド",
                            "type": "Defense",
                            "ap_cost": 2,
                            "power": 15
                        },
                        {
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "602",
                    "name": "神の法衣",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "def_bonus": 12,
                        "description": "忘却の五英霊の力を封じた法衣。纏う者に神聖な加護を与え、致命的な一撃すら耐え凌ぐ強固な結界を張る。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 2,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "325",
                    "name": "怒りの腕輪",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 3,
                        "description": "怒りの念が込められた腕輪。着用者の肉体を頑強にし、相手を行動不能にする。",
                        "battle_start_buff": {
                            "duration": 3,
                            "buff_type": "stun_infuse"
                        }
                    }
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
                    "image_url": "/images/npcs/npc_roland_paladin_leo.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "11",
                            "name": "聖剣",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "15",
                            "name": "聖壁",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 20
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_roland_knight_veteran.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "4",
                            "name": "防御",
                            "type": "Defense",
                            "ap_cost": 1,
                            "power": 10
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
                    "image_url": "/images/npcs/npc_nadeshiko.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "4",
                            "name": "防御",
                            "type": "Defense",
                            "ap_cost": 1,
                            "power": 10
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "233",
                    "name": "黄金のサイコロ",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "def_bonus": 2,
                        "description": "戦場の結果を運否天賦に任せる狂気のギャンブラーに愛用される、純金振りのサイコロ。"
                    }
                },
                {
                    "id": "602",
                    "name": "神の法衣",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "def_bonus": 12,
                        "description": "忘却の五英霊の力を封じた法衣。纏う者に神聖な加護を与え、致命的な一撃すら耐え凌ぐ強固な結界を張る。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 2,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "322",
                    "name": "魔導士の指輪",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 8,
                        "def_bonus": -2,
                        "description": "古代の魔力回路が組み込まれた指輪。スペルキャスターの魔力を増幅させ、呪文による破壊力を一時的に高める。",
                        "battle_start_buff": {
                            "value": 0.15,
                            "duration": 3,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
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
            "battle_score": 2331,
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
                    "image_url": "/images/npcs/npc_roland_priest_anna.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "13",
                            "name": "祈り",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 30
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
                    "id": 1383,
                    "name": "Persepho",
                    "job_class": "Civilian",
                    "level": 8,
                    "hp": 176,
                    "max_hp": 176,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/abe8c1ff-5fb5-47dd-89cc-d20e217502a4/avatar.jpeg?t=1782293429456",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "16",
                            "name": "砂の罠",
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
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        },
                        {
                            "id": "133",
                            "name": "属性の共鳴",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "134",
                            "name": "プラズマシャワー",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "137",
                            "name": "クイックドロー",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_markand_merc_scimitar.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "18",
                            "name": "毒刃",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "206",
                    "name": "神器:草薙(模造)",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 18,
                        "description": "夜刀神国の神話に登場する剣の模造品。それでも一振りで竹林を吹き飛ばす威力を秘めている。"
                    }
                },
                {
                    "id": "503",
                    "name": "英霊の鎖帷子",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 14,
                        "description": "神々に抗った古代の英雄たちの残留魔力が編み込まれた鎖帷子。纏う者の傷を癒し、折れかけた心を奮い立たせる不思議な温もりがある。"
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
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
            "battle_score": 2337,
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
                    "hp": 284,
                    "max_hp": 284,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "21",
                            "name": "ツバメ返し",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 60
                        },
                        {
                            "id": "45",
                            "name": "岩砕き",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 55
                        },
                        {
                            "id": "7",
                            "name": "集中",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "26",
                            "name": "氣の癒やし",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 70
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
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
                        }
                    ]
                },
                {
                    "id": 1138,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 15,
                    "hp": 250,
                    "max_hp": 250,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "139",
                            "name": "タイムリバース",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "124",
                            "name": "凍てつく波動",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 0
                        },
                        {
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        },
                        {
                            "id": "113",
                            "name": "マナチャージ",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 30
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        }
                    ]
                },
                {
                    "id": 1104,
                    "name": "透",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 187,
                    "max_hp": 187,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/6d4473c3-a03e-4938-9a5d-1e1f5fadcafd/avatar.png?t=1781963398206",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "128",
                            "name": "グラウンディング",
                            "type": "Defense",
                            "ap_cost": 2,
                            "power": 15
                        },
                        {
                            "id": "104",
                            "name": "伝染病の霧",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 15
                        },
                        {
                            "id": "108",
                            "name": "犠牲の誓約",
                            "type": "Defense",
                            "ap_cost": 2,
                            "power": 20
                        },
                        {
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        },
                        {
                            "id": "67",
                            "name": "雷撃",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 45
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
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "502",
                    "name": "竜牙の剣",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 12,
                        "def_bonus": 2,
                        "description": "神代の守護竜の牙から鍛えた剣。刀身には天界の紋様が浮かび上がり、『神に弓引く者』の証として、持ち主に叛逆の力を宿す。",
                        "battle_start_buff": {
                            "value": 0.2,
                            "duration": 3,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "602",
                    "name": "神の法衣",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "def_bonus": 12,
                        "description": "忘却の五英霊の力を封じた法衣。纏う者に神聖な加護を与え、致命的な一撃すら耐え凌ぐ強固な結界を張る。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 2,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "e155794b-a049-4d34-a9ec-1b7086cba695",
            "user_name": "タクミ",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 1801,
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
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
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
                    "id": 672,
                    "name": "とらまる",
                    "job_class": "Civilian",
                    "level": 11,
                    "hp": 192,
                    "max_hp": 192,
                    "atk": 13,
                    "def": 12,
                    "inject_cards": [
                        37,
                        115,
                        135,
                        119,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/193c41b3-c6ee-4a72-bf73-0184d2976511/avatar.jpeg?t=1781883867183",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "37",
                            "name": "メテオストライク",
                            "type": "Magic",
                            "ap_cost": 5,
                            "power": 100
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        },
                        {
                            "id": "135",
                            "name": "アブソリュートゼロ",
                            "type": "Magic",
                            "ap_cost": 3,
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
                            "id": "64",
                            "name": "瞑想",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 3
                        }
                    ]
                },
                {
                    "id": 746,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 201,
                    "max_hp": 201,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 30
                        },
                        {
                            "id": "133",
                            "name": "属性の共鳴",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "135",
                            "name": "アブソリュートゼロ",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 25
                        },
                        {
                            "id": "124",
                            "name": "凍てつく波動",
                            "type": "Magic",
                            "ap_cost": 3,
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
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "219",
                    "name": "重装鎧",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 12,
                        "description": "全身を鋼鉄で覆い隠す防御力重視の鎧。物理的な攻撃を大きく軽減する。"
                    }
                },
                {
                    "id": "206",
                    "name": "神器:草薙(模造)",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 18,
                        "description": "夜刀神国の神話に登場する剣の模造品。それでも一振りで竹林を吹き飛ばす威力を秘めている。"
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "222",
                    "name": "幸運のコイン",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 4,
                        "description": "マルカンドの闇市で高値で取引される、持っているだけで会心の一撃が連発する不思議な硬貨。"
                    }
                },
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
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
                    "image_url": "/images/npcs/npc_yato_samurai_general.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "9",
                            "name": "挑発",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
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
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
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
                    "image_url": "/images/npcs/npc_roland_paladin_leo.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "11",
                            "name": "聖剣",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "15",
                            "name": "聖壁",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 20
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "319",
                    "name": "混沌の重鎧",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 40,
                        "description": "混沌の魔力により結晶化した未知の金属製プレートアーマー。圧倒的な防御力を提供する代償として、装備者の動作を著しく遅くする。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_down"
                        }
                    }
                },
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "321",
                    "name": "深緑のアミュレット",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 25,
                        "def_bonus": 5,
                        "description": "豊かな大森林の生命の息吹を宿すお守り。装備者の体内に宿る自然治癒力を呼び覚まし、絶え間なく体力を回復させる。",
                        "battle_start_buff": {
                            "duration": 3,
                            "buff_type": "regen"
                        }
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
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
            "user_id": "e26223d4-36b2-446e-b8ae-aa2c92be8b47",
            "user_name": "クロノ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e26223d4-36b2-446e-b8ae-aa2c92be8b47/avatar.png?t=1782598149931",
            "battle_score": 1724,
            "defense_rank": "B",
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
                    "hp": 241,
                    "max_hp": 241,
                    "atk": 20,
                    "def": 14,
                    "inject_cards": [
                        1,
                        13,
                        37,
                        64,
                        114,
                        124,
                        119
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.jpg?t=1782300093251",
                    "snapshot_data": {
                        "hp": 241,
                        "atk": 20,
                        "def": 14,
                        "deck": [],
                        "level": 15,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 25,
                            "atk": 21,
                            "def": 26
                        },
                        "equipped_items": [
                            {
                                "name": "幸運のコイン",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "竜牙の剣",
                                "slot": "weapon"
                            },
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "狐火の護符",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "英霊の鎖帷子",
                                "slot": "armor"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.2,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 10,
                                "duration": 3,
                                "buff_type": "def_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "13",
                            "name": "祈り",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 30
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
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                },
                {
                    "id": 1564,
                    "name": "雅人",
                    "job_class": "Civilian",
                    "level": 17,
                    "hp": 245,
                    "max_hp": 245,
                    "atk": 19,
                    "def": 19,
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
                    "image_url": "/avatars/adventurer.jpg",
                    "snapshot_data": {
                        "hp": 245,
                        "atk": 19,
                        "def": 19,
                        "deck": [],
                        "level": 17,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 40,
                            "atk": 14,
                            "def": 24
                        },
                        "equipped_items": [
                            {
                                "name": "商人の鞄",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "竜牙の剣",
                                "slot": "weapon"
                            },
                            {
                                "name": "重装鎧",
                                "slot": "armor"
                            },
                            {
                                "name": "十字軍の指輪",
                                "slot": "accessory_2"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.2,
                                "duration": 3,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "40",
                            "name": "暗殺",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "16",
                            "name": "砂の罠",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "27",
                            "name": "龍の咆哮",
                            "type": "Support",
                            "ap_cost": 3,
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
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "503",
                    "name": "英霊の鎖帷子",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 14,
                        "description": "神々に抗った古代の英雄たちの残留魔力が編み込まれた鎖帷子。纏う者の傷を癒し、折れかけた心を奮い立たせる不思議な温もりがある。"
                    }
                },
                {
                    "id": "351",
                    "name": "デーモンスレイヤー",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "次元深淵の魔王を討ち果たすために鍛え上げられた伝説の聖剣。手にするだけで邪悪を退ける神聖な加護が全身を包み込む。",
                        "battle_start_buff": [
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "233",
                    "name": "黄金のサイコロ",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "def_bonus": 2,
                        "description": "戦場の結果を運否天賦に任せる狂気のギャンブラーに愛用される、純金振りのサイコロ。"
                    }
                },
                {
                    "id": "501",
                    "name": "ガウェインの小手",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 7,
                        "description": "「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。",
                        "battle_start_buff": {
                            "value": 0.1,
                            "duration": 2,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "e50314d6-4b08-4e2a-b954-c81ff91e01f3",
            "user_name": "あめちぃ",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e50314d6-4b08-4e2a-b954-c81ff91e01f3/avatar.jpg?t=1782257002786",
            "battle_score": 2237,
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
                    "hp": 198,
                    "max_hp": 198,
                    "atk": 14,
                    "def": 8,
                    "inject_cards": [
                        40,
                        1,
                        12,
                        27
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c2494b75-13df-4189-9a94-de216ce0336e/avatar.png?t=1782407029074",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "40",
                            "name": "暗殺",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "12",
                            "name": "裁き",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "27",
                            "name": "龍の咆哮",
                            "type": "Support",
                            "ap_cost": 3,
                            "power": 0
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_free_griffon.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_yato_ronin_kenji.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
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
                    "id": 1271,
                    "name": "ドリミス",
                    "job_class": "Civilian",
                    "level": 10,
                    "hp": 205,
                    "max_hp": 205,
                    "atk": 14,
                    "def": 16,
                    "inject_cards": [
                        24,
                        119,
                        65,
                        66,
                        134
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/defefa6d-87e6-4fb4-8649-4bea5220c607/avatar.png?t=1781692394005",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "24",
                            "name": "清め",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 50
                        },
                        {
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
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
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        },
                        {
                            "id": "134",
                            "name": "プラズマシャワー",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 30
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "206",
                    "name": "神器:草薙(模造)",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 18,
                        "description": "夜刀神国の神話に登場する剣の模造品。それでも一振りで竹林を吹き飛ばす威力を秘めている。"
                    }
                },
                {
                    "id": "219",
                    "name": "重装鎧",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 12,
                        "description": "全身を鋼鉄で覆い隠す防御力重視の鎧。物理的な攻撃を大きく軽減する。"
                    }
                },
                {
                    "id": "233",
                    "name": "黄金のサイコロ",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "def_bonus": 2,
                        "description": "戦場の結果を運否天賦に任せる狂気のギャンブラーに愛用される、純金振りのサイコロ。"
                    }
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
            "user_id": "0f1c24a4-20e1-4d89-823a-7b0b20e1ab45",
            "user_name": "紅葉",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 2454,
            "defense_rank": "B",
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
                        }
                    ]
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
                    "image_url": "/images/npcs/npc_yato_kannushi.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "24",
                            "name": "清め",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 50
                        }
                    ]
                },
                {
                    "id": 1826,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 20,
                    "hp": 344,
                    "max_hp": 344,
                    "atk": 22,
                    "def": 24,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855",
                    "snapshot_data": {
                        "hp": 344,
                        "atk": 22,
                        "def": 24,
                        "deck": [],
                        "level": 20,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 0,
                            "atk": 80,
                            "def": 6
                        },
                        "equipped_items": [
                            {
                                "name": "村正",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "duration": 99,
                                "buff_type": "def_down"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "2",
                            "name": "斬撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "45",
                            "name": "岩砕き",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 55
                        },
                        {
                            "id": "8",
                            "name": "クイックステップ",
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
                        },
                        {
                            "id": "102",
                            "name": "傷口をえぐる",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "26",
                            "name": "氣の癒やし",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 70
                        },
                        {
                            "id": "122",
                            "name": "血の追撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 20
                        },
                        {
                            "id": "137",
                            "name": "クイックドロー",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "42",
                            "name": "血の怒り",
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
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "351",
                    "name": "デーモンスレイヤー",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "次元深淵の魔王を討ち果たすために鍛え上げられた伝説の聖剣。手にするだけで邪悪を退ける神聖な加護が全身を包み込む。",
                        "battle_start_buff": [
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "322",
                    "name": "魔導士の指輪",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 8,
                        "def_bonus": -2,
                        "description": "古代の魔力回路が組み込まれた指輪。スペルキャスターの魔力を増幅させ、呪文による破壊力を一時的に高める。",
                        "battle_start_buff": {
                            "value": 0.15,
                            "duration": 3,
                            "buff_type": "atk_up"
                        }
                    }
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
        },
        {
            "user_id": "0be1a6b5-763f-4bcb-8e63-59b49a121e68",
            "user_name": "ナス",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/0be1a6b5-763f-4bcb-8e63-59b49a121e68/avatar.png?t=1781702598439",
            "battle_score": 2231,
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
                    "hp": 176,
                    "max_hp": 176,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "2",
                            "name": "斬撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "3",
                            "name": "突き",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 18
                        },
                        {
                            "id": "10",
                            "name": "石投げ",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 8
                        },
                        {
                            "id": "7",
                            "name": "集中",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        },
                        {
                            "id": "5",
                            "name": "応急手当",
                            "type": "Heal",
                            "ap_cost": 1,
                            "power": 40
                        },
                        {
                            "id": "6",
                            "name": "シールドバッシュ",
                            "type": "Defense",
                            "ap_cost": 2,
                            "power": 10
                        },
                        {
                            "id": "22",
                            "name": "クナイ投げ",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 15
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
                    "id": 707,
                    "name": "Jack ",
                    "job_class": "Civilian",
                    "level": 12,
                    "hp": 205,
                    "max_hp": 205,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/bac4f137-a5fc-4ce2-977b-d64eaa4b0afc/avatar.jpeg?t=1781626808364",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "21",
                            "name": "ツバメ返し",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 60
                        },
                        {
                            "id": "40",
                            "name": "暗殺",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "2",
                            "name": "斬撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "3",
                            "name": "突き",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 18
                        },
                        {
                            "id": "7",
                            "name": "集中",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "26",
                            "name": "氣の癒やし",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 70
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
                    "image_url": "/images/npcs/npc_yato_samurai_general.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "9",
                            "name": "挑発",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
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
                    "id": 815,
                    "name": "とらまる",
                    "job_class": "Civilian",
                    "level": 12,
                    "hp": 203,
                    "max_hp": 203,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/193c41b3-c6ee-4a72-bf73-0184d2976511/avatar.jpeg?t=1781883867183",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "37",
                            "name": "メテオストライク",
                            "type": "Magic",
                            "ap_cost": 5,
                            "power": 100
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
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
                        },
                        {
                            "id": "12",
                            "name": "裁き",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "64",
                            "name": "瞑想",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 3
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "206",
                    "name": "神器:草薙(模造)",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 18,
                        "description": "夜刀神国の神話に登場する剣の模造品。それでも一振りで竹林を吹き飛ばす威力を秘めている。"
                    }
                },
                {
                    "id": "503",
                    "name": "英霊の鎖帷子",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 14,
                        "description": "神々に抗った古代の英雄たちの残留魔力が編み込まれた鎖帷子。纏う者の傷を癒し、折れかけた心を奮い立たせる不思議な温もりがある。"
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
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
        }
    ],
    "A": [
        {
            "user_id": "fac65cfe-bbae-4ca2-b647-fa95ee6ad734",
            "user_name": "なかなかな",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217",
            "battle_score": 3113,
            "defense_rank": "A",
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
                    "hp": 251,
                    "max_hp": 251,
                    "atk": 22,
                    "def": 16,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c4a8cf70-6185-4725-8e07-810bb5a53d38/avatar.png?t=1783243446077",
                    "snapshot_data": {
                        "hp": 251,
                        "atk": 22,
                        "def": 16,
                        "deck": [],
                        "level": 16,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 70,
                            "atk": 40,
                            "def": 35
                        },
                        "equipped_items": [
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "狐火の護符",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "怒りの腕輪",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "神の法衣",
                                "slot": "armor"
                            },
                            {
                                "name": "デーモンスレイヤー",
                                "slot": "weapon"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 10,
                                "duration": 3,
                                "buff_type": "def_up"
                            },
                            {
                                "duration": 3,
                                "buff_type": "stun_infuse"
                            },
                            {
                                "value": 0.3,
                                "duration": 2,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.1,
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "37",
                            "name": "メテオストライク",
                            "type": "Magic",
                            "ap_cost": 5,
                            "power": 100
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
                            "id": "5",
                            "name": "応急手当",
                            "type": "Heal",
                            "ap_cost": 1,
                            "power": 40
                        },
                        {
                            "id": "6",
                            "name": "シールドバッシュ",
                            "type": "Defense",
                            "ap_cost": 2,
                            "power": 10
                        },
                        {
                            "id": "124",
                            "name": "凍てつく波動",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 0
                        },
                        {
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 30
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
                    "image_url": "/images/npcs/npc_markand_bedouin.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "1",
                            "name": "強打",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
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
                    "id": 1887,
                    "name": "ArcLine",
                    "job_class": "Civilian",
                    "level": 12,
                    "hp": 215,
                    "max_hp": 215,
                    "atk": 20,
                    "def": 16,
                    "inject_cards": [
                        57,
                        58,
                        55,
                        115,
                        129,
                        130
                    ],
                    "image_url": "/avatars/adventurer.jpg",
                    "snapshot_data": {
                        "hp": 215,
                        "atk": 20,
                        "def": 16,
                        "deck": [],
                        "level": 12,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 0,
                            "atk": 80,
                            "def": 6
                        },
                        "equipped_items": [
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "村正",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "duration": 99,
                                "buff_type": "def_down"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
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
                            "id": "55",
                            "name": "時止めの法",
                            "type": "Support",
                            "ap_cost": 5,
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
                            "id": "129",
                            "name": "成金の一撃",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 30
                        },
                        {
                            "id": "130",
                            "name": "ギャンブラーダイス",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 60
                        }
                    ]
                },
                {
                    "id": 1885,
                    "name": "将哉",
                    "job_class": "Civilian",
                    "level": 21,
                    "hp": 353,
                    "max_hp": 353,
                    "atk": 23,
                    "def": 25,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/2e3beb82-3fb8-4321-b13c-9eaa7a4ca897/avatar.jpg?t=1782109724855",
                    "snapshot_data": {
                        "hp": 353,
                        "atk": 23,
                        "def": 25,
                        "deck": [],
                        "level": 21,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 0,
                            "atk": 80,
                            "def": 6
                        },
                        "equipped_items": [
                            {
                                "name": "村正",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "duration": 99,
                                "buff_type": "def_down"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "2",
                            "name": "斬撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 12
                        },
                        {
                            "id": "45",
                            "name": "岩砕き",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 55
                        },
                        {
                            "id": "8",
                            "name": "クイックステップ",
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
                        },
                        {
                            "id": "102",
                            "name": "傷口をえぐる",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "26",
                            "name": "氣の癒やし",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 70
                        },
                        {
                            "id": "122",
                            "name": "血の追撃",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 20
                        },
                        {
                            "id": "137",
                            "name": "クイックドロー",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "42",
                            "name": "血の怒り",
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
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
                },
                {
                    "id": "322",
                    "name": "魔導士の指輪",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 8,
                        "def_bonus": -2,
                        "description": "古代の魔力回路が組み込まれた指輪。スペルキャスターの魔力を増幅させ、呪文による破壊力を一時的に高める。",
                        "battle_start_buff": {
                            "value": 0.15,
                            "duration": 3,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
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
            "user_id": "16bafcdc-a211-482b-8850-6b94031ed6ea",
            "user_name": "せな",
            "avatar_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/16bafcdc-a211-482b-8850-6b94031ed6ea/avatar.png?t=1781626478030",
            "battle_score": 3161,
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
                    "image_url": "/images/npcs/npc_guest_volg.png",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "48",
                            "name": "天翔斬",
                            "type": "Skill",
                            "ap_cost": 5,
                            "power": 120
                        },
                        {
                            "id": "25",
                            "name": "居合切り",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 100
                        },
                        {
                            "id": "28",
                            "name": "鉄布衫",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 30
                        },
                        {
                            "id": "29",
                            "name": "連撃",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 40
                        }
                    ]
                },
                {
                    "id": 696,
                    "name": "ベル",
                    "job_class": "Civilian",
                    "level": 16,
                    "hp": 243,
                    "max_hp": 243,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/c7906aec-ba14-4e35-8102-b21c6bea529a/avatar.jpeg?t=1781659829258",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "37",
                            "name": "メテオストライク",
                            "type": "Magic",
                            "ap_cost": 5,
                            "power": 100
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
                        },
                        {
                            "id": "58",
                            "name": "即死攻撃",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 30
                        }
                    ]
                },
                {
                    "id": 956,
                    "name": "リンネ",
                    "job_class": "Civilian",
                    "level": 11,
                    "hp": 197,
                    "max_hp": 197,
                    "atk": 11,
                    "def": 10,
                    "inject_cards": [
                        115,
                        139,
                        119,
                        15,
                        64
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/e26223d4-36b2-446e-b8ae-aa2c92be8b47/avatar.png?t=1782007944627",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "15",
                            "name": "聖壁",
                            "type": "Defense",
                            "ap_cost": 3,
                            "power": 20
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
                    "id": 957,
                    "name": "リマーナ",
                    "job_class": "Civilian",
                    "level": 14,
                    "hp": 232,
                    "max_hp": 232,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/99ec1273-d758-4797-a5e3-ab6761eb5561/avatar.png?t=1781631772227",
                    "snapshot_data": {},
                    "signature_deck_snapshot": [
                        {
                            "id": "40",
                            "name": "暗殺",
                            "type": "Skill",
                            "ap_cost": 3,
                            "power": 50
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        },
                        {
                            "id": "133",
                            "name": "属性の共鳴",
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "14",
                            "name": "治癒",
                            "type": "Heal",
                            "ap_cost": 2,
                            "power": 80
                        },
                        {
                            "id": "65",
                            "name": "火球",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 40
                        },
                        {
                            "id": "64",
                            "name": "瞑想",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 3
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "230",
                    "name": "大賢者の杖",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "atk_bonus": 12,
                        "description": "ローランの最高位魔術師のみが持つことを許された、宇宙の真理へアクセスできる杖。"
                    }
                },
                {
                    "id": "503",
                    "name": "英霊の鎖帷子",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 10,
                        "def_bonus": 14,
                        "description": "神々に抗った古代の英雄たちの残留魔力が編み込まれた鎖帷子。纏う者の傷を癒し、折れかけた心を奮い立たせる不思議な温もりがある。"
                    }
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
            "user_id": "a52c0e53-7c2c-4929-a58b-c3a8788cfa3d",
            "user_name": "ArcLine",
            "avatar_url": "/avatars/adventurer.jpg",
            "battle_score": 3650,
            "defense_rank": "A",
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
                    "hp": 265,
                    "max_hp": 265,
                    "atk": 23,
                    "def": 26,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/fac65cfe-bbae-4ca2-b647-fa95ee6ad734/avatar.png?t=1781845986217",
                    "snapshot_data": {
                        "hp": 265,
                        "atk": 23,
                        "def": 26,
                        "deck": [],
                        "level": 18,
                        "blessing_data": {
                            "hp_pct": 0.1,
                            "ap_bonus": 1,
                            "expires_after_battle": true
                        },
                        "equipped_bonus": {
                            "hp": 30,
                            "atk": 63,
                            "def": 14
                        },
                        "equipped_items": [
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "デーモンバスター",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
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
                            "id": "59",
                            "name": "狂戦士の薬",
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
                        },
                        {
                            "id": "67",
                            "name": "雷撃",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 45
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        },
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
                            "id": "119",
                            "name": "ダブルキャスト",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        }
                    ]
                },
                {
                    "id": 1882,
                    "name": "雅人",
                    "job_class": "Civilian",
                    "level": 21,
                    "hp": 280,
                    "max_hp": 280,
                    "atk": 22,
                    "def": 25,
                    "inject_cards": [
                        37,
                        54,
                        115,
                        134,
                        136
                    ],
                    "image_url": "/avatars/adventurer.jpg",
                    "snapshot_data": {
                        "hp": 280,
                        "atk": 22,
                        "def": 25,
                        "deck": [],
                        "level": 21,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 60,
                            "atk": 37,
                            "def": 35
                        },
                        "equipped_items": [
                            {
                                "name": "デーモンバスター",
                                "slot": "weapon"
                            },
                            {
                                "name": "商人の鞄",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "深淵の盾",
                                "slot": "armor"
                            },
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "十字軍の指輪",
                                "slot": "accessory_2"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 10,
                                "duration": 3,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "37",
                            "name": "メテオストライク",
                            "type": "Magic",
                            "ap_cost": 5,
                            "power": 100
                        },
                        {
                            "id": "54",
                            "name": "死の舞踊",
                            "type": "Skill",
                            "ap_cost": 4,
                            "power": 50
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        },
                        {
                            "id": "134",
                            "name": "プラズマシャワー",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 30
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
                    "id": 1880,
                    "name": "魔剣士 テリア",
                    "job_class": "Civilian",
                    "level": 26,
                    "hp": 349,
                    "max_hp": 349,
                    "atk": 24,
                    "def": 27,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/097ade0d-ff40-4b2f-a0cf-0f79076c5f77/avatar.jpeg?t=1782585034384",
                    "snapshot_data": {
                        "hp": 349,
                        "atk": 24,
                        "def": 27,
                        "deck": [],
                        "level": 26,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 30,
                            "atk": 60,
                            "def": 16
                        },
                        "equipped_items": [
                            {
                                "name": "デーモンバスター",
                                "slot": "weapon"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "暗黒の外套",
                                "slot": "armor"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "烈火のルビーリング",
                                "slot": "accessory_1"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.3,
                                "duration": 5,
                                "buff_type": "evasion_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 0.5,
                                "duration": 1,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
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
                            "id": "30",
                            "name": "飛刀",
                            "type": "Skill",
                            "ap_cost": 2,
                            "power": 25
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
                            "id": "137",
                            "name": "クイックドロー",
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
                        },
                        {
                            "id": "130",
                            "name": "ギャンブラーダイス",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 60
                        },
                        {
                            "id": "117",
                            "name": "ブレインスピン",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "120",
                            "name": "リサイクル",
                            "type": "Support",
                            "ap_cost": 1,
                            "power": 0
                        },
                        {
                            "id": "142",
                            "name": "シャドークロウ",
                            "type": "Skill",
                            "ap_cost": 1,
                            "power": 18
                        }
                    ]
                },
                {
                    "id": 1881,
                    "name": "Melody",
                    "job_class": "Civilian",
                    "level": 17,
                    "hp": 270,
                    "max_hp": 270,
                    "atk": 20,
                    "def": 20,
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
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040",
                    "snapshot_data": {
                        "hp": 270,
                        "atk": 20,
                        "def": 20,
                        "deck": [],
                        "level": 17,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 65,
                            "atk": 43,
                            "def": 32
                        },
                        "equipped_items": [
                            {
                                "name": "デーモンバスター",
                                "slot": "weapon"
                            },
                            {
                                "name": "深淵の盾",
                                "slot": "armor"
                            },
                            {
                                "name": "魔導士の指輪",
                                "slot": "accessory_3"
                            },
                            {
                                "name": "氷結のブローチ",
                                "slot": "accessory_2"
                            },
                            {
                                "name": "深緑のアミュレット",
                                "slot": "accessory_1"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 20,
                                "duration": 3,
                                "buff_type": "def_up"
                            },
                            {
                                "value": 0.15,
                                "duration": 3,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 30,
                                "duration": 3,
                                "buff_type": "absolute_barrier"
                            },
                            {
                                "duration": 3,
                                "buff_type": "regen"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "16",
                            "name": "砂の罠",
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
                            "id": "66",
                            "name": "氷槍",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 35
                        },
                        {
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 30
                        },
                        {
                            "id": "115",
                            "name": "雷電の連鎖",
                            "type": "Magic",
                            "ap_cost": 3,
                            "power": 20
                        },
                        {
                            "id": "137",
                            "name": "クイックドロー",
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
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "350",
                    "name": "デーモンバスター",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 30,
                        "atk_bonus": 35,
                        "def_bonus": 10,
                        "description": "戦闘開始時に5ターンの間、攻撃力と防御力が上昇する大剣。",
                        "battle_start_buff": [
                            {
                                "duration": 5,
                                "buff_type": "atk_up"
                            },
                            {
                                "value": 15,
                                "duration": 5,
                                "buff_type": "def_up"
                            }
                        ]
                    }
                },
                {
                    "id": "332",
                    "name": "烈火のルビーリング",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 5,
                        "description": "火山のマグマを閉じ込めたかのように赤く輝くルビーの指輪。装備者が放つ火属性の攻撃力を増幅する。",
                        "battle_start_buff": {
                            "value": 0.5,
                            "duration": 1,
                            "buff_type": "atk_up"
                        }
                    }
                },
                {
                    "id": "318",
                    "name": "暗黒の外套",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 10,
                        "def_bonus": 6,
                        "description": "影守の魔力が込められた闇の外套。着用者の輪郭をぼやけさせ、暗闇での隠密性と回避力を劇的に高める。",
                        "battle_start_buff": {
                            "value": 0.3,
                            "duration": 5,
                            "buff_type": "evasion_up"
                        }
                    }
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
            "battle_score": 11790,
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
                    "hp": 250,
                    "max_hp": 250,
                    "atk": 16,
                    "def": 18,
                    "inject_cards": [
                        139,
                        55,
                        113,
                        114,
                        115,
                        124
                    ],
                    "image_url": "https://auth.code-wirth-dawn.com/storage/v1/object/public/avatars/205fca0d-0bc0-41b9-9687-50a00743fd0c/avatar.png?t=1781922609040",
                    "snapshot_data": {
                        "hp": 250,
                        "atk": 16,
                        "def": 18,
                        "deck": [],
                        "level": 15,
                        "blessing_data": null,
                        "equipped_bonus": {
                            "hp": 15,
                            "atk": 18,
                            "def": 19
                        },
                        "equipped_items": [
                            {
                                "name": "ガウェインの小手",
                                "slot": "accessory_1"
                            },
                            {
                                "name": "神器:草薙(模造)",
                                "slot": "weapon"
                            },
                            {
                                "name": "重装鎧",
                                "slot": "armor"
                            }
                        ],
                        "battle_start_buffs": [
                            {
                                "value": 0.1,
                                "duration": 2,
                                "buff_type": "atk_up"
                            }
                        ]
                    },
                    "signature_deck_snapshot": [
                        {
                            "id": "139",
                            "name": "タイムリバース",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "55",
                            "name": "時止めの法",
                            "type": "Support",
                            "ap_cost": 5,
                            "power": 0
                        },
                        {
                            "id": "113",
                            "name": "マナチャージ",
                            "type": "Support",
                            "ap_cost": 2,
                            "power": 0
                        },
                        {
                            "id": "114",
                            "name": "フリーズランサー",
                            "type": "Magic",
                            "ap_cost": 2,
                            "power": 30
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
                        }
                    ]
                }
            ],
            "equipped_items_snapshot": [
                {
                    "id": "244",
                    "name": "盗賊の七つ道具",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 3,
                        "description": "どんなに固く閉ざされた宝箱の錠前も簡単に開けてしまう、特殊な形状をした鍵開けツールのセット。"
                    }
                },
                {
                    "id": "244",
                    "name": "盗賊の七つ道具",
                    "type": "equipment",
                    "effect_data": {
                        "def_bonus": 3,
                        "description": "どんなに固く閉ざされた宝箱の錠前も簡単に開けてしまう、特殊な形状をした鍵開けツールのセット。"
                    }
                },
                {
                    "id": "3045",
                    "name": "狐火の護符",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "atk_bonus": 5,
                        "def_bonus": 3,
                        "description": "妖狐の姫が婚礼の夜に贈った護符。狐火の青白い炎が封じられ、霊的な災いから持ち主を守護する。触れると微かに温もりがあり、暗闇で淡く発光する。",
                        "battle_start_buff": {
                            "value": 10,
                            "duration": 3,
                            "buff_type": "def_up"
                        }
                    }
                },
                {
                    "id": "568",
                    "name": "砂防の革甲",
                    "type": "equipment",
                    "effect_data": {
                        "hp_bonus": 5,
                        "def_bonus": 3,
                        "description": "砂漠の過酷な環境に耐えるために設計された軽量な革甲。"
                    }
                },
                {
                    "id": "206",
                    "name": "神器:草薙(模造)",
                    "type": "equipment",
                    "effect_data": {
                        "atk_bonus": 18,
                        "description": "夜刀神国の神話に登場する剣の模造品。それでも一振りで竹林を吹き飛ばす威力を秘めている。"
                    }
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

        // 1. 挑戦者プレイヤーの現在戦闘スコア、ランク、アリーナレートの取得
        const [profileResult, enrichedMembers, inventoryResult, defensePartyCheck] = await Promise.all([
            supabaseServer
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(),
            PartyService.getEnrichedPartyMembers(userId),
            supabaseServer
                .from('inventory')
                .select('item_id, is_equipped, items!inner(type, effect_data)')
                .eq('user_id', userId)
                .eq('is_equipped', true),
            supabaseServer
                .from('pvp_defense_parties')
                .select('user_id')
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
        if (totalScore >= 8000) rankClass = 'S';
        else if (totalScore >= 4000) rankClass = 'A';
        else if (totalScore >= 2000) rankClass = 'B';

        const myRate = profile.arena_rate ?? 1000;

        // 2. 対戦相手選出（同ランク優先2枠、残りは全体/レート近接からランダム）
        // 負荷軽減のため、軽量なカラム情報のみを取得 (snapshot_dataを除外するために、取得後に必要な部分のみにマップ)
        
        // 重複排除のための seenUserIds セット (自分自身および本番テストユーザーを除外)
        const seenUserIds = new Set<string>();
        seenUserIds.add(userId);
        seenUserIds.add('c1cf67dd-527a-497e-bf88-ce10c2cb516f');

        // フェーズ1: 同ランク優先枠 (最大2枠)
        const { data: sameRankOpponents } = await supabaseServer
            .from('pvp_defense_parties')
            .select('user_id, defender_rank, updated_at, snapshot_data')
            .eq('defender_rank', rankClass)
            .neq('user_id', userId)
            .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
            .limit(10); // 候補をいくつか取ってインメモリでランダム選択

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

        // 自分のレート近接レンジからインデックススキャンで引く (全件スキャン Seq Scan 回避)
        const { data: rangeOpponents } = await supabaseServer
            .from('pvp_defense_parties')
            .select('user_id, defender_rank, updated_at, snapshot_data')
            .neq('user_id', userId)
            .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
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

        // マージして一覧用の軽量フォーマットに整形 (重い snapshot_data 内部の装備・スキル詳細は除外)
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
                // 一覧用なので装備・スキル snapshot_data 詳細は除外し lazy load させる
                party_members_snapshot: (snap.party_members_snapshot || []).map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    job_class: m.job_class,
                    level: m.level,
                    hp: m.hp,
                    max_hp: m.max_hp,
                    atk: m.atk,
                    def: m.def
                })),
                equipped_items_snapshot: undefined,
                skill_deck_snapshot: undefined,
                arena_rate: 1000
            };
        });

        // 3. 不足分をゴーストデータで補填 (最大5件、同じゴーストNPCの重複も seenUserIds で完全遮断)
        let ghostCountNeeded = 5 - opponentsList.length;
        if (ghostCountNeeded > 0) {
            // まずは自ランクのゴーストから補充
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

        // 各対戦相手の現在のアリーナレートを DB (user_profiles.arena_rate) からピンポイントで取得してマージ
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
        });

    } catch (err: any) {
        console.error('[PvP Opponents] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
