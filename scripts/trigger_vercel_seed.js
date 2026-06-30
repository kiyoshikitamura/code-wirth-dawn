process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const seedUrl = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/debug/seed-quests-master?secret=admin_user';
const syncUrl = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/debug/sync-csv-scenarios?secret=admin_user';

async function run() {
    try {
        console.log('Triggering Vercel seed API...');
        const res1 = await fetch(seedUrl);
        const text1 = await res1.text();
        console.log(`--- Vercel Seed Status: ${res1.status}`);
        console.log(`--- Vercel Seed Text: ${text1.substring(0, 500)}`);

        console.log('Triggering Vercel sync-csv-scenarios API...');
        const res2 = await fetch(syncUrl);
        const text2 = await res2.text();
        console.log(`--- Vercel Sync Status: ${res2.status}`);
        console.log(`--- Vercel Sync Text: ${text2.substring(0, 500)}`);
    } catch (e) {
        console.error('API error:', e);
    }
}

run();
