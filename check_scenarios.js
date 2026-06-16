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
    // Check scenario 7001
    const { data: q7001, error: e7001 } = await supabase
        .from('scenarios')
        .select('id, title, slug, quest_type, requirements, script_data')
        .eq('id', 7001)
        .maybeSingle();

    console.log('--- 7001 Query ---');
    if (e7001) {
        console.error('Error fetching 7001:', e7001.message);
    } else if (!q7001) {
        console.log('Quest 7001 not found in DB.');
    } else {
        console.log('Quest 7001:', {
            id: q7001.id,
            title: q7001.title,
            slug: q7001.slug,
            quest_type: q7001.quest_type,
            requirements: q7001.requirements,
            has_script_data: !!q7001.script_data,
            has_nodes: q7001.script_data ? !!q7001.script_data.nodes : false,
            node_count: q7001.script_data && q7001.script_data.nodes ? Object.keys(q7001.script_data.nodes).length : 0
        });
    }

    // Check scenario 6001
    const { data: q6001, error: e6001 } = await supabase
        .from('scenarios')
        .select('id, title, slug, quest_type, requirements, script_data')
        .eq('id', 6001)
        .maybeSingle();

    console.log('--- 6001 Query ---');
    if (e6001) {
        console.error('Error fetching 6001:', e6001.message);
    } else if (!q6001) {
        console.log('Quest 6001 not found in DB.');
    } else {
        console.log('Quest 6001:', {
            id: q6001.id,
            title: q6001.title,
            slug: q6001.slug,
            quest_type: q6001.quest_type,
            requirements: q6001.requirements,
            has_script_data: !!q6001.script_data,
            has_nodes: q6001.script_data ? !!q6001.script_data.nodes : false,
            node_count: q6001.script_data && q6001.script_data.nodes ? Object.keys(q6001.script_data.nodes).length : 0
        });
    }

    // Check all scenarios in DB count
    const { count, error: countErr } = await supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true });
    
    console.log('--- DB Info ---');
    if (countErr) {
        console.error('Error getting count:', countErr.message);
    } else {
        console.log('Total scenarios in DB:', count);
    }
}

main().catch(console.error);
