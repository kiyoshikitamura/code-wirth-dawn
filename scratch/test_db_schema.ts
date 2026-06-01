import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// .env.preview.local をロード
dotenv.config({ path: path.resolve(process.cwd(), '.env.preview.local') });

// DB接続文字列を構築
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// プレビューDB接続情報を .env.preview.local や .env.vercel.preview から取得するか、
// 直接環境変数から取得。
// 通常、DATABASE_URL や、直接接続用の情報があるはず。
// .env.preview.local の中身を確認するために、まずは環境変数を出力する。
console.log("POSTGRES_URL:", process.env.POSTGRES_URL);
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// もし PostgreSQL に直接接続できない場合（IPv6制限などで）、
// Supabase RPC や SQL Editor から実行するが、
// まず接続文字列があるか確認する。
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function checkSchema() {
    if (!connectionString) {
        console.error("No DATABASE_URL or POSTGRES_URL found in env.");
        return;
    }
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        console.log("\n--- checking columns of equipped_items ---");
        const res1 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'equipped_items';
        `);
        console.log(res1.rows);

        console.log("\n--- checking columns of items ---");
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'items';
        `);
        console.log(res2.rows);

        console.log("\n--- checking foreign keys of equipped_items ---");
        const res3 = await client.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='equipped_items';
        `);
        console.log(res3.rows);

    } catch (e) {
        console.error("DB connection error:", e);
    } finally {
        await client.end();
    }
}

checkSchema();
