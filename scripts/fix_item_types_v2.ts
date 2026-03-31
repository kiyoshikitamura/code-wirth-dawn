/**
 * items テーブルの type を正しい値に一括修正するスクリプト (v2)
 * 
 * 問題: 前回の fix_item_types.ts で更新できなかった交易品・装備品・素材・キーアイテムが
 *       items.type = 'skill' のまま残っている
 * 
 * 使い方: npx tsx scripts/fix_item_types_v2.ts
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
    console.log('=== items テーブル type 一括修正 (v2) ===\n');

    // 1. 装備品 (equipment) + sub_type
    const equipmentUpdates = [
        { slug: 'gear_knight_shield', sub_type: 'armor' },
        { slug: 'gear_desert_cloak', sub_type: 'armor' },
        { slug: 'gear_samurai_armor', sub_type: 'armor' },
        { slug: 'gear_iron_fist', sub_type: 'weapon' },
        { slug: 'acc_crusader_ring', sub_type: 'accessory' },
        { slug: 'gear_cursed_mask', sub_type: 'accessory' },
        { slug: 'gear_archmage_staff', sub_type: 'weapon' },
        { slug: 'gear_silver_lance', sub_type: 'weapon' },
        { slug: 'gear_inquisitor_mace', sub_type: 'weapon' },
        { slug: 'gear_magic_lamp', sub_type: 'accessory' },
        { slug: 'gear_ninja_tool', sub_type: 'accessory' },
        { slug: 'gear_dragon_spear', sub_type: 'weapon' },
        { slug: 'gear_adventurer_boots', sub_type: 'accessory' },
        { slug: 'gear_heavy_armor', sub_type: 'armor' },
        { slug: 'gear_snake_flute', sub_type: 'accessory' },
        { slug: 'gear_longbow', sub_type: 'weapon' },
        { slug: 'gear_hannya_mask', sub_type: 'accessory' },
        { slug: 'gear_nunchaku', sub_type: 'weapon' },
        { slug: 'gear_rusty_sword', sub_type: 'weapon' },
        { slug: 'gear_merchant_abacus', sub_type: 'weapon' },
        { slug: 'gear_paper_fan', sub_type: 'weapon' },
        { slug: 'gear_travel_bag', sub_type: 'accessory' },
        { slug: 'item_white_robe', sub_type: 'armor' },
        { slug: 'item_thief_blade', sub_type: 'weapon' },
        { slug: 'item_pirate_hat', sub_type: 'accessory' },
        { slug: 'item_mino_axe', sub_type: 'weapon' },
    ];

    console.log('--- 装備品 (equipment) ---');
    let eqCount = 0;
    for (const eq of equipmentUpdates) {
        const { error, count } = await supabase
            .from('items')
            .update({ type: 'equipment', sub_type: eq.sub_type })
            .eq('slug', eq.slug);
        if (error) console.error(`  ❌ ${eq.slug}: ${error.message}`);
        else { console.log(`  ✅ ${eq.slug} → equipment (${eq.sub_type})`); eqCount++; }
    }
    console.log(`  合計: ${eqCount} 件\n`);

    // 2. 消耗品 (consumable) - スキル教本・巻物・魔導書など使用するとスキルを習得するもの
    // これらはスキルそのものではなく、アイテムとしてはconsumableカテゴリ
    // ただし skills テーブルに対応するレコードがあるものは別途スキルとして扱う
    // ここでは items テーブル上で type を正しくする
    const consumableSlugs = [
        'item_world_map',  // 消費品（探索用）
        'item_merchant_bag',  // パッシブ装備扱い→equipment
        'item_alchemy_kit',   // パッシブ装備扱い→equipment
        'item_tea_set',       // パッシブ装備扱い→equipment
        'item_ofuda_set',     // パッシブ装備扱い→equipment
        'item_lucky_coin',    // パッシブ装備扱い→equipment
        'item_golden_dice',   // パッシブ装備扱い→equipment
        'item_cursed_idol',   // パッシブ装備扱い→equipment
        'tool_lockpick',      // パッシブ装備扱い→equipment
    ];

    // consumable として更新すべきもの
    const pureConsumableSlugs = ['item_world_map'];
    if (pureConsumableSlugs.length > 0) {
        console.log('--- 消耗品 (consumable) ---');
        const { error } = await supabase
            .from('items')
            .update({ type: 'consumable' })
            .in('slug', pureConsumableSlugs);
        if (error) console.error(`  ❌ consumable: ${error.message}`);
        else console.log(`  ✅ consumable × ${pureConsumableSlugs.length} 件\n`);
    }

    // パッシブ装備品 (equipment / accessory)
    const passiveEquipSlugs = [
        { slug: 'item_merchant_bag', sub_type: 'accessory' },
        { slug: 'item_alchemy_kit', sub_type: 'accessory' },
        { slug: 'item_tea_set', sub_type: 'accessory' },
        { slug: 'item_ofuda_set', sub_type: 'accessory' },
        { slug: 'item_lucky_coin', sub_type: 'accessory' },
        { slug: 'item_golden_dice', sub_type: 'accessory' },
        { slug: 'item_cursed_idol', sub_type: 'accessory' },
        { slug: 'tool_lockpick', sub_type: 'accessory' },
        { slug: 'sword_kusanagi', sub_type: 'weapon' },
        { slug: 'item_poison_manual', sub_type: 'accessory' },
        { slug: 'item_forbidden_scroll', sub_type: 'accessory' },
    ];

    console.log('--- パッシブ装備品 (equipment) ---');
    let passiveCount = 0;
    for (const eq of passiveEquipSlugs) {
        const { error } = await supabase
            .from('items')
            .update({ type: 'equipment', sub_type: eq.sub_type })
            .eq('slug', eq.slug);
        if (error) console.error(`  ❌ ${eq.slug}: ${error.message}`);
        else { console.log(`  ✅ ${eq.slug} → equipment (${eq.sub_type})`); passiveCount++; }
    }
    console.log(`  合計: ${passiveCount} 件\n`);

    // 3. キーアイテム (key_item)
    const keyItemSlugs = [
        'item_debris_clear',
        'item_pass_roland',
        'item_pass_karyu',
        'item_pass_yato',
        'item_pass_markand',
    ];
    console.log('--- キーアイテム (key_item) ---');
    const { error: keyErr } = await supabase
        .from('items')
        .update({ type: 'key_item' })
        .in('slug', keyItemSlugs);
    if (keyErr) console.error(`  ❌ key_items: ${keyErr.message}`);
    else console.log(`  ✅ key_item × ${keyItemSlugs.length} 件\n`);

    // 4. 素材 (material)
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
    console.log('--- 素材 (material) ---');
    const { error: matErr } = await supabase
        .from('items')
        .update({ type: 'material' })
        .in('slug', materialSlugs);
    if (matErr) console.error(`  ❌ materials: ${matErr.message}`);
    else console.log(`  ✅ material × ${materialSlugs.length} 件\n`);

    // 5. 交易品 (trade_good)
    const tradeGoodSlugs = [
        'item_trade_iron',
        'item_trade_silk',
        'item_trade_gem',
        'item_trade_dragon',
        'item_trade_mithril',
        'item_dark_matter',
    ];
    console.log('--- 交易品 (trade_good) ---');
    const { error: tradeErr } = await supabase
        .from('items')
        .update({ type: 'trade_good' })
        .in('slug', tradeGoodSlugs);
    if (tradeErr) console.error(`  ❌ trade_goods: ${tradeErr.message}`);
    else console.log(`  ✅ trade_good × ${tradeGoodSlugs.length} 件\n`);

    // 6. スキル教本・魔導書 (skill) - これらは skills テーブルに対応するものなので type='skill' のままでOK
    // slug が book_*, grimoire_*, scroll_*, skill_*, manual_* のものは正しく skill
    // 確認のためリスト
    const validSkillPrefixes = ['book_', 'grimoire_', 'scroll_', 'skill_', 'manual_'];
    
    // 7. 確認: type 別カウント
    console.log('=== 更新後の type 分布 ===');
    const { data: allItems } = await supabase.from('items').select('id, name, slug, type');
    if (allItems) {
        const counts: Record<string, number> = {};
        const stillSkillItems: any[] = [];
        for (const item of allItems) {
            counts[item.type] = (counts[item.type] || 0) + 1;
            if (item.type === 'skill') {
                const isValidSkill = validSkillPrefixes.some(p => item.slug?.startsWith(p));
                if (!isValidSkill) {
                    stillSkillItems.push(item);
                }
            }
        }
        for (const [type, count] of Object.entries(counts).sort()) {
            console.log(`  ${type}: ${count} 件`);
        }

        if (stillSkillItems.length > 0) {
            console.log(`\n⚠️  type='skill' のまま残っているが、slugがスキル接頭辞でないアイテム (${stillSkillItems.length} 件):`);
            for (const item of stillSkillItems) {
                console.log(`  id: ${item.id} | name: ${item.name} | slug: ${item.slug}`);
            }
        } else {
            console.log('\n✅ type=skill で不正なアイテムはありません。');
        }
    }

    console.log('\n✅ 完了');
}

main().catch(console.error);
