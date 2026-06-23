const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
    const userId = 'af2848d0-40f2-4f75-bd2b-ac633184107c';
    console.log('Resetting quest status for user kitsa (ID:', userId, ')...');
    
    const { data, error } = await supabase
        .from('user_profiles')
        .update({
            current_quest_id: null,
            current_quest_state: null
        })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Reset failed:', error.message);
        return;
    }
    console.log('Reset successfully:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
