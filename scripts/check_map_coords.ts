
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoords() {
    // Check all locations
    const { data: allLocs } = await supabase.from('locations').select('id, name, slug, map_x, map_y');

    console.log('--- All Locations ---');
    if (allLocs) {
        allLocs.forEach(l => {
            console.log(`[${l.name}] (${l.slug}): x=${l.map_x}, y=${l.map_y}`);
        });
    } else {
        console.log('No locations found.');
    }
}

checkCoords();
