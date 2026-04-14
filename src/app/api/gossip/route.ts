import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gossip
 * 「街の噂話」モーダル向けデータを一括返却。
 * Query: user_id, location_id, tab (optional: 'news'|'lore'|'secret'|'tavern')
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id') || '';
        const locationId = searchParams.get('location_id') || '';
        const tab = searchParams.get('tab') || 'all'; // 個別タブ更新にも対応

        const result: Record<string, any> = {};

        // ─────────────────────────────────────────────
        // タブ①「噂話」: world_states_history 最新10件
        // ─────────────────────────────────────────────
        if (tab === 'all' || tab === 'news') {
            const { data: worldNews, error: newsError } = await supabase
                .from('world_states_history')
                .select('id, news_content, old_status, new_status, occured_at, location:locations(name)')
                .order('occured_at', { ascending: false })
                .limit(10);

            if (newsError) throw newsError;

            // 未読カウント (user_world_views との差分)
            const { data: viewData } = await supabase
                .from('user_world_views')
                .select('last_seen_history_id')
                .eq('user_id', userId)
                .maybeSingle();

            let unreadCount = 0;
            if (worldNews && viewData?.last_seen_history_id) {
                const idx = worldNews.findIndex(n => n.id === viewData.last_seen_history_id);
                unreadCount = idx === -1 ? worldNews.length : idx;
            } else if (worldNews) {
                unreadCount = worldNews.length > 0 ? 1 : 0;
            }

            // 未読カウントの判定後にランダム3件を抽出
            const shuffledNews = (worldNews || []).sort(() => Math.random() - 0.5).slice(0, 3);

            result.world_news = shuffledNews;
            result.unread_count = unreadCount;
        }

        // ─────────────────────────────────────────────
        // タブ②「こぼれ話」: rumors テーブルからランダム3件
        // プレースホルダー ({loc_name}, {nation_name}) をサーバー側で差し替え
        // ─────────────────────────────────────────────
        if (tab === 'all' || tab === 'lore') {
            // 現在地情報を取得してプレースホルダー用に使う
            const { data: locData } = await supabase
                .from('locations')
                .select('name, ruling_nation_id, world_states(controlling_nation)')
                .eq('id', locationId)
                .maybeSingle();

            const locName = locData?.name || '旅先の街';
            const nationName = (locData?.world_states as any)?.[0]?.controlling_nation || locData?.ruling_nation_id || '未知の国';

            // nation_tag が NULL または現在地の国に一致するものを取得
            const { data: rumorRows } = await supabase
                .from('rumors')
                .select('id, content, rarity, nation_tag')
                .eq('category', 'lore')
                .or(`nation_tag.is.null,nation_tag.eq.${nationName}`);

            // 0件の場合は country タグなしの全拠点共通データのみで再試行
            let finalRumorRows = rumorRows || [];
            if (finalRumorRows.length === 0) {
                const { data: fallbackRows } = await supabase
                    .from('rumors')
                    .select('id, content, rarity, nation_tag')
                    .eq('category', 'lore')
                    .is('nation_tag', null);
                finalRumorRows = fallbackRows || [];
            }

            // Black marketアイテム情報（噂話として流用）
            const { data: blackMarketItems } = await supabase
                .from('items')
                .select('id, name, nation_tags, min_prosperity')
                .eq('is_black_market', true)
                .limit(5);

            const blackMarketLore = (blackMarketItems || []).map(it => ({
                id: `bm-${it.id}`,
                content: `「${it.name}……普通じゃ手に入らない代物だ。どこかの闇市を探せば見つかるかもしれないが、危険を覚悟しろよ。」`,
                rarity: 3,
                nation_tag: it.nation_tags?.[0] || null
            }));

            const combinedLore = [...finalRumorRows, ...blackMarketLore];

            // ランダムシャッフルして3件選択
            const shuffled = combinedLore.sort(() => Math.random() - 0.5).slice(0, 3);
            const loreItems = shuffled.map(r => ({
                ...r,
                content: r.content
                    .replace(/\{loc_name\}/g, locName)
                    .replace(/\{nation_name\}/g, nationName),
            }));

            result.lore_tips = loreItems;
        }

        // ─────────────────────────────────────────────
        // タブ③「路地裏」: 全拠点の出現中 special quest（最大6件）
        // ─────────────────────────────────────────────
        if (tab === 'all' || tab === 'secret') {
            // special系シナリオを全拠点から取得 (is_urgent = true かつ requirements 付き)
            const { data: specialQuests } = await supabase
                .from('scenarios')
                .select('id, slug, title, quest_type, requirements, difficulty, location_id, location:locations(name, ruling_nation_id)')
                .eq('quest_type', 'special')
                .eq('is_urgent', true)
                .not('slug', 'like', 'main_%');

            const shuffledQuests = (specialQuests || []).sort(() => Math.random() - 0.5).slice(0, 3);

            result.secret_info = {
                quests: shuffledQuests.map(q => ({
                    id: q.id,
                    title: q.title,
                    location_name: (q.location as any)?.name || '不明の地',
                    nation: (q.location as any)?.ruling_nation_id || '???',
                    difficulty: q.difficulty,
                    // requirements を曖昧にフォーマット
                    hint: formatRequirementsHint(q.requirements),
                })),
            };
        }

        // ─────────────────────────────────────────────
        // タブ④「酒場」: 同拠点にいる他プレイヤー(active) + システム傭兵(npcs)
        // ─────────────────────────────────────────────
        if (tab === 'all' || tab === 'tavern') {
            // 拠点情報を取得（国籍フィルタ用）
            let rulingNation: string | null = null;
            if (locationId) {
                const { data: locInfo } = await supabase
                    .from('locations')
                    .select('ruling_nation_id')
                    .eq('id', locationId)
                    .maybeSingle();
                rulingNation = locInfo?.ruling_nation_id?.toLowerCase() || null;
            }

            // ① 同拠点で最近アクティブな他プレイヤー（24h以内）
            // ※ name=NULLのユーザーはタバーンリストに出ないので除外（整合性確保）
            // ※ Supabaseクエリビルダーはimmutableなので必ずletで再代入
            let activeUsersQuery = supabase
                .from('user_profiles')
                .select('id, name, title_name, level, avatar_url, updated_at, atk, def, max_hp, job_class')
                .eq('is_alive', true)
                .not('name', 'is', null)   // name=NULLを除外（tavernListと整合）
                .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (locationId) {
                activeUsersQuery = activeUsersQuery
                    .eq('current_location_id', locationId)
                    .neq('id', userId);
            }

            activeUsersQuery = activeUsersQuery.limit(5); // 多すぎないよう制限
            const { data: activeUsers } = await activeUsersQuery;

            // v25: active_shadow ユーザーの装備スキルを一括取得
            const activeUserIds = (activeUsers || []).map((u: any) => u.id);
            const skillsByUser: Record<string, string[]> = {};
            if (activeUserIds.length > 0) {
                const { data: equippedSkills } = await supabase
                    .from('user_skills')
                    .select('user_id, cards!inner(name)')
                    .in('user_id', activeUserIds)
                    .eq('is_equipped', true)
                    .limit(30);

                if (equippedSkills) {
                    for (const s of equippedSkills) {
                        if (!skillsByUser[s.user_id]) skillsByUser[s.user_id] = [];
                        const cardName = (s as any).cards?.name;
                        if (cardName) skillsByUser[s.user_id].push(cardName);
                    }
                }
            }

            // ② システム傭兵 - shadowServiceと同じslug.includes(rulingNation)ロジックで絞り込み
            // 全npcsを取得後にJS側でフィルタ（Supabase ilike構文の複雑さを回避）
            const { data: allNpcMercs } = await supabase
                .from('npcs')
                .select('id, slug, name, epithet, level, job_class, image_url, introduction')
                .eq('is_hireable', true)
                .eq('origin', 'system_mercenary');

            // shadowServiceと同じロジックでフィルタリング
            let npcMercs = allNpcMercs || [];
            if (rulingNation && rulingNation !== 'unknown') {
                const nativeNpcs = npcMercs.filter(n => n.slug?.toLowerCase().includes(rulingNation!));
                const freeNpcs = npcMercs.filter(n => n.slug?.toLowerCase().includes('free'));
                // nativeNpcsがある場合はそちらを優先、なければ全員
                npcMercs = nativeNpcs.length > 0 ? [...nativeNpcs, ...freeNpcs] : npcMercs;
            }
            npcMercs = npcMercs.slice(0, 10);

            // activeUsersをTavernShadow形式に整形（v25: atk/def/hp/skills追加）
            const JOB_CLASS_JP_GOSSIP: Record<string, string> = {
                Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Mage: '魔法使い',
                Ranger: '狩人', Thief: '盗賊', Cleric: '僧侶', Bard: '吟遊詩人',
                Adventurer: '冒険者', Samurai: '侍', Ninja: '忍者', Mercenary: '傭兵',
            };
            const activeShadows = (activeUsers || []).map((u: any) => ({
                id: u.id,
                profile_id: u.id,
                name: u.name || '名もなき旅人',
                epithet: u.title_name || '',
                job_class: JOB_CLASS_JP_GOSSIP[u.job_class] || u.job_class || '冒険者',
                durability: u.max_hp || 100,
                max_durability: u.max_hp || 100,
                cover_rate: 0,
                avatar_url: u.avatar_url,
                icon_url: u.avatar_url,
                origin_type: 'active_shadow',
                level: u.level,
                // v25: スナップショットステータス
                stats: { atk: u.atk || 0, def: u.def || 0, hp: u.max_hp || 100 },
                signature_deck_preview: skillsByUser[u.id] || [],
                contract_fee: (u.level || 1) * 50, // 仮計算（hireShadow 側でサーバー再計算）
                subscription_tier: 'free',
            }));

            // npcをTavernShadow形式に整形
            const npcShadows = npcMercs.map(n => ({
                id: n.id,
                name: n.name,
                epithet: n.epithet || '',
                job_class: n.job_class || '傭兵',
                durability: 100,
                max_durability: 100,
                cover_rate: 0,
                avatar_url: n.image_url || (n.slug ? `/images/npcs/${n.slug}.png` : undefined),
                origin_type: 'system_mercenary',
                level: n.level,
                flavor_text: n.introduction,
            }));

            // 合算してランダム3件
            const allCandidates = [...activeShadows, ...npcShadows];
            const shuffledShadows = allCandidates.sort(() => Math.random() - 0.5).slice(0, 3);

            // 同じ拠点にいる他プレイヤー数 - is_alive & 24h以内に限定
            let resonanceCount = 0;
            if (locationId) {
                const { count } = await supabase
                    .from('user_profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('current_location_id', locationId)
                    .neq('id', userId)
                    .eq('is_alive', true)
                    .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
                resonanceCount = count || 0;
            }

            result.tavern_shadows = shuffledShadows;
            result.resonance_count = resonanceCount;
        }



        return NextResponse.json(result);

    } catch (e: any) {
        console.error('[gossip] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * requirements オブジェクトを「ヒント文」に変換（意図的に曖昧）
 */
function formatRequirementsHint(req: any): string {
    if (!req) return 'この情報の詳細は不明だ…';

    const parts: string[] = [];
    try {
        const parsed = typeof req === 'string' ? JSON.parse(req) : req;
        if (parsed.min_reputation) parts.push(`相応の名声を持つ者`);
        if (parsed.max_reputation) parts.push(`世を忍ぶ者`);
        if (parsed.align_evil) parts.push(`後ろ暗い過去のある者`);
        if (parsed.min_align_order) parts.push(`秩序を重んじる者`);
        if (parsed.completed_quest) parts.push(`実績のある冒険者`);
        if (parsed.min_level) parts.push(`相応の腕前がある者`);
        if (parsed.nation_id) {
            const nationMap: Record<string, string> = {
                loc_holy_empire: 'ローランドの縁者',
                loc_marcund: 'マルカンドの通',
                loc_yatoshin: '夜刀に精通した者',
                loc_haryu: '華龍の習わしを知る者',
            };
            parts.push(nationMap[parsed.nation_id] || '縁のある者');
        }
    } catch {
        return 'この情報の詳細は不明だ…';
    }

    return parts.length > 0
        ? `${parts.join('・')}に向けた依頼らしい…`
        : '詳細は口外できないが、かなり危険な案件のようだ…';
}
