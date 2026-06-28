process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

/**
 * POST /api/quest/save-state
 * Persists the client's current quest progress state to the database (Spec v3.4: Resume Persistence)
 */
export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const { quest_id, quest_state } = body;

        if (!quest_id || !quest_state) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Save quest state with optimistic lock checking on active quest ID
        const { data: updatedProfiles, error: updateError } = await supabaseServer
            .from('user_profiles')
            .update({
                current_quest_state: quest_state
            })
            .eq('id', userId)
            .eq('current_quest_id', quest_id)
            .select('id');

        if (updateError) throw updateError;

        if (!updatedProfiles || updatedProfiles.length === 0) {
            console.warn(`[Security] API rejected quest state saving. Inactive quest or mismatch: user_id=${userId}, quest_id=${quest_id}`);
            return NextResponse.json({ error: 'Quest is not active or has already been completed.' }, { status: 409 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Quest Save State] Critical Error:', e);
        return NextResponse.json({ error: e.message || 'Unknown server error' }, { status: 500 });
    }
}
