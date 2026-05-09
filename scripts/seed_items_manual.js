require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseCsvRows(csvText) {
    const rows = [];
    const lines = csvText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/\r$/, '');
        if (!line.trim()) continue;
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (inQuotes) {
                if (ch === '"') {
                    if (j + 1 < line.length && line[j + 1] === '"') {
                        current += '"';
                        j++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    fields.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        fields.push(current);
        rows.push(fields);
    }
    return rows;
}

async function run() {
    try {
        const filePath = path.join(__dirname, '..', 'src', 'data', 'csv', 'items.csv');
        const csvText = fs.readFileSync(filePath, 'utf-8');
        const rows = parseCsvRows(csvText);

        const headers = rows[0].map(h => h.trim());
        const colIdx = {
            id: headers.indexOf('id'),
            slug: headers.indexOf('slug'),
            name: headers.indexOf('name'),
            type: headers.indexOf('type'),
            base_price: headers.indexOf('base_price'),
            effect_data: headers.indexOf('effect_data')
        };

        const upsertData = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const idStr = row[colIdx.id]?.trim();
            if (!idStr) continue;
            const id = parseInt(idStr, 10);
            if (isNaN(id)) continue;

            let effectData = {};
            const effectStr = row[colIdx.effect_data]?.trim();
            if (effectStr && effectStr.startsWith('{')) {
                try {
                    effectData = JSON.parse(effectStr);
                } catch (e) {}
            }

            upsertData.push({
                id,
                slug: row[colIdx.slug]?.trim(),
                name: row[colIdx.name]?.trim(),
                type: row[colIdx.type]?.trim() || 'equipment',
                base_price: parseInt(row[colIdx.base_price]?.trim() || '0', 10) || 0,
                effect_data: effectData
            });
        }

        console.log(`Upserting ${upsertData.length} items to Supabase...`);
        const { error } = await supabase.from('items').upsert(upsertData, { onConflict: 'id' });
        if (error) throw error;
        console.log('Seed completed successfully!');
    } catch (e) {
        console.error('Failed to seed items:', e);
    }
}

run();
