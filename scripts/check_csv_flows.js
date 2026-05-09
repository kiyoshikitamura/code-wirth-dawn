const fs = require('fs');
const path = require('path');

const quests = [
  { id: '7010', slug: 'heretic' },
  { id: '7011', slug: 'holywater' },
  { id: '7012', slug: 'pilgrim' },
  { id: '7013', slug: 'undead' },
  { id: '7014', slug: 'tithe' },
  { id: '7015', slug: 'relic' },
];

for (const q of quests) {
  const csvPath = path.join(__dirname, '../src/data/csv/scenarios', q.id + '_qst_rol_' + q.slug + '.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());

  console.log('=== CSV ' + q.id + ' (' + q.slug + ') ===');

  // Build node graph
  const nodes = [];
  const allNodeIds = new Set();
  const referencedIds = new Set();

  for (let i = 1; i < lines.length; i++) {
    // Parse CSV properly
    const line = lines[i];
    const rowType = line.substring(0, line.indexOf(','));

    if (rowType === 'NODE') {
      // Extract node_id (second field)
      const rest = line.substring(5); // after "NODE,"
      const nodeId = rest.substring(0, rest.indexOf(','));
      allNodeIds.add(nodeId);

      // Extract next_node (last field after last comma)
      const lastComma = line.lastIndexOf(',');
      const nextNode = line.substring(lastComma + 1).trim();

      // Extract type from params JSON
      const paramsMatch = line.match(/\{[^}]*"type""[^}]*\}/);
      let type = '?';
      if (paramsMatch) {
        const cleaned = paramsMatch[0].replace(/""/g, '"');
        try {
          const obj = JSON.parse(cleaned);
          type = obj.type || '?';
        } catch(e) {}
      }

      nodes.push({ nodeId, type, nextNode });
      if (nextNode) referencedIds.add(nextNode);
    } else if (rowType === 'CHOICE') {
      const lastComma = line.lastIndexOf(',');
      const nextNode = line.substring(lastComma + 1).trim();
      const textMatch = line.match(/CHOICE,,([^,]*),/);
      const text = textMatch ? textMatch[1] : '?';
      nodes.push({ nodeId: '  CHOICE:' + text, type: '', nextNode });
      if (nextNode) referencedIds.add(nextNode);
    }
  }

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
      // For choices, the previous battle node leads to them
    }
    // Also handle choices: find battle nodes and add their choice targets
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeId.startsWith('  CHOICE:') && i > 0) {
        // Find the owning battle node
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

  // Check for dangling references
  const danglingRefs = [];
  for (const ref of referencedIds) {
    if (!allNodeIds.has(ref)) {
      danglingRefs.push(ref);
    }
  }

  if (unreachableNodes.length > 0) {
    console.log('  *** UNREACHABLE NODES: ' + unreachableNodes.join(', '));
  }
  if (danglingRefs.length > 0) {
    console.log('  *** DANGLING REFERENCES: ' + danglingRefs.join(', '));
  }
  console.log('');
}
