
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("--- NPC SCHEMA INSPECTION ---");
    // Attempt to insert a dummy with minimal fields to provoke error or success, 
    // but better to just try selecting and see if we can perform a 'dry run' or introspection if enabled.
    // Supabase JS doesn't have direct schema introspection easily without admin rights or rpc.
    // I will try to select one row and print keys.

    // If table is empty, I'll try to insert a row with JUST slug and name.
    const { data: existing } = await supabase.from('npcs').select('*').limit(1);
    if (existing && existing.length > 0) {
        console.log("Existing Columns:", Object.keys(existing[0]));
    } else {
        console.log("Table empty. Trying minimal insert to test columns.");
        const testData = { slug: 'test_schema_check' + Date.now(), name: 'Test' };
        const { data, error } = await supabase.from('npcs').insert(testData).select();
        if (error) console.log("Minimal insert failed:", error.message);
        else console.log("Minimal insert success. Columns:", Object.keys(data[0]));
    }
}

inspectSchema();
