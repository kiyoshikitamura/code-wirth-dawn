import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// 現在のシーズンIDとデイリーIDの文字列を取得するヘルパー
function getPeriodIds() {
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);

    // シーズンID (前回の水曜日18:00の日付文字列)
    const prevWed = new Date(jstNow);
    const currentDay = jstNow.getUTCDay();
    let daysToSubtract = currentDay - 3;
    if (daysToSubtract < 0) daysToSubtract += 7;
    prevWed.setUTCDate(jstNow.getUTCDate() - daysToSubtract);
    prevWed.setUTCHours(9, 0, 0, 0); // JST 18:00
    if (prevWed.getTime() > jstNow.getTime()) {
        prevWed.setUTCDate(prevWed.getUTCDate() - 7);
    }
    const seasonId = `season_${prevWed.getUTCFullYear()}${(prevWed.getUTCMonth()+1).toString().padStart(2,'0')}${prevWed.getUTCDate().toString().padStart(2,'0')}`;

    // デイリーID (前回の18:00の日付文字列)
    const prevDaily = new Date(jstNow);
    if (jstNow.getUTCHours() < 9) { // JST 18:00 未満の場合
        prevDaily.setUTCDate(jstNow.getUTCDate() - 1);
    }
    prevDaily.setUTCHours(9, 0, 0, 0); // JST 18:00
    const dailyId = `daily_${prevDaily.getUTCFullYear()}${(prevDaily.getUTCMonth()+1).toString().padStart(2,'0')}${prevDaily.getUTCDate().toString().padStart(2,'0')}`;

    return { seasonId, dailyId };
}

