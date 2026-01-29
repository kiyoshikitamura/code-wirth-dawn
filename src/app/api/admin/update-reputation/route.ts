import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ReputationRank } from '@/types/game';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { location_name, action, amount = 10 } = await req.json();

        if (!location_name) {
            return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
        }

        // 1. Get User Profile (assume single user for now)
        const { data: profiles } = await supabase.from('user_profiles').select('id, title_name').limit(1);
        const userId = profiles?.[0]?.id;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Get Current Reputation
        const { data: currentRep } = await supabase
            .from('reputations')
            .select('*')
            .eq('user_id', userId)
            .eq('location_name', location_name)
            .maybeSingle();

        let newScore = currentRep?.score || 0;

        if (action === 'add') {
            newScore += amount;
        } else if (action === 'sub') {
            newScore -= amount;
        }

        // 3. Determine Rank
        let newRank: ReputationRank = 'Stranger';
        if (newScore >= 100) newRank = 'Hero';
        else if (newScore >= 50) newRank = 'Famous';
        else if (newScore <= -100) newRank = 'Criminal';
        else if (newScore <= -50) newRank = 'Rogue';
        else newRank = 'Stranger';

        // 4. Upsert Reputation
        const { error: repError } = await supabase
            .from('reputations')
            .upsert({
                user_id: userId,
                location_name,
                score: newScore,
                rank: newRank,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,location_name' });

        if (repError) throw repError;

        if (repError) throw repError;

        // Note: Global Title (user_profiles.title_name) is NOT updated here.
        // It is now derived dynamically on the client based on Local Rank.

        return NextResponse.json({ success: true, score: newScore, rank: newRank });

    } catch (e: any) {
        console.error("Update Reputation Failed", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
