const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_7013_undead.md', thumb: 'bg_catacombs', defaultBg: 'bg_catacombs' },
    { file: 'quest_7014_tithe.md', thumb: 'bg_slum', defaultBg: 'bg_slum' },
    { file: 'quest_7015_relic.md', thumb: 'bg_ruins_field', defaultBg: 'bg_ruins_field' },
    { file: 'quest_7020_caravan.md', thumb: 'bg_desert', defaultBg: 'bg_desert' },
    { file: 'quest_7021_scorpion.md', thumb: 'bg_desert', defaultBg: 'bg_desert' }
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
        
        if (item.file === 'quest_7013_undead.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_church';
            } else {
                useBg = 'bg_catacombs';
            }
        }
        
        if (item.file === 'quest_7014_tithe.md') {
            if (['start', 'end_success', 'end_failure'].includes(currentNode)) {
                useBg = 'bg_church';
            } else {
                useBg = 'bg_slum';
            }
        }
        
        if (item.file === 'quest_7015_relic.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_church';
            } else {
                useBg = 'bg_ruins_field';
            }
        }
        
        if (item.file === 'quest_7020_caravan.md') {
            if (['start', 'arrive_destination', 'leave_caravan', 'end_success'].includes(currentNode)) {
                useBg = 'bg_guild';
            } else {
                useBg = 'bg_desert';
            }
        }
        
        if (item.file === 'quest_7021_scorpion.md') {
            if (['start', 'deliver', 'end_success'].includes(currentNode)) {
                useBg = 'bg_slum';
            } else {
                useBg = 'bg_desert';
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
