import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllPhaseQueriesFixed() {
    console.log("Supabase URL:", supabaseUrl);
    
    console.log("Testing FIXED world_states_history join locations query...");
    const q8 = await supabase
        .from('world_states_history')
        .select('*, location:locations!world_states_history_location_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(10);
        
    if (q8.error) {
        console.error("Q8 ERROR:", q8.error);
    } else {
        console.log("Q8 SUCCESS! Length:", q8.data?.length);
        if (q8.data && q8.data.length > 0) {
            console.log("Q8 snippet:", JSON.stringify(q8.data[0], null, 2));
        }
    }
}

testAllPhaseQueriesFixed();
