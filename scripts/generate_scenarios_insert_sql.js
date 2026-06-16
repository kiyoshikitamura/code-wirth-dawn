const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// 1. Parse success/failure days from 20260616000002_update_scenarios_days.sql
const daysSqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260616000002_update_scenarios_days.sql');
const daysSqlContent = fs.readFileSync(daysSqlPath, 'utf-8');
const daysMap = {};
const daysRegex = /UPDATE scenarios SET days_success = (\d+), days_failure = (\d+) WHERE id = (\d+);/g;
let match;
while ((match = daysRegex.exec(daysSqlContent)) !== null) {
    const days_success = parseInt(match[1], 10);
    const days_failure = parseInt(match[2], 10);
    const id = parseInt(match[3], 10);
    daysMap[id] = { days_success, days_failure };
}
console.log(`Parsed days mappings for ${Object.keys(daysMap).length} scenarios.`);

// 2. Scenario script CSV parser (same logic as generate_scenario_sql.js)
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
                if (params.type === 'end_success') { node.type = 'end'; node.result = 'success'; }
                else if (params.type === 'end_failure') { node.type = 'end'; node.result = 'failure'; }
                else if (params.type === 'end') { node.type = 'end'; node.result = params.result || 'success'; }
            }
            if (params.bg) node.bg_key = params.bg;
            if (params.bgm) node.bgm = params.bgm;
            if (params.enemy_group_id) node.enemy_group_id = String(params.enemy_group_id);
            else if (params.enemy) node.enemy_group_id = params.enemy;
            if (params.speaker_image_url) node.speaker_image_url = params.speaker_image_url;
            if (params.speaker_name || params.speaker) {
                node.speaker_name = params.speaker_name || params.speaker;
                node.speaker = params.speaker_name || params.speaker;
            }
            if (params.enemy_name) node.enemy_name = params.enemy_name;
            if (params.enemy_level) node.enemy_level = params.enemy_level;
            if (params.guest_id) {
                node.params = node.params || {};
                node.params.guest_id = params.guest_id;
                if (params.is_escort_target) {
                    node.params.is_escort_target = true;
                }
            }
            if (params.prob) node.prob = parseInt(String(params.prob), 10);
            if (params.cond) node.cond = params.cond;
            if (params.next) node.condNext = params.next;
            if (params.fallback) node.condFallback = params.fallback;
            if (params.req_stat) node.req_stat = params.req_stat;
            if (params.req_val) node.req_val = parseInt(String(params.req_val), 10);

            const passthrough = ['item_id','quantity','remove_on_success','target_location_slug','hp_percent','hp_flat','percent','flag','key','delta','value','threshold','operator','amount','location_name','items','gold','success_node','fail_node','encounter_rate','fallback','rewards'];
            for (const k of passthrough) {
                if (params[k] !== undefined) { node.params = node.params || {}; node.params[k] = params[k]; }
            }
            if (nextNode) {
                if (nextNode === 'EXIT') { node.type = 'end'; node.result = 'success'; }
                else if (nextNode === 'EXIT_FAIL') { node.type = 'end'; node.result = 'failure'; }
                else if (params.type === 'battle') {
                    // battle node transition is handled by choice
                }
                else { node.next = nextNode; node.choices = [{ label: '続ける', next: nextNode }]; }
            }
            node.choices = node.choices || [];
            nodes[nodeId] = node;
        } else if (rowType === 'META') {
            const metaKey = nodeId.toLowerCase();
            meta[metaKey] = textLabel;
        } else if (rowType === 'CHOICE' && currentNodeId) {
            const choice = { label: textLabel || '...', next: nextNode || currentNodeId };
            if (params.cost_gold) choice.cost_gold = parseInt(String(params.cost_gold), 10);
            if (params.cost_vitality) choice.cost_vitality = parseInt(String(params.cost_vitality), 10);
            if (params.req_card) choice.req_card = params.req_card;
            if (params.req_tag) choice.req_tag = params.req_tag;
            if (!nodes[currentNodeId].choices) nodes[currentNodeId].choices = [];
            const existing = nodes[currentNodeId].choices;
            if (existing.length === 1 && existing[0].label === '続ける') {
                nodes[currentNodeId].choices = [];
            }
            nodes[currentNodeId].choices.push(choice);
            if (nodes[currentNodeId].type === 'battle' && !nodes[currentNodeId].battle_success_next) {
                nodes[currentNodeId].battle_success_next = choice.next;
            }
        }
    }
    return { nodes, meta };
}

