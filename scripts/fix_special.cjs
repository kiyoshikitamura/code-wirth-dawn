const fs = require('fs');

let lines = fs.readFileSync('src/data/csv/quests_special.csv', 'utf8').split('\n');
lines = lines.map(line => {
    if(line.startsWith('80') && line.includes('qst_boss_')) {
        // Find last quote match like ,"Gold:2000|Item:3101"
        line = line.replace(/,"(Gold.*?)",/, ',$1,');
        // Find trailing comment like ,"[強敵] ..."
        line = line.replace(/,"(\[.*?\] .*?)"$/, ',$1');
        return line;
    }
    return line;
});

fs.writeFileSync('src/data/csv/quests_special.csv', lines.join('\n'));
console.log('Fixed quests_special.csv formatting');
