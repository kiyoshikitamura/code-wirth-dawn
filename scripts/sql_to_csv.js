/**
 * scripts/sql_to_csv.js
 *
 * scenario_6011_6015.sql / scenario_6016_6020.sql のJSONデータを
 * CSVフォーマットに変換して src/data/csv/scenarios/ に書き出す。
 *
 * Usage: node scripts/sql_to_csv.js
 */
const fs = require('fs');
const path = require('path');

const SQL_FILES = [
    'scenario_6011_6015.sql',
    'scenario_6016_6020.sql',
];

// CSV slug マッピング
const SLUG_MAP = {
    6011: 'main_ep11', 6012: 'main_ep12', 6013: 'main_ep13', 6014: 'main_ep14', 6015: 'main_ep15',
    6016: 'main_ep16', 6017: 'main_ep17', 6018: 'main_ep18', 6019: 'main_ep19', 6020: 'main_ep20',
};

const CSV_DIR = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');

function escapeCSV(str) {
    if (!str) return '';
    // CSV: ダブルクォートを含む場合はエスケープ
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function buildParamsString(node) {
    const p = {};
    p.type = node.type || 'text';

    if (node.bg_key) p.bg = node.bg_key;
    if (node.bgm) p.bgm = node.bgm;
    if (node.speaker_name) p.speaker_name = node.speaker_name;
    if (node.speaker_image_url) p.speaker_image_url = node.speaker_image_url;

    // Battle specific
    if (node.enemy_group_id) p.enemy_group_id = node.enemy_group_id;

    // Guest join
    if (node.params?.guest_id) p.guest_id = node.params.guest_id;

    // check_item specific
    if (node.type === 'check_item' && node.params) {
        p.type = 'check_item';
        p.items = node.params.items;
        p.success_node = node.params.success_node;
        p.fail_node = node.params.fail_node;
    }

    // End type mapping
    if (node.type === 'end') {
        const result = node.params?.result || node.result || 'success';
        p.type = result === 'failure' ? 'end_failure' : 'end_success';
        if (node.params?.bg) p.bg = node.params.bg;
    }

    // Serialize: CSV内ではダブルクォートを2重にする
    const jsonStr = JSON.stringify(p);
    // CSV内のJSONは ""key"":""val"" 形式
    return '"' + jsonStr.replace(/"/g, '""') + '"';
}

function jsonToCSV(scenarioId, scriptData, rewards) {
    const lines = [];
    lines.push('row_type,node_id,text_label,params,next_node');

    // META rows
    if (rewards.gold) lines.push(`META,gold,${rewards.gold},,`);
    if (rewards.exp) lines.push(`META,exp,${rewards.exp},,`);
    if (rewards.reputation) lines.push(`META,reputation,${rewards.reputation},,`);

    const nodes = scriptData.nodes;

    // ノードの順序を推定: startから辿る
    const visited = new Set();
    const orderedIds = [];

    function traverse(nodeId) {
        if (!nodeId || visited.has(nodeId) || !nodes[nodeId]) return;
        visited.add(nodeId);
        orderedIds.push(nodeId);
        const node = nodes[nodeId];

        // 分岐先を先に処理
        if (node.type === 'check_item' && node.params) {
            traverse(node.params.success_node);
            traverse(node.params.fail_node);
        }

        // next を辿る
        if (node.next) traverse(node.next);

        // battle_success_next
        if (node.battle_success_next) traverse(node.battle_success_next);

        // choices を辿る
        if (node.choices) {
            for (const c of node.choices) {
                if (c.next) traverse(c.next);
            }
        }
    }

    traverse('start');

    // 未到達ノードも追加（end_failure等）
    for (const id of Object.keys(nodes)) {
        if (!visited.has(id)) {
            orderedIds.push(id);
        }
    }

    for (const nodeId of orderedIds) {
        const node = nodes[nodeId];
        if (!node) continue;

        const text = escapeCSV(node.text || '');
        const params = buildParamsString(node);

        // next_node の決定
        let nextNode = '';
        if (node.type === 'battle') {
            nextNode = node.battle_success_next || node.next || '';
        } else if (node.type === 'check_item') {
            // check_item は params 内で分岐先指定、next_node は success_node を指す
            nextNode = node.params?.success_node || node.next || '';
        } else if (node.type === 'end') {
            nextNode = '';
        } else {
            nextNode = node.next || '';
        }

        lines.push(`NODE,${nodeId},${text},${params},${nextNode}`);

        // CHOICE rows for battle nodes
        if (node.type === 'battle' && node.choices && node.choices.length > 0) {
            for (const c of node.choices) {
                if (c.label && c.label !== '続ける') {
                    lines.push(`CHOICE,,${escapeCSV(c.label)},,${c.next || nextNode}`);
                }
            }
            // Default battle choice
            if (!node.choices.some(c => c.label && c.label !== '続ける')) {
                lines.push(`CHOICE,,${escapeCSV(node.choices[0]?.label || '続ける')},,${node.choices[0]?.next || nextNode}`);
            }
        }
    }

    return lines.join('\n') + '\n';
}

function main() {
    let count = 0;

    for (const sqlFile of SQL_FILES) {
        const sqlPath = path.join(__dirname, '..', 'sql', sqlFile);
        if (!fs.existsSync(sqlPath)) {
            console.error(`[SKIP] ${sqlFile} not found`);
            continue;
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
        const updateRegex = /UPDATE\s+scenarios\s+SET\s+script_data\s*=\s*'(.+?)'::jsonb\s*,\s*rewards\s*=\s*'(.+?)'::jsonb\s+WHERE\s+id\s*=\s*(\d+);/gs;

        let match;
        while ((match = updateRegex.exec(sqlContent)) !== null) {
            const scriptData = JSON.parse(match[1]);
            const rewards = JSON.parse(match[2]);
            const scenarioId = parseInt(match[3], 10);
            const slug = SLUG_MAP[scenarioId];

            if (!slug) {
                console.warn(`[SKIP] No slug for ${scenarioId}`);
                continue;
            }

            const csvContent = jsonToCSV(scenarioId, scriptData, rewards);
            const csvPath = path.join(CSV_DIR, `${scenarioId}_${slug}.csv`);
            fs.writeFileSync(csvPath, csvContent, 'utf-8');

            const nodeCount = Object.keys(scriptData.nodes).length;
            console.log(`[OK] ${scenarioId}_${slug}.csv (${nodeCount} nodes)`);
            count++;
        }
    }

    console.log(`\nGenerated ${count} CSV files.`);
}

main();
