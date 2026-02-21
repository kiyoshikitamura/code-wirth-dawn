
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listScenarios() {
    console.log('Listing scenarios...');
    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 1)
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (!data || data.length === 0) {
            console.log('No scenarios found.');
            return;
        }
        console.log('Found scenarios:');
        data.forEach(s => {
            const hasScript = !!s.script_data;
            const scriptNodes = hasScript && s.script_data.nodes ? Object.keys(s.script_data.nodes).length : 0;
            console.log(`ID: ${s.id} | Title: ${s.title} | Has Script: ${hasScript} (Nodes: ${scriptNodes})`);
        });
    }
}

listScenarios();
