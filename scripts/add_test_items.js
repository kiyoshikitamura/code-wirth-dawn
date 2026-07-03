process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const dotenv = require('dotenv');
dotenv.config({ path: 'D:/dev/code-wirth-dawn/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, adminKey);

async function run() {
    const userId = 'c1cf67dd-527a-497e-bf88-ce10c2cb516f';
    console.log(`Checking user profile for (${userId}) in preview DB...`);

    // 1. ユーザープロファイルが存在するかチェック、なければダミー作成
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (profileError) {
        console.error('Error checking profile:', profileError);
        return;
    }

    if (!profile) {
        console.log(`User profile for ${userId} not found. Creating a dummy profile first...`);
        const { error: insertProfileError } = await supabase
            .from('user_profiles')
            .insert({
                id: userId,
                name: 'きたむ',
                gender: 'male',
                age: 20,
                vitality: 100,
                max_vitality: 100,
                hp: 150,
                max_hp: 150,
                atk: 10,
                def: 10,
                is_alive: true,
                updated_at: new Date().toISOString(),
                gold: 10000
            });
        if (insertProfileError) {
            console.error('Error creating dummy user profile:', insertProfileError);
            return;
        }
        console.log('Dummy user profile created successfully.');
    } else {
        console.log('User profile already exists.');
    }

    // 2. インベントリ（通常アイテム・装備）への付与
    const itemsToGrant = [
        301, 304, 306, 311, 312, 313, 314, 315, 316, 317, 
        318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 
        328, 329, 330, 346, 347, 350, 351, 4002, 4003,
        706, 707, 708, 709
    ];

    const itemInserts = itemsToGrant.map(itemId => {
        const qty = [706, 707, 708, 709].includes(itemId) ? 5 : 1;
        return {
            user_id: userId,
            item_id: itemId,
            quantity: qty
        };
    });

    console.log(`Inserting/Upserting ${itemInserts.length} items into inventory...`);

    const { error: deleteItemError } = await supabase
        .from('inventory')
        .delete()
        .eq('user_id', userId)
        .in('item_id', itemsToGrant);

    if (deleteItemError) {
        console.error('Error clearing old inventory items:', deleteItemError);
        return;
    }

    const { data: itemData, error: insertItemError } = await supabase
        .from('inventory')
        .insert(itemInserts)
        .select();

    if (insertItemError) {
        console.error('Error inserting items into inventory:', insertItemError);
    } else {
        console.log(`Successfully granted ${itemData ? itemData.length : 0} items to test user inventory.`);
    }

    // 3. ユーザー所持スキル（user_skills）への付与
    const skillsToGrant = [
        3026, // 砂の罠 (カードID: 16)
        3052, // 血の怒り (カードID: 42)
        3137  // クイックドロー (カードID: 137)
    ];

    const skillInserts = skillsToGrant.map(skillId => {
        return {
            user_id: userId,
            skill_id: skillId
        };
    });

    console.log(`Inserting/Upserting ${skillInserts.length} skills into user_skills...`);

    const { error: deleteSkillError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId)
        .in('skill_id', skillsToGrant);

    if (deleteSkillError) {
        console.error('Error clearing old user skills:', deleteSkillError);
        return;
    }

    const { data: skillData, error: insertSkillError } = await supabase
        .from('user_skills')
        .insert(skillInserts)
        .select();

    if (insertSkillError) {
        console.error('Error inserting skills into user_skills:', insertSkillError);
    } else {
        console.log(`Successfully granted ${skillData ? skillData.length : 0} skills to test user.`);
    }
}

run();
