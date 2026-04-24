import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/list-quests
 * デバッグ用: 全クエスト一覧を条件なしで返す
 */
export async function GET() {
    try {
        const { data: quests, error } = await supabaseServer
            .from('scenarios')
            .select('id, slug, title, quest_type, rec_level, difficulty')
            .not('slug', 'like', 'ugc_%')
            .order('id', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            quests: quests || [],
            count: quests?.length || 0,
        });
    } catch (e: any) {
        console.error('[debug/list-quests] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
