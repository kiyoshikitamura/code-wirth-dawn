import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/battle-test
 * ランダムエンカウント用のエネミーグループを取得してバトルテスト用データを返す。
 * クエリパラメータ:
 *   - slug: (optional) 特定のenemy_groupスラッグを指定
 *   - locationId: (optional) 拠点IDからlocation_encountersを使って抽選
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        let groupSlug = slug;

        if (!groupSlug) {
            // enemy_groups からランダムに1つ選ぶ
            const { data: groups } = await supabase
                .from('enemy_groups')
                .select('slug')
                .limit(50);

            if (groups && groups.length > 0) {
                const randomIndex = Math.floor(Math.random() * groups.length);
                groupSlug = groups[randomIndex].slug;
            } else {
                groupSlug = 'bandit_group';
            }
        }

        // グループデータ取得
        const { data: groupData } = await supabase
            .from('enemy_groups')
            .select('*')
            .eq('slug', groupSlug)
            .maybeSingle();

        let targetSlugs = [groupSlug];
        if (groupData?.members && groupData.members.length > 0) {
            targetSlugs = groupData.members;
        }

        // エネミーデータ取得
        const { data: enemiesData } = await supabase
            .from('enemies')
            .select('*')
            .in('slug', targetSlugs);

        if (!enemiesData || enemiesData.length === 0) {
            return NextResponse.json({ error: 'エネミーデータが見つかりません', slug: groupSlug }, { status: 404 });
        }

        // バトル用フォーマットに変換
        const enemyMap = new Map(enemiesData.map(e => [e.slug, e]));
        const enemies = targetSlugs.map((s, index) => {
            const e = enemyMap.get(s);
            if (!e) return null;
            return {
                id: `${e.slug}_${index}_${Date.now()}`,
                name: e.name,
                hp: e.hp,
                maxHp: e.hp,
                def: e.def || 0,
                level: Math.floor(e.hp / 10) || 1,
                image: e.image_url || `/enemies/${e.slug}.png`,
                status_effects: [],
                vit_damage: e.vit_damage,
                traits: e.traits,
                drop_rate: e.drop_rate,
                drop_item_slug: e.drop_item_slug
            };
        }).filter(Boolean);

        return NextResponse.json({
            success: true,
            group_slug: groupSlug,
            group_name: groupData?.name || groupSlug,
            enemies
        });

    } catch (e: any) {
        console.error('[デバッグ] バトルテストエラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
