
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("=== Verifying Defense (DEF) Implementation ===");

    // 1. Check Schema (implied by querying)
    console.log("\n1. Checking 'def' column in user_profiles...");
    const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, def')
        .limit(1);

    if (userError) {
        console.error("❌ Error querying user_profiles:", userError.message);
    } else {
        console.log("✅ Query successful. Row sample:", userData);
    }

    // 2. Check NPCs
    console.log("\n2. Checking NPCs (party_members) seeded data...");
    // Check specific NPCs: Guts (Tank, should be 3), Elena (Cleric, should be 0), Knight Veteran (Should be 5)
    const { data: npcs, error: npcError } = await supabase
        .from('party_members')
        .select('name, job_class, def')
        .in('slug', ['npc_guts', 'npc_elena', 'npc_knight_veteran']);

    if (npcError) {
        console.error("❌ Error querying party_members:", npcError.message);
    } else {
        console.log("Found NPCs:", npcs);
        const guts = npcs?.find(n => n.name.includes('傭兵'));
        const elena = npcs?.find(n => n.name.includes('エレナ'));
        const knight = npcs?.find(n => n.name.includes('騎士'));

        if (guts && guts.def === 3) console.log("✅ Guts DEF is 3 (Correct)");
        else console.warn("⚠️ Guts DEF mismatch:", guts);

        if (elena && elena.def === 0) console.log("✅ Elena DEF is 0 (Correct)");
        else console.warn("⚠️ Elena DEF mismatch:", elena);

        if (knight && knight.def === 5) console.log("✅ Knight DEF is 5 (Correct)");
        else console.warn("⚠️ Knight DEF mismatch:", knight);
    }

    // 3. Check Enemies
    console.log("\n3. Checking Enemies...");
    const { data: enemies, error: enemyError } = await supabase
        .from('enemies')
        .select('name, def')
        .in('slug', ['goblin', 'succubus']);

    if (enemyError) {
        console.error("❌ Error querying enemies:", enemyError.message);
    } else {
        console.log("Found Enemies:", enemies);
        const goblin = enemies?.find(e => e.name === 'ゴブリン'); // Should be 1
        const succubus = enemies?.find(e => e.name === 'サキュバス'); // Should be 2

        if (goblin && goblin.def === 1) console.log("✅ Goblin DEF is 1 (Correct)");
        else console.warn("⚠️ Goblin DEF mismatch:", goblin);

        if (succubus && succubus.def === 2) console.log("✅ Succubus DEF is 2 (Correct)");
        else console.warn("⚠️ Succubus DEF mismatch:", succubus);
    }
}

verify();
