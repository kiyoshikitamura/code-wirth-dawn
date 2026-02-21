
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    console.log("--- Listing ALL NPCs ---");
    const { data: npcs, error: nError } = await supabase.from('npcs').select('id, name, slug');
    if (nError) console.error(nError);
    else {
        console.log(`Found ${npcs.length} NPCs.`);
        npcs.forEach(n => console.log(`- ${n.name} (${n.slug})`));
    }

    console.log("\n--- Listing ALL Enemy Groups ---");
    const { data: groups, error: gError } = await supabase.from('enemy_groups').select('id, name, members');
    if (gError) console.error(gError);
    else {
        console.log(`Found ${groups.length} Groups.`);
        groups.forEach(g => console.log(`- [${g.id}] ${g.name}: ${g.members}`));
    }
}

listAll();
