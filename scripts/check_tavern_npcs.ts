
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTavern() {
    console.log("Checking Tavern NPCs...");

    // Get Hub Location ID
    const { data: hub, error: hubError } = await supabase.from('locations').select('id, name').eq('name', '名もなき旅人の拠所').single();
    if (hubError) {
        console.error("Hub not found:", hubError);
        return;
    }
    console.log("Hub Location:", hub);

    // Check NPCs in this location
    const { data: npcs, error: npcError } = await supabase
        .from('npcs')
        .select('*')
        .eq('status', 'Available');
    // Note: Logic might be different in actual API. Checking raw first.

    console.log("Available NPCs Count:", npcs?.length);
    if (npcs && npcs.length > 0) {
        console.log("First 3 NPCs:", npcs.slice(0, 3));
    }

    // Check specific "Nameless" ones if any
    const { data: nameless } = await supabase.from('npcs').select('*').like('name', '%名もなき%');
    console.log("Nameless NPCs:", nameless);
}

checkTavern();
