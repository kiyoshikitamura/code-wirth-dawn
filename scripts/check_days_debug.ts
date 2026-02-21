
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Quest 1 Data ---");
    const { data: q1 } = await supabase.from('scenarios').select('id, title, days_success').eq('id', 1).single();
    console.log("Quest 1:", q1);

    console.log("\n--- Checking User Data (Latest) ---");
    const { data: user } = await supabase.from('user_profiles').select('id, age, age_days, accumulated_days, name').limit(1).single();
    console.log("User:", user);
}

run();
