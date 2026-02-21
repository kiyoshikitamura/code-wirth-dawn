
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function verify() {
    const { data: locs } = await supabase.from('locations').select('name, slug, neighbors');
    console.log("Locations Count:", locs?.length);
    if (locs && locs.length > 0) {
        console.log("Sample Neighbor (Regalia):", locs.find(l => l.slug === 'loc_regalia')?.neighbors);
    }

    const { data: ws } = await supabase.from('world_states').select('location_name, controlling_nation');
    console.log("World States Count:", ws?.length);
    console.log("Sample WS (Regalia):", ws?.find(w => w.location_name === '王都レガリア'));
}

verify();
