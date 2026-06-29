process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const db1 = "https://drbqnpzxgcbicpritcpi.supabase.co";
const db2 = "https://zvoroixjuypnintkpmux.supabase.co";
const key1 = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const key2 = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';

const targetIds = [6112, 7050, 7051];

async function deleteFromDb(url: string, key: string, dbName: string) {
    if (!key) return;
    const supabase = createClient(url, key);
    
    console.log(`Deleting old quests ${targetIds} from ${dbName}...`);
    const { error } = await supabase
        .from('scenarios')
        .delete()
        .in('id', targetIds);
        
    if (error) {
        console.error(`Error deleting from ${dbName}:`, error);
    } else {
        console.log(`Successfully deleted from ${dbName}.`);
    }
}

async function run() {
    // 1. Delete from both DBs
    await deleteFromDb(db1, key1, 'Local/Vercel-default DB');
    await deleteFromDb(db2, key2, 'Dashboard DB');
    
    // 2. Delete local legacy file if exists
    const legacyFile = path.join(process.cwd(), 'src', 'data', 'csv', 'scenarios', '7050_qst_demon_explore.csv');
    if (fs.existsSync(legacyFile)) {
        console.log('Deleting legacy file:', legacyFile);
        fs.unlinkSync(legacyFile);
    }
}

run();
