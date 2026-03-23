import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// .env.localでSUPABASE_SERVICE_ROLE_KEY または ADMIN_SECRET_KEY いずれかを使用
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);
const CSV_DIR = path.join(process.cwd(), 'src', 'data', 'csv');

async function seedNpcs() {
    const filePath = path.join(CSV_DIR, 'npcs.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // BOM除去
    const records = parse(fileContent, {
        columns: true, skip_empty_lines: true, trim: true,
        cast: (value: string, context: any) => {
            const col = String(context.column).replace(/^\uFEFF/, '');
            if (col === 'durability' || col === 'def' || col === 'cover_rate') return Number(value);
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
            // idなし → DBでUUIDを自動生成
            slug: r.slug,
            name: r.name,
            job_class: r.job || r.job_class || 'Civilian',
            level: 5,
            attack: 10,
            defense: r.def,
            max_hp: r.durability * 2,
            default_cards: cardIds,
            origin: 'system_mercenary',
            is_hireable: true
        };
    });

    // slugをuniqueキーとしてupsert
    const { error } = await supabase.from('npcs').upsert(npcsData, { onConflict: 'slug' });
    if (error) {
        console.error("upsert failed, trying insert:", error.message);
        // slugにユニーク制約がない場合は全件insertを試みる
        const { error: insertError } = await supabase.from('npcs').insert(npcsData);
        if (insertError) console.error("Insert also failed:", insertError.message);
        else console.log(`Inserted ${npcsData.length} records into npcs table.`);
    } else {
        console.log(`Seeded ${npcsData.length} records into npcs table.`);
    }
}

seedNpcs();
