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
                matched_npc_count: matchedNpcs.length,
                matched_npcs: matchedNpcs.map(n => `${n.slug} (${n.name})`),
                free_npc_count: freeNpcs.length,
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
