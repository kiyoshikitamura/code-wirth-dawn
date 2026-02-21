
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserLocation() {
    console.log("--- Checking User Location ---");
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, name, current_location_id, current_location_name')
        .limit(1);

    if (error) {
        console.error("Error fetching user:", error);
        return;
    }

    if (users && users.length > 0) {
        users.forEach(u => {
            console.log(`User: ${u.name}`);
            console.log(`Location ID: ${u.current_location_id}`);
            console.log(`Location Name: "${u.current_location_name}"`);
        });

        // Check if that location exists in locations table
        const locId = users[0].current_location_id;
        if (locId) {
            const { data: loc } = await supabase.from('locations').select('*').eq('id', locId).single();
            console.log("Location Record:", loc);
        }
    }
}

checkUserLocation();
