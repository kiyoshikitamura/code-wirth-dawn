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
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk('D:/dev/code-wirth-dawn/src');
console.log(`Searching through ${files.length} files...`);

const keywords = ['LoadingBattle', 'loading', 'isLoading', 'battlePhase', 'processQueue'];

files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const matchedKeywords = keywords.filter(kw => content.includes(kw));
    if (matchedKeywords.length > 0) {
        // print matched lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes('LoadingBattle') || line.includes('isLoading')) {
                console.log(`Matched in ${path.relative('D:/dev/code-wirth-dawn', f)} L${idx + 1}: ${line.trim()}`);
            }
        });
    }
});
