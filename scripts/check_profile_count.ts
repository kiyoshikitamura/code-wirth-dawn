
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfiles() {
    console.log("Checking User Profiles...");

    const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });

    if (error) console.error(error);
    else console.log("Total Profiles:", count);

    const { data } = await supabase.from('user_profiles').select('id, name, title_name, age');
    console.log("Profiles Data:", data);
}

checkProfiles();
