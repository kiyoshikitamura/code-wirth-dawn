
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking Enemies Schema...");
    const { data: e, error: eErr } = await supabase.from('enemies').select('*').limit(1);
    if (e && e.length > 0) console.log("Enemies Keys:", Object.keys(e[0]));
    else console.log("Enemies empty or error:", eErr);

    console.log("Checking User Profiles Schema...");
    const { data: u, error: uErr } = await supabase.from('user_profiles').select('*').limit(1);
    if (u && u.length > 0) console.log("User Profiles Keys:", Object.keys(u[0]));
    else console.log("User Profiles empty or error:", uErr);
}

check();
