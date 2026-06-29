process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=f94db6e2-ca9b-4e1b-90f7-ebf996c56782&locationId=1';
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('--- Vercel API Response status:', res.status);
        
        const inSpecial = data.special_quests?.some((q: any) => String(q.id) === '7060');
        const inQuests = data.quests?.some((q: any) => String(q.id) === '7060');
        
        console.log('Is 7060 in special_quests?', inSpecial);
        console.log('Is 7060 in quests?', inQuests);
        
        if (inSpecial) {
            const q = data.special_quests.find((q: any) => String(q.id) === '7060');
            console.log('Quest 7060 details from API response:', {
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
