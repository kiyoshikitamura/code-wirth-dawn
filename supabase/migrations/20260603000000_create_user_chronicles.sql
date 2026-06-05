-- Migration: 20260603000000_create_user_chronicles.sql
-- Description: 一元履歴テーブル user_chronicles の作成、6テーブルの統合・ビュー化および INSTEAD OF トリガーによる後方互換性担保
-- Fix: 部分ユニークインデックスに合わせた ON CONFLICT (user_id, col) WHERE ... DO NOTHING の記述に修正

-- ============================================================
-- 1. user_chronicles テーブルの作成
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_chronicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- イベント種別
    event_type TEXT NOT NULL,
    
    -- ゲーム内累積日数（世界暦の計算用）
    accumulated_days INTEGER NOT NULL,
    
    -- 発生地
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    location_name TEXT,
    
    -- 関連キー群
    scenario_id BIGINT REFERENCES public.scenarios(id) ON DELETE SET NULL,
    ugc_scenario_id UUID REFERENCES public.ugc_scenarios(id) ON DELETE SET NULL,
    item_id INTEGER,
    enemy_id INTEGER,
    npc_slug TEXT,
    
    -- 主要テキスト
    title TEXT NOT NULL,
    description TEXT,
    
    -- パラメータ変化 (JSONB)
    param_changes JSONB DEFAULT '{}'::jsonb,
    
    -- 重大イベントフラグ
    is_major_event BOOLEAN DEFAULT FALSE,
    
    -- Xシェア用テキスト
    share_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. ユニークインデックス制約（重複登録を防止）
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_chronicles_unique_quest 
ON public.user_chronicles (user_id, scenario_id) 
WHERE event_type = 'quest_success' AND scenario_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chronicles_unique_ugc_quest 
ON public.user_chronicles (user_id, ugc_scenario_id) 
WHERE event_type = 'quest_success' AND ugc_scenario_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chronicles_unique_item 
ON public.user_chronicles (user_id, item_id) 
WHERE event_type = 'item_collected' AND item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chronicles_unique_enemy 
ON public.user_chronicles (user_id, enemy_id) 
WHERE event_type = 'monster_defeated' AND enemy_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chronicles_unique_npc 
ON public.user_chronicles (user_id, npc_slug) 
WHERE event_type = 'npc_encountered' AND npc_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chronicles_unique_visit
ON public.user_chronicles (user_id, location_id)
WHERE event_type = 'location_visited' AND location_id IS NOT NULL;

-- 検索最適化用インデックス
CREATE INDEX IF NOT EXISTS idx_user_chronicles_user_days ON public.user_chronicles(user_id, accumulated_days DESC);
CREATE INDEX IF NOT EXISTS idx_user_chronicles_event_type ON public.user_chronicles(event_type);

-- ============================================================
-- 3. 既存データの移行
-- ============================================================

-- 3a. クエスト完了履歴の移行
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_completed_quests') THEN
        INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at)
        SELECT 
            uq.user_id, 
            'quest_success', 
            COALESCE(uq.accumulated_days_at_completion, p.accumulated_days, 0), 
            uq.scenario_id, 
            uq.ugc_scenario_id, 
            COALESCE(s.location_id, p.current_location_id),
            COALESCE(l.name, (SELECT name FROM public.locations WHERE id = p.current_location_id)),
            COALESCE(s.title, 'クエスト完了'), 
            'クエストを成功させ、歴史にその名を刻んだ。',
            COALESCE(uq.completed_at, NOW())
        FROM public.user_completed_quests uq
        LEFT JOIN public.scenarios s ON s.id = uq.scenario_id
        LEFT JOIN public.locations l ON l.id = s.location_id
        LEFT JOIN public.user_profiles p ON p.id = uq.user_id
        ON CONFLICT (user_id, scenario_id) WHERE event_type = 'quest_success' AND scenario_id IS NOT NULL DO NOTHING;
    END IF;
END $$;

