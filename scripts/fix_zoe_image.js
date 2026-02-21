
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImage() {
    console.log("Updating Zoe Image...");
    const { error } = await supabase
        .from('npcs')
        .update({ image: '/avatars/adventurer.jpg' })
        .eq('slug', 'npc_alchemist_zoe');

    if (error) console.error("Update Error:", error);
    else console.log("Zoe image updated to /avatars/adventurer.jpg");
}

fixImage();
