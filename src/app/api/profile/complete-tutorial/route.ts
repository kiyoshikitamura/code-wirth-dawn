import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await anonSupabase.auth.getUser(token);
            if (user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: '認証セッションが見つかりません。' }, { status: 401 });
        }

        const { error } = await supabaseServer
            .from('user_profiles')
            .update({
                is_tutorial_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[POST /api/profile/complete-tutorial] エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
