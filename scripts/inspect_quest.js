
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectQuest() {
    const { data: quest, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('slug', 'quest_escort_empire_v1')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Quest Title:', quest.title);
        console.log('Quest Type:', quest.quest_type);
        console.log('Rewards:', quest.rewards, 'Type:', typeof quest.rewards);
        console.log('Flow Nodes exists:', !!quest.flow_nodes);
        console.log('Script Data exists:', !!quest.script_data);
    }
}

inspectQuest();
