// Try multiple Supabase SQL execution endpoints
const SUPABASE_URL = 'https://zvoroixjuypnintkpmux.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b3JvaXhqdXlwbmludGtwbXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMDUwNCwiZXhwIjoyMDg0OTk2NTA0fQ.b2ywSvYqDu67XZla6gqG6-7j3Bv5d9AtJyqfHO5AgVg';

const sql = `
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS share_text TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS max_reputation INT DEFAULT NULL;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS creator_id UUID;
`;

const endpoints = [
    '/rest/v1/rpc/exec_sql',
    '/pg/query',
    '/pg-meta/default/query', 
    '/sql',
];

async function tryAll() {
    for (const ep of endpoints) {
        console.log('Trying:', SUPABASE_URL + ep);
        try {
            const res = await fetch(SUPABASE_URL + ep, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SERVICE_KEY,
                    'Authorization': 'Bearer ' + SERVICE_KEY,
                },
                body: JSON.stringify({ query: sql })
            });
            console.log('  Status:', res.status);
            const text = await res.text();
            console.log('  Body:', text.substring(0, 300));
        } catch (e) {
            console.error('  Error:', e.message);
        }
    }

    // Also try the Supabase Management API
    const ref = 'zvoroixjuypnintkpmux';
    const mgmtUrl = `https://api.supabase.com/v1/projects/${ref}/database/query`;
    console.log('Trying Management API:', mgmtUrl);
    try {
        const res = await fetch(mgmtUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + SERVICE_KEY,
            },
            body: JSON.stringify({ query: sql })
        });
        console.log('  Status:', res.status);
        const text = await res.text();
        console.log('  Body:', text.substring(0, 300));
    } catch (e) {
        console.error('  Error:', e.message);
    }
}

tryAll();
