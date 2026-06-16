-- Update days_success and days_failure for all implemented scenarios

-- ==========================================
-- 1. Main Quests (6001 - 6020)
-- ==========================================
UPDATE scenarios SET days_success = 2, days_failure = 1 WHERE id = 6001;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6002;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6003;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6004;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6005;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6006;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6007;
UPDATE scenarios SET days_success = 1, days_failure = 1 WHERE id = 6008;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6009;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6010;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6011;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6012;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6013;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6014;
UPDATE scenarios SET days_success = 7, days_failure = 4 WHERE id = 6015;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 6016;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6017;
UPDATE scenarios SET days_success = 7, days_failure = 4 WHERE id = 6018;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 6019;
UPDATE scenarios SET days_success = 8, days_failure = 5 WHERE id = 6020;

-- ==========================================
-- 2. Spot Quests (6101 - 6104)
-- ==========================================
UPDATE scenarios SET days_success = 7, days_failure = 5 WHERE id = 6101;
UPDATE scenarios SET days_success = 7, days_failure = 3 WHERE id = 6102;
UPDATE scenarios SET days_success = 7, days_failure = 3 WHERE id = 6103;
UPDATE scenarios SET days_success = 7, days_failure = 3 WHERE id = 6104;

-- ==========================================
-- 3. Legendary Bosses (6105 - 6111)
-- ==========================================
UPDATE scenarios SET days_success = 8, days_failure = 4 WHERE id = 6105;
UPDATE scenarios SET days_success = 8, days_failure = 4 WHERE id = 6106;
UPDATE scenarios SET days_success = 10, days_failure = 5 WHERE id = 6107;
UPDATE scenarios SET days_success = 10, days_failure = 5 WHERE id = 6108;
UPDATE scenarios SET days_success = 8, days_failure = 4 WHERE id = 6109;
UPDATE scenarios SET days_success = 12, days_failure = 6 WHERE id = 6110;
UPDATE scenarios SET days_success = 9, days_failure = 4 WHERE id = 6111;

-- ==========================================
-- 4. Bounty Hunts (5101 - 5104, 5111 - 5114, 5201 - 5207)
-- ==========================================
UPDATE scenarios SET days_success = 3, days_failure = 1 WHERE id = 5101;
UPDATE scenarios SET days_success = 3, days_failure = 1 WHERE id = 5102;
UPDATE scenarios SET days_success = 3, days_failure = 1 WHERE id = 5103;
UPDATE scenarios SET days_success = 3, days_failure = 1 WHERE id = 5104;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 5111;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 5112;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 5113;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 5114;
UPDATE scenarios SET days_success = 6, days_failure = 3 WHERE id = 5201;
UPDATE scenarios SET days_success = 6, days_failure = 3 WHERE id = 5202;
UPDATE scenarios SET days_success = 6, days_failure = 3 WHERE id = 5203;
UPDATE scenarios SET days_success = 6, days_failure = 4 WHERE id = 5204;
UPDATE scenarios SET days_success = 6, days_failure = 4 WHERE id = 5205;
UPDATE scenarios SET days_success = 6, days_failure = 4 WHERE id = 5206;
UPDATE scenarios SET days_success = 6, days_failure = 4 WHERE id = 5207;

-- ==========================================
-- 5. Normal Quests (7001 - 7008, 7010 - 7015, 7020 - 7025, 7030 - 7035, 7040 - 7045)
-- ==========================================
UPDATE scenarios SET days_success = 8, days_failure = 8 WHERE id = 7001;
UPDATE scenarios SET days_success = 8, days_failure = 8 WHERE id = 7002;
UPDATE scenarios SET days_success = 3, days_failure = 3 WHERE id = 7003;
UPDATE scenarios SET days_success = 1, days_failure = 1 WHERE id = 7004;
UPDATE scenarios SET days_success = 4, days_failure = 4 WHERE id = 7005;
UPDATE scenarios SET days_success = 8, days_failure = 8 WHERE id = 7006;
UPDATE scenarios SET days_success = 2, days_failure = 2 WHERE id = 7007;
UPDATE scenarios SET days_success = 4, days_failure = 4 WHERE id = 7008;

UPDATE scenarios SET days_success = 2, days_failure = 1 WHERE id = 7010;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 7011;
UPDATE scenarios SET days_success = 10, days_failure = 5 WHERE id = 7012;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 7013;
UPDATE scenarios SET days_success = 1, days_failure = 1 WHERE id = 7014;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 7015;

UPDATE scenarios SET days_success = 8, days_failure = 4 WHERE id = 7020;
UPDATE scenarios SET days_success = 2, days_failure = 1 WHERE id = 7021;
UPDATE scenarios SET days_success = 3, days_failure = 2 WHERE id = 7022;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 7023;
UPDATE scenarios SET days_success = 1, days_failure = 1 WHERE id = 7024;
UPDATE scenarios SET days_success = 6, days_failure = 3 WHERE id = 7025;

UPDATE scenarios SET days_success = 3, days_failure = 1 WHERE id = 7030;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 7031;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 7032;
UPDATE scenarios SET days_success = 2, days_failure = 1 WHERE id = 7033;
UPDATE scenarios SET days_success = 1, days_failure = 1 WHERE id = 7034;
UPDATE scenarios SET days_success = 5, days_failure = 5 WHERE id = 7035;

UPDATE scenarios SET days_success = 5, days_failure = 2 WHERE id = 7040;
UPDATE scenarios SET days_success = 6, days_failure = 3 WHERE id = 7041;
UPDATE scenarios SET days_success = 4, days_failure = 2 WHERE id = 7042;
UPDATE scenarios SET days_success = 6, days_failure = 4 WHERE id = 7043;
UPDATE scenarios SET days_success = 5, days_failure = 3 WHERE id = 7044;
UPDATE scenarios SET days_success = 6, days_failure = 6 WHERE id = 7045;
