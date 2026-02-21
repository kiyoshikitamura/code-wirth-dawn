
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugGroup() {
    console.log("--- Debugging Group Insert ---");
    const newGroup = {
        name: 'Debug Wolf Pack',
        members: ['wolf_shadow', 'wolf_shadow'],
        slug: 'debug_wolf_pack' // trying to add slug just in case
    };

    // Try inserting with name
    const { data, error } = await supabase.from('enemy_groups').insert(newGroup).select();
    if (error) {
        console.error("Insert Error Full:", JSON.stringify(error, null, 2));
    } else {
        console.log("Insert Success:", data);
    }

    // List all groups again
    const { data: all } = await supabase.from('enemy_groups').select('*');
    console.log("All Groups:", all?.length);
    all?.forEach(g => console.log(JSON.stringify(g)));
}

debugGroup();
