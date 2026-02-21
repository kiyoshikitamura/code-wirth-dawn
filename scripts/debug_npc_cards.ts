
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkNpcCards() {
    console.log("Checking NPC Cards...");

    // Check NPCs table
    const { data: npcs, error: err1 } = await supabase.from('npcs').select('id, name, inject_cards');
    if (err1) console.error("NPCs Error:", err1);
    else {
        console.log(`Found ${npcs?.length} NPCs.`);
        npcs?.forEach(n => {
            console.log(`- NPC '${n.name}': Cards=[${n.inject_cards?.join(', ')}]`);
        });
    }

    // Check Party Members table (User's party)
    const { data: party, error: err2 } = await supabase.from('party_members').select('id, name, inject_cards');
    if (err2) console.error("Party Error:", err2);
    else {
        console.log(`\nFound ${party?.length} Party Members.`);
        party?.forEach(pm => {
            console.log(`- Member '${pm.name}': Cards=[${pm.inject_cards?.join(', ')}]`);
        });
    }

    // Check Cards table to see if these IDs exist
    const { data: cards } = await supabase.from('cards').select('id, name');
    console.log(`\nTotal Cards in DB: ${cards?.length}`);
    const cardIds = new Set(cards?.map(c => c.id));
    console.log("Card IDs:", Array.from(cardIds).slice(0, 10)); // Show sample
}

checkNpcCards();
