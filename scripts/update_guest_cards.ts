
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedGuestCards() {
    console.log("--- Seeding Guest Cards ---");

    // Update Guest Alchemist to have cards
    // Assuming card IDs 1001 (Attack), 1002 (Magic?), etc exist.
    // Let's check cards table or just assume standard IDs.
    // 1001: Slash, 1004: Defend.
    // Let's give her a special card or standard ones.

    const { error } = await supabase.from('npcs').upsert({
        slug: 'npc_test_alchemist',
        name: 'Alchemist Riza',
        job_class: 'Alchemist',
        introduction: 'Test guest character.',
        is_hireable: false,
        default_cards: ['1001', '1004', '1004'] // 1 Attack, 2 Defend
    }, { onConflict: 'slug' });

    if (error) console.error("Error updating guest cards:", error);
    else console.log("Guest cards updated.");
}

seedGuestCards();
