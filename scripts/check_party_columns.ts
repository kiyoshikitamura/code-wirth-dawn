process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const dbDest = "https://drbqnpzxgcbicpritcpi.supabase.co"; // Local/Preview DB
const keyDest = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function run() {
    if (!keyDest) {
        console.error('Dest Service Key is missing!');
        return;
    }
    const client = createClient(dbDest, keyDest);
    
    console.log("Fetching one row from party_members on dev DB to inspect columns...");
    const { data, error } = await client
        .from('party_members')
        .select('*')
        .limit(1);
        
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Columns found in party_members on dev DB:', data ? Object.keys(data[0] || {}) : 'no data');
}

run();
