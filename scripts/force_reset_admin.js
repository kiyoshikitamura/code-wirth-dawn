
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase Config");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function forceReset() {
    console.log("Starting FORCE RESET with Admin Key...");

    // 1. Reset World State
    const defaultState = {
        order_score: 10,
        chaos_score: 10,
        justice_score: 10,
        evil_score: 10,
        status: '繁栄',
        attribute_name: '至高の平穏',
        flavor_text: '秩序と正義が保たれ、人々は安らかに暮らしている。',
        background_url: '/backgrounds/peace.jpg'
    };

    const { error: worldError } = await supabase
        .from('world_states')
        .update(defaultState)
        .eq('location_name', '名もなき旅人の拠所');

    if (worldError) console.error("World Error:", worldError);
    else console.log("World State: Reset");

    // 2. Delete All Inventory
    const { error: invError } = await supabase
        .from('inventory')
        .delete()
        .not('id', 'is', null);

    if (invError) console.error("Inventory Error:", invError);
    else console.log("Inventory: Cleared");

    // 3. Reset NPCs (Disband)
    const { error: npcError } = await supabase
        .from('npcs')
        .update({ hired_by_user_id: null })
        .not('hired_by_user_id', 'is', null);

    if (npcError) console.error("NPC Error:", npcError);
    else console.log("NPCs: Disbanded");

    // 4. Get/Create Hub ID
    let startLocId = '00000000-0000-0000-0000-000000000000';
    const { data: loc } = await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').maybeSingle();
    if (loc) startLocId = loc.id;
    else {
        // Create if missing
        const { data: newLoc } = await supabase.from('locations').insert([{
            name: '名もなき旅人の拠所', type: 'Hub', description: 'Hub', x: 500, y: 500, nation_id: 'Neutral', connections: []
        }]).select('id').single();
        if (newLoc) startLocId = newLoc.id;
    }

    // 5. Reset All Profiles
    const { count, error: profileError } = await supabase
        .from('user_profiles')
        .update({
            order_pts: 0,
            chaos_pts: 0,
            justice_pts: 0,
            evil_pts: 0,
            gold: 1000, // Reset Gold explicitly
            title_name: '名もなき旅人',
            avatar_url: '/avatars/adventurer.jpg',
            current_location_id: startLocId,
            previous_location_id: null,
            age: 20,
            accumulated_days: 0,
            vitality: 100,
            mp: 100
        })
        .not('id', 'is', null) // Safety check
        .select('*', { count: 'exact' });

    if (profileError) console.error("Profile Error:", profileError);
    else console.log(`Profiles: Reset ${count} users.`);
}

forceReset();
