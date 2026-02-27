const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixQuest5999() {
    console.log("Fetching quest 5999...");
    const { data, error } = await supabase.from('scenarios').select('*').eq('id', 5999).single();
    if (error) {
        console.error(error);
        process.exit(1);
    }

    let nodes = data.flow_nodes;
    if (nodes) {
        let checkNode = nodes.find(n => n.node_id === 'check_node' || n.id === 'check_node');
        if (checkNode) {
            checkNode.params = {
                type: 'check_delivery',
                item_id: 3100,
                quantity: 1
            };
            checkNode.item_id = 3100;
            checkNode.quantity = 1;
            console.log("Updated flow_nodes checkNode");
        }
    }

    let scriptData = data.script_data;
    if (scriptData && scriptData.nodes) {
        let scNode = scriptData.nodes['check_node'];
        if (scNode) {
            scNode.params = {
                type: 'check_delivery',
                item_id: 3100,
                quantity: 1
            };
            scNode.item_id = 3100;
            scNode.quantity = 1;
            console.log("Updated script_data checkNode");
        }
    }

    const { error: updateError } = await supabase.from('scenarios').update({ flow_nodes: nodes, script_data: scriptData }).eq('id', 5999);

    if (updateError) {
        console.error("Failed to update:", updateError);
    } else {
        console.log("Successfully updated quest 5999.", scriptData?.nodes?.check_node);
    }
}

fixQuest5999();
