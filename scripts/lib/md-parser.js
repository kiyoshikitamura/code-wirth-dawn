/**
 * Shared MD Parser — Wirth-Dawn Scripts
 * 
 * Extracts quest scenario nodes from Markdown specification files (docs/quest/).
 * Core logic derived from md_to_csv_7000.js, made reusable.
 * 
 * Supported MD node format:
 *   #### `node_id`（type）
 *   **演出:** bg:bg_key, bgm:bgm_key, speaker:Name
 *   ```text
 *   テキスト内容
 *   ```
 *   **パラメータ:** key: value, key: value
 */
const fs = require('fs');
const path = require('path');

const QUEST_DIR = path.join(__dirname, '..', '..', 'docs', 'quest');
const CSV_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'csv', 'scenarios');

/**
 * Parse a quest MD file into structured node objects.
 * @param {string} mdPath - Absolute path to the MD file
 * @returns {Array<Object>} Parsed node objects
 */
function parseMD(mdPath) {
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const content = mdContent.charCodeAt(0) === 0xFEFF ? mdContent.slice(1) : mdContent;
  const lines = content.split('\n');
  const nodes = [];
  let currentNode = null;

  // Phase 1: Parse nodes from MD
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Node header: #### `node_id`（type）
    const nodeMatch = line.match(/^#### `([^`]+)`（([^）]+)）/);
    if (nodeMatch) {
      currentNode = {
        id: nodeMatch[1],
        type: nodeMatch[2],
        text: '',
        parsedParams: null,
        choices: [],
        explicitNext: null,
        explicitFallback: null,
        explicitFail: null,
        explicitItemId: null,
        explicitQuantity: null,
        explicitProb: null,
        explicitPercent: null,
        overrideNextNode: null,
      };
      nodes.push(currentNode);
      continue;
    }

    if (!currentNode) continue;

    // Text block (```text ... ```)
    if (line.startsWith('```text')) {
      let textLines = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('```')) {
        textLines.push(lines[j].replace('\r', ''));
        j++;
      }
      currentNode.text = textLines.join('\\n').trim();
      i = j;
      continue;
    }

    // Stage params: **演出:**
    if (line.startsWith('**演出:**')) {
      const rawParams = line.replace('**演出:**', '').trim();
      const paramParts = rawParams.split(',').map(p => p.trim());
      const paramObj = {};
      for (const part of paramParts) {
        const [k, ...v] = part.split(':');
        if (k && v.length) paramObj[k.trim()] = v.join(':').trim();
      }
      if (paramObj.speaker) {
        paramObj.speaker_name = paramObj.speaker;
        delete paramObj.speaker;
      }
      currentNode.parsedParams = paramObj;
    }

    // **パラメータ:** line
    const paramLineMatch = line.match(/^\*\*パラメータ:\*\*\s*(.+)$/);
    if (paramLineMatch && currentNode) {
      const rawStr = paramLineMatch[1];
      const pairs = rawStr.split(',').map(p => p.trim());
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx < 0) continue;
        const k = pair.substring(0, colonIdx).trim().toLowerCase();
        const v = pair.substring(colonIdx + 1).trim().replace(/`/g, '');
        if (k === 'next') currentNode.explicitNext = v;
        else if (k === 'fallback') currentNode.explicitFallback = v;
        else if (k === 'fail') currentNode.explicitFail = v;
        else if (k === 'item_id') currentNode.explicitItemId = v;
        else if (k === 'quantity') currentNode.explicitQuantity = parseInt(v, 10);
        else if (k === 'prob') currentNode.explicitProb = parseInt(v, 10);
        else if (k === 'percent') currentNode.explicitPercent = parseInt(v, 10);
        else if (k === 'enemy_group_id') {
          if (!currentNode.parsedParams) currentNode.parsedParams = {};
          currentNode.parsedParams.enemy_group_id = parseInt(v, 10);
        }
        else if (k === 'guest_id' || k === 'npc_slug') {
          if (!currentNode.parsedParams) currentNode.parsedParams = {};
          currentNode.parsedParams.guest_id = v;
        }
        else if (k === 'is_escort_target') {
          if (!currentNode.parsedParams) currentNode.parsedParams = {};
          currentNode.parsedParams.is_escort_target = v === 'true';
        }
      }
    }

    // **次ノード:** line
    const nextNodeMatch = line.match(/^\*\*次ノード:\*\*\s*(.+)$/);
    if (nextNodeMatch && currentNode) {
      const raw = nextNodeMatch[1].trim();
      const idMatch = raw.match(/^([a-z0-9_]+)/);
      if (idMatch) currentNode.overrideNextNode = idMatch[1];
    }

    // Battle params: 敵グループID table row
    if (currentNode.type === 'battle' && line.startsWith('| 敵グループID |')) {
      if (!currentNode.parsedParams) currentNode.parsedParams = {};
      const parts = line.split('|').map(p => p.trim());
      const idMatch = parts[2].match(/\d+/);
      if (idMatch) currentNode.parsedParams.enemy_group_id = parseInt(idMatch[0], 10);
    }
    if (currentNode.type === 'battle' && line.startsWith('| 敵表示名 |')) {
      if (!currentNode.parsedParams) currentNode.parsedParams = {};
      const parts = line.split('|').map(p => p.trim());
      currentNode.parsedParams.enemy_name = parts[2];
    }

    // Guest params
    if (line.startsWith('| guest_id |')) {
      if (!currentNode.parsedParams) currentNode.parsedParams = {};
      const parts = line.split('|').map(p => p.trim());
      currentNode.parsedParams.guest_id = parts[2].replace(/`/g, '');
    }
    if (line.startsWith('| is_escort_target |')) {
      if (!currentNode.parsedParams) currentNode.parsedParams = {};
      const parts = line.split('|').map(p => p.trim());
      currentNode.parsedParams.is_escort_target = parts[2] === 'true';
    }

    // Choice table rows
    if (currentNode.type === 'choice' && line.match(/^\|[^|]+\|[^|]+\|$/)) {
      if (line.includes('選択肢') || line.includes('---')) continue;
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 2) {
        currentNode.choices.push({ text: parts[0], next: parts[1].replace(/`/g, '') });
      }
    }

    // Choice list format: - 選択肢: 「テキスト」→ `next_node`
    if (currentNode.type === 'choice') {
      const listChoiceMatch = line.match(/^-\s*選択肢:\s*[「『]([^」』]+)[」』]\s*→\s*`([^`]+)`/);
      if (listChoiceMatch) {
        currentNode.choices.push({ text: listChoiceMatch[1], next: listChoiceMatch[2] });
      }
    }

    // **rewards:** line
    const rewardsMatch = line.match(/^\*\*rewards:\*\*\s*(.+)$/i);
    if (rewardsMatch && currentNode) {
      if (!currentNode.parsedParams) currentNode.parsedParams = {};
      const rewards = {};
      for (const token of rewardsMatch[1].split(/[,|]/)) {
        const [key, val] = token.trim().split(':');
        if (!key || !val) continue;
        const k = key.trim().toLowerCase();
        const v = parseInt(val.trim(), 10);
        if (isNaN(v)) continue;
        if (k === 'gold') rewards.gold = v;
        else if (k === 'exp') rewards.exp = v;
        else if (k === 'rep') rewards.reputation = v;
        else if (k === 'order') { if (!rewards.alignment_shift) rewards.alignment_shift = {}; rewards.alignment_shift.order = v; }
        else if (k === 'evil') { if (!rewards.alignment_shift) rewards.alignment_shift = {}; rewards.alignment_shift.evil = v; }
        else if (k === 'chaos') { if (!rewards.alignment_shift) rewards.alignment_shift = {}; rewards.alignment_shift.chaos = v; }
        else if (k === 'justice') { if (!rewards.alignment_shift) rewards.alignment_shift = {}; rewards.alignment_shift.justice = v; }
      }
      currentNode.parsedParams.rewards = rewards;
    }
  }

  // Phase 2: Post-parse param completion
  for (const node of nodes) {
    if (!node.parsedParams) node.parsedParams = {};
    const ht = node.type;
    if (ht === 'end_success') { node.parsedParams.type = 'end'; node.parsedParams.result = 'success'; }
    else if (ht === 'end_failure') { node.parsedParams.type = 'end'; node.parsedParams.result = 'failure'; }
    else if (['guest_join','leave','battle','choice','random_branch','check_delivery','reward','hp_damage','modify_flag','check_flags'].includes(ht)) {
      node.parsedParams.type = ht;
    } else {
      if (!node.parsedParams.type) node.parsedParams.type = 'text';
    }
    if (ht === 'random_branch' && node.explicitProb != null) node.parsedParams.prob = node.explicitProb;
    if (ht === 'check_delivery') {
      if (node.explicitItemId) node.parsedParams.item_id = node.explicitItemId;
      if (node.explicitQuantity != null) node.parsedParams.quantity = node.explicitQuantity;
    }
    if (ht === 'reward' && node.explicitItemId) node.parsedParams.item_id = node.explicitItemId;
    if (ht === 'hp_damage' && node.explicitPercent != null) {
      node.parsedParams.percent = node.explicitPercent;
      node.parsedParams.hp_percent = node.explicitPercent;
    }

    // bg/bgm inheritance
    if (!node.parsedParams.bg) {
      const idx = nodes.indexOf(node);
      for (let j = idx - 1; j >= 0; j--) {
        if (nodes[j].parsedParams?.bg) { node.parsedParams.bg = nodes[j].parsedParams.bg; break; }
      }
    }
    if (node.parsedParams.type === 'battle' && !node.parsedParams.bgm) {
      node.parsedParams.bgm = 'bgm_battle';
    }
  }

  return nodes;
}

/**
 * Resolve choice branch merge points (same logic as md_to_csv_7000.js Phase 2.5).
 */
function resolveChoiceMergePoints(nodes) {
  const nodeIndex = {};
  nodes.forEach((n, idx) => { nodeIndex[n.id] = idx; });
  const overrideNextNode = {};

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== 'choice' || node.choices.length < 2) continue;

    const branchStartIndices = node.choices
      .map(c => ({ text: c.text, next: c.next, idx: nodeIndex[c.next] }))
      .filter(c => c.idx !== undefined)
      .sort((a, b) => a.idx - b.idx);

    if (branchStartIndices.length < 2) continue;

    const branches = [];
    for (let b = 0; b < branchStartIndices.length; b++) {
      const startIdx = branchStartIndices[b].idx;
      let endIdx;
      if (b + 1 < branchStartIndices.length) {
        endIdx = branchStartIndices[b + 1].idx - 1;
      } else {
        endIdx = startIdx;
        for (let j = startIdx; j < nodes.length; j++) {
          const n = nodes[j];
          if (n.type === 'end_success' || n.type === 'end_failure' || n.type === 'end') break;
          endIdx = j;
          if (n.type === 'battle' && j + 1 < nodes.length) { endIdx = j + 1; break; }
        }
      }
      branches.push({
        startId: branchStartIndices[b].next, startIdx, endIdx,
        nodeIds: nodes.slice(startIdx, endIdx + 1).map(n => n.id)
      });
    }

    const lastBranch = branches[branches.length - 1];
    const mergeIdx = lastBranch.endIdx + 1;
    if (mergeIdx >= nodes.length) continue;
    const mergePoint = nodes[mergeIdx].id;
    const allBranchNodes = new Set();
    for (const br of branches) { for (const id of br.nodeIds) allBranchNodes.add(id); }

    for (const br of branches) {
      const lastNodeId = br.nodeIds[br.nodeIds.length - 1];
      const lastNode = nodes[nodeIndex[lastNodeId]];
      if (['battle','end_success','end_failure','end'].includes(lastNode.type)) continue;
      const seqNextIdx = nodeIndex[lastNodeId] + 1;
      if (seqNextIdx < nodes.length && allBranchNodes.has(nodes[seqNextIdx].id)) {
        overrideNextNode[lastNodeId] = mergePoint;
      }
    }
  }
  return overrideNextNode;
}

