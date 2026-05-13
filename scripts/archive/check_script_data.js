const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://zvoroixjuypnintkpmux.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b3JvaXhqdXlwbmludGtwbXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMDUwNCwiZXhwIjoyMDg0OTk2NTA0fQ.b2ywSvYqDu67XZla6gqG6-7j3Bv5d9AtJyqfHO5AgVg'
);

async function check() {
    const { data, error } = await supabase
        .from('scenarios')
        .select('id, script_data')
        .eq('id', 6101)
        .single();
    
    if (error) { console.log('Error:', error); return; }
    
    const sd = data.script_data;
    console.log('=== Top-level keys ===');
    console.log(Object.keys(sd));
    
    // If nodes is an object, check its structure
    if (sd.nodes) {
        console.log('\n=== sd.nodes keys (first 10) ===');
        const nodeKeys = Object.keys(sd.nodes);
        console.log(nodeKeys.slice(0, 10));
        
        // Find get_promise
        const gp = sd.nodes.get_promise || sd.nodes['get_promise'];
        if (gp) {
            console.log('\n=== get_promise node ===');
            console.log(JSON.stringify(gp, null, 2));
        } else {
            console.log('\nget_promise not found in sd.nodes');
            // Check all node types
            for (const [id, node] of Object.entries(sd.nodes)) {
                if (node.type === 'reward') {
                    console.log(`Found reward node: ${id}`);
                    console.log(JSON.stringify(node, null, 2));
                }
            }
        }
        
        // Check for any node with items in params
        console.log('\n=== Nodes with params.items ===');
        for (const [id, node] of Object.entries(sd.nodes)) {
            if (node.params?.items) {
                console.log(`  ${id}: type=${node.type}, items=${JSON.stringify(node.params.items)}`);
            }
        }
    }
}

check().catch(console.error);
