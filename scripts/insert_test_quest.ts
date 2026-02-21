
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertQuest() {
    console.log('Inserting validation quest...');

    // Check if it exists by slug or title first to avoid duplicates
    const { data: existing } = await supabase
        .from('scenarios')
        .select('id')
        .ilike('title', '検証：王都への護衛任務')
        .single();

    if (existing) {
        console.log('Quest already exists with ID:', existing.id);
        return;
    }

    const { data, error } = await supabase
        .from('scenarios')
        .insert({
            title: '検証：王都への護衛任務',
            description: 'システム検証用の特別護衛任務です。王都までの安全を確保してください。',
            quest_type: 'special',
            difficulty: 3,
            rec_level: 3, // Recommended Level
            is_urgent: true,
            client_name: '運営事務局', // Admin
            rewards: { gold: 1000, exp: 500 },
            requirements: {}, // No requirements
            conditions: {},   // No special conditions
            slug: 'test_quest_001', // Putting the string ID here if needed
            script_data: { script_id: 'test_escort_scenario' } // Storing the script reference
        })
        .select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Inserted Quest:', data);
    }
}

insertQuest();