-- 3b. クエスト受注・放棄（開始・放棄）履歴の移行
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quest_activity_logs') THEN
        INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at)
        SELECT 
            uq.user_id, 
            CASE 
                WHEN uq.action = 'start' THEN 'quest_start'
                ELSE 'quest_abandon'
            END, 
            COALESCE(p.accumulated_days, 0), 
            CASE WHEN uq.scenario_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN NULL ELSE uq.scenario_id::bigint END,
            CASE WHEN uq.scenario_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uq.scenario_id::uuid ELSE NULL END,
            COALESCE(s.location_id, p.current_location_id),
            COALESCE(l.name, (SELECT name FROM public.locations WHERE id = p.current_location_id)),
            CASE 
                WHEN uq.action = 'start' THEN 'クエスト受注: ' || COALESCE(s.title, u.title, 'クエスト')
                ELSE 'クエスト放棄: ' || COALESCE(s.title, u.title, 'クエスト')
            END,
            CASE 
                WHEN uq.action = 'start' THEN 'クエストを受注した。'
                ELSE 'クエストの遂行を諦めた。'
            END,
            uq.created_at
        FROM public.quest_activity_logs uq
        LEFT JOIN public.scenarios s ON s.id::text = uq.scenario_id::text
        LEFT JOIN public.ugc_scenarios u ON u.id::text = uq.scenario_id::text
        LEFT JOIN public.locations l ON l.id = s.location_id
        LEFT JOIN public.user_profiles p ON p.id = uq.user_id
        WHERE uq.action IN ('start', 'abandon');
    END IF;
END $$;

-- 3c. 拠点訪問履歴の移行
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_visited_locations') THEN
        INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, location_id, title, description, created_at)
        SELECT 
            uv.user_id, 
            'location_visited', 
            COALESCE(p.accumulated_days, 0), 
            uv.location_id, 
            '新たな地への到達: ' || COALESCE(l.name, '未知の場所'),
            '初めてこの地に足を踏み入れた。',
            COALESCE(uv.first_visited_at, NOW())
        FROM public.user_visited_locations uv
        LEFT JOIN public.user_profiles p ON p.id = uv.user_id
        LEFT JOIN public.locations l ON l.id = uv.location_id
        ON CONFLICT (user_id, location_id) WHERE event_type = 'location_visited' AND location_id IS NOT NULL DO NOTHING;
    END IF;
END $$;

-- 3d. アイテム歴史の移行
DO $$
DECLARE
    v_col TEXT;
    v_sql TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_item_history') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_item_history' AND column_name = 'first_acquired_at') THEN
            v_col := 'first_acquired_at';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_item_history' AND column_name = 'first_obtained_at') THEN
            v_col := 'first_obtained_at';
        ELSE
            v_col := 'created_at';
        END IF;

        v_sql := 'INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, item_id, title, description, created_at) ' ||
                 'SELECT ui.user_id, ''item_collected'', COALESCE(p.accumulated_days, 0), ui.item_id, ' ||
                 '''コレクション: '' || COALESCE(i.name, ''未知のアイテム''), ''アイテムを発見し、図鑑に記録した。'', ' ||
                 'COALESCE(ui.' || v_col || ', NOW()) ' ||
                 'FROM public.user_item_history ui ' ||
                 'LEFT JOIN public.user_profiles p ON p.id = ui.user_id ' ||
                 'LEFT JOIN public.items i ON i.id = ui.item_id ' ||
                 'ON CONFLICT (user_id, item_id) WHERE event_type = ''item_collected'' AND item_id IS NOT NULL DO NOTHING';

        EXECUTE v_sql;
    END IF;
END $$;

-- 3e. エネミー遭遇履歴の移行
DO $$
DECLARE
    v_col TEXT;
    v_sql TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_bestiary') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_bestiary' AND column_name = 'first_encountered_at') THEN
            v_col := 'first_encountered_at';
        ELSE
            v_col := 'created_at';
        END IF;

        v_sql := 'INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, enemy_id, title, description, created_at) ' ||
                 'SELECT ub.user_id, ''monster_defeated'', COALESCE(p.accumulated_days, 0), ub.enemy_id, ' ||
                 '''コレクション: '' || COALESCE(e.name, ''未知の魔物''), ''魔物と交戦し、図鑑に記録した。'', ' ||
                 'COALESCE(ub.' || v_col || ', NOW()) ' ||
                 'FROM public.user_bestiary ub ' ||
                 'LEFT JOIN public.user_profiles p ON p.id = ub.user_id ' ||
                 'LEFT JOIN public.enemies e ON e.id = ub.enemy_id ' ||
                 'ON CONFLICT (user_id, enemy_id) WHERE event_type = ''monster_defeated'' AND enemy_id IS NOT NULL DO NOTHING';

        EXECUTE v_sql;
    END IF;
