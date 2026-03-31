import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // Check NPC data structure
    const { data: npcs, error } = await s.from('npcs').select('id, slug, epithet, name, inject_cards').order('id');
    if (error) { console.error('Error:', error); return; }
    
    console.log('=== NPC Data (' + (npcs?.length || 0) + ' entries) ===');
    for (const npc of (npcs || [])) {
        const cards = npc.inject_cards || [];
        console.log('ID:', npc.id, '|', npc.slug, '| epithet:', npc.epithet, '| name:', npc.name, '| cards:', JSON.stringify(cards));
    }
}

main();
