import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zvoroixjuypnintkpmux.supabase.co";
const supabaseKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, level, current_location_id')
        .limit(10);
        
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Recent Users:', users);
    }
}

check();
