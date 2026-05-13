const fs = require('fs');
const path = require('path');

const dir = 'd:/dev/code-wirth-dawn/src/data/csv/scenarios';
const files = [
    { file: '6012_main_ep12.csv', battleGroup: '212', postBattleNode: 'text_path_clear' },
    { file: '6013_main_ep13.csv', battleGroup: '213', postBattleNode: 'text_throne_approach', preBattleFixBgm: true },
    { file: '6014_main_ep14.csv', battleGroup: '214', postBattleNode: 'text_inner_shrine' },
    { file: '6015_main_ep15.csv', battleGroup: '215', postBattleNode: 'text_michael_descend' }
];

function processText(text) {
    if (text.startsWith('「') || text.length < 30) return text;
    // Split by '。' and add \n, but ensure no double \n if already there.
    let newText = text.replace(/。/g, '。\\n');
    newText = newText.replace(/\\n$/g, ''); // remove trailing \n
    newText = newText.replace(/\\n\\n/g, '\\n'); // cleanup
    return newText;
}

files.forEach(({ file, battleGroup, postBattleNode, preBattleFixBgm }) => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('NODE,')) {
            let parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (parts.length >= 4) {
                let nodeId = parts[1];
                let text = parts[2];
                let params = parts[3];
                let nextNode = parts[4] || '';

                // Text Splitting
                if (text && !text.includes('\\n') && text.length > 30) {
                    // remove outer quotes if any
                    let unquoted = text;
                    if (unquoted.startsWith('"') && unquoted.endsWith('"')) {
                        unquoted = unquoted.slice(1, -1).replace(/""/g, '"');
                    }
                    unquoted = processText(unquoted);
                    
                    if (unquoted.includes(',') || unquoted.includes('"')) {
                        unquoted = `"${unquoted.replace(/"/g, '""')}"`;
                    }
                    parts[2] = unquoted;
                }

                // Battle Group Replace
                if (nodeId === 'battle1') {
                    parts[3] = parts[3].replace(/""enemy_group_id"":""\d+""/, `""enemy_group_id"":""${battleGroup}""`);
                }

                // Post Battle BGM
                if (nodeId === postBattleNode) {
                    if (!parts[3].includes('bgm_quest_crisis')) {
                        parts[3] = parts[3].replace(/\}$/, `,""bgm"":""bgm_quest_crisis""}`);
                    }
                }

                // Pre Battle BGM Fix for 6013
                if (preBattleFixBgm && nodeId === 'battle1') {
                     if (!parts[3].includes('bgm_battle')) {
                         parts[3] = parts[3].replace(/\}$/, `,""bgm"":""bgm_battle""}`);
                     }
                }
                
                // Fix missing end_node next_node for final destination node if necessary
                // (Already correct in CSVs as we checked)

                lines[i] = parts.join(',');
            }
        }
    }
    fs.writeFileSync(filePath, lines.join('\n'));
});
console.log("Scenarios updated.");
