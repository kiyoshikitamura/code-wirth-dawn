
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyZoeAnon() {
    console.log("--- VERIFYING ZOE (ANON) ---");
    const { data: bySlug, error: slugError } = await supabase
        .from('npcs')
        .select('*')
        .eq('slug', 'npc_alchemist_zoe')
        .single();

    if (bySlug) console.log("Found by Slug:", bySlug.name);
    else console.log("Slug lookup failed:", slugError);
}

verifyZoeAnon();
