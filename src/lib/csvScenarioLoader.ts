/**
 * csvScenarioLoader.ts
 * Unified CSV → ScenarioEngine JSON converter (Spec v3.3)
 *
 * Parses row_type (NODE/CHOICE) CSV format into the JSON tree
 * consumed by <ScenarioEngine />.
 */

export interface ScenarioNode {
    text?: string;
    type?: string;
    bg_key?: string;
    bgm?: string;
    enemy_group_id?: string;
    result?: string;
    prob?: number;
    req_stat?: string;
    req_val?: number;
    choices?: ScenarioChoice[];
    [key: string]: any;
}

export interface ScenarioChoice {
    label: string;
    next: string;
    cost_vitality?: number;
    cost_gold?: number;
    req_tag?: string;
    req_card?: string;
    [key: string]: any;
}

export interface ScenarioJson {
    nodes: Record<string, ScenarioNode>;
}

/**
 * Parse a key:value params string like "bg:forest, type:battle, enemy:goblin_squad"
 * into an object { bg: "forest", type: "battle", enemy: "goblin_squad" }
 */
function parseParams(paramsStr: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!paramsStr || !paramsStr.trim()) return result;

    // Split by comma, then by colon
    const parts = paramsStr.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
        const colonIdx = part.indexOf(':');
        if (colonIdx > 0) {
            const key = part.substring(0, colonIdx).trim();
            const val = part.substring(colonIdx + 1).trim();
            result[key] = val;
        }
    }
    return result;
}

/**
 * Parses CSV text (with header row) into rows.
 * Handles quoted fields with commas and escaped quotes.
 */
function parseCsvRows(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');

    for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');
        if (!line.trim()) continue;

        const fields: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++; // skip escaped quote
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

/**
 * Main converter: parses unified CSV text into ScenarioEngine-compatible JSON.
 *
 * Expected columns: row_type, node_id, text_label, next_node, params
 */
export function parseCsvToScenarioJson(csvText: string): ScenarioJson {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) return { nodes: {} };

    // Header
    const header = rows[0].map(h => h.trim().toLowerCase());
    const colIdx = {
        row_type: header.indexOf('row_type'),
        node_id: header.indexOf('node_id'),
        text_label: header.indexOf('text_label'),
        next_node: header.indexOf('next_node'),
        params: header.indexOf('params'),
    };

    const nodes: Record<string, ScenarioNode> = {};
    let currentNodeId: string | null = null;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowType = (row[colIdx.row_type] || '').trim().toUpperCase();
        const nodeId = (row[colIdx.node_id] || '').trim();
        const textLabel = (row[colIdx.text_label] || '').trim();
        const nextNode = (row[colIdx.next_node] || '').trim();
        const paramsStr = (row[colIdx.params] || '').trim();
        const params = parseParams(paramsStr);

        if (rowType === 'NODE') {
            currentNodeId = nodeId;

            const node: ScenarioNode = {};

            // Process text (handle \n escape)
            if (textLabel) {
                node.text = textLabel.replace(/\\n/g, '\n');
            }

            // Apply params
            if (params.type) {
                node.type = params.type;

                // Map end types to result
                if (params.type === 'end_success' || params.type === 'end') {
                    node.type = 'end';
                    node.result = 'success';
                } else if (params.type === 'end_failure') {
                    node.type = 'end';
                    node.result = 'failure';
                }
            }

            if (params.bg) node.bg_key = params.bg;
            if (params.bgm) node.bgm = params.bgm;
            if (params.enemy) node.enemy_group_id = params.enemy;
            if (params.prob) node.prob = parseInt(params.prob, 10);
            if (params.cond) node.cond = params.cond;
            if (params.next) node.condNext = params.next;
            if (params.fallback) node.condFallback = params.fallback;
            if (params.req_stat) node.req_stat = params.req_stat;
            if (params.req_val) node.req_val = parseInt(params.req_val, 10);

            // If next_node is specified at NODE level (auto-advance)
            if (nextNode) {
                if (nextNode === 'EXIT') {
                    node.type = 'end';
                    node.result = 'success';
                } else if (nextNode === 'EXIT_FAIL') {
                    node.type = 'end';
                    node.result = 'failure';
                } else {
                    // Auto-advance: create a single "continue" choice
                    node.choices = [{ label: '続ける', next: nextNode }];
                }
            }

            node.choices = node.choices || [];
            nodes[nodeId] = node;

        } else if (rowType === 'CHOICE' && currentNodeId) {
            const choice: ScenarioChoice = {
                label: textLabel || '...',
                next: nextNode || currentNodeId,
            };

            // Apply choice-specific params
            if (params.cost_gold) choice.cost_gold = parseInt(params.cost_gold, 10);
            if (params.cost_type === 'vitality' && params.cost_val) {
                choice.cost_vitality = parseInt(params.cost_val, 10);
            }
            if (params.req_card) choice.req_card = params.req_card;
            if (params.req_tag) choice.req_tag = params.req_tag;

            // Map special CHOICE labels for branch nodes
            if (!nodes[currentNodeId].choices) {
                nodes[currentNodeId].choices = [];
            }
            nodes[currentNodeId].choices!.push(choice);
        }
    }

    return { nodes };
}
