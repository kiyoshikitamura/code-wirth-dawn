import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';

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
                .select('id, message, old_value, new_value, event_type, created_at, location:locations(name)')
                .order('created_at', { ascending: false })
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
            // v2.9.3f: ShadowService統一 — tavern/list APIと同じデータを返すことで表示不一致を解消
            const { ShadowService } = await import('@/services/shadowService');
            const shadowService = new ShadowService(supabase);
            const shadows = locationId
                ? await shadowService.findShadowsAtLocation(locationId, userId)
                : [];

            // ShadowSummary → TavernShadow 形式に変換
            const JOB_CLASS_JP_GOSSIP: Record<string, string> = {
                Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Mage: '魔法使い',
                Ranger: '狩人', Thief: '盗賊', Cleric: '僧侶', Bard: '吟遊詩人',
                Adventurer: '冒険者', Samurai: '侍', Ninja: '忍者', Mercenary: '傭兵',
            };
            const shuffledShadows = shadows.map(s => ({
                id: s.profile_id,
                profile_id: s.profile_id,
                name: s.name,
                epithet: s.epithet || '',
                job_class: JOB_CLASS_JP_GOSSIP[s.job_class] || s.job_class || '傭兵',
                durability: s.stats?.hp || 100,
                max_durability: s.stats?.hp || 100,
                cover_rate: 0,
                avatar_url: s.npc_image_url || s.icon_url || s.image_url || undefined,
                origin_type: s.origin_type,
                level: s.level,
                flavor_text: s.flavor_text || undefined,
                // v2.9.3f: TavernModal用に完全データを保持
                stats: s.stats || { atk: 0, def: 0, hp: 100 },
                signature_deck_preview: s.signature_deck_preview || [],
                contract_fee: s.contract_fee || 0,
                subscription_tier: s.subscription_tier || 'free',
                icon_url: s.icon_url,
                npc_image_url: s.npc_image_url,
            }));

            // 同じ拠点にいる他プレイヤー数 - is_alive & 24h以内に限定
            let resonanceCount = 0;
            if (locationId) {
                const { count } = await supabase
                    .from('user_profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('current_location_id', locationId)
                    .neq('id', userId)
                    .eq('is_alive', true)
                    .not('name', 'is', null)
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
