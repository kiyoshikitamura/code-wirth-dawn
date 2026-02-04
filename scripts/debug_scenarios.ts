import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- SCENARIO DEBUG ---');
    const { data, error } = await supabase
        .from('scenarios')
        .select('id, title, location_id, conditions, ruling_nation_id')
        .in('id', [5008, 5013]);

    if (error) {
        console.error(error);
    } else {
        const target = data.find(q => q.id === 5008);
        console.log("QUEST 5008:", JSON.stringify(target, null, 2));
    }
}

main();
