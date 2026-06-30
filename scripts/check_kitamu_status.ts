process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndInject() {
    const userId = 'af2848d0-40f2-4f75-bd2b-ac633184107c'; // きたむ様
    
    console.log('--- Checking User Profile ---');
    const { data: profile, error: err1 } = await supabase
        .from('user_profiles')
        .select('id, level, current_quest_id')
        .eq('id', userId)
        .single();
        
    if (err1) {
        console.error('Error user_profiles:', err1);
        return;
    }
    
    console.log('Current User Profile:', profile);

    // 1. user_completed_quests で 7060 (プロローグ) が完了しているかチェック
    const { data: completedRecord, error: errCompleted } = await supabase
        .from('user_completed_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('scenario_id', 7060)
        .maybeSingle();

    if (errCompleted) {
        console.error('Error checking user_completed_quests:', errCompleted);
    } else if (!completedRecord) {
        console.log('-> qst_rift_prologue (7060) is NOT marked as completed. Inserting record...');
        const { error: errInsert } = await supabase
            .from('user_completed_quests')
            .insert({ user_id: userId, scenario_id: 7060 });
            
        if (errInsert) {
            console.error('Failed to insert completed quest record:', errInsert);
        } else {
            console.log('Successfully marked 7060 as completed in user_completed_quests.');
        }
    } else {
        console.log('-> qst_rift_prologue (7060) is already completed.');
    }

    // 2. もし 7061 を受注するために、現在受注中のクエストがあったらリセットする
    if (profile.current_quest_id !== null) {
        console.log(`-> Resetting current_quest_id from ${profile.current_quest_id} to null...`);
        const { error: errReset } = await supabase
            .from('user_profiles')
            .update({ current_quest_id: null })
            .eq('id', userId);
            
        if (errReset) {
            console.error('Failed to reset current_quest_id:', errReset);
        } else {
            console.log('Successfully reset current_quest_id to null.');
        }
    } else {
        console.log('No current quest active. Ready to start 7061.');
    }
}

checkAndInject();
