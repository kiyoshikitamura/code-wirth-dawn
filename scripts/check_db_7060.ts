import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.DASHBOARD_SUPABASE_URL || '';
const supabaseKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('scenarios')
        .select('id, slug, title, is_repeatable')
        .eq('id', 7060)
        .single();
        
    if (error) {
        console.error('Error fetching scenario 7060:', error);
    } else {
        console.log('DASHBOARD DB Scenario 7060 data:', data);
    }
}

check();
