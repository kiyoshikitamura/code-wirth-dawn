
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetCoords() {
    console.log("--- RESETTING COORDS ---");
    const updates = [
        { slug: 'loc_regalia', x: 0, y: 0 },
        { slug: 'loc_white_fort', x: -20, y: -40 },
        { slug: 'loc_iron_mine', x: -50, y: -80 },
        { slug: 'loc_charon', x: -80, y: -120 }
    ];

    for (const u of updates) {
        const { error } = await supabase
            .from('locations')
            .update({ x: u.x, y: u.y })
            .eq('slug', u.slug);

        if (error) console.error(`Error updating ${u.slug}:`, error);
        else console.log(`Updated ${u.slug}: (${u.x}, ${u.y})`);
    }
}

resetCoords();
