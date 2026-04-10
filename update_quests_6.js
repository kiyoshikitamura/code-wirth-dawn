const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_7002_escort.md', thumb: 'bg_road_day', defaultBg: 'bg_tavern_day' },
    { file: 'quest_7003_battle.md', thumb: 'bg_catacombs', defaultBg: 'bg_catacombs' },
    { file: 'quest_7004_riot.md', thumb: 'bg_slum', defaultBg: 'bg_slum' },
    { file: 'quest_7005_bear.md', thumb: 'bg_mountain', defaultBg: 'bg_mountain' },
    { file: 'quest_7006_smuggle.md', thumb: 'bg_forest_night', defaultBg: 'bg_slum' } // default ending
];

filesToUpdate.forEach(item => {
    let content = fs.readFileSync(path.join(questDir, item.file), 'utf8');
    
    // Replace Thumbnail
    content = content.replace(/\[要定義:\s*クエストボード用のサムネイル.*?\]/, `/images/quests/${item.thumb}.png`);
    
    const lines = content.split('\n');
    let currentNode = '';
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#### `') || lines[i].startsWith('#### バトルノード')) {
            currentNode = lines[i].replace(/#### `|`/g, '').replace('#### バトルノード（type: battle）', 'battle').trim();
        }
        
        let useBg = item.defaultBg;
        
        // Custom Logic for 7002
        if (item.file === 'quest_7002_escort.md') {
            if (['start', 'join_escort'].includes(currentNode)) {
                useBg = 'bg_guild';
            } else if (['travel_start', 'midway'].includes(currentNode)) {
                useBg = 'bg_road_day';
            } else if (['battle_bandit', 'battle', 'after_battle'].includes(currentNode)) {
                useBg = 'bg_road_night';
            } else {
                useBg = 'bg_tavern_day';
            }
        }
        
        // Custom Logic for 7003
        if (item.file === 'quest_7003_battle.md') {
            if (['start', 'end_success', 'end_failure'].includes(currentNode)) {
                useBg = 'bg_guild';
            } else {
                useBg = 'bg_catacombs';
            }
        }
        
        // Custom Logic for 7004
        if (item.file === 'quest_7004_riot.md') {
            if (currentNode === 'start') {
                useBg = 'bg_office';
            } else {
                useBg = 'bg_slum';
            }
        }
        
        // Custom Logic for 7005
        if (item.file === 'quest_7005_bear.md') {
            if (['start', 'end_success', 'end_failure'].includes(currentNode)) {
                useBg = 'bg_tavern_day';
            } else {
                useBg = 'bg_mountain';
            }
        }
        
        // Custom Logic for 7006
        if (item.file === 'quest_7006_smuggle.md') {
            if (['start', 'receive_cargo'].includes(currentNode)) {
                useBg = 'bg_slum';
            } else if (['travel_smuggle', 'ambush', 'battle_hunter'].includes(currentNode)) {
                useBg = 'bg_forest_night';
            } else {
                useBg = 'bg_slum';
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
