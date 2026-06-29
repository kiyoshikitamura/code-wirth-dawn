process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const gildaId = "f94db6e2-ca9b-4e1b-90f7-ebf996c56782";
    const highlandLocationId = "2f953311-2240-44fd-afba-ef63a359e845"; // 高原の村
    
    console.log(`Fetching quests for Gilda (${gildaId}) at Highland location...`);
    const url = `https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=${gildaId}&locationId=${highlandLocationId}`;
    
    try {
        const res = await fetch(url);
        console.log('--- Vercel API Response status:', res.status);
        const data = await res.json();
        
        const has7060 = data.special_quests?.some((q: any) => q.id === 7060);
        console.log('--- Is 7060 in special_quests?:', has7060);
        console.log('--- Debug Logs:', data.debug);
    } catch (e) {
        console.error('Error fetching Vercel API:', e);
    }
}

run();
