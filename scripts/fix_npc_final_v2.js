
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNpcCorrectly() {
    console.log("--- FINAL NPC INSERT (Correct Columns) ---");
    const zoeData = {
        slug: 'npc_alchemist_zoe',
        name: '怪しい錬金術師',
        job_class: 'Alchemist',
        introduction: 'ふふ... 私の実験に付き合ってもらうよ。',
        // 'location_id' -> 'current_location_id'
        current_location_id: 'loc_regalia',
        // 'image' -> Not in schema! Skipping.
        is_hireable: false
    };

    const { data: npc, error: insertErr } = await supabase
        .from('npcs')
        .upsert(zoeData, { onConflict: 'slug' })
        .select()
        .single();

    if (insertErr) {
        console.error("Insert Error:", insertErr);
    } else {
        console.log("Insert Success:", npc);
    }
}

fixNpcCorrectly();
