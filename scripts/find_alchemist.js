
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAlchemist() {
    // Check party_members table for templates (where user_id is null or specific flag?)
    // Or maybe there is an 'npcs' table?

    // List tables first to be sure
    /*
    const { data: tables, error } = await supabase.from('information_schema.tables').select('*');
    if (error) console.log(error);
    else console.log(tables.map(t => t.table_name));
    */

    // Try 'party_members' with some query
    const { data, error } = await supabase
        .from('party_members')
        .select('*')
        .ilike('job_class', '%Alchemist%')
        .limit(5);

    if (error) {
        console.error('Party Member Error:', error);
        // Fallback: check schema of party_members to see if it allows templates
    } else {
        console.log('Alchemist Members:', data);
    }
}

findAlchemist();