END $$;

-- 3f. NPC遭遇履歴の移行
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_npc_encounters') THEN
        INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, npc_slug, title, description, created_at)
        SELECT 
            un.user_id, 
            'npc_encountered', 
            COALESCE(p.accumulated_days, 0), 
            un.npc_slug, 
            '出会いの記録: ' || COALESCE(n.name, un.npc_slug), 
            '新たな旅人と邂逅を果たした。',
            COALESCE(un.created_at, NOW())
        FROM public.user_npc_encounters un
        LEFT JOIN public.user_profiles p ON p.id = un.user_id
        LEFT JOIN public.npcs n ON n.slug = un.npc_slug
        ON CONFLICT (user_id, npc_slug) WHERE event_type = 'npc_encountered' AND npc_slug IS NOT NULL DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- 4. 旧テーブルのドロップ
-- ============================================================
DROP VIEW IF EXISTS public.quest_activity_logs CASCADE;
DROP VIEW IF EXISTS public.user_visited_locations CASCADE;
DROP VIEW IF EXISTS public.user_completed_quests CASCADE;
DROP VIEW IF EXISTS public.user_item_history CASCADE;
DROP VIEW IF EXISTS public.user_bestiary CASCADE;
DROP VIEW IF EXISTS public.user_npc_encounters CASCADE;

DROP TABLE IF EXISTS public.quest_activity_logs CASCADE;
DROP TABLE IF EXISTS public.user_visited_locations CASCADE;
DROP TABLE IF EXISTS public.user_completed_quests CASCADE;
DROP TABLE IF EXISTS public.user_item_history CASCADE;
DROP TABLE IF EXISTS public.user_bestiary CASCADE;
DROP TABLE IF EXISTS public.user_npc_encounters CASCADE;

-- ============================================================
-- 5. ビューの作成
-- ============================================================

-- 5a. quest_activity_logs ビュー
CREATE OR REPLACE VIEW public.quest_activity_logs AS
SELECT 
    id,
    user_id,
    COALESCE(scenario_id::TEXT, ugc_scenario_id::TEXT) AS scenario_id,
    CASE 
        WHEN event_type = 'quest_start' THEN 'start'
        WHEN event_type = 'quest_success' THEN 'complete'
        ELSE 'abandon'
    END AS action,
    created_at,
    CASE 
        WHEN ugc_scenario_id IS NOT NULL THEN 'ugc'
        ELSE 'official'
    END AS source_type
FROM public.user_chronicles
WHERE event_type IN ('quest_start', 'quest_success', 'quest_abandon', 'quest_failure');

-- 5b. user_visited_locations ビュー
CREATE OR REPLACE VIEW public.user_visited_locations AS
SELECT DISTINCT ON (user_id, location_id)
    id,
    user_id,
    location_id,
    created_at AS first_visited_at
FROM public.user_chronicles
WHERE event_type = 'location_visited'
ORDER BY user_id, location_id, created_at ASC;

-- 5c. user_completed_quests ビュー
CREATE OR REPLACE VIEW public.user_completed_quests AS
SELECT 
    id,
    user_id,
    scenario_id,
    ugc_scenario_id,
    created_at AS completed_at,
    accumulated_days AS accumulated_days_at_completion
