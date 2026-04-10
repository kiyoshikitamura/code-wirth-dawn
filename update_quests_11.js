const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_7041_herb.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' },
    { file: 'quest_7042_rebel.md', thumb: 'bg_slum', defaultBg: 'bg_slum' },
    { file: 'quest_7043_official.md', thumb: 'bg_office', defaultBg: 'bg_office' },
    { file: 'quest_7044_pirate.md', thumb: 'bg_river', defaultBg: 'bg_river' }
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
        
        if (item.file === 'quest_7041_herb.md') {
            if (['start', 'deliver_herb', 'end_success'].includes(currentNode)) {
                useBg = 'bg_office';
            } else {
                useBg = 'bg_mountain';
            }
        }
        
        if (item.file === 'quest_7042_rebel.md') {
            if (['start', 'end_success', 'end_failure'].includes(currentNode)) {
                useBg = 'bg_office';
            } else {
                useBg = 'bg_slum';
            }
        }
        
        if (item.file === 'quest_7043_official.md') {
            useBg = 'bg_office';
        }
        
        if (item.file === 'quest_7044_pirate.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_guild';
            } else {
                useBg = 'bg_river';
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
