const fs = require('fs');
const path = require('path');

const quests = [
  // 名声連動 Tier 1
  { id: '5101', prefix: 'qst_rep', slug: 'graverobber' },
  { id: '5102', prefix: 'qst_rep', slug: 'scorpion_hunt' },
  { id: '5103', prefix: 'qst_rep', slug: 'toll_bandit' },
  { id: '5104', prefix: 'qst_rep', slug: 'river_god' },
  // ローランド
  { id: '7010', prefix: 'qst_rol', slug: 'heretic' },
  { id: '7011', prefix: 'qst_rol', slug: 'holywater' },
  { id: '7012', prefix: 'qst_rol', slug: 'pilgrim' },
  { id: '7013', prefix: 'qst_rol', slug: 'undead' },
  { id: '7014', prefix: 'qst_rol', slug: 'tithe' },
  { id: '7015', prefix: 'qst_rol', slug: 'relic' },
  // マルカンド
  { id: '7020', prefix: 'qst_mar', slug: 'caravan' },
  { id: '7021', prefix: 'qst_mar', slug: 'scorpion' },
  { id: '7022', prefix: 'qst_mar', slug: 'debt' },
  { id: '7023', prefix: 'qst_mar', slug: 'sandworm' },
  { id: '7024', prefix: 'qst_mar', slug: 'auction' },
  { id: '7025', prefix: 'qst_mar', slug: 'bribe' },
  // 夜刀
  { id: '7030', prefix: 'qst_yat', slug: 'yokai' },
  { id: '7031', prefix: 'qst_yat', slug: 'ninja' },
  { id: '7032', prefix: 'qst_yat', slug: 'shrine' },
  { id: '7033', prefix: 'qst_yat', slug: 'ronin' },
  { id: '7034', prefix: 'qst_yat', slug: 'shogun' },
  { id: '7035', prefix: 'qst_yat', slug: 'mansion' },
  // 華龍
  { id: '7040', prefix: 'qst_har', slug: 'jiangshi' },
  { id: '7041', prefix: 'qst_har', slug: 'herb' },
  { id: '7042', prefix: 'qst_har', slug: 'rebel' },
  { id: '7043', prefix: 'qst_har', slug: 'official' },
  { id: '7044', prefix: 'qst_har', slug: 'pirate' },
  { id: '7045', prefix: 'qst_har', slug: 'foxwed' },
  // メインエピソード (Phase 7 & 8)
  { id: '6001', prefix: 'qst_main', slug: 'ep01' },
  { id: '6002', prefix: 'qst_main', slug: 'ep02' },
  { id: '6003', prefix: 'qst_main', slug: 'ep03' },
  { id: '6004', prefix: 'qst_main', slug: 'ep04' },
  { id: '6005', prefix: 'qst_main', slug: 'ep05' },
  { id: '6006', prefix: 'qst_main', slug: 'ep06' },
  { id: '6007', prefix: 'qst_main', slug: 'ep07' },
  { id: '6008', prefix: 'qst_main', slug: 'ep08' },
  { id: '6009', prefix: 'qst_main', slug: 'ep09' },
  { id: '6010', prefix: 'qst_main', slug: 'ep10' },
  { id: '6011', prefix: 'qst_main', slug: 'ep11' },
  { id: '6012', prefix: 'qst_main', slug: 'ep12' },
  { id: '6014', prefix: 'qst_main', slug: 'ep14' },
  { id: '6015', prefix: 'qst_main', slug: 'ep15' },
  { id: '6016', prefix: 'qst_main', slug: 'ep16' },
  { id: '6017', prefix: 'qst_main', slug: 'ep17' },
  { id: '6018', prefix: 'qst_main', slug: 'ep18' },
  { id: '6019', prefix: 'qst_main', slug: 'ep19' },
  { id: '6020', prefix: 'qst_main', slug: 'ep20' },
];

// ─── 既知のノードタイプ定義（エンジン対応済み） ─────────────────
const KNOWN_NODE_TYPES = new Set([
  'text', 'battle', 'choice', 'end', 'end_success', 'end_failure',
  'reward', 'random_branch', 'check_delivery', 'check_possession',
  'check_status', 'check_equipped', 'check_item', 'check_flag',
  'check_flags', 'check_world',
  'guest_join', 'leave', 'travel', 'camp', 'shop_special', 'shop_access',
  'trap', 'modify_state', 'modify_flag', 'modify_reputation',
  'hp_damage',
]);

// ─── エンジンが自動遷移するノードタイプ ─────────────────────
const AUTO_TRANSITION_TYPES = new Set([
  'random_branch', 'check_delivery', 'check_possession', 'check_status',
  'check_equipped', 'check_item', 'check_flag', 'check_flags', 'check_world',
  'modify_flag', 'modify_state', 'modify_reputation',
  'guest_join', 'trap', 'hp_damage', 'reward',
]);

