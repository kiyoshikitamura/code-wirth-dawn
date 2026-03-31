/**
 * items テーブルのカラム一覧を確認
 * npx tsx scripts/debug_items_columns.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    // items テーブルから1件取得してカラム名を確認
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .limit(1)
        .single();

    if (error) { console.error('Error:', error); return; }

    console.log('=== items テーブルのカラム ===');
    console.log('Keys:', Object.keys(data));
    console.log('\nSample:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
