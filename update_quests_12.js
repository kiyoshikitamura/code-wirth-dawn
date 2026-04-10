const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_8001_qst_boss_skeleton.md', thumb: 'bg_catacombs', startBg: 'bg_church', battleBg: 'bg_catacombs' },
    { file: 'quest_8002_qst_boss_worm.md', thumb: 'bg_desert', startBg: 'bg_guild', battleBg: 'bg_desert' },
    { file: 'quest_8003_qst_boss_ogre.md', thumb: 'bg_mountain', startBg: 'bg_office', battleBg: 'bg_mountain' },
    { file: 'quest_8004_qst_boss_thunder.md', thumb: 'bg_mountain', startBg: 'bg_church', battleBg: 'bg_mountain' },
    { file: 'quest_8005_qst_boss_griffon.md', thumb: 'bg_mountain', startBg: 'bg_guild', battleBg: 'bg_mountain' }
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
