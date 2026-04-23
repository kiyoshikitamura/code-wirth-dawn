-- ============================================================
-- v2.9.3n: 消耗品リバランス + 新機能追加
-- 2026-04-20
-- ============================================================

-- ■ 聖水: damage 50→30
UPDATE items SET effect_data = '{"damage":30,"use_timing":"battle","description":"聖なる水を投げつけ、敵に30ダメージ。アンデッド系への投擲に最適。"}'::jsonb
WHERE slug = 'item_holy_water';

-- ■ 火炎瓶: damage 30→20, poison→burn
UPDATE items SET effect_data = '{"damage":20,"target":"enemy","effect_id":"burn","use_timing":"battle","description":"火炎瓶を投げつけ20ダメージ。さらに炎上（2ターン持続ダメージ）を与える。","effect_duration":2}'::jsonb
WHERE slug = 'item_oil_pot';

-- ■ 煙玉: escape:true → escape_chance:0.7
UPDATE items SET effect_data = '{"escape_chance":0.7,"use_timing":"battle","description":"煙幕を張って戦闘から逃走を試みる。成功率70%。"}'::jsonb
WHERE slug = 'item_smokescreen';

-- ■ 強い酒: price 120→50, heal 20→50, stun_self_chance追加
UPDATE items SET base_price = 50, effect_data = '{"heal":50,"use_timing":"battle","stun_self_chance":0.5,"stun_self_duration":1,"description":"癖の強い蒸留酒。HP50回復するが、50%の確率で酔って1ターン行動不能。"}'::jsonb
WHERE slug = 'item_whiskey';

-- ■ 中和薬→高級傷薬: name変更, price 50→200, heal 150→100
UPDATE items SET name = '高級傷薬', base_price = 200, effect_data = '{"heal":100,"use_timing":"battle","description":"上質な薬草を調合した傷薬。HPを100回復する。"}'::jsonb
WHERE slug = 'item_potion';

-- ■ 上級中和薬→最高級傷薬: name変更, price 250→300, heal 350→200
UPDATE items SET name = '最高級傷薬', base_price = 300, effect_data = '{"heal":200,"use_timing":"battle","description":"名匠が精製した最高級の傷薬。HPを200回復する。"}'::jsonb
WHERE slug = 'item_high_potion';

-- ■ 龍井茶: price 800→500, remove_effect:poison追加
UPDATE items SET base_price = 500, effect_data = '{"heal":200,"use_timing":"battle","remove_effect":"poison","description":"神朝の名茶。飲むとHP200回復し、毒状態も解除する。"}'::jsonb
WHERE slug = 'item_karyu_tea';

-- ■ 煙玉(夜刀)→忍玉: name変更, escape:true維持(100%)
UPDATE items SET name = '忍玉', effect_data = '{"escape":true,"use_timing":"battle","description":"忍者が用いる特殊な逃走玉。確実に戦闘から離脱できる。"}'::jsonb
WHERE slug = 'item_yato_smoke';

-- ■ 熱砂の香辛料: atk_bonus削除, effect_duration 2→8, description追加
UPDATE items SET effect_data = '{"effect":"berserk","duration":3,"effect_id":"atk_up","use_timing":"battle","def_penalty":10,"effect_duration":8,"description":"熱砂の香辛料。ATKが8ターン上昇するが、DEFが低下する副作用あり。"}'::jsonb
WHERE slug = 'item_desert_spice';

-- ■ 天狗の羽団扇: atk_bonus削除, effect_duration 2→4
UPDATE items SET effect_data = '{"effect_id":"atk_up","use_timing":"battle","description":"天狗が操る風の力を封じた団扇。使用するとATKが4ターン上昇する。","effect_duration":4}'::jsonb
WHERE slug = 'item_tengu_fan';

-- ■ 禁術の秘薬: price 50000→10000, regen+atk_up+remove_effect追加
UPDATE items SET base_price = 10000, effect_data = '{"heal":9999,"effect":"full_restore","heal_full":true,"use_timing":"battle","remove_effect":"poison","effect_id":"regen","effect_duration":5,"extra_effects":[{"id":"atk_up","duration":10}],"description":"禁断の魔術で調合された秘薬。HP全回復・毒解除・リジェネ・ATK UP。"}'::jsonb
WHERE slug = 'item_black_market_elixir';

-- ■ 帳簿の改竄: use_timing:field追加, description追加
UPDATE items SET effect_data = '{"effect":"reputation_reset","use_timing":"field","description":"闇の帳簿を改竄し、全国での名声をリセットする。"}'::jsonb
WHERE slug = 'item_launder_scroll';

-- ■ 竜血: price 8000→50000
UPDATE items SET base_price = 50000
WHERE slug = 'item_dragon_blood';

