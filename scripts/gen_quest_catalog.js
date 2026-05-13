/**
 * Generate quest catalog MD for playtesting.
 * Enhanced: enemy details, branch/trap info, scenario rewards fallback.
 */
const fs = require('fs');
const path = require('path');
const csvLib = require('./lib/csv-parser');

const SCENARIO_DIR = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');
const QUEST_DIR = path.join(__dirname, '..', 'docs', 'quest');

// Load data
const qNormal = csvLib.parseCSV(path.join(csvLib.DATA_DIR, 'quests_normal.csv'));
const qSpecial = csvLib.parseCSV(path.join(csvLib.DATA_DIR, 'quests_special.csv'));
const allQuests = [...qNormal.map(q => ({...q, src: 'normal'})), ...qSpecial.map(q => ({...q, src: 'special'}))];
const enemies = csvLib.getEnemies();
const groups = csvLib.getEnemyGroups();
const enemyMap = {};
enemies.forEach(e => { enemyMap[e.slug] = e; });
const groupMap = {};
groups.forEach(g => { groupMap[g.id] = g; groupMap[g.slug] = g; });

const scenarioFiles = fs.readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.csv') && !f.startsWith('8'));

function getRegion(id) {
  const n = parseInt(id);
  if (n >= 5101 && n <= 5104) return 'Rep T1';
  if (n >= 5111 && n <= 5114) return 'Rep T2';
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

/** Resolve enemy group to member details */
function resolveGroup(groupId) {
  const g = groupMap[String(groupId)];
  if (!g) return [{ name: '(グループ' + groupId + ')', level: '?', count: '?' }];
  const memberSlugs = (g.members || '').split('|').filter(m => m);
  return memberSlugs.map(slug => {
    const e = enemyMap[slug];
    return {
      name: e ? e.name : slug,
      level: e ? e.level : '?',
      slug
    };
  });
}

/** Format rewards object to compact string */
function formatRewards(r) {
  if (!r) return '';
  const parts = [];
  if (r.gold) parts.push('G:' + r.gold);
  if (r.exp) parts.push('E:' + r.exp);
  if (r.reputation) parts.push('R:' + r.reputation);
  if (r.alignment_shift) {
    const a = r.alignment_shift;
    if (a.order) parts.push('Or:' + a.order);
    if (a.justice) parts.push('Ju:' + a.justice);
    if (a.evil) parts.push('Ev:' + a.evil);
    if (a.chaos) parts.push('Ch:' + a.chaos);
  }
  if (r.items) {
    (Array.isArray(r.items) ? r.items : [r.items]).forEach(i => {
      parts.push('Item:' + (typeof i === 'string' ? i : i.id || i.item_id || JSON.stringify(i)));
    });
  }
  if (r.item_id) parts.push('Item:' + r.item_id);
  return parts.join(' ') || '';
}

function analyzeScenario(filename) {
  const nodes = csvLib.parseScenarioCSV(filename);
  const nodeRows = nodes.filter(n => n.rowType === 'NODE');

  let battles = 0, choiceCount = 0, ends = 0;
  let hasRandomBranch = false, hasCheckDelivery = false, hasHpDamage = false;
  let hasReward = false;
  const battleDetails = []; // { groupId, members: [{name, level}], name }
  const endRewards = []; // { nodeId, rewards }
  let maxTextLen = 0, maxTextNode = '';

  for (const n of nodeRows) {
    const t = n.parsedParams?.type || 'text';
    if (t === 'battle') {
      battles++;
      const gid = n.parsedParams?.enemy_group_id;
      const eName = n.parsedParams?.enemy_name || '';
      if (gid) {
        const members = resolveGroup(gid);
        battleDetails.push({ groupId: gid, members, displayName: eName });
      }
    }
    if (t === 'choice') choiceCount++;
    if (t === 'end' || t === 'end_success' || t === 'end_failure') {
      ends++;
      // Rewards can be JSON object, pipe-string, or absent
      const rawRewards = n.parsedParams?.rewards;
      if (rawRewards) {
        let rewardsObj;
        if (typeof rawRewards === 'object') {
          rewardsObj = rawRewards;
        } else if (typeof rawRewards === 'string' && rawRewards.includes(':')) {
          // Parse pipe format: Gold:500|Exp:80|Rep:3|Order:3
          rewardsObj = {};
          for (const token of rawRewards.split('|')) {
            const [key, val] = token.trim().split(':');
            if (!key || !val) continue;
            const k = key.trim();
            const v = parseInt(val.trim(), 10);
            if (isNaN(v)) { rewardsObj[k.toLowerCase()] = val.trim(); continue; }
            if (k === 'Gold' || k === 'gold') rewardsObj.gold = v;
            else if (k === 'Exp' || k === 'exp') rewardsObj.exp = v;
            else if (k === 'Rep' || k === 'rep') rewardsObj.reputation = v;
            else if (k === 'Order' || k === 'order') { if (!rewardsObj.alignment_shift) rewardsObj.alignment_shift = {}; rewardsObj.alignment_shift.order = v; }
            else if (k === 'Justice' || k === 'justice') { if (!rewardsObj.alignment_shift) rewardsObj.alignment_shift = {}; rewardsObj.alignment_shift.justice = v; }
            else if (k === 'Evil' || k === 'evil') { if (!rewardsObj.alignment_shift) rewardsObj.alignment_shift = {}; rewardsObj.alignment_shift.evil = v; }
            else if (k === 'Chaos' || k === 'chaos') { if (!rewardsObj.alignment_shift) rewardsObj.alignment_shift = {}; rewardsObj.alignment_shift.chaos = v; }
            else if (k === 'Item' || k === 'item') rewardsObj.item_id = val.trim();
          }
        }
        const result = t === 'end_success' ? 'success' : t === 'end_failure' ? 'failure' : (n.parsedParams.result || 'success');
        if (rewardsObj) endRewards.push({ nodeId: n.nodeId, result, rewards: rewardsObj });
      }
    }
    if (t === 'random_branch') hasRandomBranch = true;
    if (t === 'check_delivery') hasCheckDelivery = true;
    if (t === 'hp_damage') hasHpDamage = true;
    if (t === 'reward') {
      hasReward = true;
      if (n.parsedParams?.item_id) {
        endRewards.push({ nodeId: n.nodeId, result: 'reward', rewards: { item_id: n.parsedParams.item_id } });
      }
    }
    if (n.textLabel) {
      const len = [...n.textLabel].length;
      if (len > maxTextLen) { maxTextLen = len; maxTextNode = n.nodeId; }
    }
  }

  // Build special node flags
  const specialNodes = [];
  if (choiceCount > 0) specialNodes.push('分岐×' + choiceCount);
  if (hasRandomBranch) specialNodes.push('確率分岐');
  if (hasCheckDelivery) specialNodes.push('納品判定');
  if (hasHpDamage) specialNodes.push('トラップ');
  if (hasReward) specialNodes.push('途中報酬');

  return { totalNodes: nodeRows.length, battles, choiceCount, ends, battleDetails, endRewards, specialNodes, maxTextLen, maxTextNode };
}

// Build quest data
const questData = [];
for (const sf of scenarioFiles) {
  const idMatch = sf.match(/^(\d+)_/);
  if (!idMatch) continue;
  const questId = idMatch[1];
  const qEntry = allQuests.find(q => q.id === questId);
  const mdFiles = fs.readdirSync(QUEST_DIR).filter(f => f.startsWith('quest_' + questId));
  const scenario = analyzeScenario(sf);
  const name = qEntry?.title || sf.replace('.csv', '').replace(/^\d+_/, '').replace(/_/g, ' ');
  const level = qEntry?.rec_level || '-';
  const diff = qEntry?.difficulty || '-';
  const timeCost = qEntry?.time_cost || '-';

  // Rewards: CSV rewards_summary > scenario end node rewards
  let rewardStr = qEntry?.rewards_summary || '';
  if (!rewardStr && scenario.endRewards.length > 0) {
    // Collect unique reward strings from end nodes
    const rewardParts = [];
    for (const er of scenario.endRewards) {
      const formatted = formatRewards(er.rewards);
      if (formatted) {
        const label = er.result === 'success' ? '成功' : er.result === 'failure' ? '失敗' : er.nodeId;
        rewardParts.push('[' + label + '] ' + formatted);
      }
    }
    rewardStr = rewardParts.join(' / ') || '-';
  }
  if (!rewardStr) rewardStr = '-';

  questData.push({
    id: questId, name, region: getRegion(questId),
    level, diff, timeCost, rewardStr,
    mdFile: mdFiles.length > 0 ? mdFiles[0] : '❌',
    ...scenario
  });
}
questData.sort((a, b) => parseInt(a.id) - parseInt(b.id));

// ── Generate MD ──
let md = '# クエスト一覧 — テストプレイ用カタログ\n\n';
md += '> 自動生成: ' + new Date().toISOString().split('T')[0] + '  \n';
md += '> 対象: シナリオCSV ' + questData.length + '本（8xxx レガシー除外）\n\n';
md += '---\n\n';

// ── Table A: Basic + Balance + Rewards ──
md += '## 表A: クエスト基本情報・報酬\n\n';
md += '| ID | クエスト名 | 地域 | Lv | 難度 | 日数 | 報酬 |\n';
md += '|:---:|-----------|:----:|:--:|:---:|:---:|------|\n';
for (const q of questData) {
  md += '| ' + q.id + ' | ' + q.name + ' | ' + q.region + ' | ' + q.level + ' | ' + q.diff + ' | ' + q.timeCost + ' | ' + q.rewardStr + ' |\n';
}

md += '\n---\n\n';

// ── Table B: Scenario Structure + Special Nodes ──
md += '## 表B: シナリオ構造・特殊ノード\n\n';
md += '| ID | ノード | バトル | 分岐 | ED数 | 特殊ノード | 最長テキスト |\n';
md += '|:---:|:-----:|:-----:|:---:|:---:|-----------|:-----------|\n';
for (const q of questData) {
  const maxText = q.maxTextLen > 45 ? '⚠️' + q.maxTextLen + 'c' : q.maxTextLen + 'c';
  const special = q.specialNodes.length > 0 ? q.specialNodes.join(', ') : '-';
  md += '| ' + q.id + ' | ' + q.totalNodes + ' | ' + q.battles + ' | ' + q.choiceCount + ' | ' + q.ends + ' | ' + special + ' | ' + maxText + ' |\n';
}

md += '\n---\n\n';

// ── Table C: Enemy Details ──
md += '## 表C: 出現エネミー詳細\n\n';
md += '| ID | バトル# | グループID | エネミー構成 |\n';
md += '|:---:|:------:|:---------:|------------|\n';
for (const q of questData) {
  if (q.battleDetails.length === 0) {
    md += '| ' + q.id + ' | - | - | なし |\n';
    continue;
  }
  q.battleDetails.forEach((b, idx) => {
    const memberStr = b.members.map(m => m.name + '(Lv' + m.level + ')').join(', ');
    const displayName = b.displayName ? ' 「' + b.displayName + '」' : '';
    md += '| ' + q.id + ' | ' + (idx + 1) + ' | ' + b.groupId + displayName + ' | ' + memberStr + ' |\n';
  });
}

// ── Summary ──
md += '\n---\n\n';
md += '## サマリ\n\n';
md += '| 指標 | 値 |\n';
md += '|------|:---:|\n';
md += '| 総クエスト数 | ' + questData.length + ' |\n';
md += '| 総ノード数 | ' + questData.reduce((s, q) => s + q.totalNodes, 0) + ' |\n';
md += '| 総バトル数 | ' + questData.reduce((s, q) => s + q.battles, 0) + ' |\n';
md += '| 分岐あり | ' + questData.filter(q => q.choiceCount > 0).length + 'クエスト |\n';
md += '| 確率分岐 | ' + questData.filter(q => q.specialNodes.includes('確率分岐')).length + 'クエスト |\n';
md += '| トラップ(hp_damage) | ' + questData.filter(q => q.specialNodes.includes('トラップ')).length + 'クエスト |\n';
md += '| 納品判定 | ' + questData.filter(q => q.specialNodes.includes('納品判定')).length + 'クエスト |\n';
md += '| テキスト超過(>45c) | ' + questData.filter(q => q.maxTextLen > 45).length + 'クエスト |\n';

const outPath = path.join(__dirname, '..', 'docs', 'quest_catalog.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('Generated:', outPath);
console.log('Quests:', questData.length);
console.log('Battles:', questData.reduce((s, q) => s + q.battles, 0));
console.log('Enemy encounters:', questData.reduce((s, q) => s + q.battleDetails.length, 0));
