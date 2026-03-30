/**
 * items テーブルの type を正しい値に一括更新するスクリプト
 * 
 * 使い方: npx tsx scripts/fix_item_types.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== items テーブル type 一括更新 ===\n');

    // 1. 装備品 (equipment)
    const equipmentUpdates = [
        { slug: 'item_white_robe', sub_type: 'armor' },
        { slug: 'item_thief_blade', sub_type: 'weapon' },
        { slug: 'item_pirate_hat', sub_type: 'accessory' },
        { slug: 'item_mino_axe', sub_type: 'weapon' },
    ];
    for (const eq of equipmentUpdates) {
        const { error } = await supabase
            .from('items')
            .update({ type: 'equipment', sub_type: eq.sub_type })
            .eq('slug', eq.slug);
        if (error) console.error(`  ❌ ${eq.slug}: ${error.message}`);
        else console.log(`  ✅ ${eq.slug} → equipment (${eq.sub_type})`);
    }

    // 2. キーアイテム (key_item)
    const keyItemSlugs = [
        'item_debris_clear',
        'item_pass_roland',
        'item_pass_karyu',
        'item_pass_yato',
        'item_pass_markand',
    ];
    const { error: keyErr } = await supabase
        .from('items')
        .update({ type: 'key_item' })
        .in('slug', keyItemSlugs);
    if (keyErr) console.error(`  ❌ key_items: ${keyErr.message}`);
    else console.log(`  ✅ key_item × ${keyItemSlugs.length} 件更新`);

    // 3. 素材 (material)
    const materialSlugs = [
        'item_relic_bone',
        'item_desert_worm_meat',
        'item_red_ogre_horn',
        'item_thunder_fur',
        'item_griffon_feather',
        'item_treant_core',
        'item_demon_heart',
        'item_angel_record',
        'item_kirin_horn',
        'item_omega_part',
        'item_kraken_proof',
        'item_maze_seal',
    ];
    const { error: matErr } = await supabase
        .from('items')
        .update({ type: 'material' })
        .in('slug', materialSlugs);
    if (matErr) console.error(`  ❌ materials: ${matErr.message}`);
    else console.log(`  ✅ material × ${materialSlugs.length} 件更新`);

    // 4. 交易品 (trade_good)
    const tradeGoodSlugs = [
        'item_trade_iron',
        'item_trade_silk',
        'item_trade_gem',
        'item_trade_dragon',
        'item_trade_mithril',
        'item_dark_matter',
    ];
    const { error: tradeErr } = await supabase
        .from('items')
        .update({ type: 'trade_good' })
        .in('slug', tradeGoodSlugs);
    if (tradeErr) console.error(`  ❌ trade_goods: ${tradeErr.message}`);
    else console.log(`  ✅ trade_good × ${tradeGoodSlugs.length} 件更新`);

    // 5. 確認: type 別カウント
    console.log('\n=== 更新後の type 分布 ===');
    const { data: allItems } = await supabase.from('items').select('type');
    if (allItems) {
        const counts: Record<string, number> = {};
        for (const item of allItems) {
            counts[item.type] = (counts[item.type] || 0) + 1;
        }
        for (const [type, count] of Object.entries(counts).sort()) {
            console.log(`  ${type}: ${count} 件`);
        }
    }

    console.log('\n✅ 完了');
}

main().catch(console.error);
