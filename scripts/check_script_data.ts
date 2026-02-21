
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScriptData() {
    console.log('Checking script_data for test_quest_001...');
    const { data, error } = await supabase
        .from('scenarios')
        .select('id, title, script_data')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found Quest:', data.title);
        console.log('Script Data Type:', typeof data.script_data);
        console.log('Script Data Content:', JSON.stringify(data.script_data, null, 2));
    }
}

checkScriptData();
