import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllPhaseQueries() {
    console.log("Supabase URL:", supabaseUrl);
    
    const { data: profiles, error: pErr } = await supabase.from('user_profiles').select('id').limit(1);
    if (pErr || !profiles || profiles.length === 0) {
        console.error("Failed to fetch test user profile id:", pErr);
        return;
    }
    const testUserId = profiles[0].id;
    console.log("Testing with User ID:", testUserId);

    // --- Phase 1 Queries ---
    console.log("\n====== Phase 1 ======");

    console.log("Q1: user_profiles join locations...");
    const q1 = await supabase
        .from('user_profiles')
        .select('*, locations:locations!fk_current_location(name, slug, region, type, ruling_nation_id)')
        .eq('id', testUserId)
        .single();
    console.log("Q1 Result:", q1.error ? `ERROR: ${q1.error.message}` : "SUCCESS");

    console.log("Q2: inventory is_equipped...");
    const q2 = await supabase
        .from('inventory')
        .select('item:items(effect_data)')
        .eq('user_id', testUserId)
        .eq('is_equipped', true);
    console.log("Q2 Result:", q2.error ? `ERROR: ${q2.error.message}` : `SUCCESS (length ${q2.data?.length})`);

    console.log("Q3: user_hub_states...");
    const q3 = await supabase
        .from('user_hub_states')
        .select('*')
        .eq('user_id', testUserId)
        .maybeSingle();
    console.log("Q3 Result:", q3.error ? `ERROR: ${q3.error.message}` : "SUCCESS");

    const profile = q1.data;
    const hubState = q3.data;
    let targetLocationName = '国境の町';
    if (hubState?.is_in_hub) {
        targetLocationName = '名もなき旅人の拠所';
    } else if (profile?.locations?.name) {
        targetLocationName = profile.locations.name;
    }
    console.log("Target Location Name for Phase 2:", targetLocationName);

    // --- Phase 2 Queries ---
    console.log("\n====== Phase 2 ======");

    console.log("Q4: world_states (single)...");
    const q4 = await supabase
        .from('world_states')
        .select('*')
        .eq('location_name', targetLocationName)
        .maybeSingle();
    console.log("Q4 Result:", q4.error ? `ERROR: ${q4.error.message}` : "SUCCESS");

    console.log("Q5: world_states (all controlling_nation)...");
    const q5 = await supabase
        .from('world_states')
        .select('controlling_nation');
    console.log("Q5 Result:", q5.error ? `ERROR: ${q5.error.message}` : `SUCCESS (length ${q5.data?.length})`);

    console.log("Q6: reputations...");
    const q6 = await supabase
        .from('reputations')
        .select('*')
        .eq('user_id', testUserId)
        .eq('location_name', targetLocationName)
        .maybeSingle();
    console.log("Q6 Result:", q6.error ? `ERROR: ${q6.error.message}` : "SUCCESS");

    console.log("Q7: user_world_views...");
    const q7 = await supabase
        .from('user_world_views')
        .select('last_seen_history_id')
        .eq('user_id', testUserId)
        .maybeSingle();
    console.log("Q7 Result:", q7.error ? `ERROR: ${q7.error.message}` : "SUCCESS");

    console.log("Q8: world_states_history join locations...");
    const q8 = await supabase
        .from('world_states_history')
        .select('*, location:locations(name)')
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

testAllPhaseQueries();
