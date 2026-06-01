import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("Supabase URL:", supabaseUrl);

    // テスト用の適当なユーザーIDを取得
    const { data: profiles, error: pErr } = await supabase.from('user_profiles').select('id').limit(1);
    if (pErr || !profiles || profiles.length === 0) {
        console.error("Failed to fetch test user profile id:", pErr);
        return;
    }
    const testUserId = profiles[0].id;
    console.log("Testing with User ID:", testUserId);

    console.log("\n--- Test 1: Original query in api/profile/route.ts ---");
    const q1 = await supabase
        .from('user_profiles')
        .select('*, locations:locations!fk_current_location(*), reputations(*)')
        .eq('id', testUserId)
        .maybeSingle();

    if (q1.error) {
        console.error("Q1 ERROR:", q1.error);
    } else {
        console.log("Q1 SUCCESS!");
        console.log("Q1 keys:", Object.keys(q1.data || {}));
    }

    console.log("\n--- Test 2: Query in api/profile/route.ts WITHOUT reputations ---");
    const q2 = await supabase
        .from('user_profiles')
        .select('*, locations:locations!fk_current_location(*)')
        .eq('id', testUserId)
        .maybeSingle();

    if (q2.error) {
        console.error("Q2 ERROR:", q2.error);
    } else {
        console.log("Q2 SUCCESS!");
        console.log("Q2 keys:", Object.keys(q2.data || {}));
    }

    console.log("\n--- Test 3: init-page queries ---");
    const q3 = await supabase
        .from('user_profiles')
        .select('*, locations:locations!fk_current_location(name, slug, type, ruling_nation_id)')
        .eq('id', testUserId)
        .single();

    if (q3.error) {
        console.error("Q3 ERROR:", q3.error);
    } else {
        console.log("Q3 SUCCESS!");
    }
}

runTests().catch(console.error);
