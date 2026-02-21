
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Connected to:", supabaseUrl);

async function verifyData() {
    console.log("--- Verifying Enemies ---");
    const { data: enemies, error: eError } = await supabase.from('enemies').select('*');
    if (eError) console.error("Enemy Error:", eError);
    else {
        console.log(`Total Enemies: ${enemies.length}`);
        enemies.filter(e => ['wolf_shadow', 'slime_poison', 'reaper'].includes(e.slug)).forEach(e => {
            console.log(`Enemy ${e.slug}: HP=${e.hp}, VitDmg=${(e as any).vit_damage}, Traits=${(e as any).traits}`);
        });
    }

    console.log("\n--- Verifying Scenario 1 Script ---");
    const { data: quest, error: qError } = await supabase.from('scenarios').select('script_data').eq('id', 1).single();
    if (qError) console.error("Quest Error:", qError);
    if (quest) {
        // Look for enemy_group_id
        const scriptJson = JSON.stringify(quest.script_data);
        console.log("Script snippet (battle):", scriptJson.match(/"battle_encount":\s*{[^}]*}/g));
        console.log("Script snippet (guest):", scriptJson.match(/"guest_join":\s*{[^}]*}/g));
        console.log("Script snippet (travel):", scriptJson.match(/"type":\s*"travel"[^}]*}/g));
    }

    console.log("\n--- Verifying Enemy Groups ---");
    const { data: groups, error: gError } = await supabase.from('enemy_groups').select('*');
    if (gError) console.error("Group Error:", gError);
    else {
        console.log(`Total Groups: ${groups.length}`);
        groups.forEach(g => {
            console.log(`Group ID ${g.id} (${(g as any).name}): ${g.members}`);
        });
    }

    console.log("\n--- Verifying NPC Alchemist ---");
    const { data: npc, error: nError } = await supabase.from('npcs').select('*').eq('slug', 'npc_test_alchemist').single();
    if (nError) console.error("NPC Error:", nError);
    if (npc) {
        console.log(`Alchemist Found: ${npc.name}, Cards: ${npc.default_cards}`);
    } else {
        console.log("Alchemist NPC not found");
    }
}

verifyData();
