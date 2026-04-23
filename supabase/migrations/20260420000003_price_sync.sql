-- ============================================================
-- v2.9.3p: CSV→DB base_price 全量同期
-- CSV (items.csv) の base_price を正とし、DBを一括更新する。
-- 価格差分が1件でもあれば全て矯正される。
-- 2026-04-20
-- ============================================================

-- ── 消耗品 ──
UPDATE items SET base_price = 100 WHERE slug = 'item_potion_s';
UPDATE items SET base_price = 50  WHERE slug = 'item_ration';
UPDATE items SET base_price = 80  WHERE slug = 'item_torch';
UPDATE items SET base_price = 300 WHERE slug = 'item_tent';
UPDATE items SET base_price = 150 WHERE slug = 'item_antidote';
UPDATE items SET base_price = 200 WHERE slug = 'item_holy_water';
UPDATE items SET base_price = 250 WHERE slug = 'item_oil_pot';
UPDATE items SET base_price = 250 WHERE slug = 'item_whetstone';
UPDATE items SET base_price = 200 WHERE slug = 'item_smokescreen';
UPDATE items SET base_price = 50  WHERE slug = 'item_whiskey';
UPDATE items SET base_price = 50  WHERE slug = 'item_ruins_map';
UPDATE items SET base_price = 200 WHERE slug = 'item_repair_kit';
UPDATE items SET base_price = 5000 WHERE slug = 'item_revive_incense';
UPDATE items SET base_price = 500 WHERE slug = 'item_bomb_large';
UPDATE items SET base_price = 1000 WHERE slug = 'item_royal_decree';
UPDATE items SET base_price = 3000 WHERE slug = 'grimoire_teleport';
UPDATE items SET base_price = 200 WHERE slug = 'item_potion';
UPDATE items SET base_price = 300 WHERE slug = 'item_high_potion';
UPDATE items SET base_price = 1000 WHERE slug = 'item_roland_blessing';
UPDATE items SET base_price = 3000 WHERE slug = 'item_roland_elixir';
UPDATE items SET base_price = 500 WHERE slug = 'item_karyu_tea';
UPDATE items SET base_price = 1200 WHERE slug = 'item_karyu_charm';
UPDATE items SET base_price = 800 WHERE slug = 'item_yato_poison';
UPDATE items SET base_price = 600 WHERE slug = 'item_yato_smoke';
UPDATE items SET base_price = 1000 WHERE slug = 'item_oasis_water';
UPDATE items SET base_price = 900 WHERE slug = 'item_desert_spice';
UPDATE items SET base_price = 10000 WHERE slug = 'item_black_market_elixir';
UPDATE items SET base_price = 100000 WHERE slug = 'item_launder_scroll';
UPDATE items SET base_price = 2000 WHERE slug = 'item_world_map';
UPDATE items SET base_price = 300 WHERE slug = 'item_tengu_fan';
UPDATE items SET base_price = 50000 WHERE slug = 'item_dragon_blood';

-- ── 交易品 ──
UPDATE items SET base_price = 100 WHERE slug = 'item_trade_iron';
UPDATE items SET base_price = 300 WHERE slug = 'item_trade_silk';
UPDATE items SET base_price = 1000 WHERE slug = 'item_trade_gem';
UPDATE items SET base_price = 5000 WHERE slug = 'item_trade_dragon';
UPDATE items SET base_price = 10000 WHERE slug = 'item_trade_mithril';
UPDATE items SET base_price = 30000 WHERE slug = 'item_dark_matter';
UPDATE items SET base_price = 500 WHERE slug = 'item_bandit_treasure';

-- ── 装備：武器 ──
UPDATE items SET base_price = 50  WHERE slug = 'gear_rusty_sword';
UPDATE items SET base_price = 1500 WHERE slug = 'gear_silver_lance';
UPDATE items SET base_price = 1000 WHERE slug = 'gear_iron_fist';
UPDATE items SET base_price = 1800 WHERE slug = 'gear_dragon_spear';
UPDATE items SET base_price = 5000 WHERE slug = 'sword_kusanagi';
UPDATE items SET base_price = 4000 WHERE slug = 'gear_archmage_staff';
UPDATE items SET base_price = 2000 WHERE slug = 'gear_inquisitor_mace';
UPDATE items SET base_price = 800  WHERE slug = 'gear_nunchaku';
UPDATE items SET base_price = 1200 WHERE slug = 'gear_merchant_abacus';
UPDATE items SET base_price = 1500 WHERE slug = 'gear_paper_fan';
UPDATE items SET base_price = 1800 WHERE slug = 'gear_longbow';
UPDATE items SET base_price = 4000 WHERE slug = 'item_thief_blade';
UPDATE items SET base_price = 4000 WHERE slug = 'item_mino_axe';
UPDATE items SET base_price = 300  WHERE slug = 'gear_short_sword';
UPDATE items SET base_price = 800  WHERE slug = 'gear_broadsword';
UPDATE items SET base_price = 1500 WHERE slug = 'gear_bastard_sword';
UPDATE items SET base_price = 1000 WHERE slug = 'gear_scimitar';
UPDATE items SET base_price = 2500 WHERE slug = 'gear_djinn_blade';

