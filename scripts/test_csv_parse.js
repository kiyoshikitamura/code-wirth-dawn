
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const filePath = path.join(process.cwd(), 'src', 'data', 'csv', 'scenarios', '1001_goblin_forest.csv');
console.log("Reading:", filePath);

if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true
    });

    console.log("Records found:", records.length);
    records.forEach(r => {
        if (r.row_type === 'NODE' && r.node_id === 'battle_start') {
            console.log("Target Node:", r);
            console.log("Params Raw:", r.params);

            // Replicate parseParams logic
            const paramStr = r.params;
            const obj = {};
            if (paramStr && paramStr.trim().startsWith('{')) {
                // JSON
            } else if (paramStr) {
                paramStr.split(',').forEach(pair => {
                    const [k, v] = pair.split(':');
                    if (k && v) {
                        obj[k.trim()] = v.trim();
                    }
                });
            }
            console.log("Parsed Params:", obj);
            console.log("Resolved Type:", obj.type || 'text');
        }
    });
} else {
    console.error("File not found");
}
