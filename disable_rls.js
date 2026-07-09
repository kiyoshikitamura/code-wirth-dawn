const { Pool } = require('pg');

async function run() {
    const projectRef = 'drbqnpzxgcbicpritcpi';
    const password = 'izasama5723';
    const dbUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

    console.log('Connecting to DEV DB to disable RLS on pvp_reward_logs...');
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        const client = await pool.connect();
        try {
            await client.query('ALTER TABLE public.pvp_reward_logs DISABLE ROW LEVEL SECURITY;');
            console.log('Successfully disabled RLS for pvp_reward_logs! 🎉');
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
