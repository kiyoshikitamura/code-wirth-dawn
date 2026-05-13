const fs = require('fs');

function parseCsvRows(csvText) {
    const rows = [];
    const lines = csvText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/\r$/, '');
        if (!line.trim()) continue;
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (inQuotes) {
                if (ch === '"') {
                    if (j + 1 < line.length && line[j + 1] === '"') {
                        current += '"';
                        j++;
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
        rows.push(fields);
    }
    return rows;
}

function parseParams(paramsStr) {
    if (!paramsStr || !paramsStr.trim()) return {};
    const trimmed = paramsStr.trim();
    if (trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            return {};
        }
    }
    return {};
}

const csvText = fs.readFileSync('src/data/csv/scenarios/6020_main_ep20.csv', 'utf-8');
const rows = parseCsvRows(csvText);
const header = rows[0].map(h => h.trim().toLowerCase());
const colIdx = {
    row_type: header.indexOf('row_type'),
    node_id: header.indexOf('node_id'),
    text_label: header.indexOf('text_label'),
    next_node: header.indexOf('next_node'),
    params: header.indexOf('params'),
};

const nodes = {};
let currentNodeId = null;

for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowType = (row[colIdx.row_type] || '').trim().toUpperCase();
    const nodeId = (row[colIdx.node_id] || '').trim();
    const nextNode = (row[colIdx.next_node] || '').trim();
    const paramsStr = (row[colIdx.params] || '').trim();
    const params = parseParams(paramsStr);

    if (rowType === 'NODE') {
        currentNodeId = nodeId;
        const node = { id: nodeId, params: {} };
        if (params.type) node.type = params.type;
        const passthrough = ['success_node', 'fail_node', 'items'];
        for (const k of passthrough) {
            if (params[k] !== undefined) node.params[k] = params[k];
        }
        if (nextNode) {
            node.next = nextNode;
            node.choices = [{ label: '続ける', next: nextNode }];
        }
        nodes[nodeId] = node;
    } else if (rowType === 'CHOICE' && currentNodeId) {
        if (!nodes[currentNodeId].choices) nodes[currentNodeId].choices = [];
        nodes[currentNodeId].choices.push({ next: nextNode });
    }
}

console.log("Nodes available:", Object.keys(nodes));
console.log("check_items node:", nodes['check_items']);
console.log("text_relics_missing node:", nodes['text_relics_missing']);
console.log("battle_strong node:", nodes['battle_strong']);
