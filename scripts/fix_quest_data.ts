import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('=== クエストデータ診断 ===\n');

    // 1. サンプルクエスト(id=1001)を削除
    console.log('--- Step 1: サンプルクエスト(id=1001)の削除 ---');
    const { error: delError } = await supabase.from('scenarios').delete().eq('id', 1001);
    if (delError) {
        console.error('削除エラー:', delError.message);
    } else {
        console.log('id=1001 を scenarios テーブルから削除しました。');
    }

    // 2. 全クエストのscript_data状態を確認
    console.log('\n--- Step 2: script_data の状態確認 ---');
    const { data: allQuests, error } = await supabase
        .from('scenarios')
        .select('id, slug, title, quest_type, script_data, description')
        .in('quest_type', ['normal', 'special'])
        .order('id');

    if (error) {
        console.error('クエスト取得エラー:', error.message);
        return;
    }

    if (!allQuests || allQuests.length === 0) {
        console.log('scenarios テーブルにクエストデータが見つかりません。seed_master.ts の再実行が必要です。');
        return;
    }

    console.log(`\n全クエスト数: ${allQuests.length}\n`);

    let hasNodes = 0;
    let noNodes = 0;
    let nullScript = 0;

    for (const q of allQuests) {
        const nodes = q.script_data?.nodes;
        const nodeCount = nodes ? Object.keys(nodes).length : 0;
        const status = nodeCount > 0 ? `✅ ${nodeCount} nodes` : (q.script_data ? '⚠️ script_data有り, nodes無し' : '❌ script_data null');

        if (nodeCount > 0) hasNodes++;
        else if (q.script_data) noNodes++;
        else nullScript++;

        console.log(`  [${q.quest_type}] id=${q.id} ${q.title} → ${status}`);
    }

    console.log(`\n--- サマリ ---`);
    console.log(`  ノード有り (プレイ可能): ${hasNodes}`);
    console.log(`  ノード無し (準備中):     ${noNodes + nullScript}`);
    console.log(`    内訳: script_data null=${nullScript}, nodes空=${noNodes}`);
}

main().catch(console.error);
