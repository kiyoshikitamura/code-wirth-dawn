const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_7031_ninja.md', thumb: 'bg_forest_night', defaultBg: 'bg_forest_night' },
    { file: 'quest_7032_shrine.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' },
    { file: 'quest_7033_ronin.md', thumb: 'bg_tavern_night', defaultBg: 'bg_tavern_night' },
    { file: 'quest_7034_shogun.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' },
    { file: 'quest_7040_jiangshi.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' }
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
        
        if (item.file === 'quest_7031_ninja.md') {
            if (['start', 'deliver_document', 'end_success'].includes(currentNode)) {
                useBg = 'bg_slum';
            } else {
                useBg = 'bg_forest_night';
            }
        }
        
        if (item.file === 'quest_7032_shrine.md') {
            if (['start', 'return_shrine', 'enshrine', 'end_success'].includes(currentNode)) {
                useBg = 'bg_ruins_field';
            } else {
                useBg = 'bg_mountain';
            }
        }
        
        if (item.file === 'quest_7033_ronin.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_office';
            } else {
                useBg = 'bg_tavern_night';
            }
        }
        
        if (item.file === 'quest_7034_shogun.md') {
            if (['start', 'receive_letter', 'deliver_letter', 'end_success'].includes(currentNode)) {
                useBg = 'bg_guild';
            } else {
                useBg = 'bg_mountain';
            }
        }
        
        if (item.file === 'quest_7040_jiangshi.md') {
            if (['start', 'report_done', 'end_success'].includes(currentNode)) {
                useBg = 'bg_church';
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
