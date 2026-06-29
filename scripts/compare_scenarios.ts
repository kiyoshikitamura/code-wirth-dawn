process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function run() {
    console.log('Comparing scenarios for Nikahaka (6cd6b349-b038-4215-9ac1-0427c0d784bd)...');
    
    // 1. Get directly from DB
    const { data: dbList } = await supabase
        .from('scenarios')
        .select('id, slug, title, quest_type')
        .in('quest_type', ['normal', 'special'])
        .not('slug', 'like', 'ugc_%')
        .limit(200);

    // 2. Get from Vercel API
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=6cd6b349-b038-4215-9ac1-0427c0d784bd&locationId=1';
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('--- Vercel API Debug Logs for Nikahaka:');
        console.log(data.debug);
        
        const apiIds = (data.quests || []).map((q: any) => `${q.id}: ${q.slug} (${q.title})`);
        console.log(`\n--- Vercel API Quests (${apiIds.length}):`);
        console.log(apiIds.sort());
        
        // 差分を検出
        const dbSet = new Set((dbList || []).map((q: any) => String(q.id)));
        const apiSet = new Set((data.quests || []).map((q: any) => String(q.id)));
        
        const missingInApi = (dbList || []).filter((q: any) => !apiSet.has(String(q.id))).map((q: any) => `${q.id}: ${q.slug} (${q.title})`);
        console.log('\n--- Missing in Vercel API response:', missingInApi);
    } catch (e) {
        console.error('Error fetching Vercel API:', e);
    }
}

run();
