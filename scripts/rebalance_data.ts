
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function rebalance() {
    console.log("--- Rebalancing Shadow Wolf ---");
    const { error } = await supabase
        .from('enemies')
        .update({
            hp: 40,
            max_hp: 40,
            vit_damage: 1 // Enable Vit Damage to test feature
        })
        .eq('slug', 'wolf_shadow');

    if (error) console.error("Update Failed:", error);
    else console.log("Update Success: Shadow Wolf HP -> 40, Vit Damage -> 1");
}

rebalance();
