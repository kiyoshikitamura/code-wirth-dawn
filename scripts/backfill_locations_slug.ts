
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SLUG_MAP: Record<string, string> = {
    '名もなき旅人の拠所': 'loc_hub',
    '王都アーカディア': 'loc_regalia',
    '交易都市メリディア': 'loc_meridia',
    '帝都カロン': 'loc_charon',
    '神都ヤト': 'loc_yato',
    '巡礼の宿場町': 'loc_pilgrim_inn',
    '北の砦': 'loc_north_fort',
    '古の遺跡': 'loc_ancient_ruins',
    '精霊の森': 'loc_spirit_forest'
};

async function run() {
    console.log("--- Backfilling Locations Slug ---");

    const { data: locs, error } = await supabase.from('locations').select('id, name, slug');
    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    if (!locs) return;

    for (const loc of locs) {
        let slug = loc.slug;
        if (!slug) {
            slug = SLUG_MAP[loc.name];
            if (!slug) {
                // Fallback: generate from name (simple hash or english placeholder)
                // Since we don't have japanese->english logic, we use 'loc_' + random short id for unknown
                slug = 'loc_' + Math.random().toString(36).substring(2, 8);
                console.warn(`Warning: No mapping for "${loc.name}". Generated slug: ${slug}`);
            }

            const { error: updateError } = await supabase
                .from('locations')
                .update({ slug: slug })
                .eq('id', loc.id);

            if (updateError) {
                console.error(`Failed to update ${loc.name}:`, updateError);
            } else {
                console.log(`Updated ${loc.name} -> ${slug}`);
            }
        } else {
            console.log(`Skipping ${loc.name} (already has slug: ${slug})`);
        }
    }
}

run();