-- ■ 簡易テント: DB価格を300Gに統一（CSV定義と一致させる）
UPDATE items SET base_price = 300
WHERE slug = 'item_tent';

-- ============================================================
-- 交易品 description 追加
-- ============================================================

UPDATE items SET effect_data = '{"category":"trade_good","description":"山岳の鉱脈から採掘された不純物の少ない鉄鉱石。鑑定士が大喜びする品質。"}'::jsonb
WHERE slug = 'item_trade_iron';

UPDATE items SET effect_data = '{"category":"trade_good","description":"東方の織師が繊細な手仕事で織り上げた絹。貴族の間で高値で取引される。"}'::jsonb
WHERE slug = 'item_trade_silk';

UPDATE items SET effect_data = '{"category":"trade_good","description":"古代文明の遺跡から発掘された神秘的な光を放つ宝石。収集家垂涎の逸品。"}'::jsonb
WHERE slug = 'item_trade_gem';

UPDATE items SET effect_data = '{"category":"trade_good","description":"飛竜の全身を覆う硬質な鱗。武具や防具の素材として極めて高価。"}'::jsonb
WHERE slug = 'item_trade_dragon';

UPDATE items SET effect_data = '{"category":"trade_good","description":"伝説の魔法金属・ミスリルの鋼材。世界中の鋳造師が感涙する至宝。"}'::jsonb
WHERE slug = 'item_trade_mithril';

UPDATE items SET effect_data = '{"category":"trade_good","description":"光すら飲み込む漆黒の鉱石。その正体を知る者は少なく、闇市でのみ取引される。"}'::jsonb
WHERE slug = 'item_dark_matter';

-- ============================================================
-- アクセサリ調整 + equipment→skill変換
-- ============================================================

-- ■ 呪いの仮面: price 500→1000, ATK+8→+4, DEF-3→-4
UPDATE items SET base_price = 1000, effect_data = '{"atk_bonus":4,"def_bonus":-4,"description":"圧倒的な力と引き換えに正気を削り取る仮面。"}'::jsonb
WHERE slug = 'gear_cursed_mask';

-- ■ 盗賊の七つ道具: DEF+1→+3, DB価格を1000Gに統一
UPDATE items SET base_price = 1000, effect_data = '{"def_bonus":3,"description":"身を守る暗器も仕込まれた盗賊の道具一式。DEF+3。"}'::jsonb
WHERE slug = 'tool_lockpick';

-- ■ 般若の面: HP-20追加
UPDATE items SET effect_data = '{"atk_bonus":6,"hp_bonus":-20,"description":"見る者を震え上がらせる般若の面。大きな力を得るが体が蝕まれる。"}'::jsonb
WHERE slug = 'gear_hannya_mask';

-- ■ 秘伝:調毒 → 教本:調毒 (equipment→skill変換)
UPDATE items SET name = '教本:調毒', type = 'skill', sub_type = NULL, base_price = 1200,
  effect_data = '{"description":"毒を調合して敵に投げつける暗器術。30ダメージ+毒(5T)付与。"}'::jsonb
WHERE slug = 'item_poison_manual';

-- ■ 禁術:血の契約書 (equipment→skill変換)
UPDATE items SET type = 'skill', sub_type = NULL, base_price = 10000,
  effect_data = '{"description":"命を代償に戦闘能力を極限まで引き上げる禁術。12Tの間ATK UPとDEF UPを同時付与。VIT1消費。"}'::jsonb
WHERE slug = 'item_forbidden_scroll';

-- ■ 新カード: 教本:調毒
INSERT INTO cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (62, 'card_poison_brew', '調毒', 'Skill', 2, 'vitality', 5, 30, 'single_enemy', 'poison', '/images/items/item_poison_manual.png', '毒を調合して敵に投げつける。30のダメージを与え、5ターンの間、毎ターンHP5%の毒ダメージを付与する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

-- ■ 新カード: 禁術:血の契約
INSERT INTO cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (63, 'card_blood_pact', '血の契約', 'Support', 3, 'vitality', 1, 0, 'self', 'atk_up', '/images/items/item_forbidden_scroll.png', '命を代償に戦闘能力を極限まで引き上げる禁術。12ターンの間ATK UPとDEF UPを同時に付与する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

-- ■ 新スキル: 教本:調毒
INSERT INTO skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url)
VALUES (3061, 'book_poison_brew', '教本:調毒', 62, 1200, 2, '{loc_marcund}', 2, false, '/images/items/item_poison_manual.png')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url;

-- ■ 新スキル: 禁術:血の契約書
INSERT INTO skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url)
VALUES (3062, 'scroll_blood_pact', '禁術:血の契約書', 63, 10000, 3, '{loc_haryu}', 1, false, '/images/items/item_forbidden_scroll.png')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url;
