
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("Checking for previous_location_id column...");
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('previous_location_id')
            .limit(1);

        if (error) {
            console.error("Error selecting previous_location_id:", error.message);
            // If column missing, PostgREST often returns error code PGRST204 or specific message
        } else {
            console.log("Column EXISTS.");
            console.log("Data sample:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

checkColumn();
