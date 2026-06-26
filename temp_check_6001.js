const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 6001)
        .maybeSingle();

    if (error) {
        console.error('Error fetching 6001:', error.message);
        return;
    }

    if (!data) {
        console.log('Quest 6001 not found in DB!');
        return;
    }

    console.log('Quest 6001 definition:');
    console.log({
        id: data.id,
        title: data.title,
        slug: data.slug,
        quest_type: data.quest_type,
        has_script_data: !!data.script_data,
        nodes: data.script_data ? Object.keys(data.script_data.nodes || {}) : []
    });

    if (data.script_data) {
        console.log('\nNodes detail:');
        console.log(JSON.stringify(data.script_data.nodes, null, 2));
    }
}

main().catch(console.error);
