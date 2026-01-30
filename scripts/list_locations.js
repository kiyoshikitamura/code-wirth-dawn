
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listLocations() {
    const { data, error } = await supabase
        .from('locations')
        .select('id, name, type, x, y, nation_id')
        .order('nation_id');

    if (error) {
        console.error('Error fetching locations:', error);
        return;
    }

    console.log('Current Locations:', data.length);
    fs.writeFileSync('locations.json', JSON.stringify(data, null, 2));
}

listLocations();