/**
 * Convert parsed nodes to CSV string.
 * @param {Array<Object>} nodes
 * @returns {string} CSV content
 */
function nodesToCSV(nodes) {
  const overrideNextNode = resolveChoiceMergePoints(nodes);
  let csv = 'row_type,node_id,text_label,params,next_node\n';

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let nextNode = '';
    let choices = [];
    const sequentialNext = (i + 1 < nodes.length) ? nodes[i + 1].id : '';

    if (node.type === 'battle') {
      nextNode = '';
      choices = [
        { text: 'win', next: node.explicitNext || sequentialNext || 'end_success' },
        { text: 'lose', next: node.explicitFail || 'end_failure' }
      ];
    } else if (node.type === 'choice') {
      nextNode = '';
      choices = node.choices.length > 0 ? node.choices.map(c => ({ text: c.text, next: c.next })) : [];
      if (choices.length === 0) nextNode = sequentialNext;
    } else if (node.type === 'random_branch') {
      nextNode = '';
      choices = [
        { text: 'success', next: node.explicitNext || sequentialNext },
        { text: 'failure', next: node.explicitFallback || sequentialNext }
      ];
    } else if (node.type === 'check_delivery') {
      nextNode = '';
      choices = [
        { text: 'success', next: node.explicitNext || sequentialNext },
        { text: 'failure', next: node.explicitFallback || sequentialNext }
      ];
    } else if (node.type === 'check_flags') {
      nextNode = '';
      if (node.choices.length > 0) choices = node.choices.map(c => ({ text: c.text, next: c.next }));
    } else if (['end_success','end_failure','end'].includes(node.type)) {
      nextNode = '';
    } else if (['reward','hp_damage'].includes(node.type)) {
      nextNode = node.explicitNext || overrideNextNode[node.id] || sequentialNext;
    } else {
      nextNode = node.overrideNextNode || overrideNextNode[node.id] || sequentialNext;
    }

    const p = node.parsedParams || {};
    const pStr = JSON.stringify(p);
    const escapedParams = '"' + pStr.replace(/"/g, '""') + '"';
    const escapedText = '"' + node.text.replace(/"/g, '""') + '"';

    csv += 'NODE,' + node.id + ',' + escapedText + ',' + escapedParams + ',' + nextNode + '\n';
    for (const c of choices) {
      csv += 'CHOICE,,' + c.text + ',,' + c.next + '\n';
    }
  }
  return csv;
}

/**
 * Auto-discover quest MD files and their corresponding CSV outputs.
 * Scans docs/quest/ for quest_*.md files and maps them to scenario CSV names.
 * @returns {Array<{md: string, csv: string, questId: string}>}
 */
function discoverQuests() {
  const mdFiles = fs.readdirSync(QUEST_DIR).filter(f => f.match(/^quest_\d+_.+\.md$/));
  return mdFiles.map(md => {
    // quest_7010_heretic.md → 7010_qst_*.csv
    const match = md.match(/^quest_(\d+)_(.+)\.md$/);
    if (!match) return null;
    const id = match[1];
    // Find matching CSV in scenarios dir
    const csvFiles = fs.readdirSync(CSV_DIR).filter(f => f.startsWith(id + '_'));
    const csvFile = csvFiles[0] || null;
    return { md, csv: csvFile, questId: id };
  }).filter(q => q && q.csv);
}

module.exports = {
  parseMD,
  resolveChoiceMergePoints,
  nodesToCSV,
  discoverQuests,
  QUEST_DIR,
  CSV_DIR
};
