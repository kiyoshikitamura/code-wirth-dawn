
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Inspecting DB Schema ---");

    // Get all tables
    const { data: tables } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');

    if (!tables) return;

    for (const t of tables) {
        const tableName = t.tablename;
        console.log(`\nTable: ${tableName}`);
        const { data: cols, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            // If we can't select *, maybe we can't see columns easily without admin API or inspection table
            // Try to infer from error or just skip data sample
            console.log("  (Error fetching sample/columns)", error.message);
        } else if (cols && cols.length > 0) {
            console.log("  Columns:", Object.keys(cols[0]).join(', '));
        } else {
            console.log("  (Empty table, cannot infer columns from data)");
        }
    }
}

run();
