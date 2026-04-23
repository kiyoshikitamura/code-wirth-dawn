/**
 * CSVシナリオ → SQL UPDATE文 生成スクリプト
 * 
 * 使い方: node scripts/generate_scenario_sql.js > sql/sync_scenario_script_data.sql
 */
const fs = require('fs');
const path = require('path');

// csvScenarioLoader の parseParams + parseCsvToScenarioJson を直接埋め込み（Node.js用）

function parseParams(paramsStr) {
    if (!paramsStr || !paramsStr.trim()) return {};
    const trimmed = paramsStr.trim();
    if (trimmed.startsWith('{')) {
        try { return JSON.parse(trimmed); } catch (e) {}
    }
    const result = {};
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
        const colonIdx = part.indexOf(':');
        if (colonIdx > 0) {
            result[part.substring(0, colonIdx).trim()] = part.substring(colonIdx + 1).trim();
        }
    }
    return result;
}

function parseCsvRows(csvText) {
    const rows = [];
    const lines = csvText.split('\n');
    for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');
        if (!line.trim()) continue;
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
                    else { inQuotes = false; }
                } else { current += ch; }
            } else {
                if (ch === '"') { inQuotes = true; }
                else if (ch === ',') { fields.push(current); current = ''; }
                else { current += ch; }
            }
        }
        fields.push(current);
        rows.push(fields);
    }
    return rows;
}

function parseCsvToScenarioJson(csvText) {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) return { nodes: {}, meta: {} };
    const header = rows[0].map(h => h.trim().toLowerCase());
    const colIdx = {
        row_type: header.indexOf('row_type'),
        node_id: header.indexOf('node_id'),
        text_label: header.indexOf('text_label'),
        next_node: header.indexOf('next_node'),
        params: header.indexOf('params'),
    };
    const nodes = {};
    const meta = {};
    let currentNodeId = null;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowType = (row[colIdx.row_type] || '').trim().toUpperCase();
        const nodeId = (row[colIdx.node_id] || '').trim();
        const textLabel = (row[colIdx.text_label] || '').trim();
        const nextNode = (row[colIdx.next_node] || '').trim();
        const paramsStr = (row[colIdx.params] || '').trim();
        const params = parseParams(paramsStr);
        if (rowType === 'NODE') {
            currentNodeId = nodeId;
            const node = {};
            if (textLabel) node.text = textLabel.replace(/\\n/g, '\n');
            if (params.type) {
                node.type = params.type;
                if (params.type === 'end_success' || params.type === 'end') { node.type = 'end'; node.result = 'success'; }
                else if (params.type === 'end_failure') { node.type = 'end'; node.result = 'failure'; }
            }
            if (params.bg) node.bg_key = params.bg;
            if (params.bgm) node.bgm = params.bgm;
            if (params.enemy_group_id) node.enemy_group_id = String(params.enemy_group_id);
            else if (params.enemy) node.enemy_group_id = params.enemy;
            if (params.speaker_image_url) node.speaker_image_url = params.speaker_image_url;
            if (params.speaker_name) { node.speaker_name = params.speaker_name; node.speaker = params.speaker_name; }
            if (params.enemy_name) node.enemy_name = params.enemy_name;
            if (params.enemy_level) node.enemy_level = params.enemy_level;
            if (params.guest_id) { node.params = node.params || {}; node.params.guest_id = params.guest_id; }
            if (params.prob) node.prob = parseInt(String(params.prob), 10);
            const passthrough = ['item_id','quantity','remove_on_success','target_location_slug','hp_percent','hp_flat','flag','key','delta','value','threshold','operator','amount','location_name','items','gold','encounter_rate'];
            for (const k of passthrough) {
                if (params[k] !== undefined) { node.params = node.params || {}; node.params[k] = params[k]; }
            }
            if (nextNode) {
                if (nextNode === 'EXIT') { node.type = 'end'; node.result = 'success'; }
                else if (nextNode === 'EXIT_FAIL') { node.type = 'end'; node.result = 'failure'; }
                else if (params.type === 'battle') {
                    // battleノード: next_nodeはCHOICEグループID（choice2等）なのでnextに設定しない
                    // バトル遷移はCHOICE行のbattle_success_nextで処理される
                }
                else { node.next = nextNode; node.choices = [{ label: '続ける', next: nextNode }]; }
            }
            node.choices = node.choices || [];
            nodes[nodeId] = node;
        } else if (rowType === 'META') {
            // META行: node_idカラムにキー, text_labelカラムに値
            const metaKey = nodeId.toLowerCase();
            meta[metaKey] = textLabel;
        } else if (rowType === 'CHOICE' && currentNodeId) {
            const choice = { label: textLabel || '...', next: nextNode || currentNodeId };
            if (params.cost_gold) choice.cost_gold = parseInt(String(params.cost_gold), 10);
            if (params.cost_vitality) choice.cost_vitality = parseInt(String(params.cost_vitality), 10);
            if (params.req_card) choice.req_card = params.req_card;
            if (params.req_tag) choice.req_tag = params.req_tag;
            if (!nodes[currentNodeId].choices) nodes[currentNodeId].choices = [];
            // ★ CHOICE行追加時にauto-generated「続ける」を削除
            const existing = nodes[currentNodeId].choices;
            if (existing.length === 1 && existing[0].label === '続ける') {
                nodes[currentNodeId].choices = [];
            }
            nodes[currentNodeId].choices.push(choice);
            // ★ battleノードの場合、最初のCHOICE行のnextをbattle_success_nextに設定
            if (nodes[currentNodeId].type === 'battle' && !nodes[currentNodeId].battle_success_next) {
                nodes[currentNodeId].battle_success_next = choice.next;
            }
        }
    }
    return { nodes, meta };
}

