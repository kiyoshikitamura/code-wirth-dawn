
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NAMES = ['Aldric', 'Bolin', 'Cedric', 'Dara', 'Elara', 'Faelan', 'Garrick', 'Hilda', 'Isolde', 'Jareth', 'Kael', 'Lysandra', 'Marek', 'Nia', 'Orin', 'Phaedra', 'Quinn', 'Rohan', 'Seraphina', 'Thorne', 'Ulric', 'Vesper', 'Willow', 'Xander', 'Yara', 'Zephyr'];
const JOBS = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Bard', 'Monk'];

async function main() {
    console.log("=== Seeding Tavern NPCs (Dummy Shadows) ===");

    // 1. Fetch Locations
    const { data: locations } = await supabase.from('locations').select('id');
    if (!locations || locations.length === 0) {
        console.error("No locations found. Run seed_topology.ts first.");
        return;
    }

    console.log(`Found ${locations.length} locations.`);

    for (const loc of locations) {
        // Cleanup existing NPCs
        const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('current_location_id', loc.id)
            .ilike('name', '[NPC]%');

        if (deleteError) console.error(`Error cleaning up NPCs for ${loc.id}:`, deleteError.message);

        // Generate 4 NPCs per location
        const npcs = [];
        for (let i = 0; i < 4; i++) {
            const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + NAMES[Math.floor(Math.random() * NAMES.length)];
            const job = JOBS[Math.floor(Math.random() * JOBS.length)];
            const level = Math.floor(Math.random() * 5) + 1; // Lv 1-5

            npcs.push({
                id: crypto.randomUUID(),
                name: `[NPC] ${name}`,
                title_name: job, // Use title_name as Job Class
                level: level,
                max_hp: 100 + (level * 10),
                hp: 100 + (level * 10),
                current_location_id: loc.id,
                attack: 10 + (level * 2),
                def: 5 + level,
                is_alive: true,
                updated_at: new Date().toISOString()
            });
        }

        // Upsert
        const { error } = await supabase.from('user_profiles').insert(npcs);
        if (error) console.error(`Error seeding NPCs for ${loc.id}:`, error.message);
        else console.log(`Seeded 4 NPCs for ${loc.id}`);
    }

    console.log("=== Seeding Complete ===");
}

main().catch(console.error);
