
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkItemColumns() {
    console.log("=== Checking Item Columns ===");
    const { data: item } = await supabase.from('items').select('*').limit(1).single();
    if (item) {
        console.log("Columns:", Object.keys(item));
    }
}

checkItemColumns();
