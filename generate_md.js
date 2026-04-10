const fs = require('fs');
const path = require('path');

const CSV_SPECIAL_PATH = 'd:/dev/code-wirth-dawn/src/data/csv/quests_special.csv';
const SCENARIO_DIR = 'd:/dev/code-wirth-dawn/src/data/csv/scenarios';
const DOCS_DIR = 'd:/dev/code-wirth-dawn/docs/quest';

// Basic CSV parser for headers
function parseCsvLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField);
    return fields;
}

// 1. Read Master Data
const masterDataArr = fs.readFileSync(CSV_SPECIAL_PATH, 'utf-8').trim().split('\n').filter(Boolean);
const masterHeaders = parseCsvLine(masterDataArr[0].trim());
const masterMap = {};

for (let i = 1; i < masterDataArr.length; i++) {
    const row = parseCsvLine(masterDataArr[i].trim());
    const id = row[0];
    if (id) {
        masterMap[id] = {
            id: id,
            slug: row[1],
            title: row[2],
            rec_level: row[3],
            difficulty: row[4],
            time_cost: row[5],
            requirements: row[6],
            client_name: row[10],
            _comment: row[11],
            rewards_summary: row[9] || ''
        };
    }
}

// 2. Read Scenarios and Generate MD
const scenarioFiles = fs.readdirSync(SCENARIO_DIR).filter(f => f.match(/^(60|80)\d{2}.*\.csv$/));

for (const file of scenarioFiles) {
    const idMatch = file.match(/^(\d{4})/);
    if (!idMatch) continue;
    const id = idMatch[1];
    
    const meta = masterMap[id] || {
        slug: 'unknown_slug',
        title: '不明なタイトル',
        rec_level: '?',
        difficulty: '?',
        client_name: '?',
        _comment: '詳細なし',
        rewards_summary: '?'
    };

    const isBoss = id.startsWith('80');
    const qType = isBoss ? 'ボス討伐（Boss）' : 'メインエピソード（Main）';

    // Parse scenario file
    const scenPath = path.join(SCENARIO_DIR, file);
    const scenRows = fs.readFileSync(scenPath, 'utf-8').trim().split('\n').filter(Boolean).slice(1);
    
    let nodesText = '';
    let flowText = 'start\n';
    
    for (const line of scenRows) {
        const row = parseCsvLine(line.trim());
        const row_type = row[0];
        const node_id = row[1];
        const text_label = row[2];
        const next_node = isBoss ? row[4] : row[3]; // columns might differ, but let's assume index 3 or 4
        let params = isBoss ? row[3] : row[4];
        if (!params) params = '';
        
        // Clean params
        params = params.replace(/^"(.*)"$/, '$1');

        if (row_type === 'NODE') {
            flowText += `  └─ ${node_id}\n`;
            
            // Generate node block
            nodesText += `#### \`${node_id || 'unknown'}\`\n`;
            nodesText += `**演出パラメータ:**\n`;
            nodesText += `- **BGM**: \`[要定義]\`\n`;
            nodesText += `- **SE**: \`[要定義]\`\n`;
            nodesText += `- **背景画像**: \`[要定義]\`\n\n`;
            
            if (params.includes('type:battle') || params.includes('"type":"battle"')) {
                // Battle node
                nodesText += `| 設定 | 値 |\n|-----|-----|\n`;
                const enemyMatch = params.match(/enemy_group_id":?"?([^",}]+)/);
                const enemy = enemyMatch ? enemyMatch[1] : '[要定義:敵グループ]';
                nodesText += `| 敵グループ | \`${enemy}\` |\n\n`;
                nodesText += `**テキスト:**\n\`\`\`\n${text_label}\n\`\`\`\n`;
                nodesText += `**params:**\n\`\`\`json\n${params}\n\`\`\`\n\n---\n\n`;
            } else {
                nodesText += `**テキスト:**\n\`\`\`\n${text_label}\n\`\`\`\n`;
                if (next_node) nodesText += `**次ノード:** \`${next_node}\` (auto-advance)\n`;
                nodesText += `**params:**\n\`\`\`json\n${params}\n\`\`\`\n\n---\n\n`;
            }
        } else if (row_type === 'CHOICE') {
            flowText += `      ├─[${text_label}]→ ${next_node || 'N/A'}\n`;
        }
    }

    const mdContent = `# クエスト仕様書：${id} — ${meta.title}

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | ${id} |
| **Slug** | \`${meta.slug}\` |
| **クエスト種別** | ${qType} |
| **推奨レベル** | ${meta.rec_level} |
| **難度** | ${meta.difficulty} |
| **依頼主** | ${meta.client_name} |
| **サムネイル画像** | \`[要定義: クエストボード用のサムネイル (例: /img/quests/${id}_${meta.slug}.webp)]\` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
\`\`\`
${meta._comment}
\`\`\`

### 長文説明
\`\`\`
[要定義: フレーバーテキスト]
\`\`\`

---

## 2. 報酬定義

**CSV記載形式:**
\`\`\`
${meta.rewards_summary}
\`\`\`

---

## 3. シナリオノード構成

### 簡易フロー
\`\`\`text
${flowText}\`\`\`

### ノード詳細

${nodesText}
`;

    const outPath = path.join(DOCS_DIR, `quest_${id}_${meta.slug}.md`);
    fs.writeFileSync(outPath, mdContent, 'utf-8');
}

console.log('Processed 6000s/8000s quests successfully.');

// Rename 610(1..4) Spot Scenarios
const spots = [
    {old: 'scenario_01_roland.md', new: 'quest_6101_spot_roland.md'},
    {old: 'scenario_02_yato.md', new: 'quest_6102_spot_yato.md'},
    {old: 'scenario_03_karyu.md', new: 'quest_6103_spot_karyu.md'},
    {old: 'scenario_04_markand.md', new: 'quest_6104_spot_markand.md'}
];

for(const p of spots) {
    const oldP = path.join(DOCS_DIR, p.old);
    const newP = path.join(DOCS_DIR, p.new);
    if(fs.existsSync(oldP)) {
        fs.renameSync(oldP, newP);
    }
}
console.log('Renamed spot scenarios successfully.');
