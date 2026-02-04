-- Fix constraint for origin_type to allow system_mercenary
ALTER TABLE party_members DROP CONSTRAINT IF EXISTS party_members_origin_type_check;

ALTER TABLE party_members 
ADD CONSTRAINT party_members_origin_type_check 
CHECK (origin_type IN ('system', 'shadow_active', 'shadow_heroic', 'system_mercenary'));
