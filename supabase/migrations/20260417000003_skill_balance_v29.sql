-- Migration: Skill Balance Pass — v2.9
-- HP回復2倍、AP調整、ダメージ調整、影縫いスタン延長

-- ============================================================
-- HP回復スキル: 回復量を全体2倍に上方修正

-- 応急手当: 20 → 40
UPDATE cards SET effect_val = 40, description = '傷口を素早く処置する。40の体力を回復する。'
WHERE slug = 'card_first_aid';

-- 祈り: 15 → 30
UPDATE cards SET effect_val = 30, description = '神への祈りで仲間を癒す。30の体力を回復し、さらに3ターンのリジェネ（毎ターンHP5%回復）を付与する。'
WHERE slug = 'card_prayer';

-- 治癒: 40 → 80
UPDATE cards SET effect_val = 80, description = '光の力で傷を塞ぐ。単体の体力を80回復する。'
WHERE slug = 'card_heal';

-- オアシスの水: 30 → 60
UPDATE cards SET effect_val = 60, description = '霊泉の水で状態異常を解除する。60の体力を回復し、毒・出血・スタン等すべての状態異常を即座に解除する。'
WHERE slug = 'card_oasis_water';

-- 清め: 25 → 50
UPDATE cards SET effect_val = 50, description = '禊の水でデバフを払い除ける。50の体力を回復し、ATK DOWN・目潰し等のデバフを即座に解除する。'
WHERE slug = 'card_purify';

-- 氣の癒やし: 35 → 70
UPDATE cards SET effect_val = 70, description = '氣の流れを整えて傷を癒す。70の体力を回復し、さらに3ターンのリジェネ（毎ターンHP5%回復）を付与する。'
WHERE slug = 'card_qigong_heal';

-- 女神の祝福: 50 → 100
UPDATE cards SET effect_val = 100, description = '女神の祝福でパーティ全体を回復・強化する。全体を100回復し、3ターンのリジェネを付与する。'
WHERE slug = 'card_blessing';

-- 市民の支援: 300 → 600
UPDATE cards SET effect_val = 600
WHERE slug = 'card_citizen_support';

-- ============================================================
-- AP消費変更

-- 挑発: AP 2 → 1
UPDATE cards SET ap_cost = 1, description = '敵全体の注意を自身に引きつける。2ターンの間、敵の単体攻撃を自分が引き受ける（挑発）。'
WHERE slug = 'card_taunt';

-- 集中: AP 1 → 2
UPDATE cards SET ap_cost = 2
WHERE slug = 'card_focus';

-- クイックステップ: AP 1 → 2
UPDATE cards SET ap_cost = 2
WHERE slug = 'card_quick_step';

-- 砂塵の目眩まし: AP 2 → 3
UPDATE cards SET ap_cost = 3
WHERE slug = 'card_sandstorm';

-- 居合切り: AP 3 → 4, ダメージ 60 → 100
UPDATE cards SET ap_cost = 4, effect_val = 100, description = '刹那に放つ鞘からの一閃。スタンや目潰し等の状態異常を無視して100の大ダメージを与える。'
WHERE slug = 'card_iai_slash';

-- 鉄布衫: AP 2 → 3
UPDATE cards SET ap_cost = 3
WHERE slug = 'card_iron_body';

-- ============================================================
-- ダメージ変更

-- 聖剣: 45 → 50
UPDATE cards SET effect_val = 50, description = '聖なる炎を宿した魔法の剣で斬りつける。DEFを無視して50のダメージを与える魔法攻撃。'
WHERE slug = 'card_holy_sword';

-- 裁き: 50 → 80
UPDATE cards SET effect_val = 80, description = '神の裁きを乱数攻撃として降らせる。ランダムな敵に80の魔法ダメージを与える。'
WHERE slug = 'card_holy_smite';

-- ツバメ返し: 50 → 60
UPDATE cards SET effect_val = 60, description = '神速の抜刀術で敵を切り払う高威力の一撃。防御カードを使ったかのような素早さで60の大ダメージを叩き込む。'
WHERE slug = 'card_swallow_rev';

-- ============================================================
-- 効果変更

-- 影縫い: スタン 1T → 2T
UPDATE cards SET description = '敵の影を縫いとめて動きを封じる。2ターンの間、敵を完全に行動不能（スタン）にする。ダメージなし。'
WHERE slug = 'card_shadow_stitch';
-- Note: effect_duration は cards テーブルのカラムではなく、cardEffects.ts で管理
