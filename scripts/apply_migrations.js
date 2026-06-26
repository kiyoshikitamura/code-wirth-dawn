const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 引数から環境変数ファイルを特定。デフォルトは .env.preview.local
const useProduction = process.argv.includes('--production');
const envFile = useProduction ? '.env.production.local' : '.env.preview.local';
const envPath = path.join(__dirname, '..', envFile);

console.log(`Loading env file: ${envFile}`);
if (!fs.existsSync(envPath)) {
    console.error(`Env file not found: ${envPath}`);
    process.exit(1);
}

dotenv.config({ path: envPath });

const refMatch = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/) : null;
const projectRef = refMatch ? refMatch[1] : null;

if (!projectRef) {
    console.error('Cannot parse project ref from NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
}

const dbPassword = 'izasama5723';
const dbUrl = process.env.SUPABASE_DB_URL 
    || `postgresql://postgres.${projectRef}:${dbPassword}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

console.log(`Connecting to: postgresql://postgres.${projectRef}:****@...`);

// 適用するマイグレーションファイル
const migrations = [
    '20260624000000_add_monetization_packages_and_rpc.sql',
    '20260624000001_compensate_existing_subscribers.sql'
];

async function run() {
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Database.');

        for (const file of migrations) {
            const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
            if (!fs.existsSync(filePath)) {
                console.error(`Migration file not found: ${file}`);
                continue;
            }

            console.log(`Applying migration: ${file}...`);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            // SQLをトランザクション内で実行
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('COMMIT');
                console.log(`Successfully applied: ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`Failed to apply: ${file}`);
                console.error(err);
                throw err;
            }
        }
    } catch (err) {
        console.error('Database execution error:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

run();
