process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const db1 = "https://drbqnpzxgcbicpritcpi.supabase.co";
const db2 = "https://zvoroixjuypnintkpmux.supabase.co";
const key1 = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const key2 = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';

async function findInDb(url: string, key: string, name: string) {
    if (!key) return;
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('scenarios').select('id, slug, title, quest_type');
    if (error) {
        console.error(`Error fetching from ${name}:`, error);
        return;
    }
    const matches = data.filter((q: any) => q.title?.includes('予兆') || q.title?.includes('狭間') || q.slug?.includes('yochou') || q.slug?.includes('premonition'));
    console.log(`Matches in ${name} (${url}):`, matches);
}

async function run() {
    await findInDb(db1, key1, 'Local/Vercel-default DB');
    await findInDb(db2, key2, 'Dashboard DB');
}

run();
