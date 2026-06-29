process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/debug/seed-quests-master?secret=admin_user';
    
    try {
        console.log('Triggering Vercel seed API...');
        const res = await fetch(url);
        const data = await res.json();
        console.log('--- Vercel Seed API Response:', data);
    } catch (e) {
        console.error('Seed API error:', e);
    }
}

run();