// ─── reward ノードの item_id 指定形式チェック ────────────────
function checkRewardNode(params, nodeId, warnings) {
  if (!params) return;
  const hasItems = params.items && Array.isArray(params.items);
  const hasItemId = params.item_id;
  if (!hasItems && !hasItemId && !params.gold) {
    warnings.push('  \u26a0 [' + nodeId + '] reward \u30ce\u30fc\u30c9\u306b items/item_id/gold \u304c\u306a\u3044\u3002\u5831\u916c\u306a\u3057\u3002');
  }
  if (hasItemId && typeof hasItemId === 'string' && !/^\d+$/.test(hasItemId)) {
    const itemsCsvPath = path.join(__dirname, '../src/data/csv/items.csv');
    if (fs.existsSync(itemsCsvPath)) {
      const csv = fs.readFileSync(itemsCsvPath, 'utf8');
      if (!csv.includes(hasItemId)) {
        warnings.push('  \u274c [' + nodeId + '] reward item_id="' + hasItemId + '" \u304c items.csv \u306b\u672a\u767b\u9332');
      }
    }
  }
}

// ─── hp_damage ノードの percent 指定チェック ─────────────────
function checkHpDamageNode(params, nodeId, warnings) {
  if (!params) return;
  if (!params.percent && !params.hp_percent && !params.hp_flat) {
    warnings.push('  \u26a0 [' + nodeId + '] hp_damage \u30ce\u30fc\u30c9\u306b percent/hp_percent/hp_flat \u304c\u306a\u3044\u3002');
  }
}

// ─── CSVパーサー（ネストJSON対応） ──────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

let totalErrors = 0;
let totalWarnings = 0;

