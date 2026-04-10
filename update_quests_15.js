const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_8023_qst_boss_dragon.md', thumb: 'bg_desert', startBg: 'bg_guild', battleBg: 'bg_desert' },
    { file: 'quest_8024_qst_boss_kirin.md', thumb: 'bg_mountain', startBg: 'bg_guild', battleBg: 'bg_mountain' },
    { file: 'quest_8025_qst_boss_golem.md', thumb: 'bg_ruins_field', startBg: 'bg_guild', battleBg: 'bg_ruins_field' },
    { file: 'quest_8026_qst_boss_kraken.md', thumb: 'bg_river', startBg: 'bg_guild', battleBg: 'bg_river' },
    { file: 'quest_8027_qst_boss_mino.md', thumb: 'bg_catacombs', startBg: 'bg_guild', battleBg: 'bg_catacombs' }
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
        
        let useBg = item.battleBg;
        
        if (['1', '6'].includes(currentNode)) {
            useBg = item.startBg;
        }

        if (lines[i].includes('背景画像**:')) {
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
