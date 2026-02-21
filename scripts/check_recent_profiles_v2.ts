
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfiles() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, age, hp, max_hp, birth_date, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log("Recent Profiles in DB (Ordered by updated_at):");
    data.forEach(p => {
        console.log(`[${p.updated_at}] ID: ${p.id}, Name: ${p.name}, Age: ${p.age}, HP: ${p.hp}/${p.max_hp}, Birth: ${p.birth_date}`);
    });
}

checkProfiles();
