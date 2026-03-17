import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {    console.error('Missing credentials'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: locs, error } = await supabase.from('locations').select('*');
    if (error) throw error;

    console.log(`Total Locations: ${locs.length}`);
    const slugs = new Set(locs.map(l => l.slug));
    
    let hub = locs.find(l => String(l.slug).includes('hub'));
    console.log(`Hub raw map coordinates: map_x=${hub?.map_x}, map_y=${hub?.map_y}, x=${hub?.x}, y=${hub?.y}`);

    let errorConnections = 0;
    locs.forEach(l => {
        if (l.connections) {
            l.connections.forEach((c: string) => {
                if (!slugs.has(c)) {
                    errorConnections++;
                    console.log(`[${l.slug}] points to unknown slug: ${c}`);
                }
            });
        }
    });

    console.log(`Total connection errors: ${errorConnections}`);
    console.log("\nSample Location (Regalia or similar):");
    const sample = locs.find(l => String(l.slug).includes('regalia') || String(l.name).includes('王都'));
    console.log(JSON.stringify(sample, null, 2));
}

check();
