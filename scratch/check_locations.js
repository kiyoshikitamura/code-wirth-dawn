const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE URL or KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    console.log("Checking item types in items table...");

    const { data, error } = await supabase
        .from('items')
        .select('type')
        .limit(500);

    if (error) {
        console.error("Error fetching items:", error.message);
        return;
    }

    const typeCounts = {};
    for (const item of data) {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    }

    console.log("Item types count summary:", typeCounts);
}

run();
