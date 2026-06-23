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
    const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, name, current_quest_id, current_quest_state')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user:', error.message);
        return;
    }
    console.log('Kitsa Quest Status:');
    console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error);
