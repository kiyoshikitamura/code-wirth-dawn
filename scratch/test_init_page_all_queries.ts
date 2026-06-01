import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllQueries() {
    console.log("Supabase URL:", supabaseUrl);
    
    const { data: profiles, error: pErr } = await supabase.from('user_profiles').select('id').limit(1);
    if (pErr || !profiles || profiles.length === 0) {
        console.error("Failed to fetch test user profile id:", pErr);
        return;
    }
    const testUserId = profiles[0].id;
    console.log("Testing with User ID:", testUserId);

    // Query: inventory join items with is_equipped=true
    console.log("\n--- Testing inventory with items(effect_data) ---");
    const qInv = await supabase
        .from('inventory')
        .select('item:items(effect_data)')
        .eq('user_id', testUserId)
        .eq('is_equipped', true);
        
    if (qInv.error) {
        console.error("QInv ERROR:", qInv.error);
    } else {
        console.log("QInv SUCCESS! Data length:", qInv.data?.length);
        if (qInv.data && qInv.data.length > 0) {
            console.log("QInv snippet:", JSON.stringify(qInv.data, null, 2));
        }
    }
}

testAllQueries();
