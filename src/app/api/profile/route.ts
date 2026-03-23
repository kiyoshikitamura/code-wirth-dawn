import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { calculateTitle, processAging } from '@/lib/character';
import { UI_RULES } from '@/constants/game_rules';

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

        // --- ロジック: 加齢・タイトル更新 ---
        if (profile) {
            let needsUpdate = false;
            const updates: any = {};

            // 1. 加齢ロジック
            const { age, vitality, aged } = processAging(profile.age || 20, profile.vitality ?? 100, profile.accumulated_days || 0, profile.birth_date);
            if (aged) {
                updates.age = age;
                updates.vitality = vitality;
                updates.updated_at = new Date().toISOString();
                profile.age = age;
                profile.vitality = vitality;
                needsUpdate = true;
            }

            // 2. ドイナミックタイトルロジック
            const newTitle = calculateTitle(profile);
            if (newTitle !== profile.title_name) {
                updates.title_name = newTitle;
                updates.updated_at = new Date().toISOString();
                profile.title_name = newTitle;
                needsUpdate = true;
            }

            // 必要な場合に限り更新を適用
            if (needsUpdate) {
                await client.from('user_profiles').update(updates).eq('id', profile.id);
            }
        }
        // -----------------------------------

        return NextResponse.json(profile);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
