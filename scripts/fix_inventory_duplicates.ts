/**
 * inventory テーブルの重複レコードを削除する
 * 同一 user_id + item_id の組み合わせで重複がある場合、数量を合算して1件にまとめる
 * npx tsx scripts/fix_inventory_duplicates.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== inventory 重複レコード修正 ===\n');

    // 全 inventory レコードを取得
    const { data: allInv, error } = await supabase
        .from('inventory')
        .select('id, user_id, item_id, is_equipped, is_skill, quantity, acquired_at')
        .order('acquired_at', { ascending: true });

    if (error) { console.error(error); return; }

    // user_id + item_id でグループ化
    const groups = new Map<string, typeof allInv>();
    for (const inv of allInv || []) {
        const key = `${inv.user_id}__${inv.item_id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(inv);
    }

    let fixCount = 0;
    for (const [key, entries] of groups) {
        if (entries.length <= 1) continue;

        console.log(`重複発見: ${key}`);
        console.log(`  件数: ${entries.length}`);

        // 装備中のレコードを優先して残す
        const equipped = entries.find(e => e.is_equipped);
        const primary = equipped || entries[0]; // 装備中があればそれを、なければ最初のレコードを残す
        const toDelete = entries.filter(e => e.id !== primary.id);

        // 数量を合算
        const totalQuantity = entries.reduce((sum, e) => sum + (e.quantity || 1), 0);

        console.log(`  残すレコード: ${primary.id} (is_equipped: ${primary.is_equipped})`);
        console.log(`  削除するレコード: ${toDelete.map(e => e.id).join(', ')}`);
        console.log(`  合算数量: ${totalQuantity}`);

        // 残すレコードの数量を更新
        const { error: updateErr } = await supabase
            .from('inventory')
            .update({ quantity: totalQuantity })
            .eq('id', primary.id);

        if (updateErr) {
            console.error(`  ❌ 数量更新失敗: ${updateErr.message}`);
            continue;
        }

        // 重複レコードを削除
        for (const del of toDelete) {
            const { error: delErr } = await supabase
                .from('inventory')
                .delete()
                .eq('id', del.id);

            if (delErr) {
                console.error(`  ❌ 削除失敗 ${del.id}: ${delErr.message}`);
            } else {
                console.log(`  ✅ 削除: ${del.id}`);
            }
        }

        fixCount++;
        console.log('');
    }

    if (fixCount === 0) {
        console.log('重複レコードはありませんでした。');
    } else {
        console.log(`\n✅ ${fixCount} 件の重複を修正しました。`);
    }
}

main().catch(console.error);
