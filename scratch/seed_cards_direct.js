// Direct DB seed script for cards - bypasses Next.js server
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function seedCards() {
    const csvPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'cards.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = csvContent.split('\n').filter(l => l.trim());
    // skip header
    const dataRows = rows.slice(1);

    let success = 0;
    let errors = 0;

    for (const row of dataRows) {
        const parts = row.split(',');
        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue;

        const slug = parts[1]?.trim();
        const name = parts[2]?.trim();
        const type = parts[3]?.trim();
        const ap_cost = parseInt(parts[4], 10) || 1;
        const cost_type = parts[5]?.trim() || null;
        const cost_val = parseInt(parts[6], 10) || 0;
        const effect_val = parseInt(parts[7], 10) || 0;
        const target_type = parts[8]?.trim() || null;
        const effect_id = parts[9]?.trim() || null;
        const image_url = parts[10]?.trim() || null;
        const description = parts.slice(11).join(',').trim() || null;

        const cardData = {
            id, slug, name, type, ap_cost,
            cost_type, cost_val, effect_val,
            target_type: target_type || null,
            effect_id: effect_id || null,
            image_url: image_url || null,
            description
        };

        const { error } = await supabase
            .from('cards')
            .upsert(cardData, { onConflict: 'id' });

        if (error) {
            console.error(`ERROR [${id}] ${name}: ${error.message}`);
            errors++;
        } else {
            success++;
        }
    }

    console.log(`\n=== Seed Complete ===`);
    console.log(`Success: ${success}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${success + errors}`);
}

seedCards().catch(e => { console.error('Fatal:', e); process.exit(1); });
