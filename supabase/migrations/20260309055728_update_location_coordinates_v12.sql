-- 1. 王都レガリア周辺 (Order - Center/Top Left)
UPDATE locations SET x = 30, y = 30 WHERE slug = 'loc_regalia';
UPDATE locations SET x = 20, y = 35 WHERE slug = 'loc_white_fort';
UPDATE locations SET x = 35, y = 20 WHERE slug = 'loc_port_city';
UPDATE locations SET x = 25, y = 25 WHERE slug = 'loc_border_town';
UPDATE locations SET x = 40, y = 40 WHERE slug = 'loc_iron_mine';

-- 2. 黄金都市イスハーク周辺 (Chaos - Bottom Left)
UPDATE locations SET x = 25, y = 75 WHERE slug = 'loc_meridia';
UPDATE locations SET x = 15, y = 65 WHERE slug = 'loc_market_town';
UPDATE locations SET x = 35, y = 85 WHERE slug = 'loc_oasis';
UPDATE locations SET x = 15, y = 85 WHERE slug = 'loc_plains_city';
UPDATE locations SET x = 30, y = 65 WHERE slug = 'loc_highland';

-- 3. 神都「出雲」周辺 (Justice - Top Right)
UPDATE locations SET x = 75, y = 25 WHERE slug = 'loc_yato';
UPDATE locations SET x = 65, y = 35 WHERE slug = 'loc_temple_town';
UPDATE locations SET x = 85, y = 15 WHERE slug = 'loc_valley';
UPDATE locations SET x = 85, y = 35 WHERE slug = 'loc_frontier_village';
UPDATE locations SET x = 65, y = 15 WHERE slug = 'loc_resort';

-- 4. 天極城「龍京」周辺 (Evil - Bottom Right)
UPDATE locations SET x = 75, y = 75 WHERE slug = 'loc_charon';
UPDATE locations SET x = 65, y = 65 WHERE slug = 'loc_north_fort';
UPDATE locations SET x = 85, y = 85 WHERE slug = 'loc_monitor_post';
UPDATE locations SET x = 85, y = 65 WHERE slug = 'loc_ancient_ruins';
UPDATE locations SET x = 65, y = 85 WHERE slug = 'loc_coliseum';

-- 5. Hub / Special
UPDATE locations SET x = 50, y = 50 WHERE slug = 'loc_hub';
