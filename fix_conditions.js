const fs = require('fs');
const path = require('path');

const DOCS_DIR = 'd:/dev/code-wirth-dawn/docs/quest';
const CSV_NORMAL = 'd:/dev/code-wirth-dawn/src/data/csv/quests_normal.csv';
const CSV_SPECIAL = 'd:/dev/code-wirth-dawn/src/data/csv/quests_special.csv';

// Use a proper regex to extract the JSON column since it's tricky with simple char readers
const specialLines = fs.readFileSync(CSV_SPECIAL, 'utf-8').trim().split('\n').filter(Boolean);
const reqMap = {};

// Spot scenarios
reqMap['6101'] = 'スポット専用: 発生条件未定義（[要定義]）';
reqMap['6102'] = 'スポット専用: 発生条件未定義（[要定義]）';
reqMap['6103'] = 'スポット専用: 発生条件未定義（[要定義]）';
reqMap['6104'] = 'スポット専用: 発生条件未定義（[要定義]）';

// Parse Normal
const normalLines = fs.readFileSync(CSV_NORMAL, 'utf-8').trim().split('\n').filter(Boolean);
for (let i = 1; i < normalLines.length; i++) {
    const r = normalLines[i].split(',');
    if (r.length < 11) continue;
    const id = r[0];
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

// Parse Special with regex
for (let i = 1; i < specialLines.length; i++) {
    const line = specialLines[i];
    const id = line.split(',')[0];
    // Find JSON string in quotes "{...}"
    const match = line.match(/"({.*?})"/);
    if (match) {
        let jsonStr = match[1].replace(/""/g, '"');
        try {
            const reqObj = JSON.parse(jsonStr);
            const conditions = [];
            if (reqObj.completed_quest) conditions.push(`前提クエストクリア: ${reqObj.completed_quest}`);
            if (reqObj.nation_id) conditions.push(`必須滞在拠点: ${reqObj.nation_id}`);
            if (reqObj.min_level) conditions.push(`プレイヤーLv ${reqObj.min_level}以上`);
            if (reqObj.min_reputation) conditions.push(`名声 ${reqObj.min_reputation}以上`);
            if (reqObj.max_reputation) conditions.push(`名声 ${reqObj.max_reputation}以下`);
            if (reqObj.min_prosperity) conditions.push(`繁栄度 ${reqObj.min_prosperity}以上`);
            if (reqObj.max_prosperity) conditions.push(`繁栄度 ${reqObj.max_prosperity}以下`);
            if (reqObj.align_evil) conditions.push(`アライメント属性: 悪(Evil)`);
            if (reqObj.min_align_order) conditions.push(`属性・秩序(Order) ${reqObj.min_align_order}以上`);
            if (reqObj.min_align_chaos) conditions.push(`属性・混沌(Chaos) ${reqObj.min_align_chaos}以上`);
            if (reqObj.require_item_id) conditions.push(`必要アイテム所持: ID ${reqObj.require_item_id}`);
            if (reqObj.required_generations) conditions.push(`引退世代数 ${reqObj.required_generations}以上`);
            if (reqObj.event_trigger) conditions.push(`ワールドイベント発生対象: ${reqObj.event_trigger}`);
            
            reqMap[id] = conditions.length > 0 ? conditions.join(' / ') : '特になし（常時）';
        } catch (e) {
            reqMap[id] = '条件JSONのパースに失敗';
        }
    } else {
        reqMap[id] = '特になし（常時）';
    }
}

// Overwrite the docs
const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
    const idMatch = file.match(/quest_(\d{4})/);
    if (!idMatch) continue;
    const id = idMatch[1];
    const condition = reqMap[id] || '特になし（常時）';
    
    const filePath = path.join(DOCS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace existing row
    content = content.replace(/\|\s*\*\*出現条件\*\*.*?\|\n/, `| **出現条件** | ${condition} |\n`);
    
    fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('Fixed conditions and formatted correctly.');
