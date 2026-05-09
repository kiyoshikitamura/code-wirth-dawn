const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../docs/quest/quest_6102_spot_yato.md');
const csvPath = path.join(__dirname, '../src/data/csv/scenarios/6102_qst_spot_yato.csv');

const mdContent = fs.readFileSync(mdPath, 'utf8');

// Parse Flow to get NEXT nodes for CHOICEs
const flowMatch = mdContent.match(/### 全体フロー\n```text\n([\s\S]*?)```/);
const flowText = flowMatch ? flowMatch[1] : '';

// Manually define the flow since parsing the ascii tree perfectly is hard
const nextMap = {
    'start': { text: '続ける', next: 'start_2' },
    'start_2': { text: '続ける', next: 'join_nadeshiko' },
    'join_nadeshiko': { text: '続ける', next: 'join_nadeshiko_2' },
    'join_nadeshiko_2': { text: '続ける', next: 'battle_1' },
    'battle_1': { success: 'text_after_b1', failure: 'end_failure' },
    'text_after_b1': { text: '続ける', next: 'text_after_b1_2' },
    'text_after_b1_2': { text: '続ける', next: 'battle_2' },
    'battle_2': { success: 'boss_01_wani_pre', failure: 'end_failure' },
    'boss_01_wani_pre': { text: '続ける', next: 'boss_01_wani' },
    'boss_01_wani': { success: 'reward_m1', failure: 'end_failure' },
    'reward_m1': { text: '', next: 'boss_02_tori_pre' }, // reward nodes auto-proceed
    'boss_02_tori_pre': { text: '続ける', next: 'boss_02_tori' },
    'boss_02_tori': { success: 'reward_m2', failure: 'end_failure' },
    'reward_m2': { text: '', next: 'reward_m2_2' },
    'reward_m2_2': { text: '続ける', next: 'boss_03_kuruma_pre' },
    'boss_03_kuruma_pre': { text: '続ける', next: 'boss_03_kuruma' },
    'boss_03_kuruma': { success: 'reward_m3', failure: 'end_failure' },
    'reward_m3': { text: '', next: 'boss_04_shuten_pre' },
    'boss_04_shuten_pre': { text: '続ける', next: 'boss_04_shuten_pre_2' },
    'boss_04_shuten_pre_2': { text: '続ける', next: 'boss_04_shuten' },
    'boss_04_shuten': { success: 'reward_m4', failure: 'end_failure' },
    'reward_m4': { text: '', next: 'final_choice' },
    'final_choice': { choices: [{ text: '完遂する', next: 'end_sacrifice' }, { text: '拒絶する', next: 'end_save' }] },
    'end_sacrifice': { text: '続ける', next: 'end_sacrifice_2' },
    'end_save': { text: '続ける', next: 'end_save_2' }
};

const lines = mdContent.split('\n');
const nodes = [];

let currentNode = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const nodeMatch = line.match(/^#### `([^`]+)`（type:\s*([^）]+)）/);
    if (nodeMatch) {
        currentNode = {
            id: nodeMatch[1],
            type: nodeMatch[2],
            text: '',
            params: ''
        };
        nodes.push(currentNode);
        continue;
    }

    if (!currentNode) continue;

    if (line.startsWith('**テキスト:**')) {
        let textLines = [];
        let j = i + 1;
        if (lines[j].startsWith('```')) j++;
        while (j < lines.length && !lines[j].startsWith('```') && !lines[j].startsWith('**params:**')) {
            textLines.push(lines[j]);
            j++;
        }
        currentNode.text = textLines.join('\\n').trim();
        i = j - 1;
    }

    if (line.startsWith('**params:**')) {
        const paramMatch = line.match(/`(\{.*?\})`/);
        if (paramMatch) {
            currentNode.params = paramMatch[1];
        }
    }
}

// Convert to CSV
let csv = 'row_type,node_id,text_label,params,next_node\n';
// Add META for rewards
csv += 'META,gold,0,,\n';
csv += 'META,exp,0,,\n';
csv += 'META,reputation,0,,\n';

for (const node of nodes) {
    // Escape double quotes in JSON params
    const escapedParams = node.params ? `"${node.params.replace(/"/g, '""')}"` : '';
    const needsQuotes = node.text && (node.text.includes(',') || node.text.includes('\n') || node.text.includes('\\n') || node.text.includes('"'));
    const escapedText = needsQuotes ? `"${node.text.replace(/"/g, '""')}"` : (node.text || '');
    
    // next_node for NODE row is for auto-proceed (text -> text)
    let nextNode = '';
    let choices = [];
    
    const flow = nextMap[node.id];
    if (flow) {
        if (node.type === 'text' || node.type === 'guest_join' || node.type === 'reward') {
            if (flow.next) nextNode = flow.next;
            else if (flow.choices) {
                choices = flow.choices;
            }
        } else if (node.type === 'battle') {
            choices = [
                { text: '勝利', next: flow.success },
                { text: '敗北', next: flow.failure }
            ];
        }
    }

    // Default next handling if not in map but it's a simple type
    if (!flow && node.type !== 'end' && node.type !== 'battle' && node.id !== 'final_choice') {
        console.warn('No flow defined for', node.id);
    }

    csv += `NODE,${node.id},${escapedText},${escapedParams},${nextNode}\n`;

    for (const c of choices) {
        csv += `CHOICE,,${c.text},,${c.next}\n`;
    }
}

fs.writeFileSync(csvPath, csv, 'utf8');
console.log('Generated CSV at', csvPath);
