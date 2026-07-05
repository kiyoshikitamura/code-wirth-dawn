-- Enable real-time replication for gossip_posts table
ALTER PUBLICATION supabase_realtime ADD TABLE gossip_posts;

-- Migrate existing user posts to the new global channel
UPDATE gossip_posts 
SET location_id = NULL, location_name = NULL 
WHERE is_system = false;
