const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/data/csv/npcs.csv');
let lines = fs.readFileSync(file, 'utf8').split('\n');

const newLines = lines.map(line => {
    if (!line.trim() || line.startsWith('id,')) return line;
    const parts = line.split(',');
    if (parts.length < 9) return line;
    
    let slug = parts[1];
    const comment = parts[8];
    
    if (comment.includes('聖帝国') && !slug.includes('roland')) {
        slug = slug.replace('npc_', 'npc_roland_');
    } else if (comment.includes('マルカンド') && !slug.includes('markand')) {
        slug = slug.replace('npc_', 'npc_markand_');
    } else if (comment.includes('夜刀') && !slug.includes('yato')) {
        slug = slug.replace('npc_', 'npc_yato_');
    } else if (comment.includes('華龍') && !slug.includes('karyu')) {
        slug = slug.replace('npc_', 'npc_karyu_');
    } else if (comment.includes('共通') && !slug.includes('free')) {
        slug = slug.replace('npc_', 'npc_free_');
    }
    
    parts[1] = slug;
    return parts.join(',');
});

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('npcs.csv updated');
