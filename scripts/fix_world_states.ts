
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWorldStates() {
    console.log("Starting World States Fix...");

    // 1. Get all locations
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name, nation_id, slug');

    if (locError || !locations) {
        console.error("Failed to fetch locations:", locError);
        return;
    }

    console.log(`Found ${locations.length} locations.`);

    let insertedCount = 0;

    for (const loc of locations) {
        // Check if world_state exists
        const { data: existing } = await supabase
            .from('world_states')
            .select('id')
            .eq('location_name', loc.name)
            .maybeSingle();

        if (!existing) {
            console.log(`Creating world state for: ${loc.name} (${loc.nation_id})`);

            const defaultState = {
                location_name: loc.name,
                status: 'Prosperous', // Default enum value usually
                order_score: 10,
                chaos_score: 10,
                justice_score: 10,
                evil_score: 10,
                attribute_name: '至高の平穏',
                flavor_text: '新たな土地は静寂に包まれている。',
                background_url: '/backgrounds/default.jpg',
                total_days_passed: 0,
                controlling_nation: loc.nation_id || 'Neutral'
            };

            const { error: insertError } = await supabase
                .from('world_states')
                .insert(defaultState);

            if (insertError) {
                console.error(`Failed to insert for ${loc.name}:`, insertError);
            } else {
                insertedCount++;
            }
        } else {
            // console.log(`World state exists for: ${loc.name}`);
        }
    }

    console.log(`Finished. Created ${insertedCount} new world states.`);
}

fixWorldStates();
