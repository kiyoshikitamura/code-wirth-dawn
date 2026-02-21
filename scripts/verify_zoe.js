
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyZoe() {
    console.log("--- VERIFYING ZOE ---");
    // Check by Slug
    const { data: bySlug, error: slugError } = await supabase
        .from('npcs')
        .select('*')
        .eq('slug', 'npc_alchemist_zoe')
        .single();

    if (bySlug) console.log("Found by Slug:", bySlug.name);
    else console.log("Slug lookup failed:", slugError);

    // Check by ID (if we knew it, but we rely on slug)
}

verifyZoe();
