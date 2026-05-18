import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-normal-quests
 *
 * 汎用クエスト7001〜7008のマスタデータをDBに反映するシードエンドポイント。
 * 対象テーブル:
 *   1. enemies: 新規エネミー3種（enemy_mob, enemy_giant_rat, enemy_giant_rat_alpha）
 *   2. items: 新規アイテム3種（item_bear_pelt, item_supply_box, item_healing_herb）
 *   3. scenarios: 7001-7008のメタデータ（time_cost, rewards等）
 *   4. enemy_groups: 7001-7008用のグループ定義
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップして変更内容のみ返却
 *
 * 変更履歴:
 *   - 2026-04-26: 初版作成（7001-7008 汎用クエスト改修）
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const dryRun = url.searchParams.get('dry_run') === 'true';

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceKey) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    // ─────────────────────────────────────────────
    // 0. NPCs テーブル: ゲストNPC登録
    // ─────────────────────────────────────────────
    const guestNpcs = [
        {
            id: '00000000-0000-4000-a000-000000004051',
            slug: 'npc_gen_merchant',
            name: '旅の商人（マルコ）',
            gender: 'Male',
            job_class: 'Merchant',
            level: 1,
            max_hp: 30,
            attack: 1,
            defense: 1,
            speed: 5,
            mp: 0,
            max_mp: 0,
            origin: 'system_guest',
            epithet: '行商人',
            introduction: '「あんたが護衛かい？ ありがてえ！ マルコだ。見ての通り、腕っぷしはからきしでね」',
            is_hireable: false,
            hire_cost: 0,
            default_cards: [],
            inject_cards: [],
        },
        {
            id: '00000000-0000-4000-a000-000000004105',
            slug: 'npc_pilgrim_albert',
            name: '巡礼者アルバート',
            gender: 'Male',
            job_class: 'Priest',
            level: 3,
            max_hp: 50,
            attack: 5,
            defense: 8,
            speed: 3,
            mp: 0,
            max_mp: 0,
            origin: 'system_guest',
            epithet: '狂信の巡礼者',
            introduction: '「主神の声が聞こえるのです。あの危険な谷の奥底へ行かねばなりません」',
            is_hireable: false,
            hire_cost: 0,
            default_cards: [],
            inject_cards: [],
        },
    ];

    for (const npc of guestNpcs) {
        if (dryRun) {
            results.push({ target: 'npcs', id: npc.id, slug: npc.slug, status: 'dry_run', payload: npc });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('npcs')
            .upsert(npc, { onConflict: 'id' });

        results.push({
            target: 'npcs',
            id: npc.id,
            slug: npc.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 0.5 party_members テーブル: ゲストNPCを登録
    //   guest_join は party_members テーブルを slug で参照するため、
    //   npcs と party_members の両方にレコードが必要。
    // ─────────────────────────────────────────────
    const guestPartyMembers = guestNpcs.map((npc, index) => ({
        id: 900000 + index,
        slug: npc.slug,
        name: npc.name,
        job_class: npc.job_class,
        durability: npc.max_hp,
        max_durability: npc.max_hp,
        owner_id: null,
        loyalty: 100,
        cover_rate: 0,
        is_active: true,
        inject_cards: [],
    }));

    for (const pm of guestPartyMembers) {
        if (dryRun) {
            results.push({ target: 'party_members', id: pm.id, slug: pm.slug, status: 'dry_run', payload: pm });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('party_members')
            .upsert(pm, { onConflict: 'id' });

        results.push({
            target: 'party_members',
            id: pm.id,
            slug: pm.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 1. 新規エネミーの upsert（enemies テーブル）
    // ─────────────────────────────────────────────
    const newEnemies = [
        { id: 1131, slug: 'enemy_mob', name: '飢えた市民', level: 2, hp: 15, atk: 5, def: 1, exp: 2, gold: 5, drop_item_id: null, spawn_type: 'quest_only' },
        { id: 1132, slug: 'enemy_giant_rat', name: '巨大ネズミ', level: 2, hp: 20, atk: 8, def: 1, exp: 3, gold: 10, drop_item_id: null, spawn_type: 'random' },
        { id: 1133, slug: 'enemy_giant_rat_alpha', name: 'ネズミの女王', level: 5, hp: 180, atk: 14, def: 3, exp: 15, gold: 30, drop_item_id: null, spawn_type: 'quest_only' },
    ];

    for (const enemy of newEnemies) {
        if (dryRun) {
            results.push({ target: 'enemies', id: enemy.id, slug: enemy.slug, status: 'dry_run', payload: enemy });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemies')
            .upsert(enemy, { onConflict: 'id' });

        results.push({
            target: 'enemies',
            id: enemy.id,
            slug: enemy.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 2. エネミーアクション upsert（enemy_actions テーブル存在時）
    // ─────────────────────────────────────────────
    const newActions = [
        { id: 1501, enemy_slug: 'enemy_mob', skill_slug: 'skill_tackle', prob: 100, condition_type: null, condition_value: null },
        { id: 1502, enemy_slug: 'enemy_giant_rat', skill_slug: 'skill_tackle', prob: 60, condition_type: null, condition_value: null },
        { id: 1503, enemy_slug: 'enemy_giant_rat', skill_slug: 'skill_poison_sting', prob: 40, condition_type: null, condition_value: null },
        { id: 1504, enemy_slug: 'enemy_giant_rat_alpha', skill_slug: 'skill_poison_sting', prob: 60, condition_type: null, condition_value: null },
        { id: 1505, enemy_slug: 'enemy_giant_rat_alpha', skill_slug: 'skill_multi_attack', prob: 40, condition_type: null, condition_value: null },
    ];

    for (const action of newActions) {
        if (dryRun) {
            results.push({ target: 'enemy_actions', id: action.id, status: 'dry_run', payload: action });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_actions')
            .upsert(action, { onConflict: 'id' });

        if (error) {
            // enemy_actions テーブルが存在しない場合はスキップ
            results.push({ target: 'enemy_actions', id: action.id, status: 'skipped_or_error', error: error.message });
        } else {
            results.push({ target: 'enemy_actions', id: action.id, status: 'upserted' });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 3. 新規アイテムの upsert（items テーブル）
    // ─────────────────────────────────────────────
    const newItems = [
        {
            id: 700, slug: 'item_bear_pelt', name: '獣の毛皮', type: 'trade_good',
            base_price: 200, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { category: 'trade_good', description: '凶暴な大熊から剥いだ分厚い毛皮。防寒具や鎧の裏地として重宝される。' },
        },
        {
            id: 701, slug: 'item_supply_box', name: '物資ボックス', type: 'trade_good',
            base_price: 1000, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { category: 'trade_good', description: '廃墟の金庫から回収した物資の包み。中身はギルド管理下にある。' },
        },
        {
            id: 702, slug: 'item_healing_herb', name: '癒やし草', type: 'consumable',
            base_price: 30, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { category: 'material', description: '白い小花をつける薬草。煎じれば傷の化膿を防ぎ痛みを和らげる。' },
        },
    ];

    for (const item of newItems) {
        if (dryRun) {
            results.push({ target: 'items', id: item.id, slug: item.slug, status: 'dry_run', payload: item });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('items')
            .upsert(item, { onConflict: 'id' });

        results.push({
            target: 'items',
            id: item.id,
            slug: item.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 4. enemy_groups テーブル: 戦闘グループ定義
    // ─────────────────────────────────────────────
    const enemyGroups = [
        { id: 400, slug: 'grp_bandit_trio', name: '追い剥ぎ一味', members: ['enemy_bandit_thug', 'enemy_bandit_archer', 'enemy_bandit_guard'], formation: 'front_row' },
        { id: 401, slug: 'grp_bandit_pair', name: '夜盗 x2', members: ['enemy_bandit_thug', 'enemy_bandit_thug'], formation: 'front_row' },
        { id: 402, slug: 'grp_goblin_pair', name: 'ゴブリン x2', members: ['enemy_goblin', 'enemy_goblin'], formation: 'front_row' },
        { id: 403, slug: 'grp_goblin_leader', name: 'ホブゴブリンの群れ', members: ['enemy_hobgoblin', 'enemy_goblin', 'enemy_goblin'], formation: 'front_row' },
        { id: 404, slug: 'grp_mob_riot', name: '飢えた市民 x5', members: ['enemy_mob', 'enemy_mob', 'enemy_mob', 'enemy_mob', 'enemy_mob'], formation: 'front_row' },
        { id: 405, slug: 'grp_bear_solo', name: 'ジャイアントベア', members: ['enemy_giant_bear'], formation: 'front_row' },
        { id: 406, slug: 'grp_bounty_squad', name: '追手部隊', members: ['enemy_bandit_archer', 'enemy_bandit_archer', 'enemy_bandit_guard', 'enemy_bandit_guard'], formation: 'front_row' },
        { id: 407, slug: 'grp_rat_swarm', name: '巨大ネズミ x3', members: ['enemy_giant_rat', 'enemy_giant_rat', 'enemy_giant_rat'], formation: 'front_row' },
        { id: 408, slug: 'grp_rat_nest', name: 'ネズミの女王と取り巻き', members: ['enemy_giant_rat_alpha', 'enemy_giant_rat', 'enemy_giant_rat'], formation: 'front_row' },
    ];

    for (const group of enemyGroups) {
        if (dryRun) {
            results.push({ target: 'enemy_groups', id: group.id, slug: group.slug, status: 'dry_run', payload: group });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_groups')
            .upsert(group, { onConflict: 'id' });

        results.push({
            target: 'enemy_groups',
            id: group.id,
            slug: group.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 5. scenarios テーブル: 7001-7008 のメタデータ更新
    // ─────────────────────────────────────────────

    interface NormalQuestSeed {
        id: number;
        slug: string;
        rec_level: number;
        difficulty: number;
        time_cost: number;
        days_success: number;
        days_failure: number;
        rewards: {
            gold: number;
            exp: number;
            reputation?: number;
            items?: number[];
            alignment_shift?: {
                order?: number;
                chaos?: number;
                justice?: number;
                evil?: number;
            };
        };
        requirements?: Record<string, any>;
    }

    const normalQuests: NormalQuestSeed[] = [
        {
            id: 7001, slug: 'qst_gen_deliver', rec_level: 2, difficulty: 2,
            time_cost: 8, days_success: 8, days_failure: 8,
            rewards: { gold: 250, exp: 30, reputation: 2 },
        },
        {
            id: 7002, slug: 'qst_gen_escort', rec_level: 2, difficulty: 2,
            time_cost: 8, days_success: 8, days_failure: 8,
            rewards: { gold: 350, exp: 40, reputation: 3 },
        },
        {
            id: 7003, slug: 'qst_gen_scavenge', rec_level: 2, difficulty: 2,
            time_cost: 3, days_success: 3, days_failure: 3,
            rewards: { gold: 250, exp: 35, reputation: 2 },
            // Note: 闇ルート (Gold:500, Rep:-5, Evil:10, Chaos:10) はシナリオエンジン側で処理
        },
        {
            id: 7004, slug: 'qst_gen_riot', rec_level: 2, difficulty: 2,
            time_cost: 1, days_success: 1, days_failure: 1,
            rewards: { gold: 200, exp: 25, reputation: 5, alignment_shift: { order: 5, justice: 5 } },
        },
        {
            id: 7005, slug: 'qst_gen_bear', rec_level: 2, difficulty: 2,
            time_cost: 4, days_success: 4, days_failure: 4,
            rewards: { gold: 200, exp: 35, reputation: 5, items: [700] }, // item_bear_pelt
        },
        {
            id: 7006, slug: 'qst_gen_smuggle', rec_level: 2, difficulty: 2,
            time_cost: 8, days_success: 8, days_failure: 8,
            rewards: { gold: 800, exp: 40, reputation: -5, alignment_shift: { evil: 5, chaos: 5 } },
            requirements: { max_reputation: -50 },
        },
        {
            id: 7007, slug: 'qst_gen_rat', rec_level: 2, difficulty: 2,
            time_cost: 2, days_success: 2, days_failure: 2,
            rewards: { gold: 400, exp: 30, reputation: 2 },
        },
        {
            id: 7008, slug: 'qst_gen_mercy', rec_level: 2, difficulty: 2,
            time_cost: 4, days_success: 4, days_failure: 4,
            rewards: { gold: 10, exp: 20, reputation: 10, alignment_shift: { justice: 10, order: 10 } },
        },
    ];

    for (const quest of normalQuests) {
        const updatePayload: Record<string, any> = {
            rec_level: quest.rec_level,
            difficulty: quest.difficulty,
            time_cost: quest.time_cost,
            days_success: quest.days_success,
            days_failure: quest.days_failure,
            rewards: quest.rewards,
        };
        if (quest.requirements) {
            updatePayload.requirements = quest.requirements;
        }

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'dry_run',
                payload: updatePayload,
            });
            successCount++;
            continue;
        }

        // まず update を試行（既存レコードがある場合）
        const { data, error } = await supabase
            .from('scenarios')
            .update(updatePayload)
            .eq('id', quest.id)
            .select('id');

        if (error) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'error',
                error: error.message,
            });
            errorCount++;
        } else if (!data || data.length === 0) {
            // レコードが存在しない場合は insert
            const insertPayload = {
                id: quest.id,
                slug: quest.slug,
                type: 'normal',
                title: getQuestTitle(quest.slug),
                ...updatePayload,
            };
            const { error: insertError } = await supabase
                .from('scenarios')
                .insert(insertPayload);

            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: insertError ? 'insert_error' : 'inserted',
                error: insertError?.message,
            });
            if (insertError) errorCount++;
            else successCount++;
        } else {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'updated',
            });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 6. ローランド地方クエスト 7010-7015 のメタデータ更新
    // ─────────────────────────────────────────────
    const rolandQuests: NormalQuestSeed[] = [
        {
            id: 7010, slug: 'qst_rol_heretic', rec_level: 4, difficulty: 3,
            time_cost: 2, days_success: 2, days_failure: 1,
            rewards: { gold: 600, exp: 100, reputation: 5, alignment_shift: { order: 20 } },
            requirements: { min_reputation: 80 },
        },
        {
            id: 7011, slug: 'qst_rol_holywater', rec_level: 4, difficulty: 2,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 400, exp: 120, reputation: 5, alignment_shift: { order: 10 } },
        },
        {
            id: 7012, slug: 'qst_rol_pilgrim', rec_level: 4, difficulty: 3,
            time_cost: 10, days_success: 10, days_failure: 5,
            rewards: { gold: 700, exp: 150, reputation: -10, alignment_shift: { chaos: 10 } },
        },
        {
            id: 7013, slug: 'qst_rol_undead', rec_level: 4, difficulty: 4,
            time_cost: 4, days_success: 4, days_failure: 2,
            rewards: { gold: 450, exp: 100, reputation: 15, alignment_shift: { order: 10 } },
        },
        {
            id: 7014, slug: 'qst_rol_tithe', rec_level: 4, difficulty: 2,
            time_cost: 1, days_success: 1, days_failure: 1,
            rewards: { gold: 200, exp: 0, reputation: -10, alignment_shift: { evil: 10 } },
            requirements: { max_reputation: -50 },
        },
        {
            id: 7015, slug: 'qst_rol_relic', rec_level: 4, difficulty: 4,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 500, exp: 200, reputation: 10, alignment_shift: { order: 10 } },
        },
    ];

    for (const quest of rolandQuests) {
        const updatePayload: Record<string, any> = {
            rec_level: quest.rec_level,
            difficulty: quest.difficulty,
            time_cost: quest.time_cost,
            days_success: quest.days_success,
            days_failure: quest.days_failure,
            rewards: quest.rewards,
        };
        if (quest.requirements) {
            updatePayload.requirements = quest.requirements;
        }

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'dry_run',
                payload: updatePayload,
            });
            successCount++;
            continue;
        }

        const { data, error } = await supabase
            .from('scenarios')
            .update(updatePayload)
            .eq('id', quest.id)
            .select('id');

        if (error) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'error',
                error: error.message,
            });
            errorCount++;
        } else if (!data || data.length === 0) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'not_found_skipped',
            });
        } else {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'updated',
            });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 7. ローランド地方 enemy_groups (410-418)
    // ─────────────────────────────────────────────
    const rolandEnemyGroups = [
        { id: 410, slug: 'grp_heretic_cultists', name: '異端の信徒たち', members: ['enemy_cultist', 'enemy_cultist', 'enemy_cultist', 'enemy_cult_priest', 'enemy_cult_priest'], formation: 'front_row' },
        { id: 411, slug: 'grp_holywater_undead_1', name: '汚染されたアンデッド', members: ['enemy_skeleton', 'enemy_skeleton', 'enemy_zombie', 'enemy_zombie'], formation: 'front_row' },
        { id: 412, slug: 'grp_holywater_undead_2', name: '上級アンデッド', members: ['enemy_skeleton', 'enemy_zombie', 'enemy_wraith'], formation: 'front_row' },
        { id: 413, slug: 'grp_holywater_lich', name: '地下礼拝堂の番人', members: ['enemy_lich'], formation: 'front_row' },
        { id: 414, slug: 'grp_pilgrim_bandit_1', name: '山賊の先遣隊', members: ['enemy_bandit_thug', 'enemy_bandit_thug', 'enemy_bandit_archer', 'enemy_bandit_archer'], formation: 'front_row' },
        { id: 415, slug: 'grp_pilgrim_bandit_2', name: '山賊の精鋭', members: ['enemy_bandit_archer', 'enemy_bandit_archer', 'enemy_bandit_guard', 'enemy_bandit_guard'], formation: 'front_row' },
        { id: 416, slug: 'grp_undead_patrol', name: '辻に彷徨う亡者', members: ['enemy_skeleton', 'enemy_skeleton', 'enemy_skeleton', 'enemy_skeleton'], formation: 'front_row' },
        { id: 417, slug: 'grp_undead_swarm', name: '墓地の腐敗者', members: ['enemy_zombie', 'enemy_zombie', 'enemy_zombie'], formation: 'front_row' },
        { id: 418, slug: 'grp_undead_boss', name: '復讐の亡霊', members: ['enemy_skeleton', 'enemy_zombie', 'enemy_wraith'], formation: 'front_row' },
    ];

    for (const group of rolandEnemyGroups) {
        if (dryRun) {
            results.push({ target: 'enemy_groups', id: group.id, slug: group.slug, status: 'dry_run', payload: group });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_groups')
            .upsert(group, { onConflict: 'id' });

        results.push({
            target: 'enemy_groups',
            id: group.id,
            slug: group.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 8. マルカンド地方クエスト 7020-7025 のメタデータ更新
    // ─────────────────────────────────────────────
    const marcundQuests: NormalQuestSeed[] = [
        {
            id: 7020, slug: 'qst_mar_caravan', rec_level: 5, difficulty: 3,
            time_cost: 8, days_success: 8, days_failure: 4,
            rewards: { gold: 500, exp: 150, reputation: 5, alignment_shift: { chaos: 10 } },
        },
        {
            id: 7021, slug: 'qst_mar_scorpion', rec_level: 5, difficulty: 2,
            time_cost: 2, days_success: 2, days_failure: 1,
            rewards: { gold: 300, exp: 100, alignment_shift: { evil: 5, chaos: 5 } },
        },
        {
            id: 7022, slug: 'qst_mar_debt', rec_level: 5, difficulty: 3,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 450, exp: 100, reputation: -5, alignment_shift: { evil: 10, chaos: 5 } },
            requirements: { max_reputation: -50 },
        },
        {
            id: 7023, slug: 'qst_mar_sandworm', rec_level: 5, difficulty: 4,
            time_cost: 4, days_success: 4, days_failure: 2,
            rewards: { gold: 600, exp: 200, reputation: 10, alignment_shift: { chaos: 10 } },
        },
        {
            id: 7024, slug: 'qst_mar_auction', rec_level: 5, difficulty: 3,
            time_cost: 1, days_success: 1, days_failure: 1,
            rewards: { gold: 500, exp: 120, reputation: -5, alignment_shift: { chaos: 10, evil: 5 } },
            requirements: { max_reputation: -50 },
        },
        {
            id: 7025, slug: 'qst_mar_bribe', rec_level: 5, difficulty: 2,
            time_cost: 6, days_success: 6, days_failure: 3,
            rewards: { gold: 350, exp: 100, reputation: -5, alignment_shift: { chaos: 10 } },
        },
    ];

    for (const quest of marcundQuests) {
        const updatePayload: Record<string, any> = {
            rec_level: quest.rec_level,
            difficulty: quest.difficulty,
            time_cost: quest.time_cost,
            days_success: quest.days_success,
            days_failure: quest.days_failure,
            rewards: quest.rewards,
        };
        if (quest.requirements) {
            updatePayload.requirements = quest.requirements;
        }

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'dry_run',
                payload: updatePayload,
            });
            successCount++;
            continue;
        }

        const { data, error } = await supabase
            .from('scenarios')
            .update(updatePayload)
            .eq('id', quest.id)
            .select('id');

        if (error) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'error',
                error: error.message,
            });
            errorCount++;
        } else if (!data || data.length === 0) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'not_found_skipped',
            });
        } else {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'updated',
            });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 9. マルカンド地方 enemy_groups (420-429)
    // ─────────────────────────────────────────────
    const marcundEnemyGroups = [
        { id: 420, slug: 'grp_desert_bandit', name: '砂漠の盗賊', members: ['enemy_bandit_thug', 'enemy_bandit_thug', 'enemy_bandit_archer', 'enemy_bandit_archer'], formation: 'front_row' },
        { id: 421, slug: 'grp_desert_beast', name: '砂漠の魔獣', members: ['enemy_markand_sand_worm', 'enemy_markand_scorpion', 'enemy_markand_scorpion'], formation: 'front_row' },
        { id: 422, slug: 'grp_scorpion_nest', name: '幻覚サソリの巣', members: ['enemy_markand_scorpion', 'enemy_markand_scorpion', 'enemy_markand_scorpion'], formation: 'front_row' },
        { id: 423, slug: 'grp_fugitive_guard', name: '逃亡奴隷の護衛', members: ['enemy_assassin_trainee', 'enemy_assassin_trainee', 'enemy_bandit_thug', 'enemy_bandit_thug'], formation: 'front_row' },
        { id: 424, slug: 'grp_fugitive_elite', name: '精鋭追手部隊', members: ['enemy_assassin_trainee', 'enemy_assassin_trainee', 'enemy_assassin_trainee', 'enemy_assassin_master'], formation: 'front_row' },
        { id: 425, slug: 'grp_sandworm_scout', name: '砂漠の先遣隊', members: ['enemy_markand_scorpion', 'enemy_markand_scorpion', 'enemy_markand_sand_worm'], formation: 'front_row' },
        { id: 426, slug: 'grp_sandworm_boss', name: '大砂虫', members: ['enemy_markand_sand_worm', 'enemy_markand_sand_worm'], formation: 'front_row' },
        { id: 427, slug: 'grp_auction_raider_1', name: '闇市の乱入者 第1波', members: ['enemy_bandit_thug', 'enemy_bandit_thug', 'enemy_bandit_thug', 'enemy_bandit_archer'], formation: 'front_row' },
        { id: 428, slug: 'grp_auction_raider_2', name: '闇市の乱入者 第2波', members: ['enemy_assassin_trainee', 'enemy_assassin_trainee', 'enemy_assassin_master'], formation: 'front_row' },
        { id: 429, slug: 'grp_militia_patrol', name: '自警団の巡回', members: ['enemy_bandit_guard', 'enemy_bandit_guard', 'enemy_bandit_archer', 'enemy_bandit_archer'], formation: 'front_row' },
    ];

    for (const group of marcundEnemyGroups) {
        if (dryRun) {
            results.push({ target: 'enemy_groups', id: group.id, slug: group.slug, status: 'dry_run', payload: group });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_groups')
            .upsert(group, { onConflict: 'id' });

        results.push({
            target: 'enemy_groups',
            id: group.id,
            slug: group.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 10. マルカンド地方 新規アイテム
    // ─────────────────────────────────────────────
    const marcundItems = [
        {
            id: 3005, slug: 'item_scorpion_needle', name: 'サソリの毒針', type: 'material',
            base_price: 0, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { description: '幻覚サソリから採取した新鮮な毒針。暗殺薬の原料として闇市場で高値で取引される。' },
        },
        {
            id: 3010, slug: 'item_explosive', name: '爆薬', type: 'consumable',
            base_price: 0, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { aoe_damage: 100, use_timing: 'battle', description: '商会の錬金術師が調合した特製爆薬。敵全体に100ダメージを与える。サンドワーム戦の切り札。' },
        },
        {
            id: 3020, slug: 'item_secret_document', name: '封をされた密書', type: 'material',
            base_price: 0, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { description: '決して中を見てはならないと念を押された黒い巻物。忍び衆への納品用。' },
        },
    ];

    for (const item of marcundItems) {
        if (dryRun) {
            results.push({ target: 'items', id: item.id, slug: item.slug, status: 'dry_run', payload: item });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('items')
            .upsert(item, { onConflict: 'id' });

        results.push({
            target: 'items',
            id: item.id,
            slug: item.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 11. 夜刀地方 新規エネミー (1241-1245)
    // ─────────────────────────────────────────────
    const yatoEnemies = [
        { id: 1241, slug: 'enemy_yato_ninja', name: '抜け忍', level: 12, hp: 100, atk: 45, def: 5, exp: 50, gold: 80, drop_item_id: null, spawn_type: 'quest_only' },
        { id: 1242, slug: 'enemy_yato_spy', name: '間者', level: 10, hp: 120, atk: 30, def: 10, exp: 80, gold: 150, drop_item_id: null, spawn_type: 'quest_only' },
        { id: 1243, slug: 'enemy_yato_ronin', name: '浪人', level: 10, hp: 80, atk: 38, def: 5, exp: 30, gold: 50, drop_item_id: null, spawn_type: 'quest_only' },
        { id: 1244, slug: 'enemy_yato_ronin_leader', name: '浪人の頭目', level: 15, hp: 250, atk: 55, def: 10, exp: 120, gold: 200, drop_item_id: null, spawn_type: 'quest_only' },
        { id: 1245, slug: 'enemy_yato_onryo', name: '怨霊', level: 12, hp: 150, atk: 45, def: 15, exp: 80, gold: 100, drop_item_id: null, spawn_type: 'quest_only' },
    ];

    for (const enemy of yatoEnemies) {
        if (dryRun) {
            results.push({ target: 'enemies', id: enemy.id, slug: enemy.slug, status: 'dry_run', payload: enemy });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemies')
            .upsert(enemy, { onConflict: 'id' });

        results.push({
            target: 'enemies',
            id: enemy.id,
            slug: enemy.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 12. 夜刀地方 enemy_groups (430-435)
    // ─────────────────────────────────────────────
    const yatoEnemyGroups = [
        { id: 430, slug: 'grp_yato_yokai_01', name: '妖怪の群れ', members: ['enemy_yato_onibi', 'enemy_yato_onibi', 'enemy_yato_karakasa'], formation: 'front_row' },
        { id: 431, slug: 'grp_yato_yokai_02', name: '赤鬼', members: ['enemy_yato_akaoni'], formation: 'front_row' },
        { id: 432, slug: 'grp_yato_ninja', name: '他国の間者', members: ['enemy_yato_ninja', 'enemy_yato_ninja', 'enemy_yato_spy'], formation: 'front_row' },
        { id: 433, slug: 'grp_yato_ronin_wave', name: '食い詰め浪人 x3', members: ['enemy_yato_ronin', 'enemy_yato_ronin', 'enemy_yato_ronin'], formation: 'front_row' },
        { id: 434, slug: 'grp_yato_ronin_boss', name: '浪人の頭目', members: ['enemy_yato_ronin_leader'], formation: 'front_row' },
        { id: 435, slug: 'grp_yato_spirit', name: '峠の怨霊', members: ['enemy_yato_onryo'], formation: 'front_row' },
    ];

    for (const group of yatoEnemyGroups) {
        if (dryRun) {
            results.push({ target: 'enemy_groups', id: group.id, slug: group.slug, status: 'dry_run', payload: group });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_groups')
            .upsert(group, { onConflict: 'id' });

        results.push({
            target: 'enemy_groups',
            id: group.id,
            slug: group.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 13. 夜刀地方クエスト 7030-7034 のメタデータ更新
    // ─────────────────────────────────────────────
    const yatoQuests: NormalQuestSeed[] = [
        {
            id: 7030, slug: 'qst_yat_yokai', rec_level: 6, difficulty: 2,
            time_cost: 3, days_success: 3, days_failure: 1,
            rewards: { gold: 300, exp: 100, alignment_shift: { justice: 5 } },
        },
        {
            id: 7031, slug: 'qst_yat_ninja', rec_level: 6, difficulty: 2,
            time_cost: 4, days_success: 4, days_failure: 2,
            rewards: { gold: 550, exp: 120, alignment_shift: { justice: 10 } },
        },
        {
            id: 7032, slug: 'qst_yat_shrine', rec_level: 6, difficulty: 2,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 400, exp: 120, alignment_shift: { justice: 10 } },
        },
        {
            id: 7033, slug: 'qst_yat_ronin', rec_level: 6, difficulty: 2,
            time_cost: 2, days_success: 2, days_failure: 1,
            rewards: { gold: 350, exp: 100, alignment_shift: { justice: 10 } },
        },
        {
            id: 7034, slug: 'qst_yat_shogun', rec_level: 6, difficulty: 2,
            time_cost: 1, days_success: 1, days_failure: 1,
            rewards: { gold: 400, exp: 120 },
        },
    ];

    for (const quest of yatoQuests) {
        const updatePayload: Record<string, any> = {
            rec_level: quest.rec_level,
            difficulty: quest.difficulty,
            time_cost: quest.time_cost,
            days_success: quest.days_success,
            days_failure: quest.days_failure,
            rewards: quest.rewards,
        };

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'dry_run',
                payload: updatePayload,
            });
            successCount++;
            continue;
        }

        const { data, error } = await supabase
            .from('scenarios')
            .update(updatePayload)
            .eq('id', quest.id)
            .select('id');

        if (error) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'error',
                error: error.message,
            });
            errorCount++;
        } else if (!data || data.length === 0) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'not_found_skipped',
            });
        } else {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'updated',
            });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 14. 華龍地方クエスト 7040-7044 のメタデータ更新
    // ─────────────────────────────────────────────
    const karyuQuests: NormalQuestSeed[] = [
        {
            id: 7040, slug: 'qst_har_jiangshi', rec_level: 7, difficulty: 2,
            time_cost: 5, days_success: 5, days_failure: 2,
            rewards: { gold: 350, exp: 100, alignment_shift: { chaos: 5 } },
        },
        {
            id: 7041, slug: 'qst_har_herb', rec_level: 7, difficulty: 2,
            time_cost: 6, days_success: 6, days_failure: 3,
            rewards: { gold: 300, exp: 100, alignment_shift: { evil: 5 } },
        },
        {
            id: 7042, slug: 'qst_har_rebel', rec_level: 7, difficulty: 2,
            time_cost: 4, days_success: 4, days_failure: 2,
            rewards: { gold: 450, exp: 100, alignment_shift: { evil: 10 } },
            requirements: { max_reputation: -50 },
        },
        {
            id: 7043, slug: 'qst_har_official', rec_level: 7, difficulty: 2,
            time_cost: 6, days_success: 6, days_failure: 4,
            rewards: { gold: 500, exp: 120, alignment_shift: { chaos: 10, evil: 5 } },
        },
        {
            id: 7044, slug: 'qst_har_pirate', rec_level: 7, difficulty: 2,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 400, exp: 120, alignment_shift: { chaos: 5 } },
        },
    ];

    for (const quest of karyuQuests) {
        const updatePayload: Record<string, any> = {
            rec_level: quest.rec_level,
            difficulty: quest.difficulty,
            time_cost: quest.time_cost,
            days_success: quest.days_success,
            days_failure: quest.days_failure,
            rewards: quest.rewards,
        };
        if (quest.requirements) {
            updatePayload.requirements = quest.requirements;
        }

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'dry_run',
                payload: updatePayload,
            });
            successCount++;
            continue;
        }

        const { data, error } = await supabase
            .from('scenarios')
            .update(updatePayload)
            .eq('id', quest.id)
            .select('id');

        if (error) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'error',
                error: error.message,
            });
            errorCount++;
        } else if (!data || data.length === 0) {
            // レコードが存在しない場合は insert
            const insertPayload = {
                id: quest.id,
                slug: quest.slug,
                type: 'normal',
                title: getKaryuQuestTitle(quest.slug),
                ...updatePayload,
            };
            const { error: insertError } = await supabase
                .from('scenarios')
                .insert(insertPayload);

            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: insertError ? 'insert_error' : 'inserted',
                error: insertError?.message,
            });
            if (insertError) errorCount++;
            else successCount++;
        } else {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'updated',
            });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 15. 華龍地方 NPC: 悪徳官僚・薛
    // ─────────────────────────────────────────────
    const karyuNpcs = [
        {
            id: '00000000-0000-4000-a000-000000004060',
            slug: 'npc_corrupt_official',
            name: '悪徳官僚・薛',
            gender: 'Male',
            job_class: 'Official',
            level: 1,
            max_hp: 40,
            attack: 0,
            defense: 1,
            speed: 2,
            mp: 0,
            max_mp: 0,
            origin: 'system_guest',
            epithet: '悪徳官僚',
            introduction: '「文官ですから。戦いは任せます」',
            is_hireable: false,
            hire_cost: 0,
            default_cards: [],
            inject_cards: [],
        },
    ];

    for (const npc of karyuNpcs) {
        if (dryRun) {
            results.push({ target: 'npcs', id: npc.id, slug: npc.slug, status: 'dry_run', payload: npc });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('npcs')
            .upsert(npc, { onConflict: 'id' });

        results.push({
            target: 'npcs',
            id: npc.id,
            slug: npc.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // party_members にも登録
    const karyuPartyMembers = karyuNpcs.map((npc) => ({
        id: 900010,
        slug: npc.slug,
        name: npc.name,
        job_class: npc.job_class,
        durability: npc.max_hp,
        max_durability: npc.max_hp,
        owner_id: null,
        loyalty: 100,
        cover_rate: 10,
        is_active: true,
        inject_cards: [],
    }));

    for (const pm of karyuPartyMembers) {
        if (dryRun) {
            results.push({ target: 'party_members', id: pm.id, slug: pm.slug, status: 'dry_run', payload: pm });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('party_members')
            .upsert(pm, { onConflict: 'id' });

        results.push({
            target: 'party_members',
            id: pm.id,
            slug: pm.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    // ─────────────────────────────────────────────
    // 16. 華龍地方 新規アイテム: 霊草
    // ─────────────────────────────────────────────
    const karyuItems = [
        {
            id: 3030, slug: 'item_spirit_herb', name: '霊草', type: 'material',
            base_price: 0, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { description: '霊山の奥深くに自生する希少な薬草。万病に効くと言われ、権力者が高値で求める。' },
        },
        {
            id: 3045, slug: 'item_foxfire_charm', name: '狐火の護符', type: 'equipment',
            base_price: 0, nation_tags: null, min_prosperity: 1, is_black_market: false,
            effect_data: { atk_bonus: 5, def_bonus: 3, hp_bonus: 5, description: '九尾の妖狐の子孫が感謝の印として授けた護符。温かい狐火の光が宿り、持ち主を守る。' },
        },
    ];

    for (const item of karyuItems) {
        if (dryRun) {
            results.push({ target: 'items', id: item.id, slug: item.slug, status: 'dry_run', payload: item });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('items')
            .upsert(item, { onConflict: 'id' });

        results.push({
            target: 'items',
            id: item.id,
            slug: item.slug,
            status: error ? 'error' : 'upserted',
            error: error?.message,
        });
        if (error) errorCount++;
        else successCount++;
    }

    return NextResponse.json({
        summary: {
            total: results.length,
            success: successCount,
            errors: errorCount,
            dry_run: dryRun,
            description: '汎用クエスト7001-7008 + ローランド7010-7015 + マルカンド7020-7025 + 夜刀7030-7034 + 華龍7040-7044 マスタデータシード',
        },
        results,
    });
}

function getQuestTitle(slug: string): string {
    const titles: Record<string, string> = {
        'qst_gen_deliver': '隣街への封書配達',
        'qst_gen_escort': '放浪商人の護衛',
        'qst_gen_scavenge': '廃墟の金庫回収',
        'qst_gen_riot': '食料暴動の事前鎮圧',
        'qst_gen_bear': '凶熊狩り',
        'qst_gen_smuggle': '禁制品の闇ルート輸送',
        'qst_gen_rat': '地下水路の害獣駆除',
        'qst_gen_mercy': '難民野営地への薬草救援',
    };
    return titles[slug] || slug;
}

function getKaryuQuestTitle(slug: string): string {
    const titles: Record<string, string> = {
        'qst_har_jiangshi': '霊山のキョンシー退治',
        'qst_har_herb': '仙丹の材料となる霊草採集',
        'qst_har_rebel': '辺境農民の反乱鎮圧',
        'qst_har_official': '巡検使の護衛と汚職隠蔽',
        'qst_har_pirate': '沿岸を荒らす海賊の討伐',
    };
    return titles[slug] || slug;
}
