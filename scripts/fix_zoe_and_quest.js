
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
    // 1. Insert Alchemist Zoe into NPCs
    console.log("Inserting Zoe...");
    const zoeData = {
        slug: 'npc_alchemist_zoe',
        name: '怪しい錬金術師',
        job_class: 'Alchemist',
        introduction: 'ふふ... 私の実験に付き合ってもらうよ。',
        image: '/assets/chara/guest_alchemist.png', // Assuming asset exists or using default
        location_id: 'loc_regalia'
    };

    const { data: npc, error: npcErr } = await supabase
        .from('npcs')
        .upsert(zoeData, { onConflict: 'slug' })
        .select()
        .single();

    if (npcErr) console.error("NPC Insert Error:", npcErr);
    else console.log("Zoe Inserted/Updated:", npc.id);

    // 2. Update Quest Data to use slug for guest_id
    console.log("Updating Quest...");
    const { data: quest, error: qErr } = await supabase
        .from('scenarios')
        .select('flow_nodes')
        .eq('slug', 'quest_escort_empire_v1')
        .single();

    if (quest && quest.flow_nodes) {
        const newNodes = quest.flow_nodes.map(node => {
            if (node.type === 'guest_join') {
                return { ...node, params: { ...node.params, guest_id: 'npc_alchemist_zoe' } };
            }
            return node;
        });

        const { error: uErr } = await supabase
            .from('scenarios')
            .update({ flow_nodes: newNodes })
            .eq('slug', 'quest_escort_empire_v1');

        if (uErr) console.error("Quest Update Error:", uErr);
        else console.log("Quest Updated with guest_id: npc_alchemist_zoe");
    } else {
        console.error("Quest not found or no flow_nodes", qErr);
    }
}

fixData();
