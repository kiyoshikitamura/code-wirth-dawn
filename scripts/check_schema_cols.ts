
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking user_profiles columns...');
    const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

    if (userError) {
        console.error('Error fetching user_profiles:', userError);
    } else if (userProfiles && userProfiles.length > 0) {
        console.log('user_profiles columns:', Object.keys(userProfiles[0]));
    } else {
        console.log('user_profiles table found but empty, cannot infer columns.');
        // Fallback: try to insert a dummy to see errors or use RPC if available (but exec_sql failed before)
    }

    console.log('Checking items table...');
    const { data: items, error: itemError } = await supabase
        .from('items')
        .select('*')
        .limit(1);

    if (itemError) {
        console.error('Error fetching items:', itemError);
    } else if (items && items.length > 0) {
        console.log('items columns:', Object.keys(items[0]));
    } else {
        console.log('items table found but empty.');
    }
}

checkSchema();
