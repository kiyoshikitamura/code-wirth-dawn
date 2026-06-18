-- 2026-06-19: クエスト推奨レベルおよびエネミーステータスの調整

-- 1. 帝国精鋭部隊のパラメータ調整 (ID: 2101)
-- レベルは12のままで、推奨Lv.5かつ2連戦で攻略可能にするための弱体化
UPDATE enemies SET hp = 300, atk = 20, def = 5 WHERE id = 2101;

-- 2. 大天使 (ID: 2108) のパラメータ調整
-- ボスとの逆転設定ミスを解消し、適正な道中ザコに設定 (Lv.26/HP 300/ATK 45/DEF 10)
UPDATE enemies SET level = 26, hp = 300, atk = 45, def = 10 WHERE id = 2108;

-- 3. 降臨せし天使 (ID: 6022) のパラメータ調整
-- ボスとしての適正ステータス化 (Lv.30/HP 2500/ATK 90/DEF 18)
UPDATE enemies SET level = 30, hp = 2500, atk = 90, def = 18 WHERE id = 6022;

-- 4. メインクエストの推奨レベル (rec_level) 引き上げ
UPDATE scenarios SET rec_level = 10 WHERE id = 6007; -- 第7話「刃の掟」
UPDATE scenarios SET rec_level = 11 WHERE id = 6008; -- 第8話「夜霧の凶刃」
UPDATE scenarios SET rec_level = 12 WHERE id = 6009; -- 第9話「大名行列の護衛」
UPDATE scenarios SET rec_level = 15 WHERE id = 6010; -- 第10話「世界の底が抜ける日」
UPDATE scenarios SET rec_level = 16 WHERE id = 6011; -- 第11話「天使降臨」
UPDATE scenarios SET rec_level = 17 WHERE id = 6012; -- 第12話「炎の審判者」
UPDATE scenarios SET rec_level = 18 WHERE id = 6013; -- 第13話「癒しの暴君」
UPDATE scenarios SET rec_level = 19 WHERE id = 6014; -- 第14話「啓示の使者」
UPDATE scenarios SET rec_level = 20 WHERE id = 6015; -- 第15話「天軍の長」
UPDATE scenarios SET rec_level = 21 WHERE id = 6016; -- 第16話「英霊の石碑」
UPDATE scenarios SET rec_level = 22 WHERE id = 6017; -- 第17話「冥府の門」
UPDATE scenarios SET rec_level = 22 WHERE id = 6018; -- 第18話「戦神の洗礼」
UPDATE scenarios SET rec_level = 23 WHERE id = 6019; -- 第19話「月光の狩人」

-- 5. 指名手配クエストの推奨レベル (rec_level) 引き上げ
UPDATE scenarios SET rec_level = 18 WHERE id = 5201; -- 聖騎士団の叛逆者
UPDATE scenarios SET rec_level = 19 WHERE id = 5202; -- 砂漠の僭王
UPDATE scenarios SET rec_level = 19 WHERE id = 5203; -- 鬼将軍の再臨
UPDATE scenarios SET rec_level = 20 WHERE id = 5204; -- 翡翠蛇の毒牙
UPDATE scenarios SET rec_level = 21 WHERE id = 5205; -- 異端の大賢者
UPDATE scenarios SET rec_level = 21 WHERE id = 5206; -- 戦の魔神
UPDATE scenarios SET rec_level = 23 WHERE id = 5207; -- 九尾の大狐
