import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {    console.error('Missing credentials'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
    console.log("Applying fix to loc_hub connections...");
    const { data, error } = await supabase
        .from('locations')
        .update({ connections: [] })
        .eq('slug', 'loc_hub');
        
    if (error) {
        console.error("Failed to update:", error);
    } else {
        console.log("Successfully updated loc_hub connections to []");
    }
}

applyFix();
