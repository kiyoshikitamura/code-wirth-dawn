
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listLocations() {
    const { data, error } = await supabase
        .from('locations')
        .select('id, name, slug, x, y');

    if (error) {
        console.error('Error fetching locations:', error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

listLocations();
