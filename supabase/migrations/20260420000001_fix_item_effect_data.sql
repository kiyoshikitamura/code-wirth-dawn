-- ============================================================
-- v2.9.3m: アイテム effect_data 修正マイグレーション
-- 道具屋ポップアップの表示不整合を修正
-- ============================================================

-- 1. 火炎瓶: description の「炎上」を「毒」に修正（effect_id は poison のまま）
UPDATE items SET effect_data = '{"damage":30,"target":"enemy","effect_id":"poison","use_timing":"battle","description":"火炎瓶を投げつけ30ダメージ。さらに毒（2ターン持続ダメージ）を与える。","effect_duration":2}'::jsonb
WHERE slug = 'item_oil_pot';

-- 2. 煙玉: escape:true を追加（戦闘離脱効果の実装）
UPDATE items SET effect_data = '{"escape":true,"use_timing":"battle","description":"煙幕を張って戦闘から確実に逃走する。"}'::jsonb
WHERE slug = 'item_smokescreen';

-- 3. 強い酒: heal:20 を追加（HP回復効果の実装）
UPDATE items SET effect_data = '{"heal":20,"use_timing":"battle","description":"飲むとHP20回復するが、癖の強い蒸留酒。"}'::jsonb
WHERE slug = 'item_whiskey';

-- 4. 中和薬: description 追加
UPDATE items SET effect_data = '{"heal":150,"use_timing":"battle","description":"冒険者の常備薬。HPを150回復する。"}'::jsonb
WHERE slug = 'item_potion';

-- 5. 上級中和薬: description 追加
UPDATE items SET effect_data = '{"heal":350,"use_timing":"battle","description":"上質な薬草を調合した高級薬。HPを350回復する。"}'::jsonb
WHERE slug = 'item_high_potion';

-- 6. 護法符: 矛盾する effect:"evasion_up" を削除、description 追加
UPDATE items SET effect_data = '{"target":"enemy","effect_id":"stun","use_timing":"battle","description":"神朝の霊符を投げつけ、敵をスタンさせる。","effect_duration":1}'::jsonb
WHERE slug = 'item_karyu_charm';

-- 7. 竜血: description 追加
UPDATE items SET effect_data = '{"use_timing":"field","vit_restore":3,"description":"竜の血液。服用するとVitalityが3回復する希少な霊薬。"}'::jsonb
WHERE slug = 'item_dragon_blood';

-- ============================================================
-- v2.9.3m Phase 2b: 装備品 description 修正（未実装効果の参照を除去）
-- ============================================================

-- 砂漠の外套: 「回避率も高める」→ DEF+4のみ
UPDATE items SET effect_data = '{"def_bonus":4,"description":"砂漠の砂嵐から身を守る外套。DEF+4。"}'::jsonb
WHERE slug = 'gear_desert_cloak';

-- 青龍偃月刀: 「全体を薙ぎ払う」→ ATK+12
UPDATE items SET effect_data = '{"atk_bonus":12,"description":"圧倒的な攻撃力を誇る大薙刀。ATK+12。"}'::jsonb
WHERE slug = 'gear_dragon_spear';

-- 鉄の爪: 「出血と連撃」→ ATK+6
UPDATE items SET effect_data = '{"atk_bonus":6,"description":"鉄の爪で敵を引き裂く格闘武器。ATK+6。"}'::jsonb
WHERE slug = 'gear_iron_fist';

-- 冒険者の靴: 「逃走を決め機動力を高める」→ DEF+2
UPDATE items SET effect_data = '{"def_bonus":2,"description":"軽量で丈夫な冒険者用のブーツ。DEF+2。"}'::jsonb
WHERE slug = 'gear_adventurer_boots';

-- 幸運のコイン: 「会心の一撃が連発」→ ATK+4, HP+5
UPDATE items SET effect_data = '{"atk_bonus":4,"hp_bonus":5,"description":"不思議な力が宿る硬貨。ATK+4、最大HP+5。"}'::jsonb
WHERE slug = 'item_lucky_coin';

-- ヌンチャク: 「連続攻撃」→ ATK+5
UPDATE items SET effect_data = '{"atk_bonus":5,"description":"振り回して攻撃する格闘武器。ATK+5。"}'::jsonb
WHERE slug = 'gear_nunchaku';

-- 盗賊の七つ道具: 「解錠成功率」→ DEF+1
UPDATE items SET effect_data = '{"def_bonus":1,"description":"身を守る暗器も仕込まれた盗賊の道具一式。DEF+1。"}'::jsonb
WHERE slug = 'tool_lockpick';

-- 旅人のリュック: 「ドロップ率微増」→ HP+5
UPDATE items SET effect_data = '{"hp_bonus":5,"description":"旅の荷物をたっぷり収納できるリュック。最大HP+5。"}'::jsonb
WHERE slug = 'gear_travel_bag';

-- ============================================================
-- v2.9.3m Phase 2c: 消耗品 description 追加・修正
-- ============================================================

-- 大聖堂の祝福: description 追加
UPDATE items SET effect_data = '{"effect":"buff_all","duration":3,"heal_pct":0.5,"atk_bonus":5,"def_bonus":5,"use_timing":"battle","description":"聖なる祝福でHP50%回復し、ATK・DEFが3ターン上昇する。"}'::jsonb
WHERE slug = 'item_roland_blessing';

-- 天使の涙: description 追加
UPDATE items SET effect_data = '{"heal":9999,"effect":"revive_full","heal_full":true,"use_timing":"battle","description":"天使の涙を注ぐと、HPが完全に回復する奇跡の霊薬。"}'::jsonb
WHERE slug = 'item_roland_elixir';

-- 龍井茶: 未実装mp_heal/mp_restoreを除去、description 追加
UPDATE items SET effect_data = '{"heal":200,"use_timing":"battle","description":"神朝の名茶。飲むとHPが200回復する。"}'::jsonb
WHERE slug = 'item_karyu_tea';
