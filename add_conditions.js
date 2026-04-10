const fs = require('fs');
const path = require('path');

const DOCS_DIR = 'd:/dev/code-wirth-dawn/docs/quest';
const CSV_NORMAL = 'd:/dev/code-wirth-dawn/src/data/csv/quests_normal.csv';
const CSV_SPECIAL = 'd:/dev/code-wirth-dawn/src/data/csv/quests_special.csv';

function parseCsv(content) {
    const lines = content.trim().split('\n');
    return lines.map(line => {
        const fields = [];
        let curr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) { fields.push(curr); curr = ''; }
            else curr += line[i];
        }
        fields.push(curr);
        return fields;
    });
}

const reqMap = {};

// Parse Normal Quests
const normalRows = parseCsv(fs.readFileSync(CSV_NORMAL, 'utf-8'));
for (let i = 1; i < normalRows.length; i++) {
    const r = normalRows[i];
    if (r.length < 11) continue;
    const id = r[0];
    const trigger = r[6]; // Wait, in quests_normal trigger is column 6? Let's check CSV
    // location_tags is 6, min_prosperity 7, max 8, min_reputation 9, max 10
    const minP = r[7];
    const maxP = r[8];
    const minR = r[9];
    const maxR = r[10];

    const conditions = [];
    if (minP) conditions.push(`繁栄度 ${minP}以上`);
    if (maxP) conditions.push(`繁栄度 ${maxP}以下`);
    if (minR) conditions.push(`名声 ${minR}以上`);
    if (maxR) conditions.push(`名声 ${maxR}以下`);
    
    reqMap[id] = conditions.length > 0 ? conditions.join(', ') : '特になし（常時）';
}

// Parse Special/Main Quests
const specialRows = parseCsv(fs.readFileSync(CSV_SPECIAL, 'utf-8'));
for (let i = 1; i < specialRows.length; i++) {
    const r = specialRows[i];
    if (r.length < 7) continue;
    const id = r[0];
    let reqStr = r[6];
    
    if (!reqStr || reqStr === '') {
        reqMap[id] = '特になし（常時）';
        continue;
    }
    
    try {
        reqStr = reqStr.replace(/^"(.*)"$/, '$1'); 
        reqStr = reqStr.replace(/""/g, '"');
        const reqObj = JSON.parse(reqStr);
        const conditions = [];
        
        if (reqObj.completed_quest) conditions.push(`前提クエストクリア: ${reqObj.completed_quest}`);
        if (reqObj.nation_id) conditions.push(`拠点: ${reqObj.nation_id}`);
        if (reqObj.min_level) conditions.push(`プレイヤーLv ${reqObj.min_level}以上`);
        if (reqObj.min_reputation) conditions.push(`名声 ${reqObj.min_reputation}以上`);
        if (reqObj.max_reputation) conditions.push(`名声 ${reqObj.max_reputation}以下`);
        if (reqObj.min_prosperity) conditions.push(`繁栄度 ${reqObj.min_prosperity}以上`);
        if (reqObj.max_prosperity) conditions.push(`繁栄度 ${reqObj.max_prosperity}以下`);
        if (reqObj.align_evil) conditions.push(`アライメント（属性）: 悪 (Evil)`);
        if (reqObj.min_align_order) conditions.push(`属性・秩序(Order) ${reqObj.min_align_order}以上`);
        if (reqObj.min_align_chaos) conditions.push(`属性・混沌(Chaos) ${reqObj.min_align_chaos}以上`);
        if (reqObj.require_item_id) conditions.push(`必要アイテム所持: ID ${reqObj.require_item_id}`);
        if (reqObj.required_generations) conditions.push(`引退世代数 ${reqObj.required_generations}以上`);
        if (reqObj.event_trigger) conditions.push(`ワールドイベント発生時: ${reqObj.event_trigger}`);
        
        reqMap[id] = conditions.length > 0 ? conditions.join(', ') : reqStr;
    } catch (e) {
        reqMap[id] = reqStr;
    }
}

reqMap['6101'] = 'スポット専用: 発生条件未定義（[要定義]）';
reqMap['6102'] = 'スポット専用: 発生条件未定義（[要定義]）';
reqMap['6103'] = 'スポット専用: 発生条件未定義（[要定義]）';
reqMap['6104'] = 'スポット専用: 発生条件未定義（[要定義]）';

const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
    const match = file.match(/quest_(\d{4})/);
    if (!match) continue;
    
    const id = match[1];
    let condition = reqMap[id] || '特になし（常時）';
    
    const filePath = path.join(DOCS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content.includes('**出現条件**')) {
        // Find | **サムネイル画像** | ...
        content = content.replace(/(\|\s*\*\*サムネイル画像\*\*.*?\n)/, `| **出現条件** | ${condition} |\n$1`);
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

console.log('Fixed requirements insertion.');
