
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkNations() {
    const { data, error } = await supabase.from('nations').select('*');
    if (error) {
        console.error("Error fetching Nations:", error);
    } else {
        console.log("Nations:", JSON.stringify(data, null, 2));
    }
}

checkNations();
