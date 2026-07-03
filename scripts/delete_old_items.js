process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const dotenv = require('dotenv');
dotenv.config({ path: 'D:/dev/code-wirth-dawn/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, adminKey);

async function run() {
    const itemIds = [350, 4002, 4003];
    console.log(`Physically deleting deprecated items ${itemIds.join(', ')} from current database...`);

    // 1. Delete from equipped_items (just in case)
    const { error: equipError } = await supabase
        .from('equipped_items')
        .delete()
        .in('item_id', itemIds);
    if (equipError) {
        console.error('Error deleting from equipped_items:', equipError);
    } else {
        console.log('Successfully cleared from equipped_items.');
    }

    // 2. Delete from inventory
    const { error: invError } = await supabase
        .from('inventory')
        .delete()
        .in('item_id', itemIds);
    if (invError) {
        console.error('Error deleting from inventory:', invError);
    } else {
        console.log('Successfully cleared from user inventories.');
    }

    // 3. Delete from items master
    const { error: itemError } = await supabase
        .from('items')
        .delete()
        .in('id', itemIds);
    if (itemError) {
        console.error('Error deleting from items master:', itemError);
    } else {
        console.log('Successfully deleted deprecated items from items master table.');
    }
}

run();
