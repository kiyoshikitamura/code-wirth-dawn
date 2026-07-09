import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // 過去20件のバトルログをロード (巨大なtext_logは除外し、メモリ/ネットワーク負荷を削減)
        const { data: logs, error } = await supabaseServer
            .from('pvp_battle_logs')
            .select(`
                id,
                attacker_user_id,
                defender_user_id,
                is_attacker_victory,
                attacker_rate_change,
                defender_rate_change,
                battle_type,
                created_at
            `)
            // 自分が攻撃側(challenge)または防衛側(defense)であるログに絞り込む
            .or(`attacker_user_id.eq.${userId},defender_user_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[pvp/battle-logs] Fetch error:', error);
            return NextResponse.json({ error: '対戦ログの取得に失敗しました。' }, { status: 500 });
        }

        // 対戦相手のプロファイルをピンポイントで一括解決 (Seq Scanを完全回避)
        const oppUserIds = Array.from(new Set((logs || []).map(l => 
            l.attacker_user_id === userId ? l.defender_user_id : l.attacker_user_id
        ))).filter(id => id !== '00000000-0000-0000-0000-000000000000');

        let userMap = new Map<string, any>();
        if (oppUserIds.length > 0) {
            const { data: profiles } = await supabaseServer
                .from('user_profiles')
                .select('id, name, avatar_url')
                .in('id', oppUserIds);
            
            if (profiles) {
                profiles.forEach(p => userMap.set(p.id, p));
            }
        }

        const formattedLogs = (logs || []).map(l => {
            const isAttacker = l.attacker_user_id === userId;
            const oppId = isAttacker ? l.defender_user_id : l.attacker_user_id;
            const oppProfile = userMap.get(oppId);

            // 挑戦(challenge)または防衛(defense)の別、および自身の勝敗とレート変動
            const type = isAttacker ? 'challenge' : 'defense';
            const isWin = isAttacker ? l.is_attacker_victory : !l.is_attacker_victory;
            const rateChange = isAttacker ? l.attacker_rate_change : l.defender_rate_change;

            return {
                id: l.id,
                battle_type: type,
                opponent_name: oppId === '00000000-0000-0000-0000-000000000000' ? 'NPCゴースト' : (oppProfile?.name || '名もなき旅人'),
                opponent_avatar: oppProfile?.avatar_url || null,
                is_victory: isWin,
                rate_change: rateChange,
                created_at: l.created_at
            };
        });

        return NextResponse.json({
            success: true,
            logs: formattedLogs
        }, {
            headers: {
                // ログ一覧は他者との対戦のたびに更新されるためキャッシュ禁止
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (e: any) {
        console.error('[pvp/battle-logs] API Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
