import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { checkAndFireTrigger, buildShareData } from '@/lib/shareUtils';
import { getFlavor } from '@/lib/shareTextLoader';

/**
 * GET /api/collection
 * Returns master data for enemies, items, and skills,
 * along with the user's unlock status for each.
 */
export async function GET(req: Request) {
    try {
        // Auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length <= 7) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
        const userId = user.id;

        // Parallel fetch: master data + user unlock data
        const [
            enemiesRes,
            itemsRes,
            skillsRes,
            bestiaryRes,
            itemHistoryRes,
            userSkillsRes,
        ] = await Promise.all([
            supabaseService.from('enemies').select('id, slug, name, level, hp, atk, def, exp_reward, gold_reward, drop_item_id, drop_item_name'),
            supabaseService.from('items').select('id, slug, name, type, sub_type, base_price, effect_data'),
            supabaseService.from('skills').select('id, slug, name, card_id, base_price, deck_cost, image_url'),
            supabaseService.from('user_bestiary').select('enemy_id').eq('user_id', userId),
            supabaseService.from('user_item_history').select('item_id').eq('user_id', userId),
            supabaseService.from('user_skills').select('skill_id').eq('user_id', userId),
        ]);

        if (enemiesRes.error) throw enemiesRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (skillsRes.error) throw skillsRes.error;

        // Build unlock sets
        const unlockedEnemies = new Set((bestiaryRes.data || []).map((r: any) => r.enemy_id));
        const unlockedItems = new Set((itemHistoryRes.data || []).map((r: any) => r.item_id));
        const unlockedSkills = new Set((userSkillsRes.data || []).map((r: any) => r.skill_id));

        // Build response lists
        const enemies = (enemiesRes.data || []).map((e: any) => ({
            id: e.id,
            slug: e.slug,
            unlocked: unlockedEnemies.has(e.id),
            name: unlockedEnemies.has(e.id) ? e.name : null,
            level: unlockedEnemies.has(e.id) ? e.level : null,
            hp: unlockedEnemies.has(e.id) ? e.hp : null,
            atk: unlockedEnemies.has(e.id) ? e.atk : null,
            def: unlockedEnemies.has(e.id) ? e.def : null,
            exp_reward: unlockedEnemies.has(e.id) ? e.exp_reward : null,
            gold_reward: unlockedEnemies.has(e.id) ? e.gold_reward : null,
            drop_item_name: unlockedEnemies.has(e.id) ? e.drop_item_name : null,
        })).sort((a: any, b: any) => a.id - b.id);

        const items = (itemsRes.data || []).filter((i: any) => i.id != null).map((i: any) => ({
            id: i.id,
            slug: i.slug,
            unlocked: unlockedItems.has(i.id),
            name: unlockedItems.has(i.id) ? i.name : null,
            type: i.type,
            sub_type: i.sub_type,
            base_price: unlockedItems.has(i.id) ? i.base_price : null,
            effect_data: unlockedItems.has(i.id) ? i.effect_data : null,
        })).sort((a: any, b: any) => a.id - b.id);

        const skills = (skillsRes.data || []).map((s: any) => ({
            id: s.id,
            slug: s.slug,
            unlocked: unlockedSkills.has(s.id),
            name: unlockedSkills.has(s.id) ? s.name : null,
            base_price: unlockedSkills.has(s.id) ? s.base_price : null,
            deck_cost: unlockedSkills.has(s.id) ? s.deck_cost : null,
            image_url: unlockedSkills.has(s.id) ? s.image_url : null,
        })).sort((a: any, b: any) => a.id - b.id);

        // #9,10 コレクションマイルストーン判定
        const shareDataList: any[] = [];
        const categories = [
            { key: 'enemy', total: enemies.length, unlocked: enemies.filter((e: any) => e.unlocked).length },
            { key: 'item', total: items.length, unlocked: items.filter((i: any) => i.unlocked).length },
            { key: 'skill', total: skills.length, unlocked: skills.filter((s: any) => s.unlocked).length },
        ];

        for (const cat of categories) {
            if (cat.total === 0) continue;
            const categoryName = getFlavor('category', cat.key) || cat.key;

            // #9 図鑑完成 (1回)
            if (cat.unlocked >= cat.total) {
                const fired = await checkAndFireTrigger(supabaseService, userId, 'collection_complete', cat.key);
                if (fired) {
                    const sd = buildShareData('collection_complete', { category: categoryName });
                    if (sd) shareDataList.push(sd);
                }
            }
            // #10 図鑑半数 (キャラ1回)
            else if (cat.unlocked >= Math.ceil(cat.total / 2)) {
                const fired = await checkAndFireTrigger(supabaseService, userId, 'collection_half', cat.key);
                if (fired) {
                    const sd = buildShareData('collection_half', { category: categoryName });
                    if (sd) shareDataList.push(sd);
                }
            }
        }

        return NextResponse.json({
            enemies: {
                total: enemies.length,
                unlocked: enemies.filter((e: any) => e.unlocked).length,
                list: enemies,
            },
            items: {
                total: items.length,
                unlocked: items.filter((i: any) => i.unlocked).length,
                list: items,
            },
            skills: {
                total: skills.length,
                unlocked: skills.filter((s: any) => s.unlocked).length,
                list: skills,
            },
            share_data_list: shareDataList,
        });
    } catch (e: any) {
        console.error('[Collection API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
