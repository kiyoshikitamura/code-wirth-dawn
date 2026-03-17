-- Migration: fix invalid connections for loc_hub

UPDATE public.locations
SET connections = '[]'::jsonb
WHERE slug = 'loc_hub';
