-- v8.1/v9.3: 基礎攻撃力と年齢経過日数カラムを追加
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS atk INT DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_days INT DEFAULT 0;
