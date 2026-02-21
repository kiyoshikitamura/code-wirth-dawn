
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCols() {
    const { data, error } = await supabase.from('locations').select('*').limit(1);

    if (error) {
        console.error("SELECT ERR:", JSON.stringify(error, null, 2));
    } else {
        // If 0 rows, we can't see columns easily from data but we know it exists.
        // We can try to insert a dummy row and read it back?
        // Or leverage the error from invalid insert to see columns?
        console.log("TABLE EXISTS. Rows:", data.length);
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("Table empty, but exists.");
        }
    }
}

checkCols();
