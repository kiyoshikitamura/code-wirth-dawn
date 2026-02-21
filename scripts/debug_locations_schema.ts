
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Locations Schema ---");
    const { data: locs, error } = await supabase
        .from('locations')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    locs?.forEach(l => {
        console.log(`ID: ${l.id}, Name: ${l.name}, Prosperity: ${l.prosperity_level}`);
        // Log all keys to see if there's a slug-like field
        console.log("Keys:", Object.keys(l).join(', '));
    });
}

run();
