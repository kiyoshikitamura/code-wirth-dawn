
-- Multi-Stage Escort Quest: Escort to the Empire
-- Route: Arcadia -> White Fort -> Iron Mine -> Karon

INSERT INTO scenarios (
    slug,
    title,
    description,
    client_name,
    type,
    difficulty,
    rec_level,
    is_urgent,
    time_cost,
    ruling_nation_id,
    location_id,
    conditions,
    rewards,
    flow_nodes
) VALUES (
    'quest_escort_empire_v1',
    '帝都への要人護衛',
    '王都から帝都カロンへ向かう重要人物の護衛任務。長路となるため、準備を怠らないように。',
    '王宮騎士団',
    'Delivery',
    3,
    5,
    true,
    0, -- Dynamic time cost based on travel
    'Roland',
    (SELECT id FROM locations WHERE slug = 'loc_regalia'), -- Start at Arcadia
    '{"min_level": 5}'::jsonb,
    '{"gold": 5000, "reputation_diff": {"loc_regalia": 10, "loc_charon": 10}}'::jsonb,
    jsonb_build_array(
        jsonb_build_object(
            'id', 'start',
            'type', 'dialogue',
            'text', '「やあ、君が護衛を引き受けてくれた冒険者か。帝都カロンまでの長旅だ。よろしく頼む。」 要人、アルフレッドは丁寧に頭を下げた。',
            'bg_key', '/backgrounds/castle_gate.jpg',
            'choices', jsonb_build_array(
                jsonb_build_object('label', '出発する', 'next_node', 'move_fort')
            )
        ),
        -- Leg 1: Arcadia -> White Fort
        jsonb_build_object(
            'id', 'move_fort',
            'type', 'travel',
            'target_location_slug', 'loc_jgxgj3', -- White Fort
            'text_start', '王都を後にし、白亜の砦を目指す。',
            'encounter_rate', 0.5,
            'next_node_battle', 'battle_1',
            'next_node_success', 'arrive_fort'
        ),
        jsonb_build_object(
            'id', 'battle_1',
            'type', 'battle',
            'enemy_group_id', 'bandits', -- Fallback if not exists, code handles it
            'next_node', 'arrive_fort'
        ),
        jsonb_build_object(
            'id', 'arrive_fort',
            'type', 'dialogue',
            'text', '白亜の砦に到着した。兵士たちが周囲を警戒している。「ふぅ、まずは一息つけそうですね。」',
            'bg_key', '/backgrounds/fort.jpg',
            'action', 'heal_partial', -- Optional: partial heal?
            'choices', jsonb_build_array(
                jsonb_build_object('label', '先を急ぐ (鉄の鉱山村へ)', 'next_node', 'move_mine')
            )
        ),

        -- Leg 2: White Fort -> Iron Mine
        jsonb_build_object(
            'id', 'move_mine',
            'type', 'travel',
            'target_location_slug', 'loc_d0etgt', -- Iron Mine
            'text_start', '街道を南下し、鉄の鉱山村へ向かう。',
            'encounter_rate', 0.6,
            'next_node_battle', 'battle_2',
            'next_node_success', 'arrive_mine'
        ),
        jsonb_build_object(
            'id', 'battle_2',
            'type', 'battle',
            'enemy_group_id', 'wolves',
            'next_node', 'arrive_mine'
        ),
        jsonb_build_object(
            'id', 'arrive_mine',
            'type', 'dialogue',
            'text', '鉄の鉱山村に辿り着いた。槌音が響いている。「帝都まであと少しですね...」',
            'bg_key', '/backgrounds/mine.jpg',
            'choices', jsonb_build_array(
                jsonb_build_object('label', '帝都へ向かう', 'next_node', 'move_capital')
            )
        ),

        -- Leg 3: Iron Mine -> Karon
        jsonb_build_object(
            'id', 'move_capital',
            'type', 'travel',
            'target_location_slug', 'loc_charon', -- Karon
            'text_start', '最後の難所を越え、帝都カロンを目指す。',
            'encounter_rate', 0.7,
            'next_node_battle', 'battle_3',
            'next_node_success', 'arrive_capital'
        ),
        jsonb_build_object(
            'id', 'battle_3',
            'type', 'battle',
            'enemy_group_id', 'soldiers',
            'next_node', 'arrive_capital'
        ),
        jsonb_build_object(
            'id', 'arrive_capital',
            'type', 'dialogue',
            'text', '帝都カロンの威容が目の前に広がる。「無事に送り届けてくれて感謝します。これは心ばかりの報酬です。」',
            'bg_key', '/backgrounds/empire_city.jpg',
            'choices', jsonb_build_array(
                jsonb_build_object('label', '報酬を受け取る', 'next_node', 'complete')
            )
        ),
        jsonb_build_object(
            'id', 'complete',
            'type', 'process_rewards',
            'next_node', 'end' -- Code handles this
        )
    )
) ON CONFLICT (slug) DO NOTHING;
