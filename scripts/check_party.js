
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPartyMembers() {
    console.log("Checking party_members for ID 4014 or Slug npc_alchemist_zoe");

    const { data: d1, error: e1 } = await supabase.from('party_members').select('*').eq('id', '4014').maybeSingle();
    if (d1) console.log("ID 4014 found in party_members:", d1.name);
    else if (e1 && e1.code !== '22P02') console.log("ID 4014 error:", e1);
    else console.log("ID 4014 not found in party_members (or uuid error)");

    const { data: d2, error: e2 } = await supabase.from('party_members').select('*').eq('slug', 'npc_alchemist_zoe').maybeSingle();
    if (d2) console.log("Slug npc_alchemist_zoe found in party_members:", d2.name, d2.id);
    else console.log("Slug npc_alchemist_zoe not found in party_members", e2);
}

checkPartyMembers();
