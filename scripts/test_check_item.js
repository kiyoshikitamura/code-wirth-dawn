const fs = require('fs');

const text = fs.readFileSync('src/data/csv/scenarios/6020_main_ep20.csv', 'utf-8');
const lines = text.split('\n');
for (const l of lines) {
    if (l.includes('check_items')) {
        const match = l.match(/\"(\{.*?\})\"/);
        if (match) {
            try {
                const cleanJson = match[1].replace(/\"\"/g, '"');
                const parsed = JSON.parse(cleanJson);
                console.log(parsed);
            } catch(e) {
                console.error("Parse Error:", e);
            }
        }
    }
}
