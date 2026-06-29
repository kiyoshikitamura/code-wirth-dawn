process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=f94db6e2-ca9b-4e1b-90f7-ebf996c56782&locationId=1';
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('--- Vercel API Debug Logs:');
        console.log(data.debug);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
