/**
 * gear_rusty_sword の items テーブルでの現在の状態を確認
 * npx tsx scripts/debug_rusty_sword.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== gear_rusty_sword 状態確認 ===\n');

    // items テーブル
    const { data: item } = await supabase
        .from('items')
        .select('*')
        .eq('slug', 'gear_rusty_sword')
        .single();
    
    console.log('items テーブル:', JSON.stringify(item, null, 2));

    // inventory テーブル（全ユーザー）
    const { data: invItems } = await supabase
        .from('inventory')
        .select('id, user_id, item_id, is_equipped, is_skill, quantity')
        .eq('item_id', item?.id);

    console.log('\ninventory テーブル:', JSON.stringify(invItems, null, 2));

    // equipped_items テーブル（全ユーザー）
    const { data: eqItems } = await supabase
        .from('equipped_items')
        .select('*')
        .eq('item_id', item?.id);

    console.log('\nequipped_items テーブル:', JSON.stringify(eqItems, null, 2));

    // equipped_items テーブルの全レコード確認
    const { data: allEquipped } = await supabase
        .from('equipped_items')
        .select('id, user_id, slot, item_id, equipped_at');

    console.log('\n全 equipped_items:', JSON.stringify(allEquipped, null, 2));
}

main().catch(console.error);
