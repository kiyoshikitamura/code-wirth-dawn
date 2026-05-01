/**
 * csvScenarioLoader.ts
 * Unified CSV → ScenarioEngine JSON converter (Spec v4.0)
 *
 * Parses row_type (NODE/CHOICE) CSV format into the JSON tree
 * consumed by <ScenarioEngine />.
 *
 * Supports two params formats:
 *   - JSON:      {"type":"text", "bg":"bg_default", "speaker_image_url":"/images/..."}
 *   - Legacy:    type:text, bg:forest, enemy:goblin_squad
 */

export interface ScenarioNode {
    text?: string;
    type?: string;
    bg_key?: string;
    bgm?: string;
    enemy_group_id?: string;
    speaker_image_url?: string;
    speaker_name?: string;
    speaker?: string;
    result?: string;
    prob?: number;
    req_stat?: string;
    req_val?: number;
    next?: string;
    choices?: ScenarioChoice[];
    params?: Record<string, any>;
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
 * Parse a params string. Auto-detects JSON vs legacy key:value format.
 */
function parseParams(paramsStr: string): Record<string, any> {
    if (!paramsStr || !paramsStr.trim()) return {};

    const trimmed = paramsStr.trim();

    // JSON形式を自動検出 (先頭が { の場合)
    if (trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            console.warn('[csvScenarioLoader] JSON parse failed for params, falling back to legacy:', trimmed);
        }
    }

    // Legacy format: key:value, key:value
    const result: Record<string, string> = {};
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
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
 * Expected columns: row_type, node_id, text_label, params, next_node
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

            // Apply params — 全フィールドを params から抽出
            if (params.type) {
                node.type = params.type;

                // Map end types to result
                if (params.type === 'end_success') {
                    node.type = 'end';
                    node.result = 'success';
                } else if (params.type === 'end_failure') {
                    node.type = 'end';
                    node.result = 'failure';
                } else if (params.type === 'end') {
                    node.type = 'end';
                    node.result = params.result || 'success';
                }
            }

            // 背景・BGM
            if (params.bg) node.bg_key = params.bg;
            if (params.bgm) node.bgm = params.bgm;

            // 敵グループ
            if (params.enemy_group_id) {
                node.enemy_group_id = String(params.enemy_group_id);
            } else if (params.enemy) {
                node.enemy_group_id = params.enemy;
            }

            // 話者情報
            if (params.speaker_image_url) node.speaker_image_url = params.speaker_image_url;
            if (params.speaker_name) {
                node.speaker_name = params.speaker_name;
                node.speaker = params.speaker_name;
            }

            // ゲスト参加
            if (params.guest_id) {
                node.params = node.params || {};
                node.params.guest_id = params.guest_id;
            }

            // 分岐・条件系
            if (params.prob) node.prob = parseInt(String(params.prob), 10);
            if (params.cond) node.cond = params.cond;
            if (params.next) node.condNext = params.next;
            if (params.fallback) node.condFallback = params.fallback;
            if (params.req_stat) node.req_stat = params.req_stat;
            if (params.req_val) node.req_val = parseInt(String(params.req_val), 10);

            // アイテム・移動系パラメータをparamsに保存
            const passthrough = ['item_id', 'quantity', 'remove_on_success',
                'target_location_slug', 'hp_percent', 'hp_flat',
                'flag', 'key', 'delta', 'value', 'threshold', 'operator',
                'amount', 'location_name', 'items', 'gold',
                'success_node', 'fail_node',
                'encounter_rate', 'fallback'];
            for (const k of passthrough) {
                if (params[k] !== undefined) {
                    node.params = node.params || {};
                    node.params[k] = params[k];
                }
            }

            // If next_node is specified at NODE level (auto-advance)
            if (nextNode) {
                if (nextNode === 'EXIT') {
                    node.type = 'end';
                    node.result = 'success';
                } else if (nextNode === 'EXIT_FAIL') {
                    node.type = 'end';
                    node.result = 'failure';
                } else {
                    node.next = nextNode;
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
            if (params.cost_gold) choice.cost_gold = parseInt(String(params.cost_gold), 10);
            if (params.cost_type === 'vitality' && params.cost_val) {
                choice.cost_vitality = parseInt(String(params.cost_val), 10);
            }
            if (params.cost_vitality) choice.cost_vitality = parseInt(String(params.cost_vitality), 10);
            if (params.req_card) choice.req_card = params.req_card;
            if (params.req_tag) choice.req_tag = params.req_tag;

            if (!nodes[currentNodeId].choices) {
                nodes[currentNodeId].choices = [];
            }

            // ★ CHOICE行が追加される際、auto-generated「続ける」を削除
            // （NODE行のnext_nodeから自動生成された「続ける」はプレースホルダにすぎない）
            const existingChoices = nodes[currentNodeId].choices!;
            if (existingChoices.length === 1 && existingChoices[0].label === '続ける') {
                nodes[currentNodeId].choices = [];
            }

            nodes[currentNodeId].choices!.push(choice);
            // ★ battleノードの場合、最初のCHOICE行のnextをbattle_success_nextに設定
            if (nodes[currentNodeId].type === 'battle' && !nodes[currentNodeId].battle_success_next) {
                nodes[currentNodeId].battle_success_next = choice.next;
            }
        }
    }

    return { nodes };
}
