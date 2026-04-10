const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_8015_qst_boss_pirate.md', thumb: 'bg_river', startBg: 'bg_guild', battleBg: 'bg_river' },
    { file: 'quest_8016_qst_boss_rebel.md', thumb: 'bg_bandit_camp', startBg: 'bg_slum', battleBg: 'bg_bandit_camp' },
    { file: 'quest_8017_qst_boss_merchant.md', thumb: 'bg_office', startBg: 'bg_slum', battleBg: 'bg_office' },
    { file: 'quest_8021_qst_boss_baphomet.md', thumb: 'bg_boss_altar', startBg: 'bg_guild', battleBg: 'bg_boss_altar' },
    { file: 'quest_8022_qst_boss_angel.md', thumb: 'bg_boss_altar', startBg: 'bg_guild', battleBg: 'bg_boss_altar' }
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
