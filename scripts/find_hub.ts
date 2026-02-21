
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .or('type.eq.Hub,name.ilike.%拠所%');

    if (error) {
        console.error(error);
    } else {
        console.log("Hub Data:", JSON.stringify(data, null, 2));
    }
}

run();
