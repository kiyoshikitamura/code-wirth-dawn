
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkDropsSimple() {
    console.log("Checking Drops Simple...");
    const { data: enemies, error } = await supabase.from('enemies').select('*');
    if (error) {
        console.error("DB Error:", error);
        return;
    }
    console.log(`Found ${enemies.length} enemies.`);
    const withDrops = enemies.filter(e => e.drop_item_slug);
    console.log(`Enemies with drops: ${withDrops.length}`);
    withDrops.forEach(e => {
        console.log(`- ${e.name} (${e.slug}): Drop '${e.drop_item_slug}' Rate: ${e.drop_rate}%`);
    });
}
checkDropsSimple();
