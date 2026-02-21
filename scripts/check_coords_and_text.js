
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- CHECKING COORDS ---");
    const { data: locs, error: lErr } = await supabase.from('locations').select('slug, name, x, y');
    if (lErr) console.error(lErr);
    else console.table(locs);

    console.log("\n--- CHECKING NODE TEXT ---");
    const { data: quest, error: qErr } = await supabase.from('scenarios').select('flow_nodes').eq('slug', 'quest_escort_empire_v1').single();
    if (qErr) console.error(qErr);
    else {
        const travels = quest.flow_nodes.filter(n => n.type === 'travel');
        travels.forEach(t => {
            console.log(`[${t.id}] Text: "${t.text}"`);
        });
        const arrives = quest.flow_nodes.filter(n => n.id.includes('arrive'));
        arrives.forEach(a => {
            console.log(`[${a.id}] Text: "${a.text}"`);
        });
    }
    process.exit(0);
}

check();
