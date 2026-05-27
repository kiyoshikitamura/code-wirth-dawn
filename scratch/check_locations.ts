import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    console.log("Fetching locations from DB...");
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('*');

    if (locError) {
        console.error("Loc error:", locError);
        return;
    }

    console.log("Total locations:", locations?.length);
    const border = locations?.find(l => l.name === '国境の町' || l.slug === 'loc_border_town');
    console.log("Border Town location row:", border);

    console.log("\nChecking npcs is_hireable status:");
    const { data: npcs, error: npcError } = await supabase
        .from('npcs')
        .select('id, slug, name, is_hireable')
        .limit(10);
    
    if (npcError) {
        console.error("NPC error:", npcError);
    } else {
        console.log("Sample NPCs:", npcs);
    }
}

run();
