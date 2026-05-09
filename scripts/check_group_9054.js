const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('enemy_groups').select('*').eq('id', 9054).single();
    console.log("enemy_groups 9054:", data, "Error:", error);
}
run();
