
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log("--- Seeding Fix Data ---");

    // 1. Insert/Update Enemies
    const enemies = [
        {
            slug: 'wolf_shadow',
            name: 'Shadow Wolf',
            hp: 60,
            maxHp: 60,
            def: 2,
            level: 3,
            exp: 15,
            vit_damage: 1, // Fix Vit Attack
            traits: ['beast', 'agile'],
            image: '/assets/enemies/wolf.png'
        },
        {
            slug: 'slime_poison',
            name: 'Poison Slime',
            hp: 40,
            maxHp: 40,
            def: 5,
            level: 2,
            exp: 10,
            vit_damage: 1,
            traits: ['slime', 'poison', 'drain_vit'], // Explicit trait
            image: '/assets/enemies/slime.png'
        },
        {
            slug: 'reaper',
            name: 'Grim Reaper',
            hp: 150,
            maxHp: 150,
            def: 10,
            level: 10,
            exp: 100,
            vit_damage: 5,
            traits: ['undead', 'drain_vit'],
            image: '/assets/enemies/reaper.png'
        }
    ];

    for (const e of enemies) {
        const { error } = await supabase.from('enemies').upsert(e, { onConflict: 'slug' });
        if (error) console.error(`Error upserting ${e.slug}:`, error);
        else console.log(`Upserted ${e.slug}`);
    }

    // 2. Insert/Update Enemy Groups
    // Note: ID must match what is in the Quest Script JSON
    // The script uses "group_test_poison" and "group_test_reaper".
    // We can't easily force string IDs if column is int, but let's check schema/types or just upsert by slug/name if possible.
    // Assuming table has `id` (text or int). If int, we need to map names in JSON to IDs, OR update JSON to use these IDs.
    // Let's assume we can map slugs.

    // Check if enemy_groups has slug?
    // Based on previous debug, it has `id` (likely int) and `members` (array). The "Group 1 (undefined)" suggests `name` or `slug` col might be missing in my log or fetch.

    // Strategy: Create groups with specific IDs if possible, or create and get IDs to update Quest.
    // Actually, `startBattle` in frontend uses `supabase.from('enemy_groups').select('*').eq('id', groupId)`
    // If JSON says `enemy_group_id: "group_test_posion"`, and DB `id` is integer, this fails.
    // We should update the Quest Script to use the REAL IDs.

    // Let's make groups first.
    const groupsToCreate = [
        {
            name: 'Wolf Pack',
            members: ['wolf_shadow', 'wolf_shadow'], // slugs
            formation: 'front_row'
        },
        {
            name: 'Poison Slimes',
            members: ['slime_poison', 'slime_poison', 'slime_poison'],
            formation: 'surround'
        },
        {
            name: 'Reaper Boss',
            members: ['reaper', 'wolf_shadow'],
            formation: 'boss'
        }
    ];

    const createdGroupIds: Record<string, string> = {};

    for (const g of groupsToCreate) {
        // Upsert by name? name might not be unique constraint.
        // Let's just insert and get ID.
        // Clean up old ones with same name first to avoid duplicates?
        await supabase.from('enemy_groups').delete().eq('name', g.name);

        const { data, error } = await supabase.from('enemy_groups').insert(g).select('id').single();
        if (error) {
            console.error(`Error creating group ${g.name}:`, error);
        } else if (data) {
            console.log(`Created group ${g.name} with ID: ${data.id}`);
            if (g.name === 'Wolf Pack') createdGroupIds['group_test_wolf'] = data.id;
            if (g.name === 'Poison Slimes') createdGroupIds['group_test_poison'] = data.id;
            if (g.name === 'Reaper Boss') createdGroupIds['group_test_reaper'] = data.id;
        }
    }

    // 3. Update Quest Script (Scenario 1)
    // We need to fetch the JSON, parse it, replace the group IDs, and update DB.

    const { data: quest } = await supabase.from('scenarios').select('script_data').eq('id', 1).single();
    if (quest && typeof quest.script_data === 'object' && quest.script_data !== null) {
        let scriptStr = JSON.stringify(quest.script_data);

        // Simple string replacement for invalid IDs to new numeric IDs
        // "enemy_group_id": "group_test_poison" -> "enemy_group_id": 123

        for (const [key, val] of Object.entries(createdGroupIds)) {
            // Regex to replace value associated with key "enemy_group_id" or "enemy"
            // But simpler: the text in the JSON is literally "group_test_poison"
            scriptStr = scriptStr.replace(new RegExp(key, 'g'), val);
        }

        // Also check if guest ID exists. `npc_test_alchemist`
        // Let's upsert that NPC too.
        await supabase.from('npcs').upsert({
            slug: 'npc_test_alchemist',
            name: 'Alchemist Riza',
            job_class: 'Alchemist',
            introduction: 'Test guest character.',
            is_hireable: false
        }, { onConflict: 'slug' });

        const { error: updateError } = await supabase
            .from('scenarios')
            .update({ script_data: JSON.parse(scriptStr) }) // Save back as JSON
            .eq('id', 1);

        if (updateError) console.error("Quest Update Error:", updateError);
        else console.log("Quest Script Updated with real IDs");

    } else {
        console.error("Could not fetch quest script for update.");
    }

    console.log("Seeding Complete.");
}

seedData();
