process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=af2848d0-40f2-4f75-bd2b-ac633184107c&locationId=1';
    
    try {
        console.log('Fetching quests for Kitamu...');
        const res = await fetch(url);
        console.log('--- Vercel API Response status:', res.status);
        
        const text = await res.text();
        console.log('--- Response Body:');
        console.log(text);
        
        try {
            const data = JSON.parse(text);
            console.log('--- Debug Logs:');
            console.log(data.debug);
        } catch (_) {
            // Not JSON
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
