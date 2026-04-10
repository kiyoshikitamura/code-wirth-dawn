const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_7007_rat.md', thumb: 'bg_catacombs', defaultBg: 'bg_catacombs' },
    { file: 'quest_7008_mercy.md', thumb: 'bg_forest_day', defaultBg: 'bg_forest_day' },
    { file: 'quest_7010_heretic.md', thumb: 'bg_catacombs', defaultBg: 'bg_catacombs' },
    { file: 'quest_7011_holywater.md', thumb: 'bg_wasteland', defaultBg: 'bg_wasteland' },
    { file: 'quest_7012_pilgrim.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' }
];

filesToUpdate.forEach(item => {
    let content = fs.readFileSync(path.join(questDir, item.file), 'utf8');
    
    // Replace Thumbnail
    content = content.replace(/\[要定義:\s*クエストボード用のサムネイル.*?\]/, `/images/quests/${item.thumb}.png`);
    
    const lines = content.split('\n');
    let currentNode = '';
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#### `') || lines[i].startsWith('#### 遭遇テキスト')) {
            currentNode = lines[i].replace(/#### `|`/g, '').replace('#### 遭遇テキスト（text）', 'mountain_ambush2').trim();
        }
        
        let useBg = item.defaultBg;
        
        // Custom Logic for 7007
        if (item.file === 'quest_7007_rat.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_office';
            } else {
                useBg = 'bg_catacombs';
            }
        }
        
        // Custom Logic for 7008
        if (item.file === 'quest_7008_mercy.md') {
            if (['start', 'deliver_herbs', 'end_success'].includes(currentNode)) {
                useBg = 'bg_bandit_camp';
            } else {
                useBg = 'bg_forest_day';
            }
        }
        
        // Custom Logic for 7010
        if (item.file === 'quest_7010_heretic.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_church';
            } else {
                useBg = 'bg_catacombs';
            }
        }
        
        // Custom Logic for 7011
        if (item.file === 'quest_7011_holywater.md') {
            if (['start', 'receive_holywater', 'end_success'].includes(currentNode)) {
                useBg = 'bg_church';
            } else if (['arrive_fort'].includes(currentNode)) {
                useBg = 'bg_bandit_camp';
            } else {
                useBg = 'bg_wasteland';
            }
        }
        
        // Custom Logic for 7012
        if (item.file === 'quest_7012_pilgrim.md') {
            if (['start', 'join_pilgrim'].includes(currentNode)) {
                useBg = 'bg_church';
            } else if (['arrive_shrine', 'leave_pilgrim', 'end_success'].includes(currentNode)) {
                useBg = 'bg_ruins_field';
            } else {
                useBg = 'bg_mountain';
            }
        }

        if (lines[i].includes('**背景画像**:')) {
            lines[i] = lines[i].replace(/`?\[要定義[^\]]*\]`?/, `\`${useBg}\``);
        }
        if (lines[i].includes('bg_image:')) {
            lines[i] = lines[i].replace(/bg_image:\[要定義[^\]]*\]/g, `bg_image:${useBg}`);
        }
    }
    
    content = lines.join('\n');
    fs.writeFileSync(path.join(questDir, item.file), content);
    console.log(`Updated ${item.file}`);
});