// 順位に応じた報酬内容を定義
function getRewardsForRank(rank: number) {
    if (rank === 1) {
        return { gold: 100000, keys: { 1: 5 }, items: ['item_unidentified_ur', 'item_unidentified_ur', 'item_unidentified_ur'] }; // 学院の鍵(ID=1)x5, UR未鑑定x3
    } else if (rank >= 2 && rank <= 3) {
        return { gold: 50000, keys: { 1: 3 }, items: ['item_unidentified_ur', 'item_unidentified_ur'] }; // 学院の鍵x3, UR未鑑定x2
    } else if (rank >= 4 && rank <= 10) {
        return { gold: 20000, keys: { 1: 1 }, items: ['item_unidentified_ur'] }; // 学院の鍵x1, UR未鑑定x1
    }
    return null;
}

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;
        const { seasonId, dailyId } = getPeriodIds();

        // 1. 最新のランキングキャッシュ (season / daily) を取得
        const [seasonCache, dailyCache, claimedList] = await Promise.all([
            supabaseServer.from('pvp_ranking_cache').select('list_data').eq('ranking_type', 'season').maybeSingle(),
            supabaseServer.from('pvp_ranking_cache').select('list_data').eq('ranking_type', 'daily').maybeSingle(),
            supabaseServer.from('pvp_claimed_rewards').select('reward_type, season_id').eq('user_id', userId)
        ]);

        const claimedSet = new Set((claimedList.data || []).map(c => `${c.reward_type}_${c.season_id}`));
        const claimable: any[] = [];

        // シーズン報酬判定 (上位10名 且つ 未受取)
        if (seasonCache.data?.list_data) {
            const myRank = seasonCache.data.list_data.find((p: any) => p.user_id === userId)?.rank;
            if (myRank && myRank <= 10 && !claimedSet.has(`season_${seasonId}`)) {
                claimable.push({
                    type: 'season',
                    season_id: seasonId,
                    rank: myRank,
                    rewards: getRewardsForRank(myRank)
                });
            }
        }

        // デイリー報酬判定 (上位10名 且つ 未受取)
        if (dailyCache.data?.list_data) {
            const myRank = dailyCache.data.list_data.find((p: any) => p.user_id === userId)?.rank;
            if (myRank && myRank <= 10 && !claimedSet.has(`daily_${dailyId}`)) {
                claimable.push({
                    type: 'daily',
                    season_id: dailyId,
                    rank: myRank,
                    rewards: getRewardsForRank(myRank)
                });
            }
        }

        return NextResponse.json({
            success: true,
            claimable
        });
    } catch (e: any) {
        console.error('[pvp/claim-rewards GET] Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;
        const { reward_type, season_id, rank } = await req.json();

        if (!reward_type || !season_id || !rank) {
            return NextResponse.json({ error: 'パラメータが不足しています。' }, { status: 400 });
        }

        // 1. すでに受け取り済みかどうかを厳格チェック (ユニークインデックスによる保護)
        const { data: existingClaim } = await supabaseServer
            .from('pvp_claimed_rewards')
            .select('id')
            .eq('user_id', userId)
            .eq('reward_type', reward_type)
            .eq('season_id', season_id)
            .maybeSingle();

        if (existingClaim) {
            return NextResponse.json({ error: 'この報酬はすでに受け取り済みです。' }, { status: 400 });
        }

        // 2. 本当に対象期間の上位10名であるかキャッシュから最終確認
        const { data: rankingCache } = await supabaseServer
            .from('pvp_ranking_cache')
            .select('list_data')
            .eq('ranking_type', reward_type)
            .maybeSingle();

        if (!rankingCache?.list_data) {
            return NextResponse.json({ error: 'ランキングキャッシュが見つかりません。' }, { status: 404 });
        }

        const rankingUser = rankingCache.list_data.find((p: any) => p.user_id === userId);
        if (!rankingUser || rankingUser.rank !== rank || rank > 10) {
            return NextResponse.json({ error: '報酬の獲得対象ではありません。' }, { status: 403 });
        }

        const rewardConfig = getRewardsForRank(rank);
        if (!rewardConfig) {
            return NextResponse.json({ error: '該当する報酬設定が見つかりません。' }, { status: 404 });
        }

        // 3. アトミックな報酬付与処理
        // ゴールド加算
        if (rewardConfig.gold > 0) {
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('gold')
                .eq('id', userId)
                .single();
            const currentGold = profile?.gold ?? 0;
            await supabaseServer
                .from('user_profiles')
                .update({ gold: currentGold + rewardConfig.gold })
                .eq('id', userId);
        }

        // 学院の鍵付与
        for (const [keyIdStr, qty] of Object.entries(rewardConfig.keys)) {
            const itemId = parseInt(keyIdStr, 10);
            const quantity = Number(qty);

            const { data: existingKey } = await supabaseServer
                .from('inventory')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .maybeSingle();

            if (existingKey) {
                await supabaseServer
                    .from('inventory')
                    .update({ quantity: existingKey.quantity + quantity })
                    .eq('id', existingKey.id);
            } else {
                await supabaseServer
                    .from('inventory')
                    .insert({
                        user_id: userId,
                        item_id: itemId,
                        quantity: quantity,
                        is_equipped: false,
                        is_skill: false
                    });
            }
        }

        // UR未鑑定アイテム付与
        if (rewardConfig.items.length > 0) {
            const { data: dbItems } = await supabaseServer
                .from('items')
                .select('id')
                .eq('slug', rewardConfig.items[0])
                .maybeSingle();
            
            if (dbItems) {
                for (let i = 0; i < rewardConfig.items.length; i++) {
                    await supabaseServer
                        .from('inventory')
                        .insert({
                            user_id: userId,
                            item_id: dbItems.id,
                            quantity: 1,
                            is_equipped: false,
                            is_skill: false
                        });
                }
            }
        }

        // 4. 受け取り履歴のインサート
        await supabaseServer
            .from('pvp_claimed_rewards')
            .insert({
                user_id: userId,
                reward_type,
                season_id
            });

        return NextResponse.json({
            success: true,
            message: `${reward_type === 'season' ? 'シーズン' : 'デイリー'}報酬（順位: ${rank}位）を受け取りました！`,
            claimed_gold: rewardConfig.gold,
            claimed_keys_count: Object.values(rewardConfig.keys).reduce((a, b) => a + b, 0),
            claimed_items_count: rewardConfig.items.length
        });

    } catch (e: any) {
        console.error('[pvp/claim-rewards POST] Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