for (const q of quests) {
  const csvPath = path.join(__dirname, '../src/data/csv/scenarios', q.id + '_' + q.prefix + '_' + q.slug + '.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('=== CSV ' + q.id + ' (' + q.slug + ') === NOT FOUND');
    console.log('');
    continue;
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());

  console.log('=== CSV ' + q.id + ' (' + q.slug + ') ===');

  const nodes = [];
  const allNodeIds = new Set();
  const referencedIds = new Set();
  const warnings = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const rowType = (fields[0] || '').trim();
    const nodeId = (fields[1] || '').trim();
    const textLabel = (fields[2] || '').trim();
    const paramsStr = (fields[3] || '').trim();
    const nextNode = (fields[4] || '').trim();

    if (rowType === 'NODE') {
      allNodeIds.add(nodeId);

      let type = '?';
      let params = null;
      if (paramsStr) {
        try {
          params = JSON.parse(paramsStr);
          type = params.type || '?';
        } catch(e) {}
      }

      // ─── 診断チェック ─────────────────────────
      if (type !== '?' && !KNOWN_NODE_TYPES.has(type)) {
        errors.push('  \u274c [' + nodeId + '] \u672a\u77e5\u306e\u30ce\u30fc\u30c9\u30bf\u30a4\u30d7: "' + type + '" \u2014 \u30a8\u30f3\u30b8\u30f3\u672a\u5bfe\u5fdc');
      }

      if (type === 'reward') {
        checkRewardNode(params, nodeId, warnings);
      }
      if (type === 'hp_damage') {
        checkHpDamageNode(params, nodeId, warnings);
      }
      if (type === 'battle' && !params?.enemy_group_id && !params?.enemy) {
        warnings.push('  \u26a0 [' + nodeId + '] battle \u30ce\u30fc\u30c9\u306b enemy_group_id \u672a\u6307\u5b9a');
      }

      nodes.push({ nodeId, type, nextNode, params });
      if (nextNode) referencedIds.add(nextNode);
    } else if (rowType === 'CHOICE') {
      nodes.push({ nodeId: '  CHOICE:' + textLabel, type: '', nextNode });
      if (nextNode) referencedIds.add(nextNode);
    }
  }

  // Print flow
  for (const n of nodes) {
    console.log('  ' + n.nodeId + (n.type ? ' (' + n.type + ')' : '') + ' -> ' + (n.nextNode || '(END)'));
  }

  // Check for unreachable nodes
  const reachable = new Set(['start']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes) {
      const id = n.nodeId.startsWith('  CHOICE:') ? null : n.nodeId;
      if (id && reachable.has(id) && n.nextNode && !reachable.has(n.nextNode)) {
        reachable.add(n.nextNode);
        changed = true;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeId.startsWith('  CHOICE:') && i > 0) {
        let owner = null;
        for (let j = i - 1; j >= 0; j--) {
          if (!nodes[j].nodeId.startsWith('  CHOICE:')) {
            owner = nodes[j].nodeId;
            break;
          }
        }
        if (owner && reachable.has(owner) && nodes[i].nextNode && !reachable.has(nodes[i].nextNode)) {
          reachable.add(nodes[i].nextNode);
          changed = true;
        }
      }
    }
  }

  const unreachableNodes = [];
  for (const n of nodes) {
    if (!n.nodeId.startsWith('  CHOICE:') && !reachable.has(n.nodeId)) {
      unreachableNodes.push(n.nodeId);
    }
  }

  const danglingRefs = [];
  for (const ref of referencedIds) {
    if (!allNodeIds.has(ref)) {
      danglingRefs.push(ref);
    }
  }

  // Check: 自動遷移ノードに遷移先がない
  for (const n of nodes) {
    if (n.nodeId.startsWith('  CHOICE:')) continue;
    if (AUTO_TRANSITION_TYPES.has(n.type)) {
      const hasNext = n.nextNode && n.nextNode.trim() !== '';
      const idx = nodes.indexOf(n);
      let hasChoices = false;
      for (let j = idx + 1; j < nodes.length; j++) {
        if (nodes[j].nodeId.startsWith('  CHOICE:')) { hasChoices = true; break; }
        else break;
      }
      if (!hasNext && !hasChoices) {
        errors.push('  \u274c [' + n.nodeId + '] \u81ea\u52d5\u9077\u79fb\u30ce\u30fc\u30c9(' + n.type + ')\u306b\u904e\u79fb\u5148(next/CHOICE)\u304c\u306a\u3044 \u2192 \u9032\u884c\u4e0d\u80fd\u306e\u539f\u56e0');
      }
    }
  }

  // Check: Node volume limits
  const actualNodeCount = nodes.filter(n => !n.nodeId.startsWith('  CHOICE:')).length;
  if (actualNodeCount <= 40) {
    warnings.push('  \u26a0 ボリューム注意: 現在 ' + actualNodeCount + ' ノード（40ノード以下のため、ボリューム増量を推奨します）');
  }

  // Check: end ノードの存在確認（result判定含む）
  const hasEndSuccess = nodes.some(n =>
    n.type === 'end' && n.params?.result === 'success'
  );
  const hasEndFailure = nodes.some(n =>
    n.type === 'end' && n.params?.result === 'failure'
  );
  if (!hasEndSuccess) warnings.push('  \u26a0 end_success \u30ce\u30fc\u30c9\u304c\u5b58\u5728\u3057\u306a\u3044');
  if (!hasEndFailure) warnings.push('  \u26a0 end_failure \u30ce\u30fc\u30c9\u304c\u5b58\u5728\u3057\u306a\u3044');

  // Check: enemy_group_id が enemy_groups.csv に存在するか
  const enemyGroupsCsvPath = path.join(__dirname, '../src/data/csv/enemy_groups.csv');
  if (fs.existsSync(enemyGroupsCsvPath)) {
    const egCsv = fs.readFileSync(enemyGroupsCsvPath, 'utf8');
    for (const n of nodes) {
      if (n.type === 'battle' && n.params?.enemy_group_id) {
        const gid = String(n.params.enemy_group_id);
        // CSV行頭のIDカラムをチェック（行頭 or カンマ直後に数値）
        const idRegex = new RegExp('(^|,)' + gid + '(,|$)', 'm');
        if (!idRegex.test(egCsv)) {
          errors.push('  \u274c [' + n.nodeId + '] enemy_group_id=' + gid + ' \u304c enemy_groups.csv \u306b\u672a\u767b\u9332');
        }
      }
    }
  }

  // Output results
  if (unreachableNodes.length > 0) {
    errors.push('  \u274c UNREACHABLE NODES: ' + unreachableNodes.join(', '));
  }
  if (danglingRefs.length > 0) {
    errors.push('  \u274c DANGLING REFERENCES: ' + danglingRefs.join(', '));
  }

  for (const e of errors) { console.log(e); totalErrors++; }
  for (const w of warnings) { console.log(w); totalWarnings++; }
  if (errors.length === 0 && warnings.length === 0) {
    console.log('  \u2705 OK');
  }
  console.log('');
}

console.log('=== SUMMARY ===');
console.log('  Errors:   ' + totalErrors);
console.log('  Warnings: ' + totalWarnings);
if (totalErrors > 0) {
  console.log('  \u26d4 \u30a8\u30e9\u30fc\u304c\u691c\u51fa\u3055\u308c\u307e\u3057\u305f\u3002\u4fee\u6b63\u3057\u3066\u304b\u3089\u5b9f\u88c5\u306b\u9032\u3093\u3067\u304f\u3060\u3055\u3044\u3002');
  process.exit(1);
} else {
  console.log('  \u2705 \u5168\u30c1\u30a7\u30c3\u30af\u5b8c\u4e86');
}
