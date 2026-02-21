
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- CHECKING COORDS ---");
    const slugs = ['loc_regalia', 'loc_white_fort', 'loc_iron_mine', 'loc_charon'];
    const { data: locs, error: lErr } = await supabase.from('locations').select('slug, name, x, y').in('slug', slugs);
    if (lErr) console.error(lErr);
    else console.table(locs);
    process.exit(0);
}

check();
