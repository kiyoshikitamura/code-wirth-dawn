
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking for Duplicate Slugs in Items ---");

    // Get all slugs
    const { data: items, error } = await supabase.from('items').select('id, slug, name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const counts: Record<string, number> = {};
    const details: Record<string, any[]> = {};

    items?.forEach(i => {
        counts[i.slug] = (counts[i.slug] || 0) + 1;
        if (!details[i.slug]) details[i.slug] = [];
        details[i.slug].push({ id: i.id, name: i.name });
    });

    const duplicates = Object.entries(counts).filter(([slug, count]) => count > 1);

    if (duplicates.length === 0) {
        console.log("No duplicate slugs found.");
    } else {
        console.error(`Found ${duplicates.length} duplicate slugs!`);
        duplicates.forEach(([slug, count]) => {
            console.log(`- ${slug} (${count}x):`);
            details[slug].forEach((d: any) => console.log(`  - [${d.id}] ${d.name}`));
        });
    }
}

run();
