process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log(`Checking default DB (${supabaseUrl})...`);
    
    // 7060 を個別に取得
    const { data: q7060, error: err7060 } = await supabase
        .from('scenarios')
        .select('id, slug, title, is_repeatable')
        .eq('id', 7060)
        .maybeSingle();
        
    if (err7060) {
        console.error('Error fetching scenario 7060:', err7060);
    } else {
        console.log('Scenario 7060 data:', q7060);
    }
    
    // 全件数
    const { count, error: errCount } = await supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true });
        
    if (errCount) {
        console.error('Error counting scenarios:', errCount);
    } else {
        console.log('Total scenarios count:', count);
    }
}

check();
