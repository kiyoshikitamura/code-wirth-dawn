
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data, error } = await supabase
        .from('locations')
        .select('id, map_x, neighbors')
        .eq('id', 'loc_regalia')
        .single();

    if (error) {
        console.error('Verification Failed:', error);
    } else {
        console.log('Verification Success:', data);
    }
}

main();
