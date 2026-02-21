
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkOne() {
    const { data, error } = await supabase.from('locations').select('*').eq('slug', 'loc_regalia').single();
    if (error) {
        console.error("Error fetching Regalia:", error);
    } else {
        console.log("Regalia Full Data:", JSON.stringify(data, null, 2));
    }
}

checkOne();
