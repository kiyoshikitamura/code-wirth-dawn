-- ============================================================
-- Migration: Quest game-day tracking & abandon count
-- spec_v15.1 §4 Tab1 / give-up count
-- ============================================================

-- ① user_completed_quests に達成時ゲーム内経過日数を追加
-- (クエスト達成時のaccumulated_daysを記録することで聖界暦換算が可能になる)
ALTER TABLE user_completed_quests
    ADD COLUMN IF NOT EXISTS accumulated_days_at_completion INTEGER;

-- 既存データのバックフィル (近似値: 現在のaccumulated_daysを使用)
-- NOTE: 完全な精度は出ないが、既存レコードへの配慮として設定
UPDATE user_completed_quests ucq
SET accumulated_days_at_completion = (
    SELECT accumulated_days FROM user_profiles WHERE id = ucq.user_id
)
WHERE accumulated_days_at_completion IS NULL;

-- ② user_profiles に途中放棄カウントカラムを追加
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS abandon_count INTEGER NOT NULL DEFAULT 0;

-- インデックスは不要（集計用途ではないため）