// 3. Load all scenario scripts from src/data/csv/scenarios/
const allScriptData = {};
const scenarioDir = path.join(process.cwd(), 'src', 'data', 'csv', 'scenarios');
if (fs.existsSync(scenarioDir)) {
    const files = fs.readdirSync(scenarioDir).filter(f => f.endsWith('.csv'));
    for (const file of files) {
        const questId = file.split('_')[0];
        if (!questId || isNaN(Number(questId))) continue;
        const csvText = fs.readFileSync(path.join(scenarioDir, file), 'utf-8');
        const json = parseCsvToScenarioJson(csvText);
        allScriptData[questId] = json;
    }
}
console.log(`Loaded ${Object.keys(allScriptData).length} scenario scripts.`);

// 4. Function to process a single CSV record
function processRecord(r, type) {
    const id = parseInt(r.id, 10);
    const slug = r.slug;
    const title = r.title;
    const description = r._comment || r.title;
    const difficulty = parseInt(r.difficulty, 10) || 1;
    const rec_level = parseInt(r.rec_level, 10) || 1;
    const time_cost = parseInt(r.time_cost, 10) || 1;
    const is_urgent = r.is_urgent === 'true' || r.is_urgent === true || r.is_urgent === '1';
    
    // Parse rewards_summary
    const rewards = { gold: 0, items: [] };
    if (r.rewards_summary) {
        const rews = r.rewards_summary.split('|');
        rews.forEach(rew => {
            const [t, val] = rew.split(':');
            if (t === 'Gold') rewards.gold = parseInt(val, 10);
            else if (t === 'Item') {
                const num = parseInt(val, 10);
                rewards.items.push(isNaN(num) ? val : num);
            }
            else if (t === 'Rep') rewards.reputation = parseInt(val, 10);
            else if (['Order', 'Chaos', 'Justice', 'Evil'].includes(t)) {
                if (!rewards.alignment_shift) rewards.alignment_shift = {};
                rewards.alignment_shift[t.toLowerCase()] = parseInt(val, 10);
            } else if (t === 'Vitality') rewards.vitality_cost = parseInt(val, 10);
            else if (t === 'NPC') rewards.npc_reward = parseInt(val, 10);
            else if (t === 'Move' || t === 'move_to') rewards.move_to = val;
            else if (t === 'Exp') rewards.exp = parseInt(val, 10);
        });
    }

    // Parse scenario script nodes and merge rewards meta
    const parsedScript = allScriptData[String(id)] || null;
    if (parsedScript && parsedScript.meta) {
        const m = parsedScript.meta;
        if (m.gold) rewards.gold = parseInt(m.gold, 10);
        if (m.exp) rewards.exp = parseInt(m.exp, 10);
        if (m.reputation) rewards.reputation = parseInt(m.reputation, 10);
        if (m.move_to) rewards.move_to = m.move_to;
    }

    const script_data = {
        nodes: parsedScript ? parsedScript.nodes : {},
        short_description: r._comment || r.title
    };

    // Requirements
    let requirements = {};
    if (type === 'special' && r.requirements) {
        try { requirements = JSON.parse(r.requirements); } catch (e) {}
    }

    // Location tags
    let location_tags = [];
    if (type === 'normal' && r.location_tags) {
        location_tags = r.location_tags.split('|').map(t => t.trim()).filter(Boolean);
    }

    // Conditions JSONB
    const conditions = type === 'normal' ? {
        location_tags: location_tags.length > 0 ? location_tags : undefined,
        min_prosperity: r.min_prosperity ? Number(r.min_prosperity) : undefined,
        max_prosperity: r.max_prosperity ? Number(r.max_prosperity) : undefined,
        min_reputation: r.min_reputation ? Number(r.min_reputation) : undefined,
        max_reputation: r.max_reputation ? Number(r.max_reputation) : undefined,
        completed_quest: r.completed_quest || undefined,
    } : requirements;

    // Get days from our daysMap
    const days = daysMap[id] || { days_success: 1, days_failure: 1 };

    return {
        id,
        slug,
        title,
        description,
        client_name: r.client_name || '冒険者ギルド',
        difficulty,
        rec_level,
        time_cost,
        rewards,
        is_urgent,
        quest_type: type,
        requirements,
        location_tags,
        conditions,
        script_data,
        days_success: days.days_success,
        days_failure: days.days_failure
    };
}

