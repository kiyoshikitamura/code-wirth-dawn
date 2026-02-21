
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking scenarios schema columns...');

    // Check if we can select 'reward_gold'
    const { error: e1 } = await supabase.from('scenarios').select('reward_gold').limit(1);
    if (e1) console.log('reward_gold error:', e1.message);
    else console.log('reward_gold exists');

    // Check if we can select 'impacts'
    const { error: e2 } = await supabase.from('scenarios').select('impacts').limit(1);
    if (e2) console.log('impacts error:', e2.message);
    else console.log('impacts exists');

    // Check 'rewards' and 'impact'
    const { data } = await supabase.from('scenarios').select('rewards, impact').limit(1);
    if (data && data.length > 0) console.log('rewards/impact data sample:', data[0]);

}

checkSchema();
