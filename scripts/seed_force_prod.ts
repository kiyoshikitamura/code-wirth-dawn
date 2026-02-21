
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Explicitly load .env.local
dotenv.config({ path: '.env.local' });

console.log("Connecting to:", process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedForce() {
    console.log("--- FORCE SEEDING PRODUCTION ---");
    // ... items ...

    // 3. Create Enemy Groups & Get IDs
    const groups = [
        { id: 101, slug: 'group_wolf_pack', name: 'Wolf Pack', members: ['wolf_shadow', 'wolf_shadow'], formation: 'front_row' },
        { id: 102, slug: 'group_poison_slimes', name: 'Poison Slimes', members: ['slime_poison', 'slime_poison', 'slime_poison'], formation: 'surround' },
        { id: 103, slug: 'group_reaper_boss', name: 'Reaper Boss', members: ['reaper', 'wolf_shadow'], formation: 'boss' }
    ];

    const groupMap: Record<string, string> = {};

    for (const g of groups) {
        console.log(`Upserting ${g.slug}...`);
        const { data, error } = await supabase.from('enemy_groups').upsert(g, { onConflict: 'slug' }).select().single();

        console.log("Result:", data ? "Data OK" : "No Data", "Error:", error ? error.message : "No Error");

        if (error) console.error("Group Upsert Error Full:", JSON.stringify(error, null, 2));

        if (data) {
            console.log(`Created/Updated Group ${g.name}: ${data.id}`);
            if (g.slug === 'group_wolf_pack') groupMap['group_test_wolf'] = data.id;
            if (g.slug === 'group_poison_slimes') groupMap['group_test_poison'] = data.id;
            if (g.slug === 'group_reaper_boss') groupMap['group_reaper_boss'] = data.id;
        }
    }

    // 4. Update Quest Script (Scenario 1)
    // Construct the script object manually to ensure it's correct
    const scriptData = {
        nodes: {
            start: {
                id: "start",
                text: "王都への旅が始まる。まずは護衛対象と合流しよう。",
                type: "dialogue",
                bg_key: "town_bg",
                next: "join_phase"
            },
            join_phase: {
                id: "join_phase",
                text: "...",
                type: "guest_join",
                params: { guest_id: "npc_test_alchemist" },
                next: "travel_01"
            },
            travel_01: {
                id: "travel_01",
                text: "街道を進む...",
                type: "travel",
                params: { dest: "巡礼の宿場町", days: 3 },
                bg_key: "road_bg",
                next: "battle_encount"
            },
            battle_encount: {
                id: "battle_encount",
                text: "影から狼が現れた！",
                type: "battle",
                enemy_group_id: groupMap['group_test_wolf'] || 101, // Use mapped ID or fallback
                bg_key: "forest_bg",
                next: "battle_win"
            },
            battle_win: {
                id: "battle_win",
                text: "狼を撃退した。先を急ごう。",
                type: "dialogue",
                next: "travel_02"
            },
            travel_02: {
                id: "travel_02",
                text: "王都が見えてきた...",
                type: "travel",
                params: { dest: "王都アーカディア", days: 2 },
                bg_key: "capital_gate_bg",
                next: "end_success"
            },
            end_success: {
                id: "end_success",
                type: "end",
                result: "success",
                text: "王都に到着し、依頼を達成した。"
            }
        }
    };

    const { error: questError } = await supabase
        .from('scenarios')
        .update({ script_data: scriptData })
        .eq('id', 1);

    if (questError) console.error("Quest Update Error:", questError);
    else console.log("Quest 1 Updated with valid script.");

    console.log("Force Seed Complete.");
}

seedForce();
