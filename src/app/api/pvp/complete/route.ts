process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;
        const { is_victory, opponent_id, opponent_name, battle_logs } = await req.json();

        if (is_victory === undefined || !opponent_name) {
            return NextResponse.json({ error: 'パラメータが不足しています。' }, { status: 400 });
        }

        // 1. プロフィール情報取得（年代記用）
        const { data: profile } = await supabaseServer
            .from('user_profiles')
            .select('current_location_id, locations:locations!fk_current_location(name), accumulated_days')
            .eq('id', userId)
            .maybeSingle();

        // 2. 現在の戦績取得
        const { data: stats, error: statsError } = await supabaseServer
            .from('pvp_user_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        let currentWins = stats?.wins ?? 0;
        let currentLosses = stats?.losses ?? 0;
        let currentStreak = stats?.current_streak ?? 0;
        let maxStreak = stats?.max_streak ?? 0;
        let currentRating = stats?.rating ?? 1500;

        let ratingChange = 0;

        // 3. 勝敗による計算
        if (is_victory) {
            currentWins += 1;
            currentStreak += 1;
            maxStreak = Math.max(maxStreak, currentStreak);
            ratingChange = 16; // 勝利時は+16
            currentRating += ratingChange;
        } else {
            currentLosses += 1;
            currentStreak = 0;
            ratingChange = -12; // 敗北時は-12
            currentRating = Math.max(1000, currentRating + ratingChange); // レーティング下限1000
        }

        // 4. 戦績の Upsert
        const { error: upsertError } = await supabaseServer
            .from('pvp_user_stats')
            .upsert({
                user_id: userId,
                wins: currentWins,
                losses: currentLosses,
                current_streak: currentStreak,
                max_streak: maxStreak,
                rating: currentRating,
                updated_at: new Date().toISOString()
            });

        if (upsertError) {
            console.error('[PvP Complete] Stats upsert error:', upsertError);
            return NextResponse.json({ error: '戦績の更新に失敗しました。' }, { status: 500 });
        }

        // 4.5 プレイヤーのクエストロック解除 (current_quest_id = null)
        const { error: resetLockError } = await supabaseServer
            .from('user_profiles')
            .update({ current_quest_id: null })
            .eq('id', userId);

        if (resetLockError) {
            console.error('[PvP Complete] Reset quest lock error:', resetLockError);
            // 警告ログを出すが、戦績自体は更新できているので処理は続行
        }

        // 5. 個人タイムライン（年代記）にインサート
        try {
            const locName = (profile as any)?.locations?.name || '闘技場';
            const days = profile?.accumulated_days ?? 0;
            await supabaseServer.from('user_chronicles').insert({
                user_id: userId,
                event_type: 'arena_battle',
                accumulated_days: days,
                location_id: profile?.current_location_id || null,
                location_name: locName,
                title: is_victory ? `闘技場勝利 (vs ${opponent_name})` : `闘技場敗北 (vs ${opponent_name})`,
                description: `${opponent_name}の防衛パーティとの対人戦に挑み、${is_victory ? '見事勝利を収めた' : '惜しくも敗北した'}。(レート: ${currentRating - ratingChange} ➔ ${currentRating})`,
                param_changes: {
                    is_victory,
                    opponent_id,
                    opponent_name,
                    rating_change: ratingChange,
                    new_rating: currentRating,
                    battle_logs: battle_logs || []
                }
            });
        } catch (chronicleErr) {
            console.warn('[PvP Complete] Chronicle insert failed (ignored):', chronicleErr);
        }

        return NextResponse.json({
            success: true,
            wins: currentWins,
            losses: currentLosses,
            current_streak: currentStreak,
            max_streak: maxStreak,
            rating: currentRating,
            rating_change: ratingChange
        });

    } catch (err: any) {
        console.error('[PvP Complete] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
