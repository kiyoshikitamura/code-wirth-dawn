process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    // きたむ（プレビュー） (ID: af2848d0-40f2-4f75-bd2b-ac633184107c) で検証
    const url = 'https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=af2848d0-40f2-4f75-bd2b-ac633184107c&locationId=1';
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        const q7060 = data.special_quests?.find((q: any) => q.id === 7060);
        
        if (q7060) {
            console.log('=== Quest 7060 Exact Fields ===');
            console.log(JSON.stringify(q7060, null, 2));
        } else {
            console.log('Quest 7060 not found in special_quests.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
