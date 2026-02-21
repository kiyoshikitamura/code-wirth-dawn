
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Items Table Schema ---");
    // Directly fetching one row to see type is JS number or string
    const { data, error } = await supabase.from('items').select('id, name, type').limit(1);
    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        const item = data[0];
        console.log("Sample Item:", item);
        console.log("ID Type (JS):", typeof item.id);
    } else {
        console.log("Items table empty.");
    }

    // Also check PartyMembers id
    console.log("\n--- PartyMembers Table Schema ---");
    const { data: pm } = await supabase.from('party_members').select('id').limit(1);
    if (pm && pm.length > 0) {
        console.log("ID Type (JS):", typeof pm[0].id);
    }
}

run();
