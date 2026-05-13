// Check item 601 in DB
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://zvoroixjuypnintkpmux.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b3JvaXhqdXlwbmludGtwbXV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQyMDUwNCwiZXhwIjoyMDg0OTk2NTA0fQ.b2ywSvYqDu67XZla6gqG6-7j3Bv5d9AtJyqfHO5AgVg'
);

async function check() {
    // 1. Check item 601 in items table
    const { data: item, error } = await supabase
        .from('items')
        .select('id, slug, name, type, effect_data')
        .eq('id', 601)
        .single();
    
    console.log('=== Item 601 in DB ===');
    console.log('Error:', error);
    console.log('Data:', JSON.stringify(item, null, 2));
    
    if (item) {
        console.log('\n--- Type check ---');
        console.log('type:', item.type, '(should be "consumable")');
        console.log('effect_data:', JSON.stringify(item.effect_data, null, 2));
        console.log('use_timing:', item.effect_data?.use_timing, '(should be "battle")');
        console.log('damage:', item.effect_data?.damage, '(should be 2000)');
        console.log('target_slug:', item.effect_data?.target_slug, '(should be "enemy_spot_alvin")');
    }

    // 2. Check inventory for any user having item 601
    const { data: invItems, error: invError } = await supabase
        .from('inventory')
        .select('id, user_id, item_id, quantity, is_equipped')
        .eq('item_id', 601);
    
    console.log('\n=== Inventory entries for item 601 ===');
    console.log('Error:', invError);
    console.log('Count:', invItems?.length || 0);
    if (invItems && invItems.length > 0) {
        invItems.forEach(inv => console.log(JSON.stringify(inv)));
    }

    // 3. Also check what a fetchInventory would return for consumable battle items
    const { data: allInv, error: allError } = await supabase
        .from('inventory')
        .select(`
            id,
            is_equipped,
            quantity,
            items!inner (
                id, name, slug, type, effect_data
            )
        `)
        .limit(200);
    
    const battleItems = (allInv || []).filter((entry) => {
        const item = entry.items;
        return item && item.type === 'consumable' && item.effect_data?.use_timing === 'battle';
    });
    
    console.log('\n=== All battle items in all inventories ===');
    console.log('Total inventory entries:', allInv?.length || 0);
    console.log('Battle items found:', battleItems.length);
    battleItems.forEach(bi => {
        console.log(`  ${bi.items.name} (id:${bi.items.id}) qty:${bi.quantity} type:${bi.items.type} use_timing:${bi.items.effect_data?.use_timing}`);
    });
}

check().catch(console.error);
