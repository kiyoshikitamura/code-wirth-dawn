const fs = require('fs');
const path = require('path');

const QUESTS = [
    { md: 'quest_7010_heretic.md', csv: '7010_qst_rol_heretic.csv' },
    { md: 'quest_7011_holywater.md', csv: '7011_qst_rol_holywater.csv' },
    { md: 'quest_7012_pilgrim.md', csv: '7012_qst_rol_pilgrim.csv' },
    { md: 'quest_7013_undead.md', csv: '7013_qst_rol_undead.csv' },
    { md: 'quest_7014_tithe.md', csv: '7014_qst_rol_tithe.csv' },
    { md: 'quest_7015_relic.md', csv: '7015_qst_rol_relic.csv' }
];

function processQuest(mdFile, csvFile) {
    const mdPath = path.join(__dirname, '../docs/quest', mdFile);
    const csvPath = path.join(__dirname, '../src/data/csv/scenarios', csvFile);

    if (!fs.existsSync(mdPath)) {
        console.error(`MD file not found: ${mdPath}`);
        return;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const content = mdContent.charCodeAt(0) === 0xFEFF ? mdContent.slice(1) : mdContent;

    const lines = content.split('\n');
    const nodes = [];
    let currentNode = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const nodeMatch = line.match(/^#### `([^`]+)`（([^）]+)）/);
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

        if (line.startsWith('**演出:**')) {
            const rawParams = line.replace('**演出:**', '').trim();
            const paramParts = rawParams.split(',').map(p => p.trim());
            const paramObj = {};
            if (currentNode.type && currentNode.type !== 'text') {
                paramObj.type = currentNode.type;
            } else {
                paramObj.type = 'text';
            }
            
            for (const part of paramParts) {
                const [k, ...v] = part.split(':');
                if (k && v.length) {
                    paramObj[k.trim()] = v.join(':').trim();
                }
            }
            // For speaker -> speaker_name
            if (paramObj.speaker) {
                paramObj.speaker_name = paramObj.speaker;
                delete paramObj.speaker;
            }
            currentNode.parsedParams = paramObj;
        }

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
        
        if (currentNode.type === 'guest_join') {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            currentNode.parsedParams.type = 'guest_join';
        }
        if (currentNode.type === 'leave') {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            currentNode.parsedParams.type = 'leave';
        }
        if (currentNode.type === 'end_success') {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            currentNode.parsedParams.type = 'end';
            currentNode.parsedParams.result = 'success';
        }
        if (currentNode.type === 'end_failure') {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            currentNode.parsedParams.type = 'end';
            currentNode.parsedParams.result = 'failure';
        }
    }

    let csv = 'row_type,node_id,text_label,params,next_node\n';
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let nextNode = '';
        let choices = [];
        
        if (node.type === 'battle') {
            let winNext = 'after_battle_1';
            // MD仕様書上で、バトルの次に定義されているノードを勝利時の遷移先とする
            if (i + 1 < nodes.length) {
                winNext = nodes[i+1].id;
            }
            choices = [
                { text: 'win', next: winNext },
                { text: 'lose', next: 'end_failure' }
            ];
        } else if (node.type === 'end_success' || node.type === 'end_failure' || node.type === 'end') {
            nextNode = '';
        } else {
            if (i + 1 < nodes.length) {
                if (nodes[i+1].id !== 'end_failure' && nodes[i+1].id !== 'win' && nodes[i+1].id !== 'lose') {
                   nextNode = nodes[i+1].id;
                }
                
                const reportNodes = ['report_knights', 'report_church', 'report_elder', 'report_client'];
                if (node.id === 'after_battle_2') {
                    const report = nodes.find(n => reportNodes.includes(n.id));
                    if (report) nextNode = report.id;
                    else nextNode = 'end_success'; 
                }
                if (node.id === 'after_battle_3') {
                    const report = nodes.find(n => reportNodes.includes(n.id));
                    if (report) nextNode = report.id;
                    else nextNode = 'end_success';
                }
                
                const endReplyNodes = ['knight_reply', 'priest_reply', 'client_reply', 'elder_reply', 'church_reply', 'bishop_reply', 'arrive_church_2', 'finish_ritual_2', 'village_arrive_2', 'investigate_2', 'meet_client_2'];
                if (endReplyNodes.includes(node.id)) {
                    nextNode = 'end_success';
                }
            }
        }

        const p = node.parsedParams || {};
        const pStr = JSON.stringify(p);
        const escapedParams = `"${pStr.replace(/"/g, '""')}"`;
        const escapedText = `"${node.text.replace(/"/g, '""')}"`;
        
        csv += `NODE,${node.id},${escapedText},${escapedParams},${nextNode}\n`;
        for (const c of choices) {
            csv += `CHOICE,,${c.text},,${c.next}\n`;
        }
    }

    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`Generated ${csvPath} (${nodes.length} nodes)`);
}

for (const q of QUESTS) {
    processQuest(q.md, q.csv);
}
