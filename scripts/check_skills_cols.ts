import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
    const { data, error } = await s.from('skills').select('*').limit(1);
    if (error) { console.error('Error:', error.message); return; }
    if (data && data.length > 0) {
        console.log('skills columns:', Object.keys(data[0]));
    } else {
        console.log('No skills data found');
    }
}
main();
