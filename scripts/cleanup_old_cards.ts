import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  // 1. Clear linked_card_id FK references in items first
  console.log('Clearing linked_card_id references in items...');
  const { error: clearFkErr } = await supabase
    .from('items')
    .update({ linked_card_id: null })
    .not('linked_card_id', 'is', null);
  
  if (clearFkErr) {
    console.error('Error clearing items FK:', clearFkErr.message);
  } else {
    console.log('Cleared linked_card_id FKs in items.');
  }

  // 2. Clear user_skills references if any
  console.log('Clearing user_skills...');
  const { error: clearSkillsErr } = await supabase
    .from('user_skills')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
  if (clearSkillsErr) {
    console.log('user_skills clear:', clearSkillsErr.message);
  } else {
    console.log('Cleared user_skills.');
  }

  // 3. Delete old cards (IDs 1000-2999)
  console.log('\nDeleting old 1000-2999 series cards...');
  const { data: oldCards, error: checkCards } = await supabase
    .from('cards')
    .select('id')
    .gte('id', 1000)
    .lt('id', 3000);
  
  if (!checkCards && oldCards && oldCards.length > 0) {
    const { error: delErr } = await supabase
      .from('cards')
      .delete()
      .gte('id', 1000)
      .lt('id', 3000);
    if (delErr) {
      console.error('Error deleting old cards:', delErr.message);
    } else {
      console.log(`Deleted ${oldCards.length} old cards.`);
    }
  } else {
    console.log('No old cards found.');
  }

  console.log('\nCleanup done.');
}

cleanup();
