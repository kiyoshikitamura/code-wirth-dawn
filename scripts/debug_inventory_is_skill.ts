/**
 * inventory テーブルで is_skill = true となっているレコードを調査
 * npx tsx scripts/debug_inventory_is_skill.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== inventory テーブル is_skill 調査 ===\n');

    // 1. is_skill = true のレコードを全取得
    const { data: skillInventory, error } = await supabase
        .from('inventory')
        .select(`
            id,
            user_id,
            item_id,
            is_skill,
            is_equipped,
            quantity,
            items!inner (
                id,
                name,
                slug,
                type
            )
        `)
        .eq('is_skill', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`is_skill=true のレコード数: ${skillInventory?.length || 0}\n`);

    if (skillInventory && skillInventory.length > 0) {
        for (const inv of skillInventory) {
            const item = inv.items as any;
            console.log(`  ID: ${inv.id}`);
            console.log(`    item_id: ${inv.item_id} | name: ${item?.name} | slug: ${item?.slug}`);
            console.log(`    items.type: ${item?.type} | is_equipped: ${inv.is_equipped} | qty: ${inv.quantity}`);
            console.log(`    user_id: ${inv.user_id}`);
            console.log('');
        }
    }

    // 2. items.type = 'skill' のレコードも確認
    const { data: skillTypeItems } = await supabase
        .from('items')
        .select('id, name, slug, type')
        .eq('type', 'skill');

    console.log(`\n=== items テーブルで type='skill' のレコード ===`);
    console.log(`件数: ${skillTypeItems?.length || 0}`);
    if (skillTypeItems) {
        for (const item of skillTypeItems) {
            console.log(`  id: ${item.id} | name: ${item.name} | slug: ${item.slug}`);
        }
    }

    // 3. 交易品の inventory 状況確認
    const { data: tradeInventory } = await supabase
        .from('inventory')
        .select(`
            id,
            is_skill,
            is_equipped,
            items!inner (
                name,
                slug,
                type
            )
        `)
        .in('items.type', ['trade_good']);

    console.log(`\n=== inventory で items.type='trade_good' のレコード ===`);
    console.log(`件数: ${tradeInventory?.length || 0}`);
    if (tradeInventory) {
        for (const inv of tradeInventory) {
            const item = inv.items as any;
            console.log(`  inv.id: ${inv.id} | ${item?.name} | is_skill: ${inv.is_skill} | is_equipped: ${inv.is_equipped}`);
        }
    }
}

main().catch(console.error);
