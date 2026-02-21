
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listLocations() {
    console.log("=== Listing Locations ===");
    const { data: locs, error } = await supabase.from('locations').select('id, slug, name');
    if (error) console.error(error);
    else console.table(locs);
}

listLocations();
