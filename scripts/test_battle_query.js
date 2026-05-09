require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testQuery() {
    const enemyId = "9054"; // simulate string from JSON
    const isNumeric = /^\d+$/.test(String(enemyId));
    let groupQuery = supabase.from('enemy_groups').select('*');
    
    if (isNumeric) {
        groupQuery = groupQuery.eq('id', enemyId);
    } else {
        groupQuery = groupQuery.eq('slug', enemyId);
    }

    const { data: groupData, error: groupErr } = await groupQuery.maybeSingle();
    console.log("Group Data:", groupData);
    if (groupErr) console.error("Group Error:", groupErr);

    let targetSlugs = [enemyId];
    if (groupData && groupData.members) {
        targetSlugs = groupData.members;
    }
    console.log("Target Slugs:", targetSlugs);

    const { data: enemiesData, error: enemiesErr } = await supabase
        .from('enemies')
        .select('*')
        .in('slug', targetSlugs);
    
    console.log("Enemies Data length:", enemiesData ? enemiesData.length : 0);
    if (enemiesData && enemiesData.length > 0) {
        console.log("Action Pattern length:", enemiesData[0].action_pattern ? enemiesData[0].action_pattern.length : 0);
    }
    if (enemiesErr) console.error("Enemies Error:", enemiesErr);
}

testQuery();
