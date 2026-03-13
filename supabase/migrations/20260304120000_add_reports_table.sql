-- Migration: 20260304120000_add_reports_table.sql
-- Adds the reports table for user avatar moderation.
-- Note: user_profiles.avatar_url already exists from earlier migrations.

-- ============================================================
-- reports table: 不適切アバター画像の通報管理
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_url TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for admin review queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);

-- RLS Policy: 通報者は自分の通報のみ INSERT 可。参照は不可（管理者はサービスロールでアクセス）。
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reporters_can_insert" ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
