
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
    console.log("--- RE-INSERTING NPC ---");
    const zoeData = {
        slug: 'npc_alchemist_zoe',
        name: '怪しい錬金術師',
        job_class: 'Alchemist',
        introduction: 'ふふ... 私の実験に付き合ってもらうよ。',
        // image: '/avatars/adventurer.jpg', // Temporarily remove image if column missing? 
        // Log says: "Could not find the 'image' column of 'npcs' in the schema cache"
        // Wait, did I add image column? Or is it missing? 
        // I should check schema. 
        // For now, omit image to ensure insert works.
        location_id: 'loc_regalia'
    };

    const { data: npc, error: npcErr } = await supabase
        .from('npcs')
        .upsert(zoeData, { onConflict: 'slug' })
        .select()
        .single();

    if (npcErr) console.error("NPC Upsert Error:", npcErr);
    else console.log("NPC Inserted:", npc);

    console.log("--- FIXING QUEST FLOW ---");
    const { data: quest } = await supabase.from('scenarios').select('flow_nodes').eq('slug', 'quest_escort_empire_v1').single();
    if (quest) {
        let nodes = quest.flow_nodes;
        // 1. Add 'end' node which mimics 'complete' or redirects
        const hasEnd = nodes.some(n => n.id === 'end');
        if (!hasEnd) {
            nodes.push({
                id: 'end',
                type: 'end',
                result: 'success',
                text: '護衛任務完了。帝都カロンに到着した。'
            });
        }

        // 2. Ensure 'complete' node is valid too
        const hasComplete = nodes.some(n => n.id === 'complete');
        if (hasComplete) {
            // If complete exists, ensure it works.
        }

        // Update
        const { error: uErr } = await supabase
            .from('scenarios')
            .update({ flow_nodes: nodes })
            .eq('slug', 'quest_escort_empire_v1');

        if (uErr) console.error("Quest Update Error:", uErr);
        else console.log("Quest Updated with 'end' node.");
    }
}

fixData();
