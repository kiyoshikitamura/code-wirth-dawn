
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Or SERVICE_ROLE_KEY if needed for schema inspection, but select might fail if col missing

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("Checking for previous_location_id column...");
    const { data, error } = await supabase
        .from('user_profiles')
        .select('previous_location_id')
        .limit(1);

    if (error) {
        console.error("Error selecting previous_location_id:", error.message);
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
            console.log("Column likely MISSING.");
        }
    } else {
        console.log("Column EXISTS.");
    }
}

checkColumn();
