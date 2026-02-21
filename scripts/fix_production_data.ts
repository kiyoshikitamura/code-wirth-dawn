
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
    console.log("Fixing Production Data...");

    // 0. Get a valid location ID
    const { data: loc } = await supabase.from('locations').select('id').limit(1).single();
    const locationId = loc?.id;

    if (!locationId) {
        console.error("No locations found! Cannot insert NPC.");
        return;
    }

    // Helper for UUID
    const { randomUUID } = require('crypto');

    // 1. Insert/Update 'wolf_shadow' Enemy
    const shadowWolf = {
        id: 10, // Use numeric ID
        slug: 'wolf_shadow',
        name: 'Shadow Wolf',
        hp: 120,
        max_hp: 120,
        def: 5,
        exp: 20,
        gold: 15,
        // image removed
        traits: ['beast', 'dark']
    };

    console.log("Upserting Enemy: wolf_shadow...");
    // Check if exists first to keep ID if updating
    const { data: existingEnemy } = await supabase.from('enemies').select('id').eq('slug', 'wolf_shadow').maybeSingle();
    if (existingEnemy) {
        shadowWolf.id = existingEnemy.id;
    }

    const { error: eErr } = await supabase.from('enemies').upsert(shadowWolf, { onConflict: 'slug' });
    if (eErr) console.error("Enemy Upsert Error:", eErr.message);
    else console.log("Enemy 'wolf_shadow' upserted.");

    // 2. Insert/Update 'liza' NPC
    const liza = {
        id: randomUUID(),
        slug: 'liza',
        name: 'Liza',
        job_class: 'Paladin',
        introduction: '私の盾で、あなたを守ります。',
        current_location_id: locationId, // Use valid UUID
        // image removed
        default_cards: ['c1', 'c4'], // Slash, Defend
        gender: 'Female',
        durability: 3,
        max_durability: 3,
        loyalty: 100,
        cover_rate: 50,
        is_hireable: true
    };

    console.log("Upserting NPC: liza...");
    const { data: existingNpc } = await supabase.from('npcs').select('id').eq('slug', 'liza').maybeSingle();
    if (existingNpc) {
        liza.id = existingNpc.id;
    }

    const { error: nErr } = await supabase.from('npcs').upsert(liza, { onConflict: 'slug' });
    if (nErr) console.error("NPC Upsert Error:", nErr.message);
    else console.log("NPC 'liza' upserted.");

    // 3. Verify Group 101 Members match
    console.log("Verifying Group 101...");
    const { data: group } = await supabase.from('enemy_groups').select('*').eq('id', 101).single();
    if (group) {
        if (JSON.stringify(group.members) !== JSON.stringify(['wolf_shadow', 'wolf_shadow'])) {
            console.log("Updating Group 101 members...");
            await supabase.from('enemy_groups').update({ members: ['wolf_shadow', 'wolf_shadow'] }).eq('id', 101);
        } else {
            console.log("Group 101 members already correct.");
        }
    } else {
        console.error("Group 101 not found! Creating...");
        await supabase.from('enemy_groups').insert({
            id: 101,
            slug: 'wolf_pack',
            name: 'Shadow Wolf Pack',
            members: ['wolf_shadow', 'wolf_shadow'],
            is_boss: false
        });
    }

    console.log("Fix Complete.");
}

fix();
