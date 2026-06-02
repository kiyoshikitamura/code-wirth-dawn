-- UGC枠追加機能用カラム追加
-- ゴールド消費による恒久枠追加（下書き・公開）と日次インポート枠追加

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ugc_extra_drafts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ugc_extra_published INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ugc_extra_daily_import INT NOT NULL DEFAULT 0;

-- ugc_extra_daily_import は daily cron (UTC 0:00) で 0 にリセットされる
-- ugc_extra_drafts / ugc_extra_published は恒久的（Tier上限の2倍が追加上限）

COMMENT ON COLUMN user_profiles.ugc_extra_drafts IS 'ゴールド購入による追加下書き枠数';
COMMENT ON COLUMN user_profiles.ugc_extra_published IS 'ゴールド購入による追加公開枠数';
COMMENT ON COLUMN user_profiles.ugc_extra_daily_import IS 'ゴールド購入による当日追加インポート回数（翌日リセット）';
