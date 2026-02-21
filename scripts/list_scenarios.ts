
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listScenarios() {
    const { data } = await supabase.from('scenarios').select('id, slug, title');
    console.table(data);
}
listScenarios();
