import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const VALID_COST_TYPES = ['mp', 'vitality', 'item', 'gold', 'none'];

async function main() {
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'cards.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
    });

    const rows = records
        .filter((r: any) => {
            const id = Number(r.id);
            if (isNaN(id)) return false;
            // cost_type が不正な値はスキップ
            if (r.cost_type && !VALID_COST_TYPES.includes(r.cost_type)) {
                console.warn(`Skipping card id=${r.id} (${r.name}): invalid cost_type="${r.cost_type}"`);
                return false;
            }
            return true;
        })
        .map((r: any) => ({
            id: Number(r.id),
            slug: r.slug,
            name: r.name,
            type: r.type,
            ap_cost: Number(r.ap_cost) || 1,
            cost_type: r.cost_type || null,
            cost_val: r.cost_val !== '' ? Number(r.cost_val) : null,
            effect_val: r.effect_val !== '' ? Number(r.effect_val) : null,
            target_type: r.target_type || 'single_enemy',
            effect_id: r.effect_id || null,
            image_url: r.image_url || null,
            description: r.description || null,
        }));

    console.log(`Upserting ${rows.length} cards...`);

    // Batch upsert in chunks of 20
    const CHUNK = 20;
    let ok = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const { error } = await supabase.from('cards').upsert(chunk, { onConflict: 'id' });
        if (error) {
            console.error(`Chunk ${i}-${i+CHUNK} error:`, error.message);
            console.error('Failing row:', JSON.stringify(chunk.find((_:any,j:number) => j === 0)));
        } else {
            ok += chunk.length;
            process.stdout.write(`\rOK: ${ok}/${rows.length}`);
        }
    }
    console.log(`\nDone! ${ok} cards upserted.`);
}

main().catch(console.error);
