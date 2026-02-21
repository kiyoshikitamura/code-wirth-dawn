
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listQuests() {
    console.log("--- LISTING QUESTS ---");
    const { data: quests, error } = await supabase
        .from('quests')
        .select('id, slug, title, flow_nodes');

    if (error) {
        console.error("Error fetching quests:", error);
    } else {
        console.log(`Found ${quests.length} quests.`);
        const target = quests.find(q => q.slug === 'quest_escort_empire_v1');
        if (target) {
            console.log("--- TARGET QUEST NODES ---");
            console.log(JSON.stringify(target.flow_nodes, null, 2));
        } else {
            console.log("Target quest not found.");
        }
    }
}

listQuests();
