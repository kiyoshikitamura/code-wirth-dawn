/**
 * クエスト仕様書（docs/quest/）の §0 ファイル概要テーブルに
 * 推奨レベル・出現条件・難易度Tierを最新CSVデータで更新するスクリプト
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV_DIR = path.join(__dirname, '..', 'src', 'data', 'csv');
const QUEST_DOC_DIR = path.join(__dirname, '..', 'docs', 'quest');

// --- CSV読み込み ---
function loadCsv(filename) {
  const fp = path.join(CSV_DIR, filename);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, 'utf-8');
  return parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

const normalQuests = loadCsv('quests_normal.csv');
const specialQuests = loadCsv('quests_special.csv');

// --- クエストデータのマップ構築 ---
const questMap = new Map();

for (const q of normalQuests) {
  questMap.set(String(q.id), {
    id: q.id,
    slug: q.slug,
    title: q.title,
    rec_level: parseInt(q.rec_level) || 0,
    difficulty: parseInt(q.difficulty) || 0,
    location_tags: q.location_tags || '',
    min_reputation: q.min_reputation || '',
    max_reputation: q.max_reputation || '',
    rewards_summary: q.rewards_summary || '',
    client_name: q.client_name || '',
    type: 'normal',
    requirements: null,
  });
}

for (const q of specialQuests) {
  const idStr = String(q.id);
  let type = 'special';
  if (idStr.startsWith('6')) {
    type = q.slug?.startsWith('main_ep') ? 'main' : 'special';
  } else if (idStr.startsWith('8')) {
    type = 'boss';
  }
  
  let reqObj = null;
  if (q.requirements) {
    try { reqObj = JSON.parse(q.requirements); } catch(e) {}
  }

  questMap.set(idStr, {
    id: q.id,
    slug: q.slug,
    title: q.title,
    rec_level: parseInt(q.rec_level) || 0,
    difficulty: parseInt(q.difficulty) || 0,
    location_tags: '',
    rewards_summary: q.rewards_summary || '',
    client_name: q.client_name || '',
    type,
    requirements: reqObj,
  });
}

// --- Tier判定 ---
function getTier(rec_level) {
  if (rec_level <= 3) return 'Easy';
  if (rec_level <= 7) return 'Normal';
  return 'Hard';
}

// --- 出現条件テキスト生成 ---
function buildConditionText(q) {
  const parts = [];
  
  // normal quests
  if (q.type === 'normal') {
    if (q.location_tags === 'all') {
      parts.push('全拠点で出現');
    } else if (q.location_tags) {
      const tagMap = {
        'loc_holy_empire': 'ローランド聖王国',
        'loc_marcund': 'マルカンド',
        'loc_yatoshin': '夜刀神国',
        'loc_haryu': '華龍国',
      };
      parts.push(`出現国: ${tagMap[q.location_tags] || q.location_tags}`);
    }
    if (q.min_reputation) parts.push(`名声 ${q.min_reputation} 以上`);
    if (q.max_reputation) parts.push(`名声 ${q.max_reputation} 以下`);
    if (!parts.length) parts.push('特になし（常時）');
    return parts.join(' / ');
  }

  // special / boss / main
  const req = q.requirements;
  if (!req) return '特になし';

  if (req.completed_quest) parts.push(`前提クエストクリア: ${req.completed_quest}`);
  if (req.min_level) parts.push(`プレイヤーLv ${req.min_level} 以上`);
  if (req.nation_id) {
    const nationMap = {
      'loc_holy_empire': 'ローランド聖王国拠点',
      'loc_marcund': 'マルカンド拠点',
      'loc_yatoshin': '夜刀神国拠点',
      'loc_haryu': '華龍国拠点',
    };
    parts.push(`滞在拠点: ${nationMap[req.nation_id] || req.nation_id}`);
  }
  if (req.min_reputation) parts.push(`名声 ${req.min_reputation} 以上`);
  if (req.max_reputation) parts.push(`名声 ${req.max_reputation} 以下`);
  if (req.min_prosperity) parts.push(`繁栄度 ${req.min_prosperity} 以上`);
  if (req.max_prosperity) parts.push(`繁栄度 ${req.max_prosperity} 以下`);
  if (req.min_align_chaos) parts.push(`混沌属性 ${req.min_align_chaos} 以上`);
  if (req.min_align_order) parts.push(`秩序属性 ${req.min_align_order} 以上`);
  if (req.align_evil) parts.push('悪属性プレイヤーのみ');
  if (req.min_vitality) parts.push(`VIT ${req.min_vitality} 以上`);
  if (req.event_trigger) parts.push(`イベントトリガー: ${req.event_trigger}`);
  if (req.require_item_id) parts.push(`所持アイテム: ID ${req.require_item_id}`);
  if (req.required_generations) parts.push(`累計 ${req.required_generations} 世代以上`);

  return parts.length ? parts.join(' / ') : '特になし';
}

// --- リピート可否 ---
function getRepeatText(q) {
  if (q.type === 'normal') return 'リピート可能';
  if (q.type === 'main') return 'アカウント通じて1回のみ（継承後も非表示）';
  if (q.type === 'boss' || q.type === 'special') return '現世代で1回（継承後は再出現）';
  return '―';
}

// --- mdファイル更新 ---
let updatedCount = 0;
let skippedCount = 0;

const files = fs.readdirSync(QUEST_DOC_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  // ファイル名からIDを抽出
  const match = file.match(/quest_(\d+)/);
  if (!match) { skippedCount++; continue; }
  
  const questId = match[1];
  const q = questMap.get(questId);
  
  if (!q) {
    console.log(`SKIP: ${file} — ID ${questId} not found in CSV`);
    skippedCount++;
    continue;
  }

  const filePath = path.join(QUEST_DOC_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const tier = getTier(q.rec_level);
  const condText = buildConditionText(q);
  const repeatText = getRepeatText(q);

  // 推奨レベルの行を更新（パターン: | **推奨レベル** | ... |）
  const recLevelPattern = /(\| \*\*推奨レベル\*\* \| ).*?( \|)/;
  if (recLevelPattern.test(content)) {
    content = content.replace(recLevelPattern, `$1${q.rec_level}（${tier}）$2`);
  }

  // 出現条件の行を更新
  const condPattern = /(\| \*\*出現条件\*\* \| ).*?( \|)/;
  if (condPattern.test(content)) {
    content = content.replace(condPattern, `$1${condText}$2`);
  }

  // 難度の行を更新
  const diffPattern = /(\| \*\*難度\*\* \| ).*?( \|)/;
  if (diffPattern.test(content)) {
    content = content.replace(diffPattern, `$1${q.difficulty}$2`);
  }

  // §0テーブルにリピート可否がなければ追加
  if (!content.includes('**リピート**')) {
    // サムネイル行の前に挿入
    const thumbPattern = /(\| \*\*サムネイル画像\*\*)/;
    if (thumbPattern.test(content)) {
      content = content.replace(thumbPattern, `| **リピート** | ${repeatText} |\n$1`);
    }
  }

  // 難易度Tierがなければ追加
  if (!content.includes('**難易度Tier**')) {
    const thumbPattern = /(\| \*\*サムネイル画像\*\*)/;
    if (thumbPattern.test(content)) {
      content = content.replace(thumbPattern, `| **難易度Tier** | ${tier}（rec_level: ${q.rec_level}） |\n$1`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`OK: ${file} — rec_level=${q.rec_level} (${tier}), cond="${condText}"`);
  updatedCount++;
}

console.log(`\nDone: ${updatedCount} updated, ${skippedCount} skipped`);
