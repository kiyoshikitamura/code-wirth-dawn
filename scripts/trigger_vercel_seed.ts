process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const seedUrl = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/debug/seed-quests-master?secret=admin_user';
    const syncUrl = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/debug/sync-csv-scenarios?secret=admin_user';
    
    try {
        console.log('Triggering Vercel seed API...');
        const res1 = await fetch(seedUrl);
        const data1 = await res1.json();
        console.log('--- Vercel Seed API Response:', data1);

        console.log('Triggering Vercel sync-csv-scenarios API...');
        const res2 = await fetch(syncUrl);
        const data2 = await res2.json();
        console.log('--- Vercel Sync API Response:', data2);
    } catch (e) {
        console.error('API error:', e);
    }
}

run();
