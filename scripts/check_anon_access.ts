process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// アノンキーを使用！
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
    console.log(`Checking DB via ANON KEY (${supabaseUrl})...`);
    
    // 7060 を個別に取得してみる
    const { data: q7060, error: err7060 } = await supabase
        .from('scenarios')
        .select('id, slug, title, is_repeatable')
        .eq('id', 7060)
        .maybeSingle();
        
    if (err7060) {
        console.error('Error fetching 7060 via ANON:', err7060);
    } else {
        console.log('Scenario 7060 via ANON:', q7060);
    }
    
    // アノンキーで全件数を取得
    const { data: list, error: errList } = await supabase
        .from('scenarios')
        .select('id, slug, title, quest_type')
        .in('quest_type', ['normal', 'special'])
        .not('slug', 'like', 'ugc_%')
        .limit(200);
        
    if (errList) {
        console.error('Error listing via ANON:', errList);
    } else {
        console.log('Total scenarios via ANON:', list?.length);
        const has7060 = list?.some((q: any) => q.id === 7060);
        console.log('Is 7060 in ANON list?', has7060);
    }
}

run();
