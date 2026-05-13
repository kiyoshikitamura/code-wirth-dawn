const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: enemy, error } = await supabase.from('enemies').select('*').eq('slug', 'enemy_god_zeus_strong').single();
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Action pattern:", enemy.action_pattern);
    
    // Check if ALL skills in action_pattern exist in enemy_skills
    for (const action of enemy.action_pattern) {
        const skill = action.skill;
        const { data: skillData, error: skillError } = await supabase.from('enemy_skills').select('*').eq('slug', skill).single();
        if (skillError) {
            console.error(`Skill MISSING in enemy_skills table: ${skill}`);
        } else {
            console.log(`Skill FOUND: ${skill} (${skillData.effect_type})`);
        }
    }
}
run();
