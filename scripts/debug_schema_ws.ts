
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('party_members').select('*').limit(1).single();
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Keys:", Object.keys(data));
        console.log("Sample:", JSON.stringify(data, null, 2));
    }
}

checkSchema();
