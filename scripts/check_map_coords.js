
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- CHECKING MAP COORDS ---");
    const { data: locs, error: lErr } = await supabase.from('locations').select('slug, name, x, y, map_x, map_y');
    if (lErr) console.error(JSON.stringify(lErr));
    else console.log(JSON.stringify(locs, null, 2));
    process.exit(0);
}

check();
