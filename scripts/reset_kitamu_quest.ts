process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function run() {
    const kitamuId = 'af2848d0-40f2-4f75-bd2b-ac633184107c';
    console.log(`Resetting active quest for Kitamu (${kitamuId}) in DB...`);

    const { data, error } = await supabase
        .from('user_profiles')
        .update({
            current_quest_id: null,
            current_quest_state: null
        })
        .eq('id', kitamuId)
        .select()
        .single();

    if (error) {
        console.error('Error resetting active quest:', error);
    } else {
        console.log('Successfully reset active quest state in DB:', data.current_quest_id, data.current_quest_state);
    }
}

run();
