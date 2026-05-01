const fs = require('fs');
const path = require('path');

const dir = 'd:/dev/code-wirth-dawn/src/data/csv/scenarios';
const mapping = {
    '6012_main_ep12.csv': { oldId: '212', newId: '502' },
    '6013_main_ep13.csv': { oldId: '213', newId: '503' },
    '6014_main_ep14.csv': { oldId: '214', newId: '504' },
    '6015_main_ep15.csv': { oldId: '215', newId: '505' }
};

for (const [file, { oldId, newId }] of Object.entries(mapping)) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(`""enemy_group_id"":""${oldId}""`, `""enemy_group_id"":""${newId}""`);
    fs.writeFileSync(filePath, content);
}
console.log("Replaced enemy IDs in scenarios.");
