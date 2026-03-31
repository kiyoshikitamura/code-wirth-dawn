import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
    // skills テーブルのカラム確認（rpc経由）
    const { data: cols, error: colError } = await s.rpc('get_table_columns', { table_name: 'skills' }).select('*');
    if (colError) {
        // RPC非対応なら直接schema情報がないため、エラーメッセージで確認
        console.log('RPC not available, trying alternative...');
        // image_url を含めずにクエリ
        const { data: s1, error: e1 } = await s.from('skills').select('id, slug, name, image_url').limit(1);
        if (e1) console.log('skills image_url test error:', e1.message);
        else console.log('skills has image_url:', s1);

        // items の image_url テスト
        const { data: i1, error: ie1 } = await s.from('items').select('id, slug, image_url').limit(1);
        if (ie1) console.log('items image_url test error:', ie1.message);
        else console.log('items has image_url:', i1);
    }
}
main();
