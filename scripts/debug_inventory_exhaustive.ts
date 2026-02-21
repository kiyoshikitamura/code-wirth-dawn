
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Exhaustive Inventory Check ---");

    // 1. Get ALL users
    const { data: users, error: uErr } = await supabase.from('user_profiles').select('id, name');
    if (uErr) {
        console.error("Failed to fetch users", uErr);
        return;
    }

    console.log(`Found ${users?.length} users.`);

    for (const user of users || []) {
        console.log(`Checking User: ${user.name} (${user.id})`);

        // 2. Fetch Inventory
        const { data: inventory, error: iErr } = await supabase
            .from('inventory')
            .select(`
                id,
                user_id,
                items!inner (
                    id,
                    name,
                    effect_data,
                    type,
                    nation_tags
                )
            `)
            .eq('user_id', user.id);

        if (iErr) {
            console.error(`  [ERROR] Inventory Fetch Failed for ${user.name}:`, iErr.message);
            continue;
        }

        // 3. Validate Items
        let badItems = 0;
        inventory?.forEach((entry: any) => {
            try {
                if (!entry.items) throw new Error("Item relation missing");
                const item = entry.items;

                // Check potentially crashing fields
                if (item.effect_data === undefined) console.warn(`  [WARN] Item ${item.id} has undefined effect_data`);

                // Simulate Shop Logic (nation_tags)
                if (!item.nation_tags || !Array.isArray(item.nation_tags)) {
                    // Shop logic is: item.nation_tags.includes(...)
                    // But inventory items are just displayed.
                }

            } catch (e: any) {
                console.error(`  [CRITICAL] Bad Inventory Entry ${entry.id}:`, e.message);
                badItems++;
            }
        });

        if (badItems === 0) {
            console.log(`  User ${user.name}: Inventory OK (${inventory?.length} items)`);
        }
    }

    // 4. Check Shop Items again closely
    console.log("--- Re-checking Shop Items for NULLs ---");
    const { data: items } = await supabase.from('items').select('*');
    items?.forEach((item: any) => {
        if (!item.nation_tags) console.error(`  [SHOP ERROR] Item ${item.slug} (${item.id}) has NULL nation_tags`);
        if (!Array.isArray(item.nation_tags)) console.error(`  [SHOP ERROR] Item ${item.slug} nation_tags is not array`);
    });
}

run();
