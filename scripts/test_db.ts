import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
    const { data: rumors } = await supabase.from('rumors').select('*');
    console.log('rumors count:', rumors?.length);
    const { data: loreRumors } = await supabase.from('rumors').select('*').eq('category', 'lore');
    console.log('lore rumors count:', loreRumors?.length);
    const { data: scenarios } = await supabase.from('scenarios').select('id, title, quest_type, is_urgent, requirements').eq('quest_type', 'special').eq('is_urgent', true);
    console.log('special urgent scenarios:', JSON.stringify(scenarios, null, 2));
}
run();