-- ── 装備：防具 ──
UPDATE items SET base_price = 1200 WHERE slug = 'gear_knight_shield';
UPDATE items SET base_price = 800  WHERE slug = 'gear_desert_cloak';
UPDATE items SET base_price = 2000 WHERE slug = 'gear_samurai_armor';
UPDATE items SET base_price = 1500 WHERE slug = 'gear_heavy_armor';
UPDATE items SET base_price = 5000 WHERE slug = 'item_white_robe';
UPDATE items SET base_price = 200  WHERE slug = 'gear_leather_armor';
UPDATE items SET base_price = 600  WHERE slug = 'gear_chain_mail';
UPDATE items SET base_price = 1200 WHERE slug = 'gear_plate_armor';
UPDATE items SET base_price = 800  WHERE slug = 'gear_holy_vestment';
UPDATE items SET base_price = 3000 WHERE slug = 'gear_paladin_plate';
UPDATE items SET base_price = 500  WHERE slug = 'gear_sand_guard';
UPDATE items SET base_price = 2000 WHERE slug = 'gear_sultan_robe';
UPDATE items SET base_price = 600  WHERE slug = 'gear_shinobi_garb';
UPDATE items SET base_price = 3000 WHERE slug = 'gear_oni_yoroi';
UPDATE items SET base_price = 500  WHERE slug = 'gear_monk_robe';
UPDATE items SET base_price = 1200 WHERE slug = 'gear_karyu_vest';
UPDATE items SET base_price = 2800 WHERE slug = 'gear_dragon_scale';

-- ── 装備：アクセサリ ──
UPDATE items SET base_price = 2500 WHERE slug = 'acc_crusader_ring';
UPDATE items SET base_price = 1000 WHERE slug = 'item_alchemy_kit';
UPDATE items SET base_price = 5000 WHERE slug = 'item_merchant_bag';
UPDATE items SET base_price = 3000 WHERE slug = 'gear_magic_lamp';
UPDATE items SET base_price = 800  WHERE slug = 'item_ofuda_set';
UPDATE items SET base_price = 1200 WHERE slug = 'gear_ninja_tool';
UPDATE items SET base_price = 400  WHERE slug = 'gear_adventurer_boots';
UPDATE items SET base_price = 3000 WHERE slug = 'item_lucky_coin';
UPDATE items SET base_price = 1000 WHERE slug = 'gear_cursed_mask';
UPDATE items SET base_price = 3000 WHERE slug = 'item_golden_dice';
UPDATE items SET base_price = 1000 WHERE slug = 'gear_snake_flute';
UPDATE items SET base_price = 1200 WHERE slug = 'item_tea_set';
UPDATE items SET base_price = 2200 WHERE slug = 'gear_hannya_mask';
UPDATE items SET base_price = 1000 WHERE slug = 'tool_lockpick';
UPDATE items SET base_price = 500  WHERE slug = 'gear_travel_bag';
UPDATE items SET base_price = 200  WHERE slug = 'item_cursed_idol';
UPDATE items SET base_price = 3500 WHERE slug = 'item_pirate_hat';

-- ── 素材 ──
UPDATE items SET base_price = 500  WHERE slug = 'item_relic_bone';
UPDATE items SET base_price = 800  WHERE slug = 'item_desert_worm_meat';
UPDATE items SET base_price = 600  WHERE slug = 'item_red_ogre_horn';
UPDATE items SET base_price = 1000 WHERE slug = 'item_thunder_fur';
UPDATE items SET base_price = 900  WHERE slug = 'item_griffon_feather';
UPDATE items SET base_price = 700  WHERE slug = 'item_treant_core';
UPDATE items SET base_price = 3000 WHERE slug = 'item_demon_heart';
UPDATE items SET base_price = 3000 WHERE slug = 'item_angel_record';
UPDATE items SET base_price = 5000 WHERE slug = 'item_kirin_horn';
UPDATE items SET base_price = 4000 WHERE slug = 'item_omega_part';
UPDATE items SET base_price = 5000 WHERE slug = 'item_kraken_proof';
UPDATE items SET base_price = 2000 WHERE slug = 'item_maze_seal';
UPDATE items SET base_price = 800  WHERE slug = 'mat_djinn_orb';
UPDATE items SET base_price = 2000 WHERE slug = 'mat_kirin_mane';

-- ── キーアイテム ──
UPDATE items SET base_price = 20000 WHERE slug = 'item_pass_roland';
UPDATE items SET base_price = 20000 WHERE slug = 'item_pass_karyu';
UPDATE items SET base_price = 20000 WHERE slug = 'item_pass_yato';
UPDATE items SET base_price = 20000 WHERE slug = 'item_pass_markand';
