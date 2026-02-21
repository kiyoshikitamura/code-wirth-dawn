
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugQuestAndItems() {
    console.log("=== Debugging Quest & Items ===");

    // 1. Find Quest "王都への護衛任務"
    const { data: quests, error: qErr } = await supabase
        .from('scenarios')
        .select('id, title, slug, rewards')
        .ilike('title', '%王都%');

    if (qErr) console.error("Quest Search Error:", qErr);
    else {
        console.log("Found Quests matching '王都':");
        quests?.forEach(q => console.log(`- [${q.id}] ${q.title} (${q.slug})`));
    }

    // 2. Check Item 'item_herb'
    const { data: item, error: iErr } = await supabase
        .from('items')
        .select('id, name, slug')
        .eq('slug', 'item_herb')
        .maybeSingle();

    if (iErr) console.error("Item Search Error:", iErr);
    else if (item) {
        console.log(`Item 'item_herb' exists: [${item.id}] ${item.name}`);
    } else {
        console.error("Item 'item_herb' NOT FOUND! Checking potential alternatives...");
        const { data: alts } = await supabase.from('items').select('slug, name').limit(5);
        console.log("Alternatives:", alts);
    }
}

debugQuestAndItems();
