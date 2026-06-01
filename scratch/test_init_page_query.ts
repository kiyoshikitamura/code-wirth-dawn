import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("Supabase URL:", supabaseUrl);
    console.log("Testing ambiguous locations relationship...");
    
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*, locations(name, slug, region, type)')
        .limit(1);

    if (error) {
        console.error("Query ERROR:", error);
    } else {
        console.log("Query SUCCESS! Data length:", data?.length);
        console.log("Data snippet:", JSON.stringify(data, null, 2));
    }
}

testQuery();
