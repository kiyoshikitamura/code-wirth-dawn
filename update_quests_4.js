const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_6016_main_ep16.md', thumb: 'bg_tavern_night', defaultBg: 'bg_tavern_night' },
    { file: 'quest_6017_main_ep17.md', thumb: 'bg_spot_roland_core', defaultBg: 'bg_spot_roland_core' },
    { file: 'quest_6018_main_ep18.md', thumb: 'bg_wasteland', defaultBg: 'bg_wasteland' },
    { file: 'quest_6019_main_ep19.md', thumb: 'bg_boss_altar', defaultBg: 'bg_boss_altar' },
    { file: 'quest_6020_main_ep20.md', thumb: 'bg_boss_altar', defaultBg: 'bg_boss_altar' }
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
        
        // Custom Logic for 6016
        if (item.file === 'quest_6016_main_ep16.md') {
            if (['battle', 'text_post_battle', 'end_node'].includes(currentNode)) {
                useBg = 'bg_road_night';
            }
        }
        
        // Custom Logic for 6020
        if (item.file === 'quest_6020_main_ep20.md') {
            if (currentNode === 'end_node') {
                useBg = 'bg_road_day';
            }
        }

        if (lines[i].includes('**背景画像**:')) {
            lines[i] = lines[i].replace(/`?\[要定義\]`?/, `\`${useBg}\``);
        }
        if (lines[i].includes('**次ノード:**')) {
            lines[i] = lines[i].replace(/bg:bg_default/g, `bg:${useBg}`);
            lines[i] = lines[i].replace(/bg:bg_battle/g, `bg:${useBg}`);
        }
    }
    
    content = lines.join('\n');
    fs.writeFileSync(path.join(questDir, item.file), content);
    console.log(`Updated ${item.file}`);
});
