
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("--- Verifying Data Driven Refactor ---");

    // 1. Nations
    const { data: nations, error: natError } = await supabase.from('nations').select('*');
    if (natError) console.error("Nations Check Failed:", natError.message);
    else {
        console.log(`✅ Nations Table: Found ${nations?.length} records.`);
        nations?.forEach(n => console.log(`   - ${n.name} [Order:${n.ideal_order}, Chaos:${n.ideal_chaos}]`));
    }

    // 2. System Mercenaries
    const { data: mercs, error: mercError } = await supabase
        .from('npcs')
        .select('id, name, job_class')
        .select('id, name, job_class')
        .eq('origin', 'system_mercenary');

    if (mercError) console.error("Mercenaries Check Failed:", mercError.message);
    else {
        console.log(`✅ System Mercenaries: Found ${mercs?.length} records.`);
        mercs?.forEach(m => console.log(`   - ${m.name} (${m.job_class})`));
    }

    // 3. Inventory Schema Check (Implicit via Select)
    // We try to select 'item_id' to satisfy our curiosity even if we can't check schema metadata easily via client
    const { data: inv, error: invError } = await supabase.from('inventory').select('id, item_id, quantity').limit(1);
    if (invError) console.error("Inventory Check Failed:", invError.message);
    else console.log("✅ Inventory Table: Accessible and has item_id column.");

}

verify();
