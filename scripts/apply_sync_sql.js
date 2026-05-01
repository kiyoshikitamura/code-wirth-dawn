/**
 * scripts/apply_sync_sql.js
 *
 * 指定SQLファイルをパースし、Supabase に直接適用する。
 * CSV同期APIでは対応できない 6011〜6020 の最新シナリオデータを反映するためのスクリプト。
 *
 * Usage:
 *   node scripts/apply_sync_sql.js [--dry-run] [--ids=6011,6012,...] [--files=scenario_6011_6015.sql,scenario_6016_6020.sql]
 *
 * デフォルトは scenario_6011_6015.sql + scenario_6016_6020.sql を適用。
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SERVICE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const idsArg = args.find(a => a.startsWith('--ids='));
const filesArg = args.find(a => a.startsWith('--files='));

const filterIds = idsArg ? idsArg.split('=')[1].split(',').map(Number) : null;
const sqlFiles = filesArg
    ? filesArg.split('=')[1].split(',')
    : ['scenario_6011_6015.sql', 'scenario_6016_6020.sql'];

async function processFile(sqlFile) {
    const sqlPath = path.join(__dirname, '..', 'sql', sqlFile);
    if (!fs.existsSync(sqlPath)) {
        console.error(`[SKIP] File not found: ${sqlFile}`);
        return { success: 0, errors: 0 };
    }

    console.log(`\n=== Processing: ${sqlFile} ===`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // UPDATE文を抽出 (script_data + rewards)
    const updateRegex = /UPDATE\s+scenarios\s+SET\s+script_data\s*=\s*'(.+?)'::jsonb\s*,\s*rewards\s*=\s*'(.+?)'::jsonb\s+WHERE\s+id\s*=\s*(\d+);/gs;

    let match;
    let success = 0;
    let errors = 0;

    while ((match = updateRegex.exec(sqlContent)) !== null) {
        const scriptDataRaw = match[1];
        const rewardsRaw = match[2];
        const scenarioId = parseInt(match[3], 10);

        if (filterIds && !filterIds.includes(scenarioId)) continue;

        try {
            const scriptData = JSON.parse(scriptDataRaw);
            const rewards = JSON.parse(rewardsRaw);
            const nodeCount = Object.keys(scriptData.nodes || {}).length;
            const hasCheckItem = Object.values(scriptData.nodes || {}).some((n) => n.type === 'check_item');

            if (dryRun) {
                const startText = scriptData.nodes?.start?.text?.substring(0, 50) || '(no start)';
                console.log(`  [DRY] ${scenarioId}: ${nodeCount} nodes${hasCheckItem ? ' [✓check_item]' : ''} | "${startText}..."`);
                success++;
                continue;
            }

            const { error } = await supabase
                .from('scenarios')
                .update({ script_data: scriptData, rewards })
                .eq('id', scenarioId);

            if (error) {
                console.error(`  [ERR] ${scenarioId}: ${error.message}`);
                errors++;
            } else {
                console.log(`  [OK]  ${scenarioId}: ${nodeCount} nodes synced${hasCheckItem ? ' [✓check_item]' : ''}`);
                success++;
            }
        } catch (e) {
            console.error(`  [ERR] ${scenarioId}: JSON parse failed - ${e.message}`);
            errors++;
        }
    }

    return { success, errors };
}

async function main() {
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const file of sqlFiles) {
        const result = await processFile(file);
        totalSuccess += result.success;
        totalErrors += result.errors;
    }

    console.log(`\n--- Summary ---`);
    console.log(`Total: ${totalSuccess + totalErrors} | Success: ${totalSuccess} | Errors: ${totalErrors}${dryRun ? ' (DRY RUN)' : ''}`);
    if (filterIds) console.log(`Filtered to IDs: ${filterIds.join(', ')}`);
}

main().catch(console.error);
