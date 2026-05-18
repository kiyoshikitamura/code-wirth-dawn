/**
 * audit_quests.js — 全クエストの完備チェック（Phase 1）
 * 出力: JSON（テーブル1: 基本+ファイル / テーブル2: エネミー+画像+報酬）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSV_DIR = path.join(ROOT, 'src', 'data', 'csv');
const SCENARIO_DIR = path.join(CSV_DIR, 'scenarios');
const DOCS_DIR = path.join(ROOT, 'docs', 'quest');
const ENEMIES_FILE = path.join(CSV_DIR, 'enemies.csv');
const GROUPS_FILE = path.join(CSV_DIR, 'enemy_groups.csv');
const ASSETS_FILE = path.join(ROOT, 'src', 'config', 'assets.ts');
const IMG_DIR = path.join(ROOT, 'public', 'images', 'enemies');

// ── Load master data ──
const enemiesCsv = fs.readFileSync(ENEMIES_FILE, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const groupsCsv = fs.readFileSync(GROUPS_FILE, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const assetsTs = fs.readFileSync(ASSETS_FILE, 'utf8');

// Parse enemies into Set of slugs
const enemySlugs = new Set();
for (const line of enemiesCsv.split('\n')) {
  const parts = line.split(',');
  if (parts[1] && !parts[1].startsWith('slug')) enemySlugs.add(parts[1].trim());
}

// Parse groups into Map<id, slug>
const groupIds = new Map();
for (const line of groupsCsv.split('\n')) {
  const parts = line.split(',');
  const id = parts[0]?.trim();
  if (id && !isNaN(Number(id))) groupIds.set(id, parts[1]?.trim());
}

// Parse asset keys
const assetKeys = new Set();
const assetRegex = /'([^']+)'/g;
let m;
while ((m = assetRegex.exec(assetsTs)) !== null) {
  assetKeys.add(m[1]);
}

// ── Load quests_special.csv + quests.csv + quests_normal.csv ──
function loadQuestCsv(filename) {
  const fp = path.join(CSV_DIR, filename);
  if (!fs.existsSync(fp)) return {};
  const csv = fs.readFileSync(fp, 'utf8');
  const map = {};
  for (const line of csv.split('\n')) {
    const id = line.split(',')[0]?.trim();
    if (id && !isNaN(Number(id))) map[id] = line;
  }
  return map;
}
const specialEntries = loadQuestCsv('quests_special.csv');
const mainEntries = loadQuestCsv('quests.csv');
const normalEntries = loadQuestCsv('quests_normal.csv');

// ── Find MD files ──
const mdFiles = fs.existsSync(DOCS_DIR)
  ? fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'))
  : [];

// ── Find scenario CSVs ──
const scenarioCsvFiles = fs.existsSync(SCENARIO_DIR)
  ? fs.readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.csv'))
  : [];

// ── Define quest IDs and categories ──
const questDefs = [];

// Main 6001-6020
for (let i = 1; i <= 20; i++) {
  const id = 6000 + i;
  const slug = `main_ep${String(i).padStart(2, '0')}`;
  questDefs.push({ id, slug, cat: 'Main', csvType: 'main' });
}

// Gen 7001-7008
const genSlugs = ['deliver', 'escort', 'scavenge', 'riot', 'bear', 'smuggle', 'rat', 'mercy'];
genSlugs.forEach((s, i) => {
  questDefs.push({ id: 7001 + i, slug: `qst_gen_${s}`, cat: 'Gen', csvType: 'normal' });
});

// Roland 7010-7015
const rolSlugs = ['heretic', 'holywater', 'pilgrim', 'relic', 'tithe'];
rolSlugs.forEach((s, i) => {
  questDefs.push({ id: 7010 + i, slug: `qst_rol_${s}`, cat: 'Rol', csvType: 'normal' });
});
questDefs.push({ id: 7015, slug: 'qst_rol_undead', cat: 'Rol', csvType: 'normal' });

// Marcund 7020-7025
const marSlugs = ['caravan', 'scorpion', 'fugitive', 'sandworm', 'auction'];
marSlugs.forEach((s, i) => {
  questDefs.push({ id: 7020 + i, slug: `qst_mar_${s}`, cat: 'Mar', csvType: 'normal' });
});
questDefs.push({ id: 7025, slug: 'qst_mar_oasis', cat: 'Mar', csvType: 'normal' });

// Yato 7030-7035
const yatSlugs = ['yokai', 'ninja', 'shrine', 'ronin', 'shogun', 'mansion'];
yatSlugs.forEach((s, i) => {
  questDefs.push({ id: 7030 + i, slug: `qst_yat_${s}`, cat: 'Yat', csvType: 'normal' });
});

// Haryu 7040-7045
const harSlugs = ['jiangshi', 'herb', 'rebel', 'official', 'pirate', 'foxwed'];
harSlugs.forEach((s, i) => {
  questDefs.push({ id: 7040 + i, slug: `qst_har_${s}`, cat: 'Har', csvType: 'normal' });
});

// Rep T1 5101-5104
const t1Slugs = ['graverobber', 'scorpion_hunt', 'toll_bandit', 'river_god'];
t1Slugs.forEach((s, i) => {
  questDefs.push({ id: 5101 + i, slug: `qst_rep_${s}`, cat: 'T1', csvType: 'special' });
});

// Rep T2 5111-5114
const t2Slugs = ['mutant', 'bandit_king', 'cursed_blade', 'false_sage'];
t2Slugs.forEach((s, i) => {
  questDefs.push({ id: 5111 + i, slug: `qst_rep_${s}`, cat: 'T2', csvType: 'special' });
});

// Rep T3 5201-5207
const t3Slugs = ['crusader', 'sand_king', 'oni_general', 'jade_serpent', 'heretic_sage', 'war_djinn', 'nine_tails'];
t3Slugs.forEach((s, i) => {
  questDefs.push({ id: 5201 + i, slug: `qst_rep_${s}`, cat: 'T3', csvType: 'special' });
});

// Spot 6101-6104
const spotSlugs = ['roland', 'yato', 'karyu', 'markand'];
spotSlugs.forEach((s, i) => {
  questDefs.push({ id: 6101 + i, slug: `qst_spot_${s}`, cat: 'Spot', csvType: 'special' });
});

// Legend 6105-6111
const legendSlugs = ['baphomet', 'angel', 'dragon', 'kirin', 'golem', 'kraken', 'minotaur'];
legendSlugs.forEach((s, i) => {
  questDefs.push({ id: 6105 + i, slug: `qst_legend_${s}`, cat: 'Legend', csvType: 'special' });
});

// ── Analyze each quest ──
const table1 = [];
const table2 = [];

for (const q of questDefs) {
  const idStr = String(q.id);

  // Find MD
  const mdFile = mdFiles.find(f => f.startsWith(`quest_${idStr}`));
  const hasMd = !!mdFile;

  // Find scenario CSV
  const csvFile = scenarioCsvFiles.find(f => f.startsWith(idStr + '_'));
  const hasCsv = !!csvFile;

  // Find quest entry in master CSV
  const hasEntry = !!(specialEntries[idStr] || mainEntries[idStr] || normalEntries[idStr]);

  // Parse CSV details
  let nodeCount = 0, choiceCount = 0, battleCount = 0, endCount = 0;
  let bossSlugs = [];
  let groupIdsUsed = [];
  let bgKeysUsed = [];

  if (hasCsv) {
    const csvPath = path.join(SCENARIO_DIR, csvFile);
    const csvText = fs.readFileSync(csvPath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = csvText.split('\n');

    for (const line of lines) {
      if (line.startsWith('NODE,')) {
        nodeCount++;
        // Normalize double-quote escaping for matching
        const norm = line.replace(/""/g, '"');
        // Check for battle
        if (norm.includes('"type":"battle"') || norm.includes('"type": "battle"') || norm.includes('type:battle')) {
          battleCount++;
          // Extract enemy_group_id
          const gm = norm.match(/"enemy_group_id"\s*:\s*(\d+)/);
          if (gm) groupIdsUsed.push(gm[1]);
        }
        // Check for end
        if (norm.includes('end_success') || norm.includes('end_failure') || (norm.includes('"type":"end"') && norm.includes('"result"'))) {
          endCount++;
        }
        // Extract bg keys
        const bgm = norm.match(/"bg"\s*:\s*"([^"]+)"/g);
        if (bgm) {
          for (const b of bgm) {
            const val = b.match(/"bg"\s*:\s*"([^"]+)"/);
            if (val) bgKeysUsed.push(val[1]);
          }
        }
      } else if (line.startsWith('CHOICE,')) {
        choiceCount++;
      }
    }

    // Deduplicate
    groupIdsUsed = [...new Set(groupIdsUsed)];
    bgKeysUsed = [...new Set(bgKeysUsed)];
  }

  // Parse MD for title and rewards
  let title = idStr;
  let recLevel = '', difficulty = '', timeCost = '', client = '';
  let rewardLines = [];

  if (hasMd) {
    const mdPath = path.join(DOCS_DIR, mdFile);
    const mdText = fs.readFileSync(mdPath, 'utf8');

    // Title
    const titleMatch = mdText.match(/^#\s*クエスト仕様書[：:]\s*\d+\s*[—–-]\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim();
    else {
      const altTitle = mdText.match(/\|\s*\*\*タイトル\*\*.*?\|\s*(.+?)\s*\|/);
      if (altTitle) title = altTitle[1].trim();
      else {
        // Try CSV entry
        const entry = specialEntries[idStr] || mainEntries[idStr] || normalEntries[idStr];
        if (entry) {
          const parts = entry.split(',');
          title = parts[2] || idStr;
        }
      }
    }

    // Rec level
    const lvMatch = mdText.match(/推奨レベル.*?\|\s*(\d+)/);
    if (lvMatch) recLevel = lvMatch[1];

    // Difficulty
    const diffMatch = mdText.match(/難度.*?\|\s*(\d+)/);
    if (diffMatch) difficulty = diffMatch[1];

    // Time cost
    const tcMatch = mdText.match(/time_cost.*?\|\s*(\d+)/);
    if (tcMatch) timeCost = tcMatch[1];

    // Client
    const clientMatch = mdText.match(/依頼主.*?\|\s*(.+?)\s*\|/);
    if (clientMatch) client = clientMatch[1].trim();

    // Rewards table
    const rewardTableMatch = mdText.match(/ルート別報酬差異.*?\n(\|.+?\|[\s\S]*?)(?=\n---|\n##|\n$)/);
    if (rewardTableMatch) {
      const rows = rewardTableMatch[1].split('\n').filter(r => r.includes('|') && !r.includes('---') && !r.includes('ルート'));
      for (const row of rows) {
        const cols = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length >= 4) {
          rewardLines.push({
            route: cols[0],
            gold: cols[1],
            exp: cols[2],
            rep: cols[3],
            align: cols[4] || ''
          });
        }
      }
    }
  } else {
    // No MD, get title from CSV entries
    const entry = specialEntries[idStr] || mainEntries[idStr] || normalEntries[idStr];
    if (entry) {
      const parts = entry.split(',');
      title = parts[2] || idStr;
    }
  }

  // Boss enemy check
  let bossSlug = '';
  let bossImgExists = false;
  let bossInEnemies = false;
  let bossGrpId = '';
  let bossGrpExists = false;

  // Try to find boss from battle nodes with group IDs >= 9000
  for (const gid of groupIdsUsed) {
    if (Number(gid) >= 9000) {
      bossGrpId = gid;
      bossGrpExists = groupIds.has(gid);
      const grpSlug = groupIds.get(gid);
      // Infer boss slug from group members in groups CSV
      const grpLine = groupsCsv.split('\n').find(l => l.startsWith(gid + ','));
      if (grpLine) {
        const members = grpLine.split(',').slice(2).join(',').trim();
        bossSlug = members.split('|')[0].trim();
        bossInEnemies = enemySlugs.has(bossSlug);
        bossImgExists = fs.existsSync(path.join(IMG_DIR, bossSlug + '.png'));
      }
    }
  }

  // Check road groups (non-boss, <9000)
  const roadGroups = groupIdsUsed.filter(g => Number(g) < 9000);
  const roadGrpStatus = roadGroups.map(g => ({
    id: g,
    exists: groupIds.has(g)
  }));
  const roadGrpMissing = roadGrpStatus.filter(g => !g.exists).map(g => g.id);

  // BG missing check
  const bgMissing = bgKeysUsed.filter(bg => !assetKeys.has(bg));

  // ── Build table rows ──
  table1.push({
    id: q.id,
    title,
    cat: q.cat,
    lv: recLevel,
    diff: difficulty,
    days: timeCost,
    md: hasMd ? '✅' : '❌',
    csv: hasCsv ? '✅' : '❌',
    entry: hasEntry ? '✅' : '❌',
    nodes: nodeCount,
    battles: battleCount,
    ends: endCount,
  });

  table2.push({
    id: q.id,
    title,
    bossSlug: bossSlug || '—',
    bossImg: bossSlug ? (bossImgExists ? '✅' : '❌') : '—',
    bossGrp: bossGrpId ? (bossGrpExists ? '✅' : '❌') : '—',
    roadGrpMissing: roadGrpMissing.length > 0 ? roadGrpMissing.join(',') : '—',
    bgMissing: bgMissing.length > 0 ? bgMissing.join(',') : '—',
    rewards: rewardLines.length > 0 ? rewardLines : [{ route: '—', gold: '—', exp: '—', rep: '—', align: '—' }],
  });
}

// ── Output ──
console.log(JSON.stringify({ table1, table2 }, null, 0));
