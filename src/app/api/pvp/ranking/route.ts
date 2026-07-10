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

        const { searchParams } = new URL(req.url);
        const rankingType = searchParams.get('type') || 'season'; // 'season' or 'daily'

        if (rankingType !== 'season' && rankingType !== 'daily') {
            return NextResponse.json({ error: 'Invalid ranking type' }, { status: 400 });
        }

        // 1. まず現在の自分のアリーナステータス（レート）を取得
        const { data: myProfile, error: myErr } = await supabaseServer
            .from('user_profiles')
            .select('name, avatar_url, level, job_class, arena_rate')
            .eq('id', userId)
            .single();

        if (myErr || !myProfile) {
            return NextResponse.json({ error: 'プロフィールが見つかりません。' }, { status: 404 });
        }

        const myRate = myProfile.arena_rate ?? 1000;

        // 2. キャッシュテーブル (pvp_ranking_cache) からキャッシュの読み込み
        const { data: cachedData } = await supabaseServer
            .from('pvp_ranking_cache')
            .select('*')
            .eq('ranking_type', rankingType)
            .maybeSingle();

        const cacheLifeMs = 15 * 60 * 1000; // 15分
        const now = Date.now();
        let listData = cachedData?.list_data || [];
        let isExpired = !cachedData || (now - new Date(cachedData.updated_at).getTime()) > cacheLifeMs;

        // 3. キャッシュ期限切れの場合のみ、DB集計を走らせて更新
        if (isExpired) {
            // DB負荷軽減のため、インデックスを利用した上位50名のみのソートスキャン (本番テストユーザーは除外、防衛デッキ登録ありのユーザーのみに限定)
            const { data: topPlayers, error: fetchErr } = await supabaseServer
                .from('user_profiles')
                .select('id, name, avatar_url, level, job_class, arena_rate, pvp_defense_parties!inner(user_id)')
                .neq('id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
                .neq('id', '5ad434ec-763f-473e-939f-14a5e9e1cc93')
                .order('arena_rate', { ascending: false })
                .limit(50);

            if (!fetchErr && topPlayers) {
                listData = topPlayers.map((p, idx) => ({
                    rank: idx + 1,
                    user_id: p.id,
                    user_name: p.name || '名もなき旅人',
                    avatar_url: p.avatar_url || null,
                    level: p.level ?? 1,
                    job_class: p.job_class || 'Adventurer',
                    arena_rate: p.arena_rate ?? 1000
                }));

                // キャッシュの upsert
                await supabaseServer
                    .from('pvp_ranking_cache')
                    .upsert({
                        ranking_type: rankingType,
                        list_data: listData,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'ranking_type' });
            }
        }

        // 4. 自分自身のリアルタイム順位を COUNT クエリで高速特定 (本番テストユーザーを除外、防衛デッキ登録ありのユーザーのみに限定してカウント)
        const { count: higherRateCount } = await supabaseServer
            .from('user_profiles')
            .select('id, pvp_defense_parties!inner(user_id)', { count: 'exact', head: true })
            .neq('id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
            .neq('id', '5ad434ec-763f-473e-939f-14a5e9e1cc93')
            .gt('arena_rate', myRate);

        const myCurrentRank = (higherRateCount ?? 0) + 1;

        // 5. 自己データリアルタイムマージ（ハイブリッド制御）
        const myStatus = {
            rank: myCurrentRank,
            user_id: userId,
            user_name: myProfile.name || '名もなき旅人',
            avatar_url: myProfile.avatar_url || null,
            level: myProfile.level ?? 1,
            job_class: myProfile.job_class || 'Adventurer',
            arena_rate: myRate
        };

        return NextResponse.json({
            success: true,
            ranking_type: rankingType,
            updated_at: cachedData?.updated_at || new Date().toISOString(),
            myStatus,
            ranking: listData
        }, {
            headers: {
                // CDNエッジおよびブラウザキャッシュを2分間有効化 (二重キャッシュによるDB負荷防止)
                'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=60'
            }
        });

    } catch (e: any) {
        console.error('[pvp/ranking] API Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
