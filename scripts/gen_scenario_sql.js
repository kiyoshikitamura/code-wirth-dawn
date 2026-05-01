/**
 * シナリオSQL生成スクリプト
 * docs/quest/quest_60XX_main_epXX.md の仕様書からシナリオSQLを生成する。
 * 対象: 6016〜6020
 */
const fs = require('fs');
const path = require('path');

const QUEST_DIR = path.join(__dirname, '..', 'docs', 'quest');
const OUTPUT = path.join(__dirname, '..', 'sql', 'scenario_6016_6020.sql');

const QUEST_FILES = [
  { id: 6016, file: 'quest_6016_main_ep16.md', rewards: { gold: 3000, exp: 400, reputation: 20 } },
  { id: 6017, file: 'quest_6017_main_ep17.md', rewards: { gold: 3500, exp: 450, reputation: 25 } },
  { id: 6018, file: 'quest_6018_main_ep18.md', rewards: { gold: 3500, exp: 450, reputation: 25 } },
  { id: 6019, file: 'quest_6019_main_ep19.md', rewards: { gold: 3500, exp: 450, reputation: 25 } },
  { id: 6020, file: 'quest_6020_main_ep20.md', rewards: { gold: 15000, exp: 1000, reputation: 50 } },
];

function parseQuestDoc(content) {
  const nodes = {};
  // Find all node definitions by #### `node_name`（type: xxx）
  const nodeRegex = /#### `([^`]+)`（type: (\w+)）/g;
  const nodePositions = [];
  let match;
  while ((match = nodeRegex.exec(content)) !== null) {
    nodePositions.push({
      name: match[1],
      type: match[2],
      startIdx: match.index,
    });
  }

  for (let i = 0; i < nodePositions.length; i++) {
    const np = nodePositions[i];
    const endIdx = i + 1 < nodePositions.length ? nodePositions[i + 1].startIdx : content.length;
    const section = content.substring(np.startIdx, endIdx);

    const node = { type: np.type };

    // Extract bg_key
    const bgMatch = section.match(/\*\*背景\*\*: `([^`]+)`/);
    if (bgMatch) node.bg_key = bgMatch[1];

    // Extract BGM
    const bgmMatch = section.match(/\*\*BGM\*\*: `([^`]+)`/);
    if (bgmMatch) node.bgm = bgmMatch[1];

    // Extract speaker_name
    const speakerMatch = section.match(/\*\*speaker_name\*\*: `([^`]+)`/);
    if (speakerMatch) node.speaker_name = speakerMatch[1];

    // Extract text content (between ``` markers under テキスト:)
    const textBlockMatch = section.match(/\*\*テキスト:\*\*\s*\n```\n([\s\S]*?)\n```/);
    if (textBlockMatch) {
      // Combine multi-line text
      node.text = textBlockMatch[1].replace(/\n/g, '');
    }

    // Extract battle enemy_group_id
    if (np.type === 'battle') {
      const groupMatch = section.match(/敵グループ\s*\|\s*`([^`]*)`/);
      if (groupMatch) {
        // Use group slug if available
        node.enemy_group_id = groupMatch[1];
      }
    }

    // Extract params
    const paramsMatch = section.match(/\*\*params:\*\*\s*`([^`]+)`/);
    if (paramsMatch) {
      try {
        node.params = JSON.parse(paramsMatch[1]);
      } catch (e) {}
    }

    nodes[np.name] = node;
  }

  return nodes;
}

function buildFlowFromDoc(content) {
  // Extract flow chart from the ### 全体フロー section
  const flowMatch = content.match(/### 全体フロー\s*\n```text\n([\s\S]*?)\n```/);
  if (!flowMatch) return [];

  const flowText = flowMatch[1];
  // Extract all node names from the flow
  const nodeNames = [];
  const nameRegex = /\b([a-z_][a-z0-9_]*)\b/g;
  let m;
  while ((m = nameRegex.exec(flowText)) !== null) {
    if (!nodeNames.includes(m[1]) && m[1] !== 'start') {
      nodeNames.push(m[1]);
    }
  }
  return ['start', ...nodeNames];
}

function linkNodes(nodes, nodeOrder) {
  // Link sequential nodes
  for (let i = 0; i < nodeOrder.length; i++) {
    const name = nodeOrder[i];
    const node = nodes[name];
    if (!node) continue;

    // Find the next node in flow
    if (i + 1 < nodeOrder.length) {
      const nextName = nodeOrder[i + 1];
      if (!node.next) {
        node.next = nextName;
      }
    }

    // Add choices
    if (node.type === 'battle') {
      // Find battle_success_next from the flow
      // Look for the victory path
      const successIdx = nodeOrder.indexOf(name) + 1;
      // Find nodes that follow battle in the spec
      if (successIdx < nodeOrder.length) {
        // Skip failure nodes
        let nextSuccess = nodeOrder[successIdx];
        if (nextSuccess && !nextSuccess.includes('failure')) {
          node.battle_success_next = nextSuccess;
        }
      }
    }

    if (node.type === 'end') {
      node.choices = [];
    } else if (node.type === 'battle') {
      node.choices = [{ label: '続ける', next: node.battle_success_next || node.next }];
    } else {
      node.choices = [{ label: '続ける', next: node.next }];
    }
  }
}

// Main
let output = '-- ============================================================\n';
output += '-- シナリオ script_data 同期SQL (6016-6020 新構成)\n';
output += '-- 生成日: 2026-04-28\n';
output += '-- ============================================================\n\n';

for (const quest of QUEST_FILES) {
  const filePath = path.join(QUEST_DIR, quest.file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${quest.file} not found`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const nodes = parseQuestDoc(content);
  const nodeOrder = buildFlowFromDoc(content);

  console.log(`[${quest.id}] ${quest.file}: ${Object.keys(nodes).length} nodes found, flow: ${nodeOrder.length} nodes`);
  console.log(`  Flow: ${nodeOrder.join(' -> ')}`);

  // Basic linking
  linkNodes(nodes, nodeOrder);

  // Build JSON
  const scriptData = { nodes: {} };
  for (const name of nodeOrder) {
    if (nodes[name]) {
      scriptData.nodes[name] = nodes[name];
    }
  }

  const jsonStr = JSON.stringify(scriptData);
  const rewardsJson = JSON.stringify(quest.rewards);

  output += `-- ${quest.file} (${Object.keys(scriptData.nodes).length} nodes)\n`;
  output += `UPDATE scenarios SET script_data = '${jsonStr.replace(/'/g, "''")}'::jsonb, rewards = '${rewardsJson}'::jsonb WHERE id = ${quest.id};\n\n`;
}

fs.writeFileSync(OUTPUT, output, 'utf-8');
console.log(`\nOutput written to: ${OUTPUT}`);
