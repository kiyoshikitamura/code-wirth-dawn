-- Add animation_type column to cards table for battle visual effects
ALTER TABLE cards ADD COLUMN IF NOT EXISTS animation_type TEXT NOT NULL DEFAULT 'SLASH';
