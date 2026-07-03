process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function run() {
    console.log('Fetching scenario 7060 raw data...');
    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 7060)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('ID:', data.id);
    console.log('Slug:', data.slug);
    console.log('Title:', data.title);
    console.log('Script Data Nodes:');
    console.log(JSON.stringify(data.script_data?.nodes, null, 2));
}

run();
