
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // or SERVICE_ROLE if needed

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Inserting Risk Test Quest...");

    const riskQuest = {
        title: '【DANGER】伝説の古龍討伐',
        description: '推奨レベル50の超高難易度クエスト。初心者は即死するだろう。',
        client_name: '王宮騎士団長',
        type: 'Subjugation',
        difficulty: 5,
        rec_level: 50, // High Level
        is_urgent: false,
        time_cost: 1,
        reward_gold: 9999,
        conditions: { min_level: 1 }, // Technically accessible but risky
        rewards: { gold: 9999 },
        flow_nodes: []
    };

    const urgentQuest = {
        title: '【URGENT】緊急防衛任務',
        description: '街への襲撃が迫っている。至急の対応求む。',
        client_name: '市警',
        type: 'Defense',
        difficulty: 2,
        rec_level: 1,
        is_urgent: true, // Urgent
        time_cost: 1,
        reward_gold: 500,
        conditions: {},
        rewards: { gold: 500 },
        flow_nodes: []
    };

    const { error: e1 } = await supabase.from('scenarios').insert(riskQuest);
    if (e1) console.error("Risk Quest Error:", e1);
    else console.log("Risk Quest Inserted.");

    const { error: e2 } = await supabase.from('scenarios').insert(urgentQuest);
    if (e2) console.error("Urgent Quest Error:", e2);
    else console.log("Urgent Quest Inserted.");
}

main();
