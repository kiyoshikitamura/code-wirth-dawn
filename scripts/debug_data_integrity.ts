
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking Enemy Group 101...");
    const { data: group, error: gErr } = await supabase.from('enemy_groups').select('*').eq('id', 101).single();

    if (gErr) {
        console.error("Group 101 Fetch Error:", gErr.message);
        return;
    }
    if (!group) {
        console.error("Group 101 NOT FOUND");
        return;
    }

    console.log("Group 101 Members:", group.members);

    if (!group.members || group.members.length === 0) {
        console.error("Group 101 has no members!");
        return;
    }

    console.log(`Checking Enemies table for slugs: ${group.members.join(', ')}`);
    const { data: enemies, error: eErr } = await supabase
        .from('enemies')
        .select('id, slug, name')
        .in('slug', group.members);

    if (eErr) {
        console.error("Enemies Fetch Error:", eErr.message);
    } else {
        console.log("Found Enemies:", enemies);
        const foundSlugs = enemies?.map(e => e.slug) || [];
        const missing = group.members.filter((m: string) => !foundSlugs.includes(m));
        if (missing.length > 0) {
            console.error("MISSING ENEMIES FROM DB:", missing);
        } else {
            console.log("All enemies found in DB.");
        }
    }
}

check();
