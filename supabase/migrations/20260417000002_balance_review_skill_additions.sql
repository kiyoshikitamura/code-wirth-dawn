-- Migration: NPC Balance Review — スキル構成変更 & ATK CSV同期
-- バランスレビュー §6.3 推奨に基づき、1枚構成NPCに2枚目のスキルを追加
-- CSVのATK値が既に20260417000001_add_npc_atk.sqlで反映済みなので、
-- 本マイグレーションではスキル（inject_cards）変更のみ

-- ============================================================
-- 高優先度: 攻撃手段なし / 1枚構成で無力化しやすいNPC

-- ホウイチ (琵琶法師): 防御のみ → 防御 + 強打
-- 理由: 防御のみで攻撃不可。最低限の自衛手段を追加
UPDATE npcs SET inject_cards = ARRAY['4', '1'], default_cards = ARRAY['4', '1']
WHERE slug = 'npc_yato_monk_hoichi';

-- ゴンペイ (足軽兵): 斬撃のみ → 斬撃 + 防御
-- 理由: 足軽は攻防一体。盾持ちとしての役割を追加
UPDATE npcs SET inject_cards = ARRAY['2', '4'], default_cards = ARRAY['2', '4']
WHERE slug = 'npc_yato_ashigaru';

-- アレン (駆け出し冒険者): 斬撃のみ → 斬撃 + 突き
-- 理由: 冒険者として複数の基本剣術を持つのは自然
UPDATE npcs SET inject_cards = ARRAY['2', '3'], default_cards = ARRAY['2', '3']
WHERE slug = 'npc_free_adventurer_a';

-- 野犬 (薄汚れた): 強打のみ → 強打 + クイックステップ
-- 理由: 野犬は機敏。回避で生存力UP
UPDATE npcs SET inject_cards = ARRAY['1', '8'], default_cards = ARRAY['1', '8']
WHERE slug = 'npc_free_stray_dog';

-- キョンシー: 連撃のみ → 連撃 + 防御
-- 理由: HP壁として防御を持つのが合理的
UPDATE npcs SET inject_cards = ARRAY['29', '4'], default_cards = ARRAY['29', '4']
WHERE slug = 'npc_karyu_jiangshi';

-- ============================================================
-- 中優先度: 回復専でAP枯渇するNPC

-- ライラ (砂漠の踊り子): 治癒のみ → 治癒 + 応急手当
-- 理由: AP2治癒のみだとAP枯渇。AP1の応急手当で行動数確保
UPDATE npcs SET inject_cards = ARRAY['14', '5'], default_cards = ARRAY['14', '5']
WHERE slug = 'npc_markand_dancer_lila';

-- エドワード (吟遊詩人): 治癒のみ → 治癒 + 集中
-- 理由: 吟遊詩人としてバフ付与。仲間の火力を支援するロール
UPDATE npcs SET inject_cards = ARRAY['14', '7'], default_cards = ARRAY['14', '7']
WHERE slug = 'npc_free_bard';

-- 猫 (路地裏の): 応急手当のみ → 応急手当 + クイックステップ
-- 理由: 猫は敏捷。回避で自身の生存力UP（cover_rate 90%の壁と両立）
UPDATE npcs SET inject_cards = ARRAY['5', '8'], default_cards = ARRAY['5', '8']
WHERE slug = 'npc_free_cat';
