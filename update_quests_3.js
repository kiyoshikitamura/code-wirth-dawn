const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_6011_main_ep11.md', thumb: 'bg_road_day', defaultBg: 'bg_road_day' },
    { file: 'quest_6012_main_ep12.md', thumb: 'bg_river', defaultBg: 'bg_river' },
    { file: 'quest_6013_main_ep13.md', thumb: 'bg_bandit_camp', defaultBg: 'bg_bandit_camp' },
    { file: 'quest_6014_main_ep14.md', thumb: 'bg_slum', defaultBg: 'bg_slum' },
    { file: 'quest_6015_main_ep15.md', thumb: 'bg_spot_karyu_thunder', defaultBg: 'bg_ruins_field' } // default for first half
];

filesToUpdate.forEach(item => {
    let content = fs.readFileSync(path.join(questDir, item.file), 'utf8');
    
    // Replace Thumbnail
    content = content.replace(/\[要定義:\s*クエストボード用のサムネイル.*?\]/, `/images/quests/${item.thumb}.png`);
    
    const lines = content.split('\n');
    let currentNode = '';
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#### `')) {
            currentNode = lines[i].replace(/#### `|`/g, '').trim();
        }
        
        let useBg = item.defaultBg;
        
        // Custom Logic for 6011
        if (item.file === 'quest_6011_main_ep11.md') {
            if (['text3', 'text3_1', 'text4', 'battle', 'text5', 'text5_1', 'text6', 'end_node'].includes(currentNode)) {
                useBg = 'bg_ruins_field';
            }
        }
        
        // Custom Logic for 6015
        if (item.file === 'quest_6015_main_ep15.md') {
            if (!['start', 'text1', 'text1_1'].includes(currentNode)) { // Everything from text2 onward
                useBg = 'bg_spot_karyu_thunder';
            }
        }

        if (lines[i].includes('**背景画像**:')) {
            lines[i] = lines[i].replace(/`?\[要定義\]`?/, `\`${useBg}\``);
        }
        if (lines[i].includes('**次ノード:**')) {
            // Replace both bg_default and bg_battle since they are generic
            lines[i] = lines[i].replace(/bg:bg_default/g, `bg:${useBg}`);
            lines[i] = lines[i].replace(/bg:bg_battle/g, `bg:${useBg}`);
        }
    }
    
    content = lines.join('\n');
    fs.writeFileSync(path.join(questDir, item.file), content);
    console.log(`Updated ${item.file}`);
});
