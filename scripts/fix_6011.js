const fs = require('fs');
const path = require('path');

const dir = 'd:/dev/code-wirth-dawn/src/data/csv/scenarios';
const files = [
    { file: '6011_main_ep11.csv' }
];

function processText(text) {
    if (text.startsWith('「') || text.length < 30) return text;
    let newText = text.replace(/。/g, '。\\n');
    newText = newText.replace(/\\n$/g, '');
    newText = newText.replace(/\\n\\n/g, '\\n');
    return newText;
}

files.forEach(({ file }) => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('NODE,')) {
            let parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (parts.length >= 4) {
                let text = parts[2];
                if (text && !text.includes('\\n') && text.length > 30) {
                    let unquoted = text;
                    if (unquoted.startsWith('"') && unquoted.endsWith('"')) {
                        unquoted = unquoted.slice(1, -1).replace(/""/g, '"');
                    }
                    unquoted = processText(unquoted);
                    
                    if (unquoted.includes(',') || unquoted.includes('"')) {
                        unquoted = `"${unquoted.replace(/"/g, '""')}"`;
                    }
                    parts[2] = unquoted;
                }
                lines[i] = parts.join(',');
            }
        }
    }
    fs.writeFileSync(filePath, lines.join('\n'));
});
console.log("6011 updated.");
