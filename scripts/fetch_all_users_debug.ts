process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkUser(userId: string, name: string) {
    const url = `https://code-wirth-dawn-git-develop-kiyoshi-kitamura.vercel.app/api/location/quests?userId=${userId}&locationId=1`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const inQuests = data.quests?.some((q: any) => String(q.id) === '7060');
        console.log(`User: ${name} (${userId}) -> Is 7060 in quests? ${inQuests}`);
        if (!inQuests) {
            console.log('   Debug Logs for exclusion:', data.debug);
        }
    } catch (e) {
        console.error(`Error checking user ${name}:`, e);
    }
}

async function run() {
    const users = [
        { id: 'f94db6e2-ca9b-4e1b-90f7-ebf996c56782', name: 'ギルダ' },
        { id: 'b4a20ab3-18d9-44d4-8837-bacd4fc711e9', name: '雅人' },
        { id: '6cd6b349-b038-4215-9ac1-0427c0d784bd', name: 'にかはか' },
        { id: '097ade0d-ff40-4b2f-a0cf-0f79076c5f77', name: 'テリア' },
        { id: '22c71f0e-2f0d-4843-8170-d977f01c4c6c', name: 'コーネリア' },
        { id: '381924a5-9887-4c85-a96e-7689c6c97257', name: 'Ruvu' }
    ];
    
    for (const u of users) {
        await checkUser(u.id, u.name);
    }
}

run();
