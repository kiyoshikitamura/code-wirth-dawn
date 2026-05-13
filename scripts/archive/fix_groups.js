const fs = require('fs');
const file = 'src/data/csv/enemy_groups.csv';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split(/\r?\n/);

// Remove all lines after line 107 (408,grp_rat_nest) except the 502-505
// Wait, let's just find where "333,spot_markand_king" is duplicated
let seen = new Set();
let newLines = [];
for (let line of lines) {
    if (!line.trim()) continue;
    let id = line.split(',')[0];
    if (seen.has(id)) continue;
    seen.add(id);
    newLines.push(line);
}
fs.writeFileSync(file, newLines.join('\n') + '\n');
console.log("Fixed duplicates in enemy_groups.csv");
