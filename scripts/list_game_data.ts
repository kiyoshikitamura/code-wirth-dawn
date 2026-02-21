
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Listing Top 20 Enemies...");
    const { data: enemies } = await supabase.from('enemies').select('id, slug, name').limit(20);
    if (enemies && enemies.length > 0) {
        enemies.forEach(e => console.log(`Enemy: ${e.name} (ID: ${e.id}, Slug: ${e.slug})`));
    } else {
        console.log("No enemies found.");
    }

    console.log("Listing Top 20 NPCs...");
    const { data: npcs } = await supabase.from('npcs').select('id, slug, name').limit(20);

    if (npcs && npcs.length > 0) {
        npcs.forEach(n => console.log(`NPC: ${n.name} (${n.slug})`));
    } else {
        console.log("No NPCs found.");
    }
}

check();
