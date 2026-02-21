
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260220000000_create_user_secrets.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying migration...");
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error("Migration Failed:", error);
    } else {
        console.log("Migration Successful!");
    }
}

run();
