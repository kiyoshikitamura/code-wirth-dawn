
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixNpcCards() {
    console.log("Fixing NPC Cards...");

    // 1. Wolf (Warrior/Mercenary) -> Slash (1001), Heavy Slash (1002) if exists, or similar
    // Using 1001 (Slash) and 1010 (Charge?) based on other NPCs
    const wolfCards = [1001, 1010];

    // 2. Elena (Mage) -> Fireball (2001), Heal (2005)
    // Using 2001 and 2005 based on log
    const elenaCards = [2001, 2005];

    // Update NPCs table (Template)
    const { error: err1 } = await supabase.from('npcs')
        .update({ inject_cards: wolfCards })
        .eq('name', '歴戦の傭兵ヴォルフ');

    const { error: err2 } = await supabase.from('npcs')
        .update({ inject_cards: elenaCards })
        .eq('name', '放浪魔術師エレナ');

    if (err1) console.error("Error updating Wolf Template:", err1);
    else console.log("Updated Wolf Template.");

    if (err2) console.error("Error updating Elena Template:", err2);
    else console.log("Updated Elena Template.");

    // Update Active Party Members
    const { error: err3 } = await supabase.from('party_members')
        .update({ inject_cards: wolfCards })
        .eq('name', '歴戦の傭兵ヴォルフ');

    const { error: err4 } = await supabase.from('party_members')
        .update({ inject_cards: elenaCards })
        .eq('name', '放浪魔術師エレナ');

    if (err3) console.error("Error updating Wolf Members:", err3);
    else console.log("Updated Active Wolf Members.");

    if (err4) console.error("Error updating Elena Members:", err4);
    else console.log("Updated Active Elena Members.");
}

fixNpcCards();
