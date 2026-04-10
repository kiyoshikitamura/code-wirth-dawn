const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_7022_debt.md', thumb: 'bg_bandit_camp', defaultBg: 'bg_slum' }, // Default for start/end
    { file: 'quest_7023_sandworm.md', thumb: 'bg_desert', defaultBg: 'bg_guild' },
    { file: 'quest_7024_auction.md', thumb: 'bg_shop', defaultBg: 'bg_slum' },
    { file: 'quest_7025_bribe.md', thumb: 'bg_bandit_camp', defaultBg: 'bg_tavern_night' },
    { file: 'quest_7030_yokai.md', thumb: 'bg_road_night', defaultBg: 'bg_office' }
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
        
        if (item.file === 'quest_7022_debt.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_slum';
            } else {
                useBg = 'bg_bandit_camp';
            }
        }
        
        if (item.file === 'quest_7023_sandworm.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_guild';
            } else {
                useBg = 'bg_desert';
            }
        }
        
        if (item.file === 'quest_7024_auction.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_slum';
            } else {
                useBg = 'bg_shop';
            }
        }
        
        if (item.file === 'quest_7025_bribe.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_tavern_night';
            } else {
                useBg = 'bg_bandit_camp';
            }
        }
        
        if (item.file === 'quest_7030_yokai.md') {
            if (['start', 'end_success'].includes(currentNode)) {
                useBg = 'bg_office';
            } else {
                useBg = 'bg_road_night';
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
