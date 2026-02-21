
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking public access to 'enemy_groups'...");
    const { data: groups, error: err1 } = await supabase.from('enemy_groups').select('id, name').limit(1);
    if (err1) console.error("Enemy Groups Access Failed:", err1.message);
    else console.log("Enemy Groups Access OK:", groups);

    console.log("Checking public access to 'locations'...");
    const { data: locs, error: err2 } = await supabase.from('locations').select('id, name').limit(1);
    if (err2) console.error("Locations Access Failed:", err2.message);
    else console.log("Locations Access OK:", locs);
}

check();
