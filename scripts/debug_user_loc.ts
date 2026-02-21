
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserLocation() {
    let output = "--- Checking User Location ---\n";
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*, status, travel_start_time, destination_id')
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .limit(1);

    if (error) {
        output += `Error fetching user: ${error.message}\n`;
    } else if (users && users.length > 0) {
        const u = users[0];
        output += `User Object: ${JSON.stringify(u, null, 2)}\n`;

        if (u.current_location_id) {
            const { data: loc } = await supabase.from('locations').select('*').eq('id', u.current_location_id).single();
            if (loc) {
                output += `Location DB Record:\n`;
                output += `  ID: ${loc.id}\n`;
                output += `  Name: ${loc.name}\n`;
                output += `  Slug: ${loc.slug}\n`;
                output += `  X: ${loc.map_x}\n`;
                output += `  Y: ${loc.map_y}\n`;
            } else {
                output += "Location DB Record: NOT FOUND\n";
            }
        }
    } else {
        output += "No users found.\n";
    }

    fs.writeFileSync('debug_output.txt', output);
    console.log("Done writing to debug_output.txt");
}

checkUserLocation();
