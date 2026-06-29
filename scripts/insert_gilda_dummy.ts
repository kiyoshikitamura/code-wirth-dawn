process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const dbDest = "https://drbqnpzxgcbicpritcpi.supabase.co"; // Local/Preview DB
const keyDest = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function run() {
    if (!keyDest) {
        console.error('Dest Service Key is missing!');
        return;
    }
    const client = createClient(dbDest, keyDest);
    
    const gildaId = "f94db6e2-ca9b-4e1b-90f7-ebf996c56782";
    
    console.log(`Upserting Gilda dummy profile (ID: ${gildaId}) to dev DB (using 'name' column)...`);
    const { error: profileErr } = await client
        .from('user_profiles')
        .upsert({
            id: gildaId,
            name: 'ギルダ',
            level: 15,
            experience: 4850,
            gold: 32252,
            current_location_id: 1,
            generation: 1,
            vitality: 100,
            max_vitality: 100,
            age: 18,
            is_tutorial_completed: true,
            introduction: '開発プレビュー用のギルダ(複製)です。'
        });
        
    if (profileErr) {
        console.error('Error inserting Gilda profile:', profileErr);
        return;
    }
    
    console.log('Gilda dummy profile upserted successfully!');
    
    // パーティメンバーも3名ほどダミー作成
    console.log('Creating dummy party members for Gilda...');
    
    // すでに存在しているかもしれないので一旦全削除
    await client.from('party_members').delete().eq('user_id', gildaId);
    
    const members = [
        {
            user_id: gildaId,
            name: 'ギルダ',
            role: 'attacker',
            level: 15,
            hp: 120,
            max_hp: 120,
            mp: 40,
            max_mp: 40,
            attack: 25,
            defense: 20,
            agility: 18,
            magic: 10,
            sort_order: 1
        },
        {
            user_id: gildaId,
            name: 'ルーク',
            role: 'defender',
            level: 15,
            hp: 180,
            max_hp: 180,
            mp: 20,
            max_mp: 20,
            attack: 18,
            defense: 30,
            agility: 12,
            magic: 5,
            sort_order: 2
        },
        {
            user_id: gildaId,
            name: 'セレナ',
            role: 'healer',
            level: 15,
            hp: 95,
            max_hp: 95,
            mp: 80,
            max_mp: 80,
            attack: 10,
            defense: 12,
            agility: 15,
            magic: 25,
            sort_order: 3
        }
    ];
    
    const { error: membersErr } = await client
        .from('party_members')
        .insert(members);
        
    if (membersErr) {
        console.error('Error inserting party members:', membersErr);
        return;
    }
    
    console.log('Dummy party members created successfully!');
}

run();
