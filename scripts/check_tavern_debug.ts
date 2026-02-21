
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ShadowService } from '../src/services/shadowService';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("=== Debugging Tavern NPCs ===");

    // 1. Check a location (e.g., loc_regalia or user's location)
    // Fetch a user to get valid location
    const { data: user } = await supabase.from('user_profiles').select('*').limit(1).single();
    const locId = user?.current_location_id || 'loc_regalia';
    const userId = user?.id || 'dummy_user';

    console.log(`Checking Location: ${locId} for User: ${userId}`);

    // 2. Direct Query
    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, name, current_location_id, updated_at, is_alive')
        .eq('current_location_id', locId)
        .neq('id', userId)
        .eq('is_alive', true)
        .order('updated_at', { ascending: false });

    if (error) console.error("Direct Query Error:", error);
    console.log(`Direct Query Found: ${profiles?.length || 0} profiles.`);
    if (profiles && profiles.length > 0) {
        console.log("Top 5:", profiles.slice(0, 5));
    }

    // 3. Shadow Service
    const service = new ShadowService(supabase);
    const shadows = await service.findShadowsAtLocation(locId, userId);
    console.log(`ShadowService Found: ${shadows.length} shadows.`);
    shadows.forEach(s => console.log(`- [${s.origin_type}] ${s.name} (Lv.${s.level})`));

    // 4. Test Insert (to check FK constraints)
    console.log("=== Testing Insert ===");
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('user_profiles').insert({
        id: testId,
        name: '[DEBUG] Test NPC',
        current_location_id: locId,
        hp: 100,
        max_hp: 100,
        vitality: 100,
        max_vitality: 100,
        gold: 0,
        age: 20,
        gender: 'Male',
        updated_at: new Date().toISOString(),
        // level: 1 // Removing level to see if it defaults or if it's required (Schema might default)
        // types/game.ts says level is optional in interface but maybe not in DB?
    });

    if (insertError) {
        console.error("Insert Failed:", insertError.message);
    } else {
        console.log("Insert Success! (FK constraint is likely loose or using service role bypassed it?)");
        // Cleanup
        await supabase.from('user_profiles').delete().eq('id', testId);
    }
}

main().catch(console.error);
