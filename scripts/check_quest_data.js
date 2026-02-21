
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestData() {
    console.log("--- CHECKING QUEST DATA ---");
    const { data: quest, error } = await supabase
        .from('quests')
        .select('*')
        .eq('slug', 'quest_escort_empire_v1')
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Quest Title:", quest.title);
    console.log("Flow Nodes:", JSON.stringify(quest.flow_nodes, null, 2));
}

checkQuestData();
