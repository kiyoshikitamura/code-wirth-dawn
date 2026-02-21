
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecific() {
    console.log('Checking for test_quest_001...');
    const { data, error } = await supabase
        .from('scenarios')
        .select('id, title, quest_type')
        .eq('id', 'test_quest_001');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Result:', data);
    }
}

checkSpecific();
