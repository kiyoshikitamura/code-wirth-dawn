
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectExhaustive() {
    console.log("--- 1. ITEMS SCHEMA ---");
    const { data: itemSample, error: itemErr } = await supabase.from('items').select('*').limit(1);
    if (itemErr) console.error(itemErr);
    else console.log("Item Columns:", Object.keys(itemSample[0]));

    console.log("\n--- 2. LOCATIONS DATA (Coords) ---");
    const slugs = ['loc_regalia', 'loc_white_fort', 'loc_iron_mine', 'loc_charon'];
    const { data: locs, error: locErr } = await supabase.from('locations').select('slug, name, x, y').in('slug', slugs);
    if (locErr) console.error(locErr);
    else console.table(locs);

    console.log("\n--- 3. QUEST NODE DATA ---");
    const { data: quest, error: qErr } = await supabase.from('scenarios').select('flow_nodes').eq('slug', 'quest_escort_empire_v1').single();
    if (qErr) console.error(qErr);
    else {
        // Log just the structure of first few nodes to verify order
        console.log("Flow Nodes Order:", quest.flow_nodes.map(n => `[${n.type}] ${n.id} (Next: ${n.next || n.next_node_success})`));
        // Check text of travel nodes
        const travels = quest.flow_nodes.filter(n => n.type === 'travel');
        console.log("Travel Nodes:", JSON.stringify(travels, null, 2));
    }
}

inspectExhaustive();
