const fs = require('fs');
const path = require('path');

const specialCsvPath = path.join(__dirname, 'src/data/csv/quests_special.csv');
const questsCsvPath = path.join(__dirname, 'src/data/csv/quests.csv');

// Correct definitions for main quests 6001 to 6020
const mainQuestsData = {
  6001: {
    slug: 'main_ep01',
    title: '第1話「始まりの轍」',
    rec_level: 1,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"location_id":"loc_border_town","min_level":1}',
    trigger_condition: 'loc:loc_border_town',
    rewards_summary: 'Gold:100|Rep:10|Order:5',
    client_name: '王国軍',
    comment: 'メインシナリオ第1話'
  },
  6002: {
    slug: 'main_ep02',
    title: '第2話「砂礫の国境線」',
    rec_level: 2,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep01","location_id":"loc_border_town"}',
    trigger_condition: 'loc:loc_border_town&pre:main_ep01',
    rewards_summary: 'Gold:200|Rep:10|Order:5',
    client_name: '王国軍',
    comment: 'メインシナリオ第2話'
  },
  6003: {
    slug: 'main_ep03',
    title: '第3話「オアシスの陰謀」',
    rec_level: 3,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep02","location_id":"loc_oasis"}',
    trigger_condition: 'loc:loc_oasis&pre:main_ep02',
    rewards_summary: 'Gold:300|Rep:10|Justice:5',
    client_name: '交易商会',
    comment: 'メインシナリオ第3話'
  },
  6004: {
    slug: 'main_ep04',
    title: '第4話「砂塵の激突」',
    rec_level: 4,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep03","location_id":"loc_plains_city"}',
    trigger_condition: 'loc:loc_plains_city&pre:main_ep03',
    rewards_summary: 'Gold:400|Rep:10|Justice:10',
    client_name: '交易商会',
    comment: 'メインシナリオ第4話'
  },
  6005: {
    slug: 'main_ep05',
    title: '第5話「大義という名の虚妄」',
    rec_level: 5,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep04","location_id":"loc_meridia"}',
    trigger_condition: 'loc:loc_meridia&pre:main_ep04',
    rewards_summary: 'Gold:500|Rep:10|Item:501|Justice:10',
    client_name: '交易商会',
    comment: 'メインシナリオ第5話'
  },
  6006: {
    slug: 'main_ep06',
    title: '第6話「逃亡者の道」',
    rec_level: 6,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep05","location_id":"loc_frontier_village"}',
    trigger_condition: 'loc:loc_frontier_village&pre:main_ep05',
    rewards_summary: 'Gold:600|Rep:10|Chaos:5',
    client_name: '忍び衆',
    comment: 'メインシナリオ第6話'
  },
  6007: {
    slug: 'main_ep07',
    title: '第7話「刃の掟」',
    rec_level: 7,
    difficulty: 1,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep06","location_id":"loc_temple_town"}',
    trigger_condition: 'loc:loc_temple_town&pre:main_ep06',
    rewards_summary: 'Gold:700|Rep:10|Justice:5',
    client_name: '代官所',
    comment: 'メインシナリオ第7話'
  },
  6008: {
    slug: 'main_ep08',
    title: '第8話「夜霧の凶刃」',
    rec_level: 8,
    difficulty: 2,
    time_cost: 1,
    requirements: '{"completed_quest":"main_ep07","location_id":"loc_yato"}',
    trigger_condition: 'loc:loc_yato&pre:main_ep07',
    rewards_summary: 'Gold:350|Rep:10|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第8話'
  },
  6009: {
    slug: 'main_ep09',
    title: '第9話「大名行列の護衛」',
    rec_level: 9,
    difficulty: 2,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep08","location_id":"loc_valley"}',
    trigger_condition: 'loc:loc_valley&pre:main_ep08',
    rewards_summary: 'Gold:400|Rep:10|Evil:5',
    client_name: 'なし',
    comment: 'メインシナリオ第9話'
  },
  6010: {
    slug: 'main_ep10',
    title: '第10話「世界の底が抜ける日」',
    rec_level: 10,
    difficulty: 2,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep09","location_id":"loc_yato"}',
    trigger_condition: 'loc:loc_yato&pre:main_ep09',
    rewards_summary: 'Gold:500|Rep:15|Item:502|Justice:10',
    client_name: 'なし',
    comment: 'メインシナリオ第10話'
  },
  6011: {
    slug: 'main_ep11',
    title: '第11話「天使降臨」',
    rec_level: 11,
    difficulty: 3,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep10","location_id":"loc_charon"}',
    trigger_condition: 'loc:loc_charon&pre:main_ep10',
    rewards_summary: 'Gold:1200|Rep:15|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第11話'
  },
  6012: {
    slug: 'main_ep12',
    title: '第12話「炎の審判者」',
    rec_level: 12,
    difficulty: 3,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep11","location_id":"loc_meridia"}',
    trigger_condition: 'loc:loc_meridia&pre:main_ep11',
    rewards_summary: 'Gold:1500|Rep:15|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第12話'
  },
  6013: {
    slug: 'main_ep13',
    title: '第13話「癒しの暴君」',
    rec_level: 13,
    difficulty: 3,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep12","location_id":"loc_charon"}',
    trigger_condition: 'loc:loc_charon&pre:main_ep12',
    rewards_summary: 'Gold:1800|Rep:20|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第13話'
  },
  6014: {
    slug: 'main_ep14',
    title: '第14話「啓示の使者」',
    rec_level: 14,
    difficulty: 3,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep13","location_id":"loc_yato"}',
    trigger_condition: 'loc:loc_yato&pre:main_ep13',
    rewards_summary: 'Gold:2000|Rep:20|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第14話'
  },
  6015: {
    slug: 'main_ep15',
    title: '第15話「天軍の長」',
    rec_level: 15,
    difficulty: 4,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep14","location_id":"loc_regalia"}',
    trigger_condition: 'loc:loc_regalia&pre:main_ep14',
    rewards_summary: 'Gold:2500|Rep:30|Item:503|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第15話'
  },
  6016: {
    slug: 'main_ep16',
    title: '第16話「英霊の石碑」',
    rec_level: 16,
    difficulty: 4,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep15","required_generations":2,"location_id":"loc_border_town"}',
    trigger_condition: 'loc:loc_border_town&pre:main_ep15&gen:2+',
    rewards_summary: 'Gold:3000|Rep:20|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第16話'
  },
  6017: {
    slug: 'main_ep17',
    title: '第17話「冥府の門」',
    rec_level: 17,
    difficulty: 4,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep16","location_id":"loc_regalia"}',
    trigger_condition: 'loc:loc_regalia&pre:main_ep16',
    rewards_summary: 'Gold:3500|Rep:25|Item:505|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第17話'
  },
  6018: {
    slug: 'main_ep18',
    title: '第18話「戦神の洗礼」',
    rec_level: 18,
    difficulty: 4,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep16","location_id":"loc_charon"}',
    trigger_condition: 'loc:loc_charon&pre:main_ep16',
    rewards_summary: 'Gold:3500|Rep:25|Item:506|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第18話'
  },
  6019: {
    slug: 'main_ep19',
    title: '第19話「月光の狩人」',
    rec_level: 22,
    difficulty: 4,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep16","location_id":"loc_yato"}',
    trigger_condition: 'loc:loc_yato&pre:main_ep16',
    rewards_summary: 'Gold:3500|Rep:25|Item:507|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第19話'
  },
  6020: {
    slug: 'main_ep20',
    title: '第20話「蒼暁の剣」',
    rec_level: 25,
    difficulty: 5,
    time_cost: 2,
    requirements: '{"completed_quest":"main_ep17||main_ep18||main_ep19","location_id":"loc_regalia"}',
    trigger_condition: 'loc:loc_regalia&pre:main_ep17||main_ep18||main_ep19',
    rewards_summary: 'Gold:15000|Rep:50|Item:504|Order:5',
    client_name: 'なし',
    comment: 'メインシナリオ第20話'
  }
};

