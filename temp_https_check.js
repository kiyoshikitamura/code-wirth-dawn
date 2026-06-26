const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const host = supabaseUrl.replace('https://', '');
const pathName = '/rest/v1/user_profiles?current_quest_id=not.is.null&select=id,name,current_quest_id,current_quest_state';

const options = {
    hostname: host,
    port: 443,
    path: pathName,
    method: 'GET',
    headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Active Quests in DB:');
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
});
req.end();
