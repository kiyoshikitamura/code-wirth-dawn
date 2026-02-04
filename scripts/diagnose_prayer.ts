import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- DIAGNOSIS START ---');

    // 1. Check user_profiles column
    console.log('Checking user_profiles.prayer_count...');
    const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, gold, prayer_count')
        .limit(1);

    if (userError) console.error('Error fetching user_profiles:', userError);
    else console.log('User Profile Sample:', userData);

    // 2. Check world_states columns
    console.log('\nChecking world_states daily pools...');
    const { data: wsData, error: wsError } = await supabase
        .from('world_states')
        .select('location_name, daily_order_pool, daily_chaos_pool')
        .limit(1);

    if (wsError) console.error('Error fetching world_states:', wsError);
    else console.log('World State Sample:', wsData);

    // 3. Simulate Prayer Logic
    console.log('\nSimulating Prayer Transaction...');
    const userId = userData?.[0]?.id;
    const locationId = 'loc_hub'; // Assuming known ID or fetch one
    // Fetch a real location id
    const { data: locData } = await supabase.from('locations').select('id, name').limit(1).single();

    if (userId && locData) {
        console.log(`Using User: ${userId}, Location: ${locData.id} (${locData.name})`);

        try {
            // Step A: Calculate Cost (Tier 1)
            const cost = 100;
            const impact = 0.1;

            // Step B: Deduction
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ gold: (userData[0].gold || 0) + 0 }) // Dummy update to check schema
                .eq('id', userId);

            if (updateError) console.error('Update Profile Error:', updateError);
            else console.log('Profile update check passed.');

            // Step C: Log
            const { error: logError } = await supabase.from('prayer_logs').insert({
                user_id: userId,
                location_id: locData.id,
                target_attribute: 'Order',
                gold_spent: cost,
                impact_value: impact
            });

            if (logError) console.error('Insert Log Error:', logError);
            else console.log('Prayer Log Insert Passed.');

            // Step D: World State Update
            const dailyPoolCol = 'daily_order_pool';
            const { data: existingWS } = await supabase
                .from('world_states')
                .select(dailyPoolCol)
                .eq('location_name', locData.name)
                .single();

            console.log('Existing Pool Value:', existingWS);

            if (existingWS) {
                const { error: wsUpdateError } = await supabase.from('world_states')
                    .update({ [dailyPoolCol]: ((existingWS as any)[dailyPoolCol] || 0) + impact })
                    .eq('location_name', locData.name);

                if (wsUpdateError) console.error('WS Update Error:', wsUpdateError);
                else console.log('World State Update Passed.');
            } else {
                console.warn('No World State found for location:', locData.name);
            }

        } catch (e) {
            console.error('Simulation Exception:', e);
        }
    } else {
        console.warn('Skipping simulation due to missing user or location.');
    }
}

main();
