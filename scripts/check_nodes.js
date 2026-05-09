const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('scenarios').select('script_data').eq('id', 6020).single();
    if (error) {
        console.error(error);
    } else {
        console.log("text_relics_missing:", JSON.stringify(data.script_data.nodes.text_relics_missing, null, 2));
        console.log("battle_strong:", JSON.stringify(data.script_data.nodes.battle_strong, null, 2));
    }
}
run();
