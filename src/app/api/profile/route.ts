import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
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

        // 優先度: 1. 明示的な profileId クエリパラメータ、2. JWT認証のUID
        const targetId = queryId || user?.id;

        if (!targetId) {
            // [Clean-Expert] 旧仕様の「最新プロファイルフォールバック」を廃止。
            // 認証なしで他人のプロファイルを取得・上書きしてしまうバグの根本原因を排除する。
            console.warn('[GET /api/profile] 認証不可・ profileId 不存在: 401 を返却');
            return NextResponse.json({ error: '認証が必要です。ログインしてから再度アクセスしてください。' }, { status: 401 });
        }

        const isSelf = !queryId || queryId === user?.id;

        // C2最適化: プロフィール取得と装備ボーナス取得を並列化
        const [profileResult, equipResult] = await Promise.all([
            client
                .from('user_profiles')
                .select('*, locations:locations!fk_current_location(*), reputations(*)')
                .eq('id', targetId)
                .maybeSingle(),
            supabaseServer
                .from('inventory')
                .select('item_id, items!inner(effect_data)')
                .eq('user_id', targetId)
                .eq('is_equipped', true),
        ]);

        let { data: profile } = profileResult;

        if (!profile) {
            // プロファイルが存在しない場合、404を返す。
            // 旧仕様の「upsertによる自動生成」を廃止し、初回プロファイル作成は /api/profile/init で明示的に行う。
            console.warn(`[GET /api/profile] プロファイルが見つかりません: ${targetId}`);
            return NextResponse.json({ error: 'プロファイルが見つかりません。キャラクター作成から始めてください。' }, { status: 404 });
        }

        // --- 装備ボーナス計算（C2: /api/equipment への追加リクエスト不要化） ---
        const equipBonus = { atk: 0, def: 0, hp: 0 };
        const equippedItems: any[] = [];
        if (equipResult.data) {
            for (const eq of equipResult.data) {
                const effectData = (eq as any).items?.effect_data;
                if (effectData) {
                    equipBonus.atk += effectData.atk_bonus || 0;
                    equipBonus.def += effectData.def_bonus || 0;
                    equipBonus.hp += effectData.hp_bonus || 0;
                }
                equippedItems.push(eq);
            }
        }
        (profile as any).equipment_bonus = equipBonus;

        // --- ロジック: タイトル更新（加齢はmove/inn/pray/quest完了時に処理済み。GETでは副作用なし） ---
        if (profile && isSelf) {
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

                // 称号更新の履歴を user_chronicles に記録
                const currentLocName = profile.locations?.name || null;
                await supabaseServer.from('user_chronicles').insert({
                    user_id: profile.id,
                    event_type: 'title_gained',
                    accumulated_days: profile.accumulated_days || 0,
                    location_id: profile.current_location_id,
                    location_name: currentLocName,
                    title: `称号獲得: ${newTitle}`,
                    description: `己の生き様が認められ、新たな称号『${newTitle}』を冠した。（旧称号: ${oldTitle}）`,
                    param_changes: {
                        title_from: oldTitle,
                        title_to: newTitle
                    }
                }).then(({ error }: any) => {
                    if (error) console.error('[Profile API] Failed to write title_gained to user_chronicles:', error);
                });

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

                // Gossip BBS auto-post for new title gain
                try {
                    const userName = profile.name || '旅人';
                    const TIER_S_TEMPLATES: Record<string, string> = {
                        '光輝の守護聖者': `「法と正義を体現せし極光の守護聖者『${userName}』が誕生した。その光は闇を切り裂く楔となるだろう。」`,
                        '終末の覇王': `「無秩序の深淵より現れし終末の覇王『${userName}』。彼らが歩む後に残るのは、絶対的な力と静寂のみである。」`,
                        '天秤の調停者': `「相反する二つの極みを支配し、秩序と混沌を量る天秤の調停者『${userName}』。その眼差しは世界の均衡を保つ。」`,
                        '嵐の解放者': `「常識の檻を壊し、自由と正義のために戦う嵐の解放者『${userName}』。世界は彼らの軌跡によって塗り替えられる。」`,
                        '不滅の古豪': `「歳月を越え、不滅の肉体を維持し続ける不屈の古豪『${userName}』。長き旅路の果てに、なお闘志は衰えず。」`,
                        '神話の富豪': `「莫大な富と確かな実力を有し、神話の富豪として君臨する『${userName}』。その影響力は世界経済さえ左右する。」`
                    };

                    const TIER_A_TITLES = ['聖騎士', '暗黒卿', '義賊', '冷徹な執行者', '黄金の暴君', '清廉の騎士団長', '戦乙女', '魔女'];

                    let content: string | null = null;
                    if (TIER_S_TEMPLATES[newTitle]) {
                        content = TIER_S_TEMPLATES[newTitle];
                    } else if (TIER_A_TITLES.includes(newTitle)) {
                        content = `「数々の試練を乗り越え、冒険者『${userName}』が上位の称号『${newTitle}』を冠した。新たなる英雄の誕生だ。」`;
                    }

                    if (content) {
                        const { GossipService } = await import('@/services/gossipService');
                        const gossipService = new GossipService(supabaseServer);
                        await gossipService.postSystemMessage(
                            content,
                            profile.current_location_id,
                            profile.id
                        );
                    }
                } catch (gossipErr) {
                    console.error('[Profile API Gossip] Failed to auto-post title message:', gossipErr);
                }
            }

            // 必要な場合に限り更新を適用
            if (needsUpdate) {
                await supabaseServer.from('user_profiles').update(updates).eq('id', profile.id);
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