// Helper to split by CRLF or LF safely
function splitLines(content) {
  return content.split(/\r?\n/);
}

// 1. Update quests_special.csv
let specialContent = fs.readFileSync(specialCsvPath, 'utf8');
let specialLines = splitLines(specialContent);
for (let i = 0; i < specialLines.length; i++) {
  const line = specialLines[i];
  if (!line.trim()) continue;
  const parts = line.split(',');
  const id = parseInt(parts[0]);
  if (id >= 6001 && id <= 6020 && mainQuestsData[id]) {
    const q = mainQuestsData[id];
    const reqEscaped = q.requirements.replace(/"/g, '""');
    specialLines[i] = `${id},${q.slug},${q.title},${q.rec_level},${q.difficulty},${q.time_cost},"${reqEscaped}",true,,${q.rewards_summary},${q.client_name},${q.comment}`;
  }
}
fs.writeFileSync(specialCsvPath, specialLines.filter(l => l.trim()).join('\r\n') + '\r\n', 'utf8');
console.log('Successfully updated quests_special.csv');

// 2. Update quests.csv
let questsContent = fs.readFileSync(questsCsvPath, 'utf8');
let questsLines = splitLines(questsContent);
for (let i = 0; i < questsLines.length; i++) {
  const line = questsLines[i];
  if (!line.trim()) continue;
  const parts = line.split(',');
  const id = parseInt(parts[0]);
  if (id >= 6001 && id <= 6020 && mainQuestsData[id]) {
    const q = mainQuestsData[id];
    questsLines[i] = `${id},${q.slug},${q.title},${q.rec_level},${q.difficulty},${q.time_cost},${q.trigger_condition},${q.rewards_summary},メイン: ${q.comment}`;
  }
}
fs.writeFileSync(questsCsvPath, questsLines.filter(l => l.trim()).join('\r\n') + '\r\n', 'utf8');
console.log('Successfully updated quests.csv');
