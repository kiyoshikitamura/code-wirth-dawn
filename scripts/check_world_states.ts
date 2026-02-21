
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking World States ---");
    const { data: ws } = await supabase.from('world_states').select('id, location_id, location_name, total_days_passed').limit(5);
    console.log("World States Sample:", ws);

    const { data: loc } = await supabase.from('locations').select('id, name').eq('name', '巡礼の宿場町').single();
    if (loc) {
        console.log("Target Location:", loc);
        const { data: wsTarget } = await supabase.from('world_states').select('*').eq('location_id', loc.id).maybeSingle();
        console.log("Target World State:", wsTarget);
    }
}

run();
