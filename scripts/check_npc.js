
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNpc() {
    console.log("Checking ID: 4014");
    const { data: d1, error: e1 } = await supabase.from('npcs').select('*').eq('id', '4014').maybeSingle();
    if (d1) console.log("ID 4014:", d1.name, d1.slug);
    else console.log("ID 4014 not found", e1);

    console.log("Checking Slug: npc_alchemist_zoe");
    const { data: d2, error: e2 } = await supabase.from('npcs').select('*').eq('slug', 'npc_alchemist_zoe').maybeSingle();
    if (d2) console.log("Slim npc_alchemist_zoe:", d2.name, d2.id);
    else console.log("Slug npc_alchemist_zoe not found", e2);
}

checkNpc();
