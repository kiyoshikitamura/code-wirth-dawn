
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfiles() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, age, hp, max_hp, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log("Recent Profiles in DB:");
    data.forEach(p => {
        console.log(`[${p.created_at}] ID: ${p.id}, Name: ${p.name}, Age: ${p.age}, HP: ${p.hp}/${p.max_hp}`);
    });
}

checkProfiles();
