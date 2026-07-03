process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const token = process.env.VERCEL_TOKEN || 'tU9H0Ldpeo7yLg7Qy1yP1z9L'; // フォールバックのデバッグ用トークン
    const projectId = 'prj_code_wirth_dawn';
    
    console.log('Fetching Vercel deployment list...');
    const url = `https://api.vercel.com/v6/deployments?projectId=prj_n2w9RTmlnYuMux7GezTUGezRTmln&limit=10`;
    
    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();
        console.log('=== Vercel Deployments ===');
        for (const dep of (data.deployments || [])) {
            console.log(`ID: ${dep.uid}, State: ${dep.state}, Creator: ${dep.creator?.username}, Commit: ${dep.meta?.githubCommitMessage?.slice(0, 40)}`);
        }
    } catch (e) {
        console.error('Error fetching Vercel deployments:', e);
    }
}

run();
