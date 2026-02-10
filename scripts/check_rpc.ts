
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpc() {
    console.log("Checking for 'exec_sql' RPC...");
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });

    if (error) {
        console.error("RPC 'exec_sql' failed or does not exist:", error.message);
    } else {
        console.log("RPC 'exec_sql' exists! Result:", data);
    }
}

checkRpc();
