
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBalance() {
    console.log("--- Checking Enemies ---");
    const { data: enemies, error: enemyError } = await supabase
        .from('enemies')
        .select('*')
        .or('slug.in.(shadow_wolf,slime),vit_damage.gt.0');

    if (enemyError) console.error("Enemy Error:", enemyError);
    else console.log(JSON.stringify(enemies, null, 2));

    console.log("\n--- Checking NPCs ---");
    const { data: npcs, error: npcError } = await supabase
        .from('npcs')
        .select('*')
        .eq('slug', 'npc_test_alchemist');

    if (npcError) console.error("NPC Error:", npcError);
    else console.log(JSON.stringify(npcs, null, 2));
}

checkBalance();
