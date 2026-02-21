
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testMinimal() {
    console.log("Testing minimal insert...");
    // Try inserting just slug and name. Assuming other fields are nullable or have defaults?
    // Based on scripts/fix_map_locations.ts, I provided many fields.
    // Let's check which are NOT NULL.
    // slug, name, type, nation_id?
    // In migration 20260219...sql: 
    // CREATE TABLE locations (
    //   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    //   slug text NOT NULL UNIQUE,
    //   name text NOT NULL,
    //   type text NOT NULL,
    //   nation_id text REFERENCES nations(id),
    //   ...
    // );

    // So slug, name, type are required.

    const payload = {
        slug: 'test_loc_min',
        name: 'Test Min Location',
        type: 'Town'
    };

    const { data, error } = await supabase.from('locations').insert(payload).select();
    if (error) {
        console.error("MIN INSERT ERROR:", JSON.stringify(error, null, 2));
    } else {
        console.log("MIN INSERT SUCCESS:", data);
        // Clean up
        await supabase.from('locations').delete().eq('slug', 'test_loc_min');
    }
}

testMinimal();
