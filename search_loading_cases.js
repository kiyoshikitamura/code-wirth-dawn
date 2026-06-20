const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                walk(fullPath, results);
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk('D:/dev/code-wirth-dawn/src');
console.log(`Searching ${files.length} TSX/TS files for loading view...`);

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.toLowerCase().includes('loading')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.toLowerCase().includes('loading')) {
                console.log(`[${path.relative('D:/dev/code-wirth-dawn', f)} L${idx + 1}]: ${line.trim()}`);
            }
        });
    }
});
