
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const { data: allScenarios, error } = await supabase
        .from('scenarios')
        .select('quest_type');

    if (error) {
        console.error(error);
        return;
    }

    const typeCounts: Record<string, number> = {};
    allScenarios?.forEach((s: any) => {
        const type = s.quest_type || 'null';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    console.log('Scenario Type Counts:', typeCounts);
}

check();
