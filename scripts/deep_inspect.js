
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
    console.log("--- NPC CHECK ---");
    const { data: npc, error: npcErr } = await supabase
        .from('npcs')
        .select('*')
        .eq('slug', 'npc_alchemist_zoe')
        .maybeSingle();
    console.log("NPC 'npc_alchemist_zoe':", npc ? "FOUND" : "NOT FOUND", npcErr || "");
    if (npc) console.log("NPC ID:", npc.id);

    console.log("\n--- QUEST FLOW CHECK ---");
    const { data: quest, error: qErr } = await supabase
        .from('scenarios')
        .select('flow_nodes')
        .eq('slug', 'quest_escort_empire_v1')
        .single();

    if (quest && quest.flow_nodes) {
        console.log("Node IDs:", quest.flow_nodes.map(n => n.id));

        // Check for 'end' usage
        const referencesEnd = JSON.stringify(quest.flow_nodes).includes('"next_node":"end"') ||
            JSON.stringify(quest.flow_nodes).includes('"next":"end"');
        console.log("References 'end' node?", referencesEnd);

        const definesEnd = quest.flow_nodes.some(n => n.id === 'end');
        console.log("Defines 'end' node?", definesEnd);

        // Check Battle Node
        const battleNodes = quest.flow_nodes.filter(n => n.type === 'battle');
        console.log("Battle Nodes:", battleNodes);
    } else {
        console.log("Quest error:", qErr);
    }
}

deepInspect();
