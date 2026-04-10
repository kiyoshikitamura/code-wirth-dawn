const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_6006_main_ep06.md', thumb: 'bg_forest_day', defaultBg: 'bg_forest_day' },
    { file: 'quest_6007_main_ep07.md', thumb: 'bg_spot_yato_entrance', defaultBg: 'bg_spot_yato_entrance' },
    { file: 'quest_6008_main_ep08.md', thumb: 'bg_tavern_night', defaultBg: 'bg_tavern_night' },
    { file: 'quest_6009_main_ep09.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' },
    { file: 'quest_6010_main_ep10.md', thumb: 'bg_boss_altar', defaultBg: 'bg_boss_altar' }
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
        
        // Custom Logic for 6006
        if (item.file === 'quest_6006_main_ep06.md') {
            if (['text_danger', 'text_danger_2', 'battle', 'text_danger_3'].includes(currentNode)) {
                useBg = 'bg_river';
            } else if (currentNode === 'end_node') {
                useBg = 'bg_spot_yato_entrance';
            }
        }
        
        // Custom Logic for 6007
        if (item.file === 'quest_6007_main_ep07.md') {
            if (currentNode === 'battle') {
                useBg = 'bg_forest_night';
            }
        }

        if (lines[i].includes('**背景画像**:')) {
            lines[i] = lines[i].replace(/`?\[要定義\]`?/, `\`${useBg}\``);
        }
        if (lines[i].includes('**次ノード:**')) {
            // Replace both bg_default and bg_battle since they are just generic placeholders
            lines[i] = lines[i].replace(/bg:bg_default/g, `bg:${useBg}`);
            lines[i] = lines[i].replace(/bg:bg_battle/g, `bg:${useBg}`);
        }
    }
    
    content = lines.join('\n');
    fs.writeFileSync(path.join(questDir, item.file), content);
    console.log(`Updated ${item.file}`);
});
