
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ScriptNode {
    text: string;
    choices?: { label: string; next: string }[];
    type?: string;
    next?: string;
    [key: string]: any;
}
interface ScriptData {
    nodes: Record<string, ScriptNode>;
}

async function updateQuest() {
    console.log('Reading CSV...');
    const csvPath = path.join(process.cwd(), 'src/data/csv_test/scenarios/test_escort_scenario.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Explicitly casting the result of parse to any[] to avoid TS errors with 'unknown'
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as any[];

    const scriptData: ScriptData = { nodes: {} };
    let lastNodeId = '';

    for (const row of records) {
        if (row.row_type === 'NODE') {
            const nodeId = row.node_id;
            lastNodeId = nodeId;

            const node: any = {
                text: row.text_label || '',
            };

            if (row.next_node) {
                node.next = row.next_node;
            }

            // Parse Params
            if (row.params) {
                const params: any = {};
                // Handle "key: value, key: value"
                (row.params as string).split(',').forEach((p: string) => {
                    const parts = p.split(':');
                    if (parts.length >= 2) {
                        const k = parts[0].trim();
                        const v = parts.slice(1).join(':').trim();
                        if (!isNaN(Number(v)) && v !== '') {
                            params[k] = Number(v);
                        } else {
                            params[k] = v;
                        }
                    }
                });
                if (params.type) node.type = params.type;
                if (params.enemy) node.enemy_group_id = params.enemy;
                Object.assign(node, params);
            }

            scriptData.nodes[nodeId] = node;
        } else if (row.row_type === 'CHOICE') {
            if (lastNodeId && scriptData.nodes[lastNodeId]) {
                const node = scriptData.nodes[lastNodeId];
                if (!node.choices) node.choices = [];

                node.choices.push({
                    label: row.text_label,
                    next: row.next_node
                });
            }
        }
    }

    console.log('Parsed Script Nodes:', Object.keys(scriptData.nodes).length);

    console.log('Updating DB...');
    const { error } = await supabase
        .from('scenarios')
        .update({
            script_data: scriptData
        })
        .eq('id', 1);

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Success! Quest updated.');
    }
}

updateQuest();
