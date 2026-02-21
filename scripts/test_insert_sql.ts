
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testInsertSQL() {
    const sql = `
    INSERT INTO locations (slug, name, type, nation_id, description, map_x, map_y, x, y, neighbors, connections, ruling_nation_id, prosperity_level, current_attributes)
    VALUES (
        'loc_regalia_sql', '王都レガリアSQL', 'Capital', 'Roland', 'SQL Insert Test', 20, 80, 20, 80, 
        '{"loc_white_fort": 2}'::jsonb, 
        ARRAY['loc_white_fort'], 
        'Roland', 
        3, 
        '{"order": 10, "chaos": 10, "justice": 10, "evil": 10}'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
    `;

    console.log("Running SQL...");
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) console.error("SQL ERROR:", JSON.stringify(error, null, 2));
    else console.log("SQL SUCCESS");
}

testInsertSQL();
