import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { checkAndFireTrigger, buildShareData } from '@/lib/shareUtils';
import { getFlavor } from '@/lib/shareTextLoader';
import type {
    CollectionEnemyEntry,
    CollectionItemEntry,
    CollectionSkillEntry,
    CollectionNpcEntry,
    ShareDataItem,
} from '@/types/collection';

/**
 * GET /api/collection
 * Returns master data for enemies, items, skills, and NPCs,
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
            npcsRes,
            bestiaryRes,
            itemHistoryRes,
            userSkillsRes,
            npcEncountersRes,
        ] = await Promise.all([
            supabaseService.from('enemies').select('id, slug, name, level, hp, atk, def, reward_exp, reward_gold, drop_item_id, drop_item_slug, death_immune'),
            supabaseService.from('items').select('id, slug, name, type, sub_type, base_price, effect_data'),
            supabaseService.from('skills').select('id, slug, name, card_id, base_price, deck_cost, image_url, cards(name, type, ap_cost, effect_val, description)'),
            supabaseService.from('npcs').select('slug, name, epithet, job_class, level, max_hp, attack, defense, cover_rate, hire_cost, introduction'),
            supabaseService.from('user_bestiary').select('enemy_id').eq('user_id', userId),
            supabaseService.from('user_item_history').select('item_id').eq('user_id', userId),
            supabaseService.from('user_skills').select('skill_id').eq('user_id', userId),
            supabaseService.from('user_npc_encounters').select('npc_slug').eq('user_id', userId),
        ]);

        if (enemiesRes.error) throw enemiesRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (skillsRes.error) throw skillsRes.error;
        // npcsRes / npcEncountersRes errors are non-critical (table may not exist yet)

        // Build unlock sets
        const unlockedEnemies = new Set((bestiaryRes.data || []).map((r: any) => r.enemy_id));
        const unlockedItems = new Set((itemHistoryRes.data || []).map((r: any) => r.item_id));
        const unlockedSkills = new Set((userSkillsRes.data || []).map((r: any) => r.skill_id));
        const unlockedNpcs = new Set((npcEncountersRes.data || []).map((r: any) => r.npc_slug));

        // Build response lists
        const itemSlugToName = new Map((itemsRes.data || []).map((i: any) => [i.slug, i.name]));

        const enemies: CollectionEnemyEntry[] = (enemiesRes.data || []).map((e: any) => ({
            id: e.id,
            slug: e.slug,
            unlocked: unlockedEnemies.has(e.id),
            name: unlockedEnemies.has(e.id) ? e.name : null,
            level: unlockedEnemies.has(e.id) ? e.level : null,
            hp: unlockedEnemies.has(e.id) ? e.hp : null,
            atk: unlockedEnemies.has(e.id) ? e.atk : null,
            def: unlockedEnemies.has(e.id) ? e.def : null,
            exp_reward: unlockedEnemies.has(e.id) ? e.reward_exp : null,
            gold_reward: unlockedEnemies.has(e.id) ? e.reward_gold : null,
            drop_item_name: unlockedEnemies.has(e.id) ? (itemSlugToName.get(e.drop_item_slug) || null) : null,
            death_immune: unlockedEnemies.has(e.id) ? e.death_immune : null,
        })).sort((a, b) => a.id - b.id);

        const items: CollectionItemEntry[] = (itemsRes.data || []).filter((i: any) => i.id != null).map((i: any) => ({
            id: i.id,
            slug: i.slug,
            unlocked: unlockedItems.has(i.id),
            name: unlockedItems.has(i.id) ? i.name : null,
            type: i.type,
            sub_type: i.sub_type,
            base_price: unlockedItems.has(i.id) ? i.base_price : null,
            effect_data: unlockedItems.has(i.id) ? i.effect_data : null,
        })).sort((a, b) => a.id - b.id);

        const skills: CollectionSkillEntry[] = (skillsRes.data || []).map((s: any) => {
            const card = s.cards; // Supabase join returns single object when FK is unique
            return {
                id: s.id,
                slug: s.slug,
                unlocked: unlockedSkills.has(s.id),
                name: unlockedSkills.has(s.id) ? s.name : null,
                base_price: unlockedSkills.has(s.id) ? s.base_price : null,
                deck_cost: unlockedSkills.has(s.id) ? s.deck_cost : null,
                image_url: unlockedSkills.has(s.id) ? s.image_url : null,
                card_type: unlockedSkills.has(s.id) && card ? card.type : null,
                card_ap_cost: unlockedSkills.has(s.id) && card ? card.ap_cost : null,
                card_effect_val: unlockedSkills.has(s.id) && card ? card.effect_val : null,
                card_description: unlockedSkills.has(s.id) && card ? card.description : null,
            };
        }).sort((a, b) => a.id - b.id);

        // NPC list (integer IDs derived from npcs.csv convention: 4001~)
        const npcs: CollectionNpcEntry[] = (npcsRes.data || []).map((n: any, idx: number) => ({
            id: idx + 1, // Display order only
            slug: n.slug,
            unlocked: unlockedNpcs.has(n.slug),
            name: unlockedNpcs.has(n.slug) ? n.name : null,
            epithet: unlockedNpcs.has(n.slug) ? n.epithet : null,
            job_class: unlockedNpcs.has(n.slug) ? n.job_class : null,
            level: unlockedNpcs.has(n.slug) ? n.level : null,
            max_hp: unlockedNpcs.has(n.slug) ? n.max_hp : null,
            attack: unlockedNpcs.has(n.slug) ? n.attack : null,
            defense: unlockedNpcs.has(n.slug) ? n.defense : null,
            cover_rate: unlockedNpcs.has(n.slug) ? n.cover_rate : null,
            hire_cost: unlockedNpcs.has(n.slug) ? n.hire_cost : null,
            introduction: unlockedNpcs.has(n.slug) ? n.introduction : null,
        })).sort((a: CollectionNpcEntry, b: CollectionNpcEntry) => a.slug.localeCompare(b.slug));

        // #9,10 コレクションマイルストーン判定
        const shareDataList: ShareDataItem[] = [];
        const categories = [
            { key: 'enemy', total: enemies.length, unlocked: enemies.filter(e => e.unlocked).length },
            { key: 'item', total: items.length, unlocked: items.filter(i => i.unlocked).length },
            { key: 'skill', total: skills.length, unlocked: skills.filter(s => s.unlocked).length },
            { key: 'npc', total: npcs.length, unlocked: npcs.filter(n => n.unlocked).length },
        ];

        // Fetch user profile name and location for Gossip BBS post
        let profile: { name: string | null; current_location_id: string | null } | null = null;
        try {
            const { data } = await supabaseService
                .from('user_profiles')
                .select('name, current_location_id')
                .eq('id', userId)
                .single();
            profile = data;
        } catch (profileErr) {
            console.error('[Collection API] Failed to fetch user profile:', profileErr);
        }

        for (const cat of categories) {
            if (cat.total === 0) continue;
            const categoryName = getFlavor('category', cat.key) || cat.key;

            // #9 図鑑完成 (1回)
            if (cat.unlocked >= cat.total) {
                const fired = await checkAndFireTrigger(supabaseService, userId, 'collection_complete', cat.key);
                if (fired) {
                    const sd = buildShareData('collection_complete', { category: categoryName });
                    if (sd) shareDataList.push(sd as ShareDataItem);

                    // Post system message to Gossip BBS
                    try {
                        const { GossipService } = await import('@/services/gossipService');
                        const gossipService = new GossipService(supabaseService);
                        const userName = profile?.name || '名もなき旅人';
                        await gossipService.postSystemMessage(
                            `「冒険者『${userName}』が全ての${categoryName}を記録し、${categoryName}図鑑を完成させた。この世界に、もはや未知はない。」`,
                            profile?.current_location_id || null,
                            userId
                        );
                    } catch (gossipErr) {
                        console.error('[Collection API Gossip] Failed to auto-post collection complete message:', gossipErr);
                    }
                }
            }
            // #10 図鑑半数 (キャラ1回)
            else if (cat.unlocked >= Math.ceil(cat.total / 2)) {
                const fired = await checkAndFireTrigger(supabaseService, userId, 'collection_half', cat.key);
                if (fired) {
                    const sd = buildShareData('collection_half', { category: categoryName });
                    if (sd) shareDataList.push(sd as ShareDataItem);
                }
            }
        }

        return NextResponse.json({
            enemies: {
                total: enemies.length,
                unlocked: enemies.filter(e => e.unlocked).length,
                list: enemies,
            },
            items: {
                total: items.length,
                unlocked: items.filter(i => i.unlocked).length,
                list: items,
            },
            skills: {
                total: skills.length,
                unlocked: skills.filter(s => s.unlocked).length,
                list: skills,
            },
            npcs: {
                total: npcs.length,
                unlocked: npcs.filter(n => n.unlocked).length,
                list: npcs,
            },
            share_data_list: shareDataList,
        });
    } catch (e: any) {
        console.error('[Collection API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
