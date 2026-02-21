
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1).single();
    if (error) {
        console.error("Error fetching user_profiles:", error);
    } else {
        console.log("Profiles Keys:", Object.keys(data));
        console.log("Profiles Sample:", JSON.stringify(data, null, 2));
    }
}

checkSchema();
