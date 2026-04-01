import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log('Deleting old 5000-series scenarios...');
  
  // First check what exists
  const { data: existing, error: checkErr } = await supabase
    .from('scenarios')
    .select('id, title')
    .gte('id', 5000)
    .lt('id', 6000);
  
  if (checkErr) {
    console.error('Error checking scenarios:', checkErr.message);
    return;
  }
  
  console.log(`Found ${existing?.length || 0} scenarios in 5000-series range.`);
  if (existing && existing.length > 0) {
    existing.forEach(s => console.log(`  - ${s.id}: ${s.title}`));
    
    const { error: delErr } = await supabase
      .from('scenarios')
      .delete()
      .gte('id', 5000)
      .lt('id', 6000);
    
    if (delErr) {
      console.error('Error deleting:', delErr.message);
    } else {
      console.log(`Successfully deleted ${existing.length} old scenarios.`);
    }
  } else {
    console.log('No 5000-series scenarios found. Skipping.');
  }
}

cleanup();
