const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
    // Check scenario 7050
    const { data: q7050, error: e7050 } = await supabase
        .from('scenarios')
        .select('id, title, slug, quest_type, requirements, script_data')
        .eq('id', 7050)
        .maybeSingle();

    console.log('--- 7050 Query ---');
    if (e7050) {
        console.error('Error fetching 7050:', e7050.message);
    } else if (!q7050) {
        console.log('Quest 7050 not found in DB.');
    } else {
        console.log('Quest 7050:', {
            id: q7050.id,
            title: q7050.title,
            slug: q7050.slug,
            quest_type: q7050.quest_type,
            requirements: q7050.requirements,
            has_script_data: !!q7050.script_data,
            has_nodes: q7050.script_data ? !!q7050.script_data.nodes : false,
            node_count: q7050.script_data && q7050.script_data.nodes ? Object.keys(q7050.script_data.nodes).length : 0
        });
        if (q7050.script_data) {
            console.log('Script Data Nodes:');
            console.log(JSON.stringify(q7050.script_data.nodes, null, 2));
        }
    }
}

main().catch(console.error);