// 5. Load CSV files
const csvDirRoot = path.join(process.cwd(), 'src', 'data', 'csv');
const normalCsv = fs.readFileSync(path.join(csvDirRoot, 'quests_normal.csv'), 'utf-8');
const specialCsv = fs.readFileSync(path.join(csvDirRoot, 'quests_special.csv'), 'utf-8');

const normalRecords = parse(normalCsv, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });
const specialRecords = parse(specialCsv, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });

const processedScenarios = [];
for (const r of normalRecords) {
    processedScenarios.push(processRecord(r, 'normal'));
}
for (const r of specialRecords) {
    processedScenarios.push(processRecord(r, 'special'));
}

console.log(`Processed ${processedScenarios.length} scenarios for SQL generation.`);

// 6. Generate SQL queries
const sqlLines = [];
sqlLines.push('-- ============================================================');
sqlLines.push('-- Wirth-Dawn Master Scenario Insertion SQL (Auto-Generated)');
sqlLines.push(`-- Generated At: ${new Date().toISOString()}`);
sqlLines.push('-- ============================================================');
sqlLines.push('');

for (const sc of processedScenarios) {
    sqlLines.push(`-- Scenario ${sc.id}: ${sc.title} (${sc.slug})`);
    
    // JSON strings serialization
    const scriptDataStr = JSON.stringify(sc.script_data).replace(/'/g, "''");
    const rewardsStr = JSON.stringify(sc.rewards).replace(/'/g, "''");
    const conditionsStr = JSON.stringify(sc.conditions).replace(/'/g, "''");
    const requirementsStr = JSON.stringify(sc.requirements).replace(/'/g, "''");
    
    // Postgres array format for location_tags
    const locationTagsStr = sc.location_tags.length > 0 
        ? `ARRAY[${sc.location_tags.map(t => `'${t}'`).join(', ')}]::text[]` 
        : `ARRAY[]::text[]`;

    sqlLines.push(`INSERT INTO scenarios (
    id, slug, title, description, client_name, difficulty, rec_level, time_cost,
    rewards, is_urgent, quest_type, requirements, location_tags, conditions,
    script_data, days_success, days_failure
) VALUES (
    ${sc.id},
    '${sc.slug}',
    '${sc.title.replace(/'/g, "''")}',
    '${sc.description.replace(/'/g, "''")}',
    '${sc.client_name.replace(/'/g, "''")}',
    ${sc.difficulty},
    ${sc.rec_level},
    ${sc.time_cost},
    '${rewardsStr}'::jsonb,
    ${sc.is_urgent},
    '${sc.quest_type}',
    '${requirementsStr}'::jsonb,
    ${locationTagsStr},
    '${conditionsStr}'::jsonb,
    '${scriptDataStr}'::jsonb,
    ${sc.days_success},
    ${sc.days_failure}
) ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    client_name = EXCLUDED.client_name,
    difficulty = EXCLUDED.difficulty,
    rec_level = EXCLUDED.rec_level,
    time_cost = EXCLUDED.time_cost,
    rewards = EXCLUDED.rewards,
    is_urgent = EXCLUDED.is_urgent,
    quest_type = EXCLUDED.quest_type,
    requirements = EXCLUDED.requirements,
    location_tags = EXCLUDED.location_tags,
    conditions = EXCLUDED.conditions,
    script_data = EXCLUDED.script_data,
    days_success = EXCLUDED.days_success,
    days_failure = EXCLUDED.days_failure;
`);
}

const outMigrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260616000003_insert_all_scenarios.sql');
fs.writeFileSync(outMigrationPath, sqlLines.join('\n'), 'utf-8');
console.log(`Successfully generated migration file: ${outMigrationPath}`);
