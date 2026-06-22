const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserParty() {
    const targetUserId = 'af2848d0-40f2-4f75-bd2b-ac633184107c';
    console.log(`Checking profile for user: ${targetUserId}...`);

    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    if (profileError) {
        console.error("Error fetching profile:", profileError);
    } else {
        console.log("Profile data:", {
            id: profile.id,
            name: profile.name,
            hp: profile.hp,
            max_hp: profile.max_hp,
            vitality: profile.vitality,
            current_quest_id: profile.current_quest_id,
        });
    }

    console.log(`Checking party members for user: ${targetUserId}...`);

    const { data: party, error } = await supabase
        .from('party_members')
        .select('*')
        .eq('owner_id', targetUserId);

    if (error) {
        console.error("Error fetching party:", error);
        return;
    }

    console.log("Database values for party members:");
    party.forEach(m => {
        console.log(`ID: ${m.id} | Name: ${m.name} | slug: ${m.slug} | durability: ${m.durability} | max_durability: ${m.max_durability} | is_active: ${m.is_active} | origin: ${m.origin_type}`);
    });

    console.log(`Checking all party_members named Leo across the database...`);
    const { data: allLeos, error: allLeosError } = await supabase
        .from('party_members')
        .select('*')
        .eq('name', 'レオ');

    if (allLeosError) {
        console.error("Error fetching all Leos:", allLeosError);
    } else {
        allLeos.forEach(m => {
            console.log(`Owner: ${m.owner_id} | ID: ${m.id} | Name: ${m.name} | durability: ${m.durability} | max_durability: ${m.max_durability} | is_active: ${m.is_active} | slug: ${m.slug}`);
        });
    }
}

checkUserParty();
