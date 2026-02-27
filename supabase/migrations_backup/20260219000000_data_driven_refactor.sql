-- Migration: Data Driven Refactoring
-- 1. Standardize party_members.inject_cards to TEXT[]
-- Note: If it was INTEGER[], we cast it. If it was already TEXT[], this is a no-op or valid cast.
-- We use a safe cast approach.

DO $$
BEGIN
    -- Check current type of inject_cards
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'party_members' 
        AND column_name = 'inject_cards' 
        AND data_type = 'ARRAY' 
        AND udt_name = '_int4' -- _int4 is integer[]
    ) THEN
        -- Convert integer[] to text[]
        ALTER TABLE party_members 
        ALTER COLUMN inject_cards TYPE TEXT[] USING inject_cards::TEXT[];
    END IF;
END $$;

-- 2. Create Nations Table
CREATE TABLE IF NOT EXISTS nations (
    id TEXT PRIMARY KEY, -- e.g. 'Roland'
    name TEXT NOT NULL,
    description TEXT,
    
    -- Alignment Ideals (0-100)
    ideal_order INTEGER DEFAULT 50,
    ideal_chaos INTEGER DEFAULT 50,
    ideal_justice INTEGER DEFAULT 50,
    ideal_evil INTEGER DEFAULT 50,

    -- Friction / Prosperity Logic
    friction_coefficient FLOAT DEFAULT 1.0, -- Multiplier for friction impact
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Nations
INSERT INTO nations (id, name, ideal_order, ideal_chaos, ideal_justice, ideal_evil) VALUES
('Roland', '王都ローランド', 80, 20, 80, 20),
('Markand', '商業都市マルカンド', 20, 80, 80, 20),
('Karyu', '火龍の里', 80, 20, 20, 80),
('Yato', '夜都ヤト', 20, 80, 20, 80),
('Neutral', '中立地帯', 50, 50, 50, 50)
ON CONFLICT (id) DO UPDATE SET
    ideal_order = EXCLUDED.ideal_order,
    ideal_chaos = EXCLUDED.ideal_chaos,
    ideal_justice = EXCLUDED.ideal_justice,
    ideal_evil = EXCLUDED.ideal_evil;

-- 3. Seed System Mercenaries into NPCs table
-- Ensure NPCs table has necessary columns (migrated in previous steps, but ensuring compliance)
-- 'system_mercenary' will be the tags or job_class identifier. 
-- We'll use a specific tag/origin column logic in code, but for now insert them as Hireable NPCs.

-- Add missing columns to support System Mercenaries and guests
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 50;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 50;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS mp INTEGER DEFAULT 0;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS max_mp INTEGER DEFAULT 0;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS attack INTEGER DEFAULT 10;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS defense INTEGER DEFAULT 10;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 10;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS default_cards TEXT[];
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS is_hireable BOOLEAN DEFAULT FALSE;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS introduction TEXT;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS job_class TEXT;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS origin TEXT;

INSERT INTO npcs (id, slug, name, job_class, level, hp, max_hp, mp, max_mp, attack, defense, speed, default_cards, is_hireable, introduction, origin)
VALUES
(
    '00000000-0000-0000-0000-000000000001', 'sys_warrior_wolf', '歴戦の傭兵ヴォルフ', 'Warrior', 
    8, 180, 180, 20, 20, 22, 12, 10, 
    ARRAY['Heavy Slash', 'Guard', 'Shield Bash'], 
    TRUE, 
    '俺の剣が必要か？金さえ払えば、誰が相手でも守ってやるさ。',
    'system_mercenary'
),
(
    '00000000-0000-0000-0000-000000000002', 'sys_mage_elena', '放浪魔術師エレナ', 'Mage', 
    7, 95, 95, 50, 50, 28, 4, 12, 
    ARRAY['Fireball', 'Meditate', 'Ice Bolt'], 
    TRUE, 
    '魔法の研究費が必要なの。協力してあげるわ、相応の対価でね。',
    'system_mercenary'
),
(
    '00000000-0000-0000-0000-000000000003', 'sys_priest_sarah', '見習い聖女サラ', 'Priest', 
    5, 120, 120, 40, 40, 8, 15, 8, 
    ARRAY['Heal', 'Barrier'], 
    TRUE, 
    '少しでも人々の役に立ちたいのです...。私を連れて行ってください！',
    'system_mercenary'
),
(
    '00000000-0000-0000-0000-000000000004', 'sys_thief_jack', '不敵なジャック', 'Thief', 
    6, 110, 110, 30, 30, 18, 6, 18, 
    ARRAY['Quick Slash', 'Poison Blade'], 
    TRUE, 
    'へへっ、鍵開けや罠の解除なら任せな。期待していいぜ？',
    'system_mercenary'
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    job_class = EXCLUDED.job_class,
    level = EXCLUDED.level,
    max_hp = EXCLUDED.max_hp,
    hp = EXCLUDED.max_hp, -- Reset HP on re-seed
    mp = EXCLUDED.mp,
    max_mp = EXCLUDED.max_mp,
    attack = EXCLUDED.attack,
    defense = EXCLUDED.defense,
    speed = EXCLUDED.speed,
    default_cards = EXCLUDED.default_cards,
    is_hireable = EXCLUDED.is_hireable,
    introduction = EXCLUDED.introduction,
    origin = EXCLUDED.origin;

