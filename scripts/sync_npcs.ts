import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse CSV
function parseCSV(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        // Handle quoted fields with commas
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') { inQuotes = !inQuotes; continue; }
            if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
            current += char;
        }
        values.push(current.trim());
        
        const obj: any = {};
        headers.forEach((h, i) => { obj[h.trim()] = values[i] || ''; });
        return obj;
    });
}

async function main() {
    const csvPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'npcs.csv');
    const npcs = parseCSV(csvPath);
    
    console.log('=== CSV NPC Data (' + npcs.length + ' entries) ===');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const npc of npcs) {
        const slug = npc.slug;
        const epithet = npc.epithet || '';
        const name = npc.name || '';
        const injectCardIdsRaw = npc.inject_card_ids || '';
        
        // Parse card IDs: "1003|1005" -> [1003, 1005]
        const injectCards = injectCardIdsRaw
            ? injectCardIdsRaw.split('|').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
            : [];
        
        const flavorText = npc.flavor_text || '';
        
        console.log('Updating:', slug, '| epithet:', epithet, '| name:', name, '| cards:', JSON.stringify(injectCards));
        
        const { error } = await supabase
            .from('npcs')
            .update({
                epithet: epithet,
                name: name,
                inject_cards: injectCards,
                default_cards: injectCards, // shadowService.ts がdefault_cardsを参照するため両方更新
                introduction: flavorText,
            })
            .eq('slug', slug);
        
        if (error) {
            console.error('  ERROR for', slug, ':', error.message);
            errorCount++;
        } else {
            updatedCount++;
        }
    }
    
    console.log('\n=== Summary ===');
    console.log('Updated:', updatedCount, '| Errors:', errorCount);
    
    // Verify
    console.log('\n=== Verification (first 5) ===');
    const { data: verify } = await supabase.from('npcs').select('slug, epithet, name, inject_cards, default_cards').order('slug').limit(5);
    for (const v of (verify || [])) {
        console.log(v.slug, '| epithet:', v.epithet, '| name:', v.name, '| inject_cards:', JSON.stringify(v.inject_cards), '| default_cards:', JSON.stringify(v.default_cards));
    }
}

main();
