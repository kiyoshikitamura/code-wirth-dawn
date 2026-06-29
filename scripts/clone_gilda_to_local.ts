process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const dbSource = "https://zvoroixjuypnintkpmux.supabase.co"; // Dashboard DB (本番)
const dbDest = "https://drbqnpzxgcbicpritcpi.supabase.co"; // Local/Preview DB

const keySource = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';
const keyDest = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function run() {
    if (!keySource || !keyDest) {
        console.error('Keys are missing!');
        return;
    }
    const clientSource = createClient(dbSource, keySource);
    const clientDest = createClient(dbDest, keyDest);
    
    const gildaId = "f94db6e2-ca9b-4e1b-90f7-ebf996c56782";
    
    console.log(`Fetching Gilda's party members from source DB...`);
    const { data: partyMembers, error: getErr } = await clientSource
        .from('party_members')
        .select('*')
        .eq('user_id', gildaId);
        
    if (getErr) {
        console.error('Error fetching party members:', getErr);
        return;
    }
    
    console.log(`Fetched ${partyMembers?.length || 0} party members. Upserting to destination DB...`);
    
    if (partyMembers && partyMembers.length > 0) {
        const { error: upsertErr } = await clientDest
            .from('party_members')
            .upsert(partyMembers);
            
        if (upsertErr) {
            console.error('Error upserting party members:', upsertErr);
            return;
        }
        console.log('Party members cloned successfully!');
    } else {
        console.log('No party members found.');
    }
}

run();
