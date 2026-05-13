/**
 * Generate quest catalog MD for playtesting.
 * Outputs 3 tables: A (basic+balance), B (scenario structure), C (data refs).
 */
const fs = require('fs');
const path = require('path');
const csvLib = require('./lib/csv-parser');

const SCENARIO_DIR = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');
const QUEST_DIR = path.join(__dirname, '..', 'docs', 'quest');

// Load quest CSVs
const qNormal = csvLib.parseCSV(path.join(csvLib.DATA_DIR, 'quests_normal.csv'));
const qSpecial = csvLib.parseCSV(path.join(csvLib.DATA_DIR, 'quests_special.csv'));
const allQuests = [...qNormal.map(q => ({...q, src: 'normal'})), ...qSpecial.map(q => ({...q, src: 'special'}))];

// Load scenario files
const scenarioFiles = fs.readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.csv') && !f.startsWith('8'));

// Region map by ID prefix
function getRegion(id) {
  const n = parseInt(id);
  if (n >= 5101 && n <= 5104) return 'Rep T1（各地方）';
  if (n >= 5111 && n <= 5114) return 'Rep T2（各地方）';
  if (n >= 5201 && n <= 5207) return 'Rep Boss';
  if (n >= 6001 && n <= 6020) return 'メイン';
  if (n >= 6101 && n <= 6104) return 'スポット';
  if (n >= 6105 && n <= 6111) return '伝説級';
  if (n >= 7001 && n <= 7008) return '汎用';
  if (n >= 7010 && n <= 7015) return 'ローラン';
  if (n >= 7020 && n <= 7025) return 'マルカンド';
  if (n >= 7030 && n <= 7035) return '夜刀';
  if (n >= 7040 && n <= 7045) return '華龍';
  return '不明';
}

function getCategory(id) {
  const n = parseInt(id);
  if (n >= 5101 && n <= 5114) return 'Rep地方';
  if (n >= 5201 && n <= 5207) return 'Rep Boss';
  if (n >= 6001 && n <= 6020) return 'メイン';
  if (n >= 6101 && n <= 6104) return 'スポット';
  if (n >= 6105 && n <= 6111) return '伝説級';
  if (n >= 7001 && n <= 7008) return '汎用';
  if (n >= 7010 && n <= 7045) return '地方';
  return '不明';
}

// Parse each scenario CSV for structure info
function analyzeScenario(filename) {
  const nodes = csvLib.parseScenarioCSV(filename);
  const nodeRows = nodes.filter(n => n.rowType === 'NODE');
  const choiceRows = nodes.filter(n => n.rowType === 'CHOICE');

  let battles = 0, choices = 0, ends = 0;
  const bgs = new Set();
  const groups = [];
  let maxTextLen = 0;
  let maxTextNode = '';

  for (const n of nodeRows) {
    const t = n.parsedParams?.type || 'text';
    if (t === 'battle') battles++;
    if (t === 'choice') choices++;
    if (t === 'end') ends++;
    if (n.parsedParams?.bg) bgs.add(n.parsedParams.bg);
    if (n.parsedParams?.enemy_group_id) {
      const gid = n.parsedParams.enemy_group_id;
      if (!groups.includes(String(gid))) groups.push(String(gid));
    }
    if (n.textLabel) {
      const len = [...n.textLabel].length;
      if (len > maxTextLen) { maxTextLen = len; maxTextNode = n.nodeId; }
    }
  }

  return {
    totalNodes: nodeRows.length,
    battles,
    choices,
    ends,
    bgs: [...bgs],
    groups,
    maxTextLen,
    maxTextNode
  };
}

// Build quest data
const questData = [];

