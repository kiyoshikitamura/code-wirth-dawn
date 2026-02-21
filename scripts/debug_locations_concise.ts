
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Locations List (Concise) ---");
    const { data: locs, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    locs?.forEach(l => {
        console.log(`${l.id} | ${l.name}`);
    });
}

run();
