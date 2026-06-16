const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.DASHBOARD_SUPABASE_URL;
const serviceKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing DASHBOARD env variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
    // 1. Get all completed quests mapping
    const { data: completedQuests, error: qError } = await supabase
        .from('user_completed_quests')
        .select('*');

    if (qError) {
        console.error('Error fetching completed quests:', qError);
        return;
    }

    // Get scenarios mapping
    const { data: scenarios } = await supabase
        .from('scenarios')
        .select('id, slug, title');
    const scenarioMap = {};
    scenarios?.forEach(s => {
        scenarioMap[s.id] = s;
    });

    // Get locations mapping
    const { data: locations } = await supabase.from('locations').select('id, name, slug');
    const slugMap = {};
    locations?.forEach(l => {
        slugMap[l.slug] = l.id;
    });

    const locBorderTownId = slugMap['loc_border_town'];
    const locOasisId = slugMap['loc_oasis'];
    const locPlainsCityId = slugMap['loc_plains_city'];

    if (!locBorderTownId || !locOasisId || !locPlainsCityId) {
        console.error('Failed to resolve locations:', { locBorderTownId, locOasisId, locPlainsCityId });
        return;
    }

    // 2. Fetch all user profiles
    const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('id, level, current_location_id, gold');

    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    const stuckAtBorderTown = [];
    const stuckAtOasis = [];

    for (const p of profiles) {
        const userCompletes = completedQuests.filter(cq => cq.user_id === p.id);
        const completedSlugs = new Set(userCompletes.map(cq => scenarioMap[cq.scenario_id]?.slug).filter(Boolean));

        // completed main_ep02 but still at loc_border_town
        if (completedSlugs.has('main_ep02') && !completedSlugs.has('main_ep03') && p.current_location_id === locBorderTownId) {
            stuckAtBorderTown.push(p.id);
        }

        // completed main_ep03 but still at loc_oasis
        if (completedSlugs.has('main_ep03') && !completedSlugs.has('main_ep04') && p.current_location_id === locOasisId) {
            stuckAtOasis.push(p.id);
        }
    }

    console.log(`Found ${stuckAtBorderTown.length} users stuck at Border Town.`);
    console.log(`Found ${stuckAtOasis.length} users stuck at Oasis.`);

    // Update stuck users at Border Town to Oasis
    if (stuckAtBorderTown.length > 0) {
        console.log('Migrating stuck Border Town users to Oasis...');
        const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update({ current_location_id: locOasisId })
            .in('id', stuckAtBorderTown);

        if (updateError) {
            console.error('Failed to migrate Border Town users:', updateError);
        } else {
            console.log(`Successfully migrated ${stuckAtBorderTown.length} users to Oasis.`);
        }
    }

    // Update stuck users at Oasis to Plains City
    if (stuckAtOasis.length > 0) {
        console.log('Migrating stuck Oasis users to Plains City...');
        const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update({ current_location_id: locPlainsCityId })
            .in('id', stuckAtOasis);

        if (updateError) {
            console.error('Failed to migrate Oasis users:', updateError);
        } else {
            console.log(`Successfully migrated ${stuckAtOasis.length} users to Plains City.`);
        }
    }
}

main().catch(console.error);
