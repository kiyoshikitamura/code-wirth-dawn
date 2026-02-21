
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Hub Location ID ---");
    const { data: loc } = await supabase
        .from('locations')
        .select('id, slug, name')
        .eq('name', '名もなき旅人の拠所')
        .single();

    if (loc) {
        console.log(`Hub Found: ${loc.name} (ID: ${loc.id}, Slug: ${loc.slug})`);
    } else {
        console.error("Hub not found!");
    }
}

run();
