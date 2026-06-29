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
    const regaliaLocationId = "337ee404-9b16-47b3-914a-fb7513c25977"; // 王都レガリア(開発DB)のUUID
    
    console.log(`Upserting Gilda dummy profile (ID: ${gildaId}) to dev DB with Regalia location UUID...`);
    const { error: profileErr } = await client
        .from('user_profiles')
        .upsert({
            id: gildaId,
            name: 'ギルダ',
            level: 15,
            exp: 4850,
            gold: 32252,
            current_location_id: regaliaLocationId,
            vitality: 100,
            max_vitality: 100,
            age: 18,
            is_tutorial_completed: true,
            introduction: '開発プレビュー用のギルダ(複製)です。',
            hp: 120,
            max_hp: 120,
            mp: 40,
            max_mp: 40,
            attack: 25,
            defense: 20,
            is_alive: true
        });
        
    if (profileErr) {
        console.error('Error inserting Gilda profile:', profileErr);
        return;
    }
    
    console.log('Gilda dummy profile upserted successfully!');
}

run();
