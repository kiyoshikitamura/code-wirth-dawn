import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);
const CSV_DIR = path.join(process.cwd(), 'src', 'data', 'csv');

async function seedNpcs() {
    const filePath = path.join(CSV_DIR, 'npcs.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
        columns: true, skip_empty_lines: true, trim: true,
        cast: (value, context) => {
            const col = String(context.column);
            if (col === 'id' || col === 'durability' || col === 'def' || col === 'cover_rate') return Number(value);
            return value;
        }
    });

    const npcsData = records.map((r: any) => {
        let cardIds: number[] = [];
        const rawInject = r.inject_card_ids || r.inject_cards;
        if (rawInject && typeof rawInject === 'string') {
            cardIds = rawInject.split('|').map((id: string) => Number(id.trim())).filter((n: number) => !isNaN(n));
        }

        return {
            id: r.id,
            slug: r.slug,
            name: r.name,
            job_class: r.job || r.job_class || 'Civilian',
            level: 5,
            attack: 10,
            defense: r.def,
            max_hp: r.durability * 2, // approximation
            default_cards: cardIds,
            origin: 'system_mercenary',
            is_hireable: true
        };
    });

    const { error } = await supabase.from('npcs').upsert(npcsData, { onConflict: 'id' });
    if (error) console.error("Error seeding npcs table:", error);
    else console.log(`Seeded ${npcsData.length} records into npcs table.`);
}

seedNpcs();
