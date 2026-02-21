import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client safely (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
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
