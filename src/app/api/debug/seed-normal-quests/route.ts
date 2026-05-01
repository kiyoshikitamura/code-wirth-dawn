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

    return NextResponse.json({
        summary: {
            total: results.length,
            success: successCount,
            errors: errorCount,
            dry_run: dryRun,
            description: '汎用クエスト7001-7008 マスタデータシード（エネミー3種・アイテム3種・シナリオメタデータ）',
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
