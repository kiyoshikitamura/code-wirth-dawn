process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rollback() {
    console.log('Rolling back Rift seed data from DB...');

    // Delete scenarios records (scenarios table contains quests, keyed by id)
    const { error: sError } = await supabase.from('scenarios').delete().in('id', [7060, 7061, 7062, 7063, 7064, 7065, 7066]);
    if (sError) console.error('Error deleting scenarios:', sError);
    else console.log('Deleted scenarios (quests) records.');

    // Delete items records
    const { error: iError } = await supabase.from('items').delete().in('id', [
        311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 
        321, 322, 323, 324, 325, 331, 332, 333, 326, 327, 
        328, 329, 330, 351
    ]);
    if (iError) console.error('Error deleting items:', iError);
    else console.log('Deleted items records.');

    // Delete enemies records
    const { error: eError } = await supabase.from('enemies').delete().in('id', [
        1901, 1902, 1907, 1903, 1908, 1904, 1905, 1906, 1909, 1910, 
        1961, 1962, 1963, 1964, 1965, 1966
    ]);
    if (eError) console.error('Error deleting enemies:', eError);
    else console.log('Deleted enemies records.');

    // Delete enemy groups records
    const { error: egError } = await supabase.from('enemy_groups').delete().in('id', [
        9501, 9502, 9503, 9504, 9505, 9506, 9507
    ]);
    if (egError) console.error('Error deleting enemy_groups:', egError);
    else console.log('Deleted enemy groups records.');

    // Delete cards records
    const { error: cError } = await supabase.from('cards').delete().in('id', [314]);
    if (cError) console.error('Error deleting cards:', cError);
    else console.log('Deleted cards records.');



    console.log('Rollback completed.');
}

rollback();