for (const sf of scenarioFiles) {
  const idMatch = sf.match(/^(\d+)_/);
  if (!idMatch) continue;
  const questId = idMatch[1];

  // Find in quest CSVs
  const qEntry = allQuests.find(q => q.id === questId || q.quest_id === questId);

  // Find MD file
  const mdFiles = fs.readdirSync(QUEST_DIR).filter(f => f.startsWith('quest_' + questId));
  const hasMD = mdFiles.length > 0;

  // Analyze scenario
  const scenario = analyzeScenario(sf);

  const name = qEntry?.title || sf.replace('.csv', '').replace(/^\d+_/, '').replace(/_/g, ' ');
  const level = qEntry?.rec_level || '-';
  const diff = qEntry?.difficulty || '-';
  const timeCost = qEntry?.time_cost || '-';

  // Parse rewards
  const rewardStr = qEntry?.rewards_summary || '-';

  const minRep = qEntry?.min_reputation || '-';
  const maxRep = qEntry?.max_reputation || '-';
  let condition = '-';
  if (minRep !== '-' || maxRep !== '-') {
    condition = 'Rep ' + minRep + (maxRep !== '-' ? '~' + maxRep : '+');
  }

  questData.push({
    id: questId,
    name,
    category: getCategory(questId),
    region: getRegion(questId),
    level,
    diff,
    timeCost,
    rewardStr,
    condition,
    csvFile: sf,
    mdFile: hasMD ? mdFiles[0] : '❌なし',
    ...scenario
  });
}

// Sort by ID
questData.sort((a, b) => parseInt(a.id) - parseInt(b.id));

// Generate MD
let md = '# クエスト一覧 — テストプレイ用カタログ\n\n';
md += '> 自動生成: ' + new Date().toISOString().split('T')[0] + '  \n';
md += '> 対象: シナリオCSV ' + questData.length + '本（8xxx レガシー除外）\n\n';
md += '---\n\n';

// Table A: Basic + Balance
md += '## 表A: クエスト基本情報・バランス\n\n';
md += '| ID | クエスト名 | カテゴリ | 地域 | 推奨Lv | 難度 | 日数 | 報酬 |\n';
md += '|:---:|-----------|:-------:|:----:|:-----:|:---:|:---:|------|\n';
for (const q of questData) {
  md += '| ' + q.id + ' | ' + q.name + ' | ' + q.category + ' | ' + q.region + ' | ' + q.level + ' | ' + q.diff + ' | ' + q.timeCost + ' | ' + q.rewardStr + ' |\n';
}

md += '\n---\n\n';

// Table B: Scenario Structure
md += '## 表B: シナリオ構造\n\n';
md += '| ID | ノード数 | バトル数 | 分岐数 | ED数 | 最長テキスト |\n';
md += '|:---:|:-------:|:------:|:-----:|:---:|:-----------|\n';
for (const q of questData) {
  const maxText = q.maxTextLen > 45 ? '⚠️ ' + q.maxTextLen + 'c (' + q.maxTextNode + ')' : q.maxTextLen + 'c';
  md += '| ' + q.id + ' | ' + q.totalNodes + ' | ' + q.battles + ' | ' + q.choices + ' | ' + q.ends + ' | ' + maxText + ' |\n';
}

md += '\n---\n\n';

// Table C: Data References
md += '## 表C: データ参照・ファイル\n\n';
md += '| ID | 出現条件 | 使用BG | 敵グループ | MDファイル |\n';
md += '|:---:|---------|--------|-----------|:---------:|\n';
for (const q of questData) {
  const bgStr = q.bgs.length > 3 ? q.bgs.slice(0, 3).join(', ') + ' +' + (q.bgs.length - 3) : q.bgs.join(', ') || '-';
  const grpStr = q.groups.length > 0 ? q.groups.join(', ') : '-';
  const mdStatus = q.mdFile.includes('❌') ? '❌' : '✅';
  md += '| ' + q.id + ' | ' + q.condition + ' | ' + bgStr + ' | ' + grpStr + ' | ' + mdStatus + ' |\n';
}

// Summary
md += '\n---\n\n';
md += '## サマリ\n\n';
md += '| 指標 | 値 |\n';
md += '|------|:---:|\n';
md += '| 総クエスト数 | ' + questData.length + ' |\n';
md += '| 総ノード数 | ' + questData.reduce((s, q) => s + q.totalNodes, 0) + ' |\n';
md += '| 総バトル数 | ' + questData.reduce((s, q) => s + q.battles, 0) + ' |\n';
md += '| 総分岐数 | ' + questData.reduce((s, q) => s + q.choices, 0) + ' |\n';
md += '| MD未作成 | ' + questData.filter(q => q.mdFile.includes('❌')).length + ' |\n';
md += '| テキスト超過(>45c) | ' + questData.filter(q => q.maxTextLen > 45).length + 'クエスト |\n';

const outPath = path.join(__dirname, '..', 'docs', 'quest_catalog.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('Generated:', outPath);
console.log('Quests:', questData.length);
