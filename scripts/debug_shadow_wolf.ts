
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkShadowWolf() {
    console.log("--- Checking Enemy Groups ---");
    const { data: groups, error: groupError } = await supabase
        .from('enemy_groups')
        .select('*');

    if (groupError) console.error("Group Error:", groupError);
    else console.log(JSON.stringify(groups, null, 2));

    console.log("\n--- Checking Enemies (All) ---");
    const { data: enemies, error: enemyError } = await supabase
        .from('enemies')
        .select('id, name, slug, hp, max_hp, vit_damage');

    if (enemyError) console.error("Enemy Error:", enemyError);
    else console.log(JSON.stringify(enemies, null, 2));
}

checkShadowWolf();
