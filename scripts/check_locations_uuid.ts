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
    
    console.log("Fetching locations from dev DB to get UUIDs...");
    const { data, error } = await client
        .from('locations')
        .select('id, name, slug');
        
    if (error) {
        console.error('Error fetching locations:', error);
        return;
    }
    
    console.log('Locations found:', data);
}

run();