FROM public.user_chronicles
WHERE event_type = 'quest_success';

-- 5d. user_item_history ビュー
CREATE OR REPLACE VIEW public.user_item_history AS
SELECT 
    id,
    user_id,
    item_id,
    created_at
FROM public.user_chronicles
WHERE event_type = 'item_collected';

-- 5e. user_bestiary ビュー
CREATE OR REPLACE VIEW public.user_bestiary AS
SELECT 
    id,
    user_id,
    enemy_id,
    created_at
FROM public.user_chronicles
WHERE event_type = 'monster_defeated';

-- 5f. user_npc_encounters ビュー
CREATE OR REPLACE VIEW public.user_npc_encounters AS
SELECT 
    id,
    user_id,
    npc_slug,
    created_at
FROM public.user_chronicles
WHERE event_type = 'npc_encountered';

-- ============================================================
-- 6. INSTEAD OF トリガー関数の定義
-- ============================================================

-- 6a. quest_activity_logs インサートトリガー
CREATE OR REPLACE FUNCTION public.insert_quest_activity_logs_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type TEXT;
    v_title TEXT;
    v_desc TEXT;
    v_scenario_id BIGINT;
    v_ugc_scenario_id UUID;
    v_quest_title TEXT;
    v_loc_id UUID;
    v_loc_name TEXT;
