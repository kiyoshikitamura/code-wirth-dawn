-- Migration: Fix Meteor Strike (ID 37) effect to apply burn instead of poison
UPDATE cards SET effect_id = 'burn', description = '天空から隕石を呼び寄せ敵全体を焼き尽くす。全体に100の魔法ダメージとともに炎上（2ターン）を付与する。' WHERE id = 37;
