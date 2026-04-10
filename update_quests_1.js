const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';
const filesToUpdate = [
    { file: 'quest_6001_main_ep01.md', bg: 'bg_wasteland', battleBg: 'bg_wasteland' },
    { file: 'quest_6002_main_ep02.md', bg: 'bg_wasteland', battleBg: 'bg_wasteland' },
    { file: 'quest_6003_main_ep03.md', bg: 'bg_desert', battleBg: 'bg_slum', special: true },
    { file: 'quest_6004_main_ep04.md', bg: 'bg_desert', battleBg: 'bg_desert' },
    { file: 'quest_6005_main_ep05.md', bg: 'bg_bandit_camp', battleBg: 'bg_bandit_camp' }
];

filesToUpdate.forEach(item => {
    let content = fs.readFileSync(path.join(questDir, item.file), 'utf8');
    
    // Replace Thumbnail (could have backticks inside the cell or not, handles safely)
    content = content.replace(/\[要定義:\s*クエストボード用のサムネイル.*?\]/, `/images/quests/${item.bg}.png`);
    
    if (item.special && item.file === 'quest_6003_main_ep03.md') {
        const specialNodes = ['search_area', 'text3', 'text3_1', 'text4', 'battle', 'text_post_battle', 'text_post_battle2', 'end_node'];
        const lines = content.split('\n');
        let currentNode = '';
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#### `')) {
                currentNode = lines[i].replace(/#### `|`/g, '').trim();
            }
            const useBg = specialNodes.includes(currentNode) ? 'bg_slum' : item.bg;
            
            if (lines[i].includes('**背景画像**:')) {
                lines[i] = lines[i].replace(/`?\[要定義\]`?/, `\`${useBg}\``);
            }
            if (lines[i].includes('**次ノード:**')) {
                lines[i] = lines[i].replace(/bg:bg_default/g, `bg:${useBg}`);
                lines[i] = lines[i].replace(/bg:bg_battle/g, `bg:${useBg}`); // In 6003 battle is in slum
            }
        }
        content = lines.join('\n');
    } else {
        // Standard replacements
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('**背景画像**:')) {
                const targetBg = lines[i].includes('bg_battle') ? item.battleBg : item.bg; // This check is flawed since the node doesn't say if it's battle here
                lines[i] = lines[i].replace(/`?\[要定義\]`?/, `\`${item.bg}\``); // Safe fallback
            }
            if (lines[i].includes('**次ノード:**')) {
                lines[i] = lines[i].replace(/bg:bg_default/g, `bg:${item.bg}`);
                lines[i] = lines[i].replace(/bg:bg_battle/g, `bg:${item.battleBg}`);
            }
        }
        content = lines.join('\n');
    }
    
    fs.writeFileSync(path.join(questDir, item.file), content);
    console.log(`Updated ${item.file}`);
});