// ── メイン ──

const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');
const outFile = path.join(__dirname, '..', 'sql', 'sync_scenario_script_data.sql');
const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv')).sort();

const lines = [];
lines.push('-- ============================================================');
lines.push('-- シナリオ script_data 同期SQL (自動生成)');
lines.push(`-- 生成日: ${new Date().toISOString().split('T')[0]}`);
lines.push('-- 対象: scenarios.script_data (JSONB) + rewards');
lines.push('-- ============================================================');
lines.push('');

let count = 0;
for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (!match) continue;
    const scenarioId = parseInt(match[1], 10);
    const csvText = fs.readFileSync(path.join(csvDir, file), 'utf-8');
    const json = parseCsvToScenarioJson(csvText);
    const nodeCount = Object.keys(json.nodes).length;
    if (nodeCount === 0) continue;

    // PostgreSQL用にシングルクォートをエスケープ
    const scriptData = { nodes: json.nodes };
    const jsonStr = JSON.stringify(scriptData).replace(/'/g, "''");

    lines.push(`-- ${file} (${nodeCount} nodes)`);

    // META行からrewards JSONBを生成
    const m = json.meta || {};
    let rewardsPart = '';
    if (m.gold || m.exp || m.reputation || m.move_to) {
        const rewards = {};
        if (m.gold) rewards.gold = parseInt(m.gold, 10);
        if (m.exp) rewards.exp = parseInt(m.exp, 10);
        if (m.reputation) rewards.reputation = parseInt(m.reputation, 10);
        if (m.move_to) rewards.move_to = m.move_to;
        const rewardsStr = JSON.stringify(rewards).replace(/'/g, "''");
        rewardsPart = `, rewards = '${rewardsStr}'::jsonb`;
    }

    lines.push(`UPDATE scenarios SET script_data = '${jsonStr}'::jsonb${rewardsPart} WHERE id = ${scenarioId};`);
    lines.push('');
    count++;
}

lines.push(`-- Total: ${count} scenarios updated`);

fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
console.log(`Generated ${outFile} (${count} scenarios, UTF-8)`);

