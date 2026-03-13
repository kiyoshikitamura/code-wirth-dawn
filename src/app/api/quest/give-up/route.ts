import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const requestUserId = body.userId;
        let userId = requestUserId;

        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                userId = user.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { error } = await supabase
            .from('user_profiles')
            .update({
                current_quest_id: null,
                current_quest_state: null
            })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Quest abandoned.' });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
