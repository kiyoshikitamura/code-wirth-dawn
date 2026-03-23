import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);
const CSV_DIR = path.join(process.cwd(), 'src', 'data', 'csv');

async function seedItems() {
    const filePath = path.join(CSV_DIR, 'items.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // BOM除去
    const records = parse(fileContent, {
        columns: true, skip_empty_lines: true, trim: true,
        relax_column_count: true, // 列数不一致を許容
    });

    const itemsData = records.map((r: any) => {
        // nation_tagsの変換: "any" → null（code側でnullを全国と見なす）
        // "loc_a|loc_b" → ["loc_a", "loc_b"]
        let nationTags: string[] | null = null;
        const rawTags = (r.nation_tags || '').trim();
        if (rawTags && rawTags !== 'any') {
            nationTags = rawTags.split('|').map((t: string) => t.trim()).filter(Boolean);
        }

        const basePrice = parseInt(r.base_price, 10) || 0;
        const minProsperity = parseInt(r.min_prosperity, 10) || 1;
        const linkedCardId = r.linked_card_id ? parseInt(r.linked_card_id, 10) : null;

        // DBのitems_type_checkに合わせた型変換
        // 許可型を調べるため、CSVの型をできるだけそのまま使う
        // skill_card系はすべて"skill"として試みる
        const rawTypeBase = (r.type || '').split('(')[0].trim().toLowerCase();
        let type: string;
        if (rawTypeBase === 'consumable') type = 'consumable';
        else if (rawTypeBase === 'material') type = 'material';
        else if (rawTypeBase === 'item') type = 'item';
        else type = 'skill'; // skill_card, gear, book, scroll, manual, grimoire → "skill"


        return {
            slug: r.slug,
            name: r.name,
            type,
            base_price: basePrice,
            min_prosperity: minProsperity,
            nation_tags: nationTags,
            linked_card_id: linkedCardId,
        };
    });

    console.log(`Processing ${itemsData.length} items...`);

    // slugをuniqueキーとしてupsert
    const { error } = await supabase.from('items').upsert(itemsData, { onConflict: 'slug' });
    if (error) {
        console.error("upsert failed:", error.message);
        // 分割して1件ずつinsert
        let successCount = 0;
        for (const item of itemsData) {
            const { error: iErr } = await supabase.from('items').upsert(item, { onConflict: 'slug' });
            if (iErr) console.error(`  SKIP: ${item.slug} — ${iErr.message}`);
            else successCount++;
        }
        console.log(`Inserted ${successCount}/${itemsData.length} items.`);
    } else {
        console.log(`Seeded ${itemsData.length} items into items table.`);
    }
}

seedItems();
