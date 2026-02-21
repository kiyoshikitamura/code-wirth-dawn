
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugQuests() {
    console.log('Starting debug...');
    // 1. Get a user
    const { data: users, error: uError } = await supabase.from('user_profiles').select('id, name, level').limit(1);
    if (uError) {
        console.error('User Fetch Error:', uError);
        return;
    }
    if (!users || users.length === 0) {
        console.log('No users found');
        return;
    }
    const user = users[0];
    console.log('Testing for User:', user.name, user.id, 'Level:', user.level);

    // 2. Mimic API Logic - Fetch Quests
    console.log('Fetching scenarios...');
    const { data: quests, error } = await supabase
        .from('scenarios')
        .select('id, title, quest_type, requirements, conditions, description, reward_gold, reward_exp')
        .in('quest_type', ['normal', 'special'])
        .limit(100);

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log(`Fetched ${quests?.length} scenarios from DB`);

    // 3. Filter (Simple version)
    const normal = quests?.filter(q => q.quest_type === 'normal') || [];
    const special = quests?.filter(q => q.quest_type === 'special') || [];

    console.log(`Normal: ${normal.length}, Special: ${special.length}`);

    const target = quests?.find(q => q.title.includes('検証'));
    if (target) {
        console.log('Target Found:', target.title, target.id);
        if (target.requirements) {
            console.log('Requirements:', JSON.stringify(target.requirements));
        }
    } else {
        console.log('Target Quest "test_quest_001" (by title) NOT FOUND in fetched list.');
    }
}

debugQuests();
