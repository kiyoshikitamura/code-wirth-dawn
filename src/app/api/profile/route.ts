import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { calculateTitle } from '@/lib/character';
import { UI_RULES } from '@/constants/game_rules';
import { checkAndFireTrigger, buildShareData, isTierUpgrade, getTitleTier } from '@/lib/shareUtils';
import { getFlavor } from '@/lib/shareTextLoader';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // JWT指向の認証クライアントを生成（RLS を必ず通る）
        const client = createAuthClient(req);
        const url = new URL(req.url);
        const queryId = url.searchParams.get('profileId');

        // JWT Bearer だからユーザーを特定する
        const { data: { user } } = await client.auth.getUser();

        // 優先度: 1. JWT認証のUID、2. 明示的な profileId クエリパラメータ
        const targetId = user?.id || queryId;

        if (!targetId) {
            // [Clean-Expert] 旧仕様の「最新プロファイルフォールバック」を廃止。
            // 認証なしで他人のプロファイルを取得・上書きしてしまうバグの根本原因を排除する。
            console.warn('[GET /api/profile] 認証不可・ profileId 不存在: 401 を返却');
            return NextResponse.json({ error: '認証が必要です。ログインしてから再度アクセスしてください。' }, { status: 401 });
        }

        let { data: profile, error } = await client
            .from('user_profiles')
            .select('*, locations:locations!fk_current_location(*), reputations(*)')
            .eq('id', targetId)
            .maybeSingle();

        if (!profile) {
            // プロファイルが存在しない場合、404を返す。
            // 旧仕様の「upsertによる自動生成」を廃止し、初回プロファイル作成は /api/profile/init で明示的に行う。
            console.warn(`[GET /api/profile] プロファイルが見つかりません: ${targetId}`);
            return NextResponse.json({ error: 'プロファイルが見つかりません。キャラクター作成から始めてください。' }, { status: 404 });
        }

        // --- ロジック: タイトル更新（加齢はmove/inn/pray/quest完了時に処理済み。GETでは副作用なし） ---
        if (profile) {
            let needsUpdate = false;
            const updates: any = {};

            // 2. ドイナミックタイトルロジック
            const oldTitle = profile.title_name || '名もなき旅人';
            const newTitle = calculateTitle(profile);
            let titleShareDataList: any[] = [];
            if (newTitle !== oldTitle) {
                updates.title_name = newTitle;
                updates.updated_at = new Date().toISOString();
                profile.title_name = newTitle;
                needsUpdate = true;

                // #8 称号Tier昇格チェック (世代1回)
                if (isTierUpgrade(oldTitle, newTitle)) {
                    const newTier = getTitleTier(newTitle);
                    const fired = await checkAndFireTrigger(client, profile.id, 'title_tier_up', newTier);
                    if (fired) {
                        const flavor = getFlavor('title_tier', newTier);
                        const sd = buildShareData('title_tier_up', { title: newTitle, flavor });
                        if (sd) titleShareDataList.push(sd);
                    }
                }
            }

            // 必要な場合に限り更新を適用
            if (needsUpdate) {
                await client.from('user_profiles').update(updates).eq('id', profile.id);
            }

            // share_data_listがあればprofileオブジェクトに付与
            if (titleShareDataList.length > 0) {
                (profile as any).share_data_list = titleShareDataList;
            }
        }
        // -----------------------------------

        return NextResponse.json(profile);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
