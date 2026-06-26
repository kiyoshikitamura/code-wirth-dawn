import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthClient } from '@/lib/supabase-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

export async function POST(req: Request) {
    try {
        if (!supabaseServiceKey) {
            console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Key' }, { status: 500 });
        }

        const client = createAuthClient(req);
        const { data: { user: authUser } } = await client.auth.getUser();
        const user_id = authUser?.id;

        if (!user_id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // 1. Get current user's location
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('current_location_id')
            .eq('id', user_id)
            .maybeSingle();

        if (userError || !user) {
            console.warn('[MeetPlayer] Failed to fetch current user profile:', userError);
        }

        const locationId = user?.current_location_id;
        let playerName = '';

        // 2. Fetch another active player in the same location
        if (locationId) {
            const { data: nearby, error: nearbyError } = await supabase
                .from('user_profiles')
                .select('display_name')
                .eq('current_location_id', locationId)
                .neq('id', user_id)
                .limit(10); // Fetch up to 10 candidates to randomize

            if (nearbyError) {
                console.error('[MeetPlayer] Failed to fetch nearby players:', nearbyError);
            }

            if (nearby && nearby.length > 0) {
                const validPlayers = nearby.filter(p => p.display_name);
                if (validPlayers.length > 0) {
                    const picked = validPlayers[Math.floor(Math.random() * validPlayers.length)];
                    playerName = picked.display_name;
                }
            }
        }

        // 3. Fallback to dummy adventurer names if no other players found
        if (!playerName) {
            const dummyAdventurers = [
                '戦士バルド',
                '魔術師ミリア',
                '冒険者ジーク',
                '盗賊レナ',
                '聖騎士クララ',
                '老兵ハンス',
                '薬師エマ',
                '吟遊詩人リュート'
            ];
            playerName = dummyAdventurers[Math.floor(Math.random() * dummyAdventurers.length)];
            console.log(`[MeetPlayer] No nearby players found at location=${locationId || 'unknown'}. Fallback to dummy: ${playerName}`);
        } else {
            console.log(`[MeetPlayer] Encountered nearby player: ${playerName} at location=${locationId}`);
        }

        return NextResponse.json({
            success: true,
            player_name: playerName
        });

    } catch (e: any) {
        console.error('[MeetPlayer] Unhandled error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
