
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Check Drops Integrity ---");

    // 1. Get Enemies with drops
    const { data: enemies, error: eErr } = await supabase
        .from('enemies')
        .select('slug, name, drop_item_slug')
        .not('drop_item_slug', 'is', null);

    if (eErr) { console.error("Enemies Error:", eErr); return; }

    // 2. Get All Items
    const { data: items, error: iErr } = await supabase
        .from('items')
        .select('slug, name');

    if (iErr) { console.error("Items Error:", iErr); return; }

    const itemSlugs = new Set(items?.map(i => i.slug));
    console.log(`Loaded ${items?.length} items.`);

    let errors = 0;
    enemies?.forEach(e => {
        if (!itemSlugs.has(e.drop_item_slug)) {
            console.error(`[INVALID DROP] Enemy '${e.name}' (${e.slug}) drops '${e.drop_item_slug}' which DOES NOT EXIST in items table.`);
            errors++;
        }
    });

    if (errors === 0) {
        console.log("All drop_item_slug references are valid.");
    } else {
        console.error(`Found ${errors} invalid drop references.`);
    }
}

run();
