-- Adjust main quest Ep 10 boss HP from 1800 to 1200
UPDATE enemies SET hp = 1200 WHERE slug = 'enemy_boss_ep10_dragon';
