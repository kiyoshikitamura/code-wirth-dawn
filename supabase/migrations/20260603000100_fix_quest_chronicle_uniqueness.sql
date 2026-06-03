-- Migration: 20260603000100_fix_quest_chronicle_uniqueness.sql
-- Description: user_chroniclesのクエスト完了ユニーク制約を解除し、user_completed_questsビューをDISTINCT ONでユニーク化して、トリガーバグを修正

-- 1. 重複クリアを許可するため、ユニークインデックスを削除
DROP INDEX IF EXISTS public.idx_chronicles_unique_quest;
DROP INDEX IF EXISTS public.idx_chronicles_unique_ugc_quest;

-- 2. user_completed_quests ビューの再定義 (DISTINCT ON で最新1件のみを抽出)
CREATE OR REPLACE VIEW public.user_completed_quests AS
SELECT DISTINCT ON (user_id, COALESCE(scenario_id::text, ugc_scenario_id::text))
    id,
    user_id,
    scenario_id,
    ugc_scenario_id,
    created_at AS completed_at,
    accumulated_days AS accumulated_days_at_completion
FROM public.user_chronicles
WHERE event_type = 'quest_success'
ORDER BY user_id, COALESCE(scenario_id::text, ugc_scenario_id::text), created_at DESC;

-- 3. インサートトリガー関数の修正（カラムの順序バグ修正、ON CONFLICT の削除）
CREATE OR REPLACE FUNCTION public.insert_completed_quests_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_loc_id UUID;
    v_loc_name TEXT;
    v_title TEXT;
BEGIN
    -- ユーザーの現在地情報を取得
    SELECT p.current_location_id, l.name 
    INTO v_loc_id, v_loc_name
    FROM public.user_profiles p
    LEFT JOIN public.locations l ON l.id = p.current_location_id
    WHERE p.id = NEW.user_id;

    -- 現在地が取得できない場合はクエスト側の設定地をフォールバック
    IF v_loc_id IS NULL AND NEW.scenario_id IS NOT NULL THEN
        SELECT location_id, (SELECT name FROM public.locations WHERE id = s.location_id)
        INTO v_loc_id, v_loc_name
        FROM public.scenarios s
        WHERE s.id = NEW.scenario_id;
    END IF;

    IF NEW.ugc_scenario_id IS NOT NULL THEN
        v_title := COALESCE((SELECT title FROM public.ugc_scenarios WHERE id = NEW.ugc_scenario_id), 'クエスト完了');
        INSERT INTO public.user_chronicles (
            user_id, 
            event_type, 
            accumulated_days, 
            scenario_id, 
            ugc_scenario_id, 
            location_id, 
            location_name, 
            title, 
            description, 
            created_at
        ) VALUES (
            NEW.user_id, 
            'quest_success', 
            COALESCE(NEW.accumulated_days_at_completion, (SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
            NULL, 
            NEW.ugc_scenario_id,
            v_loc_id,
            v_loc_name,
            'クエストクリア: ' || v_title,
            'クエストを成功させた。',
            COALESCE(NEW.completed_at, NOW())
        );
    ELSE
        v_title := COALESCE((SELECT title FROM public.scenarios WHERE id = NEW.scenario_id), 'クエスト完了');
        INSERT INTO public.user_chronicles (
            user_id, 
            event_type, 
            accumulated_days, 
            scenario_id, 
            ugc_scenario_id, 
            location_id, 
            location_name, 
            title, 
            description, 
            created_at
        ) VALUES (
            NEW.user_id, 
            'quest_success', 
            COALESCE(NEW.accumulated_days_at_completion, (SELECT accumulated_days FROM public.user_profiles WHERE id = NEW.user_id), 0), 
            NEW.scenario_id, 
            NULL,
            v_loc_id,
            v_loc_name,
            'クエストクリア: ' || v_title,
            'クエストを成功させた。',
            COALESCE(NEW.completed_at, NOW())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
