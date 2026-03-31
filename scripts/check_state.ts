import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // Check all profiles
    const { data: profiles } = await s.from('user_profiles').select('id, current_location_id, title_name').limit(5);
    
    for (const p of (profiles || [])) {
        const { data: loc } = await s.from('locations').select('name, slug').eq('id', p.current_location_id).maybeSingle();
        const { data: hub } = await s.from('user_hub_states').select('is_in_hub').eq('user_id', p.id).maybeSingle();
        console.log('Profile:', p.title_name, '| Location:', loc?.name, '(' + loc?.slug + ')', '| is_in_hub:', hub?.is_in_hub);
    }
}

main();
