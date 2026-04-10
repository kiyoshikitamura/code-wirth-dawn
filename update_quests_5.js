const fs = require('fs');
const path = require('path');

const questDir = 'D:/dev/code-wirth-dawn/docs/quest';

const filesToUpdate = [
    { file: 'quest_6101_spot_roland.md', thumb: 'bg_spot_roland_tomb', defaultBg: 'bg_spot_roland_tomb' },
    { file: 'quest_6102_spot_yato.md', thumb: 'bg_spot_yato_eclipse', defaultBg: 'bg_spot_yato_eclipse' },
    { file: 'quest_6103_spot_karyu.md', thumb: 'bg_spot_karyu_tower', defaultBg: 'bg_spot_karyu_tower' },
    { file: 'quest_6104_spot_markand.md', thumb: 'bg_spot_markand_king', defaultBg: 'bg_spot_markand_ruins' },
    { file: 'quest_7001_deliver.md', thumb: 'bg_guild', defaultBg: 'bg_guild' }
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
        
        // Custom Logic for 6101
        if (item.file === 'quest_6101_spot_roland.md') {
            if (currentNode === 'start') {
                useBg = 'bg_spot_roland_fire';
            } else if (currentNode) {
                useBg = 'bg_spot_roland_tomb';
            }
        }
        
        // Custom Logic for 6102
        if (item.file === 'quest_6102_spot_yato.md') {
            if (currentNode === 'boss_04_shuten') {
                useBg = 'bg_spot_yato_gate';
            }
        }
        
        // Custom Logic for 6103
        if (item.file === 'quest_6103_spot_karyu.md') {
            if (currentNode === 'final_boss_kami') {
                useBg = 'bg_spot_karyu_throne';
            }
        }
        
        // Custom Logic for 6104
        if (item.file === 'quest_6104_spot_markand.md') {
            if (['trap_01', 'battle_trap_01', 'trap_02', 'trap_03'].includes(currentNode)) {
                useBg = 'bg_spot_markand_mirror';
            } else if (currentNode === 'boss_king') {
                useBg = 'bg_spot_markand_king';
            } else {
                useBg = 'bg_spot_markand_ruins';
            }
        }
        
        // Custom Logic for 7001
        if (item.file === 'quest_7001_deliver.md') {
            if (['travel_start'].includes(currentNode)) {
                useBg = 'bg_road_day';
            } else if (['encounter_thief', 'battle_thief'].includes(currentNode)) {
                useBg = 'bg_road_night';
            } else if (['arrive_inn', 'suspicious', 'delivery_ok', 'end_success'].includes(currentNode)) {
                useBg = 'bg_tavern_night';
            } else {
                useBg = 'bg_guild';
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
