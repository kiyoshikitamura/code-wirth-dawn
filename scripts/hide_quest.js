process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const dotenv = require('dotenv');
dotenv.config({ path: 'D:/dev/code-wirth-dawn/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, adminKey);

async function run() {
    console.log("Temporarily hiding Quest 7060 and 9999 in production database...");

    // Quest 7060 の非表示
    const { data: data7060, error: error7060 } = await supabase
        .from('scenarios')
        .update({
            requirements: { event_trigger: true },
            conditions: { event_trigger: true }
        })
        .eq('id', 7060)
        .select('id, requirements');

    if (error7060) {
        console.error('Error hiding quest 7060:', error7060);
    } else {
        console.log('Successfully hid quest 7060 in production. Requirements:', data7060);
    }

    // Quest 9999 の非表示
    const { data: data9999, error: error9999 } = await supabase
        .from('scenarios')
        .update({
            requirements: { event_trigger: true },
            conditions: { event_trigger: true }
        })
        .eq('id', 9999)
        .select('id, requirements');

    if (error9999) {
        console.error('Error hiding quest 9999:', error9999);
    } else {
        console.log('Successfully hid quest 9999 in production. Requirements:', data9999);
    }
}

run();
