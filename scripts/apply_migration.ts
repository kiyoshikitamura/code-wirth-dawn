
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const sql = fs.readFileSync('supabase/migrations/20260219000001_fix_rls_and_names.sql', 'utf8');

    // Split by -- (simple splitting won't work for complex SQL, but these are simple)
    // Actually, Supabase doesn't have a generic SQL execution endpoint in the JS client.
    // BUT we can use pg-native or just execute the specific parts using Supabase methods if possible.
    // Since I can't run RAW SQL via the client easily without an RPC, I will use individual calls for RLS.
    // Wait, the migration also updates data.

    console.log("Applying RLS and Name updates...");

    // 1. Nations Update
    await supabase.from('nations').update({ name: 'ローラン聖帝国' }).eq('id', 'Roland');
    await supabase.from('nations').update({ name: '砂塵の王国マルカンド' }).eq('id', 'Markand');
    await supabase.from('nations').update({ name: '夜刀神国' }).eq('id', 'Yato');
    await supabase.from('nations').update({ name: '華龍神朝' }).eq('id', 'Karyu');
    await supabase.from('nations').update({ name: '中立自由都市' }).eq('id', 'Neutral');

    // 2. RLS Policies
    // We try to use RPC if available or just assume we might need the SQL editor.
    // However, I can try to use a specific RPC `exec_sql` if it's been set up by the user before.
    // If not, I'll have to warn the user or find another way.
    // Let's check for an exec_sql RPC.

    const { data: rpcCheck, error: rpcError } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (rpcError) {
        console.warn("RPC 'exec_sql' not found. RLS policies might need manual application in Supabase Dashboard.");
        console.warn("Please run migrations/20260219000001_fix_rls_and_names.sql manually.");
    } else {
        console.log("RPC 'exec_sql' found. Applying SQL...");
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) console.error("Migration error:", error);
    }
}

applyMigration();
