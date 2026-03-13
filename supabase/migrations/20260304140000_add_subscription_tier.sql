-- Migration: subscription_tier カラムの追加と is_subscriber からの移行
-- 仕様: spec_v13_monetization_subscription.md §3
-- 3段階 Tier: 'free' | 'basic' | 'premium'

-- 1. subscription_tier カラムを追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'basic', 'premium'));

-- 2. 既存の is_subscriber = true のユーザーを 'basic' に移行
UPDATE user_profiles
  SET subscription_tier = 'basic'
  WHERE is_subscriber = TRUE AND subscription_tier = 'free';

-- NOTE: is_subscriber カラムの DROP は全コードの移行確認後、別マイグレーションで実施する。
-- ALTER TABLE user_profiles DROP COLUMN is_subscriber;
