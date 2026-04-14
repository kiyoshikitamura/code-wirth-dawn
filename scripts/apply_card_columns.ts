import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('Applying migration: add image_url and description to cards...');

    // Execute raw SQL via rpc (using pg_query exec)
    // Supabase doesn't expose raw ALTER TABLE via client SDK directly,
    // so we use the REST API
    const statements = [
        `ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_url TEXT`,
        `ALTER TABLE cards ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE cards ADD COLUMN IF NOT EXISTS ap_cost INTEGER DEFAULT 1`,
        `ALTER TABLE cards ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'single_enemy'`,
        `ALTER TABLE cards ADD COLUMN IF NOT EXISTS effect_id TEXT`,
    ];

    for (const sql of statements) {
        const { error } = await sb.rpc('exec_sql', { query: sql }).single();
        if (error) {
            // Try alternative: direct fetch to REST
            console.log(`RPC failed for: ${sql.slice(0, 60)}... trying REST...`);
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: sql }),
            });
            if (!res.ok) {
                const text = await res.text();
                console.error(`REST also failed: ${text}`);
            } else {
                console.log(`OK via REST: ${sql.slice(0, 60)}`);
            }
        } else {
            console.log(`OK: ${sql.slice(0, 60)}`);
        }
    }

    // Verify columns exist by selecting
    console.log('\nVerifying columns...');
    const { data, error } = await sb.from('cards').select('id, slug, image_url, description').limit(3);
    if (error) {
        console.error('Column verification failed:', error.message);
    } else {
        console.log('Columns exist! Sample:', JSON.stringify(data, null, 2));
    }

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
