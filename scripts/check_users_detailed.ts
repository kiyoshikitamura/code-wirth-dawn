process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zvoroixjuypnintkpmux.supabase.co";
const supabaseKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
        
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Recent Users (detailed):');
        users.forEach((u: any) => {
            console.log(`ID: ${u.id}, Name: ${u.name}, Level: ${u.level}, QuestID: ${u.current_quest_id}, Updated: ${u.updated_at}`);
        });
    }
}

check();
