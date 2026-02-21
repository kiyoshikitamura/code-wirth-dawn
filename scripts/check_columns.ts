
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCols() {
    const sql = "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'locations'";
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) console.error("SQL ERR:", error);
    else console.log("COLUMNS:", JSON.stringify(data, null, 2));
}

checkCols();
