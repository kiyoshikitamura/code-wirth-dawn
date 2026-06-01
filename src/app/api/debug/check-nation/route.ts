import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

/**
 * GET /api/debug/check-nation?location_id=xxx
 * デバッグ用: 拠点の支配国情報を確認する
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const locationId = searchParams.get('location_id');

        if (!locationId) {
            return NextResponse.json({ error: 'Missing location_id' }, { status: 400 });
        }

        // 1. locations テーブルから取得
        const { data: loc, error: locError } = await supabaseServer
            .from('locations')
            .select('id, name, slug, ruling_nation_id, nation_id, prosperity_level')
            .eq('id', locationId)
            .single();

        // 2. world_states を location_name で検索
        let worldState = null;
        let worldStateError = null;
        if (loc?.name) {
            const { data: ws, error: wsErr } = await supabaseServer
                .from('world_states')
                .select('id, location_name, controlling_nation, status, prosperity_level')
                .eq('location_name', loc.name)
                .maybeSingle();
            worldState = ws;
            worldStateError = wsErr;
        }

        // 3. world_states の全レコードの location_name 一覧
        const { data: allWorldStates } = await supabaseServer
            .from('world_states')
            .select('location_name, controlling_nation');

        // 4. ネストJOINのテスト
        const { data: joinTest, error: joinError } = await supabaseServer
            .from('locations')
            .select('name, ruling_nation_id, world_states(controlling_nation)')
            .eq('id', locationId)
            .maybeSingle();

        // 5. NPC slug フィルタのシミュレーション
        const dynamicNation = worldState?.controlling_nation || null;
        const resolvedNation = (dynamicNation || loc?.ruling_nation_id || 'unknown').toLowerCase();

        const { data: npcs } = await supabaseServer
            .from('npcs')
            .select('id, slug, name')
            .eq('is_hireable', true);

        const matchedNpcs = npcs?.filter(n => n.slug?.toLowerCase().includes(resolvedNation)) || [];
        const freeNpcs = npcs?.filter(n => n.slug?.toLowerCase().includes('free')) || [];

        // 6. ショップアイテムフィルタの診断
        const nationTag = `loc_${resolvedNation}`;
        const matchesNation = (tags: string[] | null) => {
            if (!tags || tags.length === 0) return true;
            if (tags.includes('any')) return true;
            if (resolvedNation === 'neutral') return tags.includes('loc_all');
            return tags.includes('loc_all') || tags.includes(nationTag);
        };

        const { data: allItems } = await supabaseServer
            .from('items')
            .select('id, slug, name, type, base_price, nation_tags, min_prosperity, is_black_market')
            .neq('type', 'skill').neq('type', 'key_item').neq('type', 'material');

        const { data: allSkills } = await supabaseServer
            .from('skills')
            .select('id, slug, name, base_price, nation_tags, min_prosperity, is_black_market');

        const shopItems = (allItems || []).filter(item => {
            if ((item.base_price || 0) <= 0 && item.type === 'equipment') return false;
            const tags = Array.isArray(item.nation_tags) ? item.nation_tags : [];
            return matchesNation(tags);
        });

        const shopSkills = (allSkills || []).filter(skill => {
            if ((skill.base_price || 0) <= 0) return false;
            const tags = Array.isArray(skill.nation_tags) ? skill.nation_tags : [];
            return matchesNation(tags);
        });

        // nation_tagsでフィルタされたアイテムも表示
        const rejectedItems = (allItems || []).filter(item => {
            const tags = Array.isArray(item.nation_tags) ? item.nation_tags : [];
            return tags.length > 0 && !matchesNation(tags);
        });

        return NextResponse.json({
            location: loc,
            location_error: locError?.message || null,
            world_state: worldState,
            world_state_error: worldStateError?.message || null,
            join_test: joinTest,
            join_error: joinError?.message || null,
            all_world_state_names: allWorldStates?.map(ws => ({ name: ws.location_name, nation: ws.controlling_nation })),
            resolved: {
                dynamic_nation: dynamicNation,
                ruling_nation_id: loc?.ruling_nation_id,
                final_nation: resolvedNation,
                nation_tag: nationTag,
                matched_npc_count: matchedNpcs.length,
                matched_npcs: matchedNpcs.map(n => `${n.slug} (${n.name})`),
                free_npc_count: freeNpcs.length,
            },
            shop_diagnostics: {
                total_items_in_db: allItems?.length || 0,
                items_passing_nation_filter: shopItems.length,
                items_list: shopItems.map(i => `${i.slug} (${i.name}) [${Array.isArray(i.nation_tags) ? i.nation_tags.join(',') : 'none'}] ¥${i.base_price}`),
                items_rejected_by_nation: rejectedItems.map(i => `${i.slug} (${i.name}) [${Array.isArray(i.nation_tags) ? i.nation_tags.join(',') : ''}]`),
                total_skills_in_db: allSkills?.length || 0,
                skills_passing_nation_filter: shopSkills.length,
                skills_list: shopSkills.map(s => `${s.slug} (${s.name}) [${Array.isArray(s.nation_tags) ? s.nation_tags.join(',') : 'none'}] ¥${s.base_price}`),
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
