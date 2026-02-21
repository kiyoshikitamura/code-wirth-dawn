
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Locations Dump ---");
    const { data: locs, error } = await supabase
        .from('locations')
        .select('*');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${locs?.length} locations.`);
    locs?.forEach(l => {
        console.log(`ID: ${l.id}`);
        console.log(`Name: ${l.name}`);
        // Check for any field that might be a slug
        console.log("Keys:", Object.keys(l).join(', '));
        console.log("-------------------");
    });
}

run();
