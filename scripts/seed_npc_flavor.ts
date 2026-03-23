// スクリプト: npcsテーブルにflavor_textカラムを追加し、CSVからデータを投入する
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
    // 1. npcs.csvからflavor_textを読み込む
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'npcs.csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });

    console.log(`Loaded ${records.length} NPCs from CSV`);

    // 2. 各NPCのflavor_textをintroductionカラムに投入（flavor_textカラムが存在しないため既存のintroductionカラムを活用）
    let updated = 0;
    for (const r of records as any[]) {
        if (!r.flavor_text) continue;
        const slug = r.slug;
        
        // slugでnpcsテーブルのレコードを探す
        const { data, error } = await sb
            .from('npcs')
            .update({ introduction: r.flavor_text })
            .eq('slug', slug);
        
        if (error) {
            console.error(`Failed to update ${slug}:`, error.message);
        } else {
            updated++;
        }
    }

    console.log(`Updated ${updated} NPCs with flavor text (via introduction column)`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
