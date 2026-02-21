
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAndFix() {
    console.log("--- SCHEMA CHECK ---");
    // Get one row to see columns
    const { data: cols, error: cErr } = await supabase.from('npcs').select('*').limit(1);

    if (cErr) {
        console.error("Schema Check Error:", cErr);
    } else if (cols.length > 0) {
        console.log("NPC Columns:", Object.keys(cols[0]));
    } else {
        console.log("NPC table empty, cannot deduce columns easily via select *");
        // Try inserting with minimal fields to see what passes
    }

    // Try inserting Zoe again WITHOUT image if it was the issue
    console.log("--- INSERTING ZOE (Minimal) ---");
    const zoeData = {
        slug: 'npc_alchemist_zoe',
        name: '怪しい錬金術師',
        job_class: 'Alchemist',
        introduction: 'ふふ... 私の実験に付き合ってもらうよ。',
        location_id: 'loc_regalia'
        // Intentionally omitting 'image' to see if it works
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

    // Check Party Member API directly via script? 
    // No, I can just check the table.
}

inspectAndFix();
