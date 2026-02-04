import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('Checking Inventory Query...');

    // Attempt the query from route.ts
    const { data, error } = await supabase
        .from('inventory')
        .select(`
            id,
            items (
                id,
                name
            )
        `)
        .limit(1);

    if (error) {
        console.error('SUPABASE ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS. Data:', data);
    }
}

main();
