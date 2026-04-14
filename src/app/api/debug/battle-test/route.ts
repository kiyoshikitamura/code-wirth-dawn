import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/battle-test
 * バトルテスト用エネミーデータを取得する。
 * 優先順位:
 *   1. slug指定 → enemy_groups からグループ取得
 *   2. enemy_groups からランダム選択
 *   3. enemies テーブルから直接ランダム取得（フォールバック）
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        // === 方法1: enemy_groups ベースの取得 ===
        if (slug) {
            const result = await getEnemiesFromGroup(slug);
            if (result) return NextResponse.json(result);
        } else {
            // enemy_groups からランダムに1つ選ぶ
            const { data: groups, error: groupsError } = await supabase
                .from('enemy_groups')
                .select('slug')
                .limit(50);

            console.log('[バトルテスト] enemy_groups取得:', { count: groups?.length, error: groupsError?.message });

            if (groups && groups.length > 0) {
                const randomIndex = Math.floor(Math.random() * groups.length);
                const result = await getEnemiesFromGroup(groups[randomIndex].slug);
                if (result) return NextResponse.json(result);
            }
        }

        // === 方法2: enemies テーブルから直接取得（フォールバック） ===
        console.log('[バトルテスト] enemy_groupsからの取得失敗。enemiesテーブルから直接取得');

        const { data: allEnemies, error: enemiesError } = await supabase
            .from('enemies')
            .select('*')
            .limit(50);

        console.log('[バトルテスト] enemies取得:', { count: allEnemies?.length, error: enemiesError?.message });

        if (!allEnemies || allEnemies.length === 0) {
            return NextResponse.json({
                error: 'エネミーデータが見つかりません。enemies テーブルが空です。',
                debug: { enemiesError: enemiesError?.message }
            }, { status: 404 });
        }

        // 5体選出（最大）
        const enemyCount = Math.min(allEnemies.length, 5);
        const shuffled = allEnemies.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, enemyCount);

        const enemies = selected.map((e, index) => ({
            id: `${e.slug || e.id}_${index}_${Date.now()}`,
            name: e.name,
            hp: e.hp,
            maxHp: e.hp,
            def: e.def || 0,
            level: Math.floor(e.hp / 10) || 1,
            image_url: e.image_url || `/images/enemies/${e.slug || 'default'}.png`,
            status_effects: [],
            vit_damage: e.vit_damage,
            traits: e.traits,
            drop_rate: e.drop_rate,
            drop_item_slug: e.drop_item_slug,
            action_pattern: e.action_pattern,
            spawn_type: e.spawn_type
        }));

        // ランダム背景の取得
        let bgImageUrl = '/images/quests/bg_tavern_night_1775635917235.png'; // fallback
        try {
            const fs = require('fs');
            const path = require('path');
            const bgDir = path.join(process.cwd(), 'public', 'images', 'quests');
            if (fs.existsSync(bgDir)) {
                const files = fs.readdirSync(bgDir).filter((f: string) => f.endsWith('.png') || f.endsWith('.jpg'));
                if (files.length > 0) {
                    const randomFile = files[Math.floor(Math.random() * files.length)];
                    bgImageUrl = `/images/quests/${randomFile}`;
                }
            }
        } catch (err) {
            console.error('背景取得エラー:', err);
        }

        return NextResponse.json({
            success: true,
            group_slug: 'random_selection',
            group_name: `ランダム選出 (${enemyCount}体)`,
            enemies,
            bg_image_url: bgImageUrl
        });

    } catch (e: any) {
        console.error('[デバッグ] バトルテストエラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/** enemy_groups → enemies の取得ヘルパー */
async function getEnemiesFromGroup(groupSlug: string) {
    const { data: groupData } = await supabase
        .from('enemy_groups')
        .select('*')
        .eq('slug', groupSlug)
        .maybeSingle();

    let targetSlugs = [groupSlug];
    if (groupData?.members && groupData.members.length > 0) {
        targetSlugs = groupData.members;
    }

    const { data: enemiesData } = await supabase
        .from('enemies')
        .select('*')
        .in('slug', targetSlugs);

    if (!enemiesData || enemiesData.length === 0) return null;

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
            image_url: e.image_url || `/images/enemies/${e.slug}.png`,
            status_effects: [],
            vit_damage: e.vit_damage,
            traits: e.traits,
            drop_rate: e.drop_rate,
            drop_item_slug: e.drop_item_slug,
            action_pattern: e.action_pattern,
            spawn_type: e.spawn_type
        };
    }).filter(Boolean);

    if (enemies.length === 0) return null;

    return {
        success: true,
        group_slug: groupSlug,
        group_name: groupData?.name || groupSlug,
        enemies
    };
}
