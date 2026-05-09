import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse CSV manually (similar to other seed scripts)
function parseCsvRows(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/\r$/, '');
        if (!line.trim()) continue;
        const fields: string[] = [];
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

export async function GET(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const filePath = path.join(process.cwd(), 'src', 'data', 'csv', 'items.csv');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'items.csv not found' }, { status: 404 });
        }

        const csvText = fs.readFileSync(filePath, 'utf-8');
        const rows = parseCsvRows(csvText);

        if (rows.length < 2) {
            return NextResponse.json({ error: 'CSV is empty or missing data rows' }, { status: 400 });
        }

        const headers = rows[0].map(h => h.trim());
        const colIdx = {
            id: headers.indexOf('id'),
            slug: headers.indexOf('slug'),
            name: headers.indexOf('name'),
            type: headers.indexOf('type'),
            base_price: headers.indexOf('base_price'),
            nation_tags: headers.indexOf('nation_tags'),
            min_prosperity: headers.indexOf('min_prosperity'),
            is_black_market: headers.indexOf('is_black_market'),
            effect_data: headers.indexOf('effect_data')
        };

        const upsertData = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < headers.length) continue;
            
            const idStr = row[colIdx.id]?.trim();
            if (!idStr) continue;

            const id = parseInt(idStr, 10);
            if (isNaN(id)) continue;

            const slug = row[colIdx.slug]?.trim();
            const name = row[colIdx.name]?.trim();
            const type = row[colIdx.type]?.trim() || 'equipment';
            const basePrice = parseInt(row[colIdx.base_price]?.trim() || '0', 10);
            
            let effectData = {};
            const effectStr = row[colIdx.effect_data]?.trim();
            if (effectStr && effectStr.startsWith('{')) {
                try {
                    effectData = JSON.parse(effectStr);
                } catch (e) {
                    console.warn(`Failed to parse effect_data for item ${id}:`, effectStr);
                }
            }

            upsertData.push({
                id,
                slug,
                name,
                type,
                base_price: isNaN(basePrice) ? 0 : basePrice,
                effect_data: effectData
            });
        }

        console.log(`Upserting ${upsertData.length} items...`);

        // Batch upsert
        const { error } = await supabase.from('items').upsert(upsertData, { onConflict: 'id' });

        if (error) {
            console.error('Supabase upsert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${upsertData.length} items.`,
            count: upsertData.length
        });
    } catch (e: any) {
        console.error('Seed error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
