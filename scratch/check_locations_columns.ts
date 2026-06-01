import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns of 'locations' table in Preview DB...");
    // 1行だけレコードを取得し、そのキー（カラム名）を確認する
    const { data, error } = await supabase.from('locations').select('*').limit(1).maybeSingle();
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Locations columns:", Object.keys(data || {}));
        console.log("Locations data snippet:", data);
    }
}

checkColumns().catch(console.error);
