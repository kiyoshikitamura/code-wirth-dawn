import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
);

async function check() {
    const { data, error } = await supabase.from('scenarios').select('id, script_data').eq('id', 6012).single();
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    // Check nodes around Uriel defeat
    const nodes = data.script_data.nodes;
    console.log("text_next_destination:", nodes['text_next_destination']);
    console.log("end_node:", nodes['end_node']);
    console.log("end_failure:", nodes['end_failure']);
}
check();
