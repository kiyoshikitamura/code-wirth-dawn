import { PartyService } from './src/services/partyService';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function run() {
    const targetUserId = 'af2848d0-40f2-4f75-bd2b-ac633184107c';
    console.log(`Calling getEnrichedPartyMembers for: ${targetUserId}...`);
    try {
        const party = await PartyService.getEnrichedPartyMembers(targetUserId);
        console.log("Enriched Party Members returned by API:");
        party.forEach(m => {
            console.log(`Name: ${m.name} | hp: ${m.hp} | max_hp: ${m.max_hp} | durability: ${m.durability} | max_durability: ${m.max_durability} | vitality: ${m.vitality}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
