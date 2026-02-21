
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugId() {
    console.log("--- Debugging Group ID Type ---");

    // Try auto-increment (already failed, but confirm)
    console.log("Attempt 1: Insert without ID");
    const { error: err1 } = await supabase.from('enemy_groups').insert({
        slug: 'debug_auto_id',
        name: 'Debug Auto',
        members: ['slime'],
        formation: 'front_row'
    });
    if (err1) console.error("Auto ID Failed:", err1.message);
    else console.log("Auto ID Success");

    // Try explicit Integer
    console.log("Attempt 2: Insert with Integer ID 9999");
    const { error: err2 } = await supabase.from('enemy_groups').insert({
        id: 9999,
        slug: 'debug_int_id',
        name: 'Debug Int',
        members: ['slime'],
        formation: 'front_row'
    });
    if (err2) console.error("Integer ID Failed:", err2.message);
    else console.log("Integer ID Success");

    // Try explicit UUID
    console.log("Attempt 3: Insert with UUID");
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const { error: err3 } = await supabase.from('enemy_groups').insert({
        id: uuid,
        slug: 'debug_uuid_id',
        name: 'Debug UUID',
        members: ['slime'],
        formation: 'front_row'
    });
    if (err3) console.error("UUID Failed:", err3.message);
    else console.log("UUID Success");
}

debugId();
