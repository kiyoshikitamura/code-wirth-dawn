
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function addDrops() {
    console.log("Adding Drops to Enemies...");

    // Shadow Wolf -> Drop 'item_herb' (Heal Herb) at 50% for testing
    const { error: err1 } = await supabase
        .from('enemies')
        .update({ drop_item_slug: 'item_herb', drop_rate: 100 }) // 100% for testing
        .eq('slug', 'wolf_shadow');

    // Slime -> Drop 'item_potion' (if exists, or seed) -> let's use 'card_slash' as a rare drop? No, items only usually.
    // Let's check items first.
    const { data: items } = await supabase.from('items').select('slug').limit(5);
    const herb = items?.find(i => i.slug.includes('herb'))?.slug || 'item_herb';

    if (err1) console.error("Failed to update Shadow Wolf:", err1);
    else console.log("Updated Shadow Wolf drop to", herb);

    // Update Slime too
    const { error: err2 } = await supabase
        .from('enemies')
        .update({ drop_item_slug: herb, drop_rate: 50 })
        .eq('slug', 'slime');

    if (err2) console.error("Failed to update Slime:", err2);
    else console.log("Updated Slime drop to", herb);
}

addDrops();
