-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial maintenance setting
INSERT INTO system_settings (key, value)
VALUES (
  'maintenance',
  '{
    "force_maintenance": false,
    "start_at": null,
    "end_at": null,
    "admin_bypass_key": "secret-maintenance-bypass-key"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (anons & authenticated users)
CREATE POLICY "Allow read system_settings for all"
ON system_settings
FOR SELECT
USING (true);

-- Allow service_role to insert/update/delete (implicitly covered by bypass, but write policy is good)
CREATE POLICY "Allow all writes for service_role"
ON system_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
