const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const csvPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'enemy_skills.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim() && !l.startsWith('id,'));
    
    let successCount = 0;
    
    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 5) continue;
        
        const id = parseInt(parts[0], 10);
        const slug = parts[1];
        const name = parts[2];
        const effect_type = parts[3];
        const value = parseFloat(parts[4]);
        const description = parts.slice(5).join(',');
        
        const { error } = await supabase.from('enemy_skills').upsert({
            id, slug, name, effect_type, value, description
        });
        
        if (error) {
            console.error(`Error upserting ${slug}:`, error);
        } else {
            successCount++;
        }
    }
    
    console.log(`Successfully seeded ${successCount} enemy skills.`);
}

run();
