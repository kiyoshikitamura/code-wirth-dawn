process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    // クラエス (ID: 0f1d0b1a-28d5-45bb-b3b3-8553f1f7dcd1, Level 1) で検証
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=0f1d0b1a-28d5-45bb-b3b3-8553f1f7dcd1&locationId=1';
    
    try {
        console.log('Fetching quests for Claes (Level 1)...');
        const res = await fetch(url);
        const data = await res.json();
        console.log('--- Vercel API Response status:', res.status);
        console.log('--- Vercel API Debug Logs:');
        console.log(data.debug);
        
        const inSpecial = data.special_quests?.some((q: any) => String(q.id) === '7060');
        const inQuests = data.quests?.some((q: any) => String(q.id) === '7060');
        console.log('Is 7060 in special_quests?', inSpecial);
        console.log('Is 7060 in quests?', inQuests);
        
        if (inSpecial) {
            const q = data.special_quests.find((q: any) => String(q.id) === '7060');
            console.log('7060 details:', {
                id: q.id,
                title: q.title,
                is_repeatable: q.is_repeatable,
                difficulty_tier: q.difficulty_tier
            });
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