BEGIN
    v_event_type := CASE 
        WHEN NEW.action = 'start' THEN 'quest_start'
        WHEN NEW.action = 'complete' THEN 'quest_success'
        ELSE 'quest_abandon'
    END;
    
    -- Detect if NEW.scenario_id is a UUID or a number
    IF NEW.scenario_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_ugc_scenario_id := NEW.scenario_id::uuid;
        v_scenario_id := NULL;
        v_quest_title := COALESCE((SELECT title FROM public.ugc_scenarios WHERE id = v_ugc_scenario_id), 'クエスト');
    ELSE
        v_scenario_id := NEW.scenario_id::bigint;
        v_ugc_scenario_id := NULL;
        v_quest_title := COALESCE((SELECT title FROM public.scenarios WHERE id = v_scenario_id), 'クエスト');
    END IF;

    v_title := CASE 
        WHEN NEW.action = 'start' THEN 'クエスト受注: ' || v_quest_title
        WHEN NEW.action = 'complete' THEN 'クエスト完了: ' || v_quest_title
        ELSE 'クエスト放棄: ' || v_quest_title
    END;

    v_desc := CASE 
        WHEN NEW.action = 'start' THEN 'クエストの依頼を引き受けた。'
        WHEN NEW.action = 'complete' THEN 'クエストを無事に達成した。'
        ELSE 'クエストの遂行を諦めた。'
    END;

    -- Fetch location information from user profiles and locations tables
    SELECT p.current_location_id, l.name 
    INTO v_loc_id, v_loc_name
    FROM public.user_profiles p
    LEFT JOIN public.locations l ON l.id = p.current_location_id
    WHERE p.id = NEW.user_id;

    -- Fallback to scenario's location if user's current location is null
    IF v_loc_id IS NULL AND v_scenario_id IS NOT NULL THEN
        SELECT location_id, (SELECT name FROM public.locations WHERE id = s.location_id)
        INTO v_loc_id, v_loc_name
        FROM public.scenarios s
        WHERE s.id = v_scenario_id;
    END IF;

    INSERT INTO public.user_chronicles (
        user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at
    ) VALUES (
        NEW.user_id, 
        v_event_type, 
        COALESCE((SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
        v_scenario_id, 
        v_ugc_scenario_id,
        v_loc_id,
        v_loc_name,
        v_title,
        v_desc,
        COALESCE(NEW.created_at, NOW())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_quest_activity_logs
INSTEAD OF INSERT ON public.quest_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.insert_quest_activity_logs_trigger();

-- 6b. user_visited_locations インサートトリガー
CREATE OR REPLACE FUNCTION public.insert_user_visited_locations_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_chronicles (
        user_id, event_type, accumulated_days, location_id, title, description, created_at
    ) VALUES (
        NEW.user_id, 
        'location_visited', 
        COALESCE((SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
        NEW.location_id, 
        '新たな地への到達: ' || COALESCE((SELECT name FROM public.locations WHERE id = NEW.location_id), '未知の場所'),
        '初めてこの地に足を踏み入れた。',
        COALESCE(NEW.first_visited_at, NOW())
    )
    ON CONFLICT (user_id, location_id) WHERE event_type = 'location_visited' AND location_id IS NOT NULL DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_user_visited_locations
INSTEAD OF INSERT ON public.user_visited_locations
FOR EACH ROW EXECUTE FUNCTION public.insert_user_visited_locations_trigger();

-- 6c. user_completed_quests インサートトリガー
CREATE OR REPLACE FUNCTION public.insert_completed_quests_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_loc_id UUID;
    v_loc_name TEXT;
BEGIN
    -- Fetch location information from user profiles and locations tables
    SELECT p.current_location_id, l.name 
    INTO v_loc_id, v_loc_name
    FROM public.user_profiles p
    LEFT JOIN public.locations l ON l.id = p.current_location_id
    WHERE p.id = NEW.user_id;

    -- Fallback to scenario's location if user's current location is null
    IF v_loc_id IS NULL AND NEW.scenario_id IS NOT NULL THEN
        SELECT location_id, (SELECT name FROM public.locations WHERE id = s.location_id)
        INTO v_loc_id, v_loc_name
        FROM public.scenarios s
        WHERE s.id = NEW.scenario_id;
    END IF;

    IF NEW.ugc_scenario_id IS NOT NULL THEN
        INSERT INTO public.user_chronicles (
            user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at
        ) VALUES (
            NEW.user_id, 
            'quest_success', 
            COALESCE(NEW.accumulated_days_at_completion, (SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
            NULL, 
            NEW.ugc_scenario_id,
            COALESCE((SELECT title FROM public.ugc_scenarios WHERE id = NEW.ugc_scenario_id), 'クエスト完了'),
            'クエストを成功させた。',
            v_loc_id,
            v_loc_name,
            COALESCE(NEW.completed_at, NOW())
        )
        ON CONFLICT (user_id, ugc_scenario_id) WHERE event_type = 'quest_success' AND ugc_scenario_id IS NOT NULL DO NOTHING;
    ELSE
        INSERT INTO public.user_chronicles (
            user_id, event_type, accumulated_days, scenario_id, ugc_scenario_id, location_id, location_name, title, description, created_at
        ) VALUES (
            NEW.user_id, 
            'quest_success', 
            COALESCE(NEW.accumulated_days_at_completion, (SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
            NEW.scenario_id, 
            NULL,
            COALESCE((SELECT title FROM public.scenarios WHERE id = NEW.scenario_id), 'クエスト完了'),
            'クエストを成功させた。',
            v_loc_id,
            v_loc_name,
            COALESCE(NEW.completed_at, NOW())
        )
        ON CONFLICT (user_id, scenario_id) WHERE event_type = 'quest_success' AND scenario_id IS NOT NULL DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_completed_quests
INSTEAD OF INSERT ON public.user_completed_quests
FOR EACH ROW EXECUTE FUNCTION public.insert_completed_quests_trigger();

-- 6d. user_item_history インサートトリガー
CREATE OR REPLACE FUNCTION public.insert_item_history_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_chronicles (
        user_id, event_type, accumulated_days, item_id, title, description, created_at
    ) VALUES (
        NEW.user_id, 
        'item_collected', 
        COALESCE((SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
        NEW.item_id,
        'コレクション: ' || COALESCE((SELECT name FROM public.items WHERE id = NEW.item_id), 'アイテム'),
        'アイテムを発見し、図鑑に記録した。',
        COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (user_id, item_id) WHERE event_type = 'item_collected' AND item_id IS NOT NULL DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_item_history
INSTEAD OF INSERT ON public.user_item_history
FOR EACH ROW EXECUTE FUNCTION public.insert_item_history_trigger();

-- 6e. user_bestiary インサートトリガー
CREATE OR REPLACE FUNCTION public.insert_bestiary_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_chronicles (
        user_id, event_type, accumulated_days, enemy_id, title, description, created_at
    ) VALUES (
        NEW.user_id, 
        'monster_defeated', 
        COALESCE((SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
        NEW.enemy_id,
        'コレクション: ' || COALESCE((SELECT name FROM public.enemies WHERE id = NEW.enemy_id), '魔物'),
        '魔物と交戦し、図鑑に記録した。',
        COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (user_id, enemy_id) WHERE event_type = 'monster_defeated' AND enemy_id IS NOT NULL DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_bestiary
INSTEAD OF INSERT ON public.user_bestiary
FOR EACH ROW EXECUTE FUNCTION public.insert_bestiary_trigger();

-- 6f. user_npc_encounters インサートトリガー
CREATE OR REPLACE FUNCTION public.insert_npc_encounters_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_chronicles (
        user_id, event_type, accumulated_days, npc_slug, title, description, created_at
    ) VALUES (
        NEW.user_id, 
        'npc_encountered', 
        COALESCE((SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
        NEW.npc_slug,
        '出会いの記録: ' || COALESCE((SELECT name FROM public.npcs WHERE slug = NEW.npc_slug), NEW.npc_slug),
        '新たな旅人と遭遇し、記録した。',
        COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (user_id, npc_slug) WHERE event_type = 'npc_encountered' AND npc_slug IS NOT NULL DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_npc_encounters
INSTEAD OF INSERT ON public.user_npc_encounters
FOR EACH ROW EXECUTE FUNCTION public.insert_npc_encounters_trigger();

-- 6g. INSTEAD OF DELETE トリガー関数の定義
CREATE OR REPLACE FUNCTION public.delete_chronicle_row_trigger()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_chronicles WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delete_quest_activity_logs
INSTEAD OF DELETE ON public.quest_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.delete_chronicle_row_trigger();

CREATE TRIGGER trg_delete_user_visited_locations
INSTEAD OF DELETE ON public.user_visited_locations
FOR EACH ROW EXECUTE FUNCTION public.delete_chronicle_row_trigger();

CREATE TRIGGER trg_delete_user_completed_quests
INSTEAD OF DELETE ON public.user_completed_quests
FOR EACH ROW EXECUTE FUNCTION public.delete_chronicle_row_trigger();

CREATE TRIGGER trg_delete_user_item_history
INSTEAD OF DELETE ON public.user_item_history
FOR EACH ROW EXECUTE FUNCTION public.delete_chronicle_row_trigger();

CREATE TRIGGER trg_delete_user_bestiary
INSTEAD OF DELETE ON public.user_bestiary
FOR EACH ROW EXECUTE FUNCTION public.delete_chronicle_row_trigger();

CREATE TRIGGER trg_delete_user_npc_encounters
INSTEAD OF DELETE ON public.user_npc_encounters
FOR EACH ROW EXECUTE FUNCTION public.delete_chronicle_row_trigger();

-- ============================================================
-- 7. RLS の有効化とポリシー定義
-- ============================================================
ALTER TABLE public.user_chronicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_chronicles_select" ON public.user_chronicles;
CREATE POLICY "user_chronicles_select" ON public.user_chronicles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_chronicles_insert" ON public.user_chronicles;
CREATE POLICY "user_chronicles_insert" ON public.user_chronicles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_chronicles_update" ON public.user_chronicles;
CREATE POLICY "user_chronicles_update" ON public.user_chronicles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_chronicles_delete" ON public.user_chronicles;
CREATE POLICY "user_chronicles_delete" ON public.user_chronicles
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
