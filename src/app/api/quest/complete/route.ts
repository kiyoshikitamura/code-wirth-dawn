
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthClient } from '@/lib/supabase-auth';
import { QuestService, calculateGrowth, processAging, resolveLocationId } from '@/services/questService';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { getShareText, getFlavor } from '@/lib/shareTextLoader';
import { checkAndFireTrigger, buildShareData, LEVEL_MILESTONES, GOLD_MILESTONES, FAME_HERO_THRESHOLD, FAME_VILLAIN_THRESHOLD, FAME_BANNED_THRESHOLD } from '@/lib/shareUtils';
import {
    applyAlignmentShift,
    updateHubAndWorldState,
    grantRewardItems,
    convertGuestToPartyMember,
    processPartyWearCycle,
    processReputationChange,
    persistLootPool,
} from '@/services/questCompleteHelpers';
import { UGC_REWARD_LIMITS } from '@/lib/ugc/ugcConfig';
import { verifyBattleCompletionToken } from '@/app/api/battle/validate-result/route';

// Initialize Supabase Client safely (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

/**
 * POST /api/quest/complete
 * Handles quest completion logic v4.0 (Refactored — helpers extracted)
 */
export async function POST(req: Request) {
    try {
        if (!supabaseServiceKey) {
            console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Key' }, { status: 500 });
        }

        const body = await req.json();
        const { quest_id, result, history, loot_pool, consumed_items, battle_defeat, node_rewards } = body;
        const lootSaved = Array.isArray(loot_pool) ? loot_pool : [];

        // ═══════════════════════════════════════
        // §0. 認証
        // ═══════════════════════════════════════
        const client = createAuthClient(req);
        const { data: { user: authUser } } = await client.auth.getUser();
        const user_id = authUser?.id;

        if (!quest_id || !user_id) {
            return NextResponse.json({ error: 'Missing parameters or authentication required' }, { status: 401 });
        }

        // ═══════════════════════════════════════
        // §1. データ取得 + バリデーション
        // ═══════════════════════════════════════
        // UGC v2: ugc_scenariosから先に検索し、見つからなければ公式scenariosから取得
        let quest: any = null;
        let isUgcV2 = false;

        if (String(quest_id).startsWith('colosseum_')) {
            const difficulty = String(quest_id).replace('colosseum_', ''); // easy, normal, hard
            let numBattles = 5;
            let diffLabel = 'Easy';
            let diffVal = 1;
            let rewards = { gold: 800, exp: 200, reputation: 5 };
            if (difficulty === 'normal') {
                numBattles = 10;
                diffLabel = 'Normal';
                diffVal = 2;
                rewards = { gold: 2000, exp: 400, reputation: 10 };
            } else if (difficulty === 'hard') {
                numBattles = 20;
                diffLabel = 'Hard';
                diffVal = 3;
                rewards = { gold: 4000, exp: 800, reputation: 20 };
            }

            // Fetch user profile current_location_id
            const { data: userLoc } = await supabase
                .from('user_profiles')
                .select('current_location_id')
                .eq('id', user_id)
                .single();

            quest = {
                id: quest_id,
                slug: quest_id,
                title: `コロシアム (${diffLabel})`,
                description: `全${numBattles}戦の連続エネミーバトルに勝ち残り、報酬を獲得しろ。`,
                quest_type: 'normal',
                requirements: {},
                conditions: {},
                rewards: rewards,
                rec_level: 1,
                difficulty: diffVal,
                is_urgent: false,
                client_name: 'バルガス',
                impact: {},
                location_id: userLoc?.current_location_id || null,
                days_success: 0,
                days_failure: 0,
                is_ugc: false,
                share_text: `コロシアム (${diffLabel}) を制覇しました！`
            };
        } else {
            const questColumns = 'id, slug, title, description, quest_type, requirements, conditions, rewards, rec_level, difficulty, is_urgent, client_name, impact, location_id, days_success, days_failure, is_ugc, share_text, script_data';
            const [ugcResult, officialResult] = await Promise.all([
                supabase.from('ugc_scenarios').select(questColumns).eq('id', quest_id).single(),
                supabase.from('scenarios').select(questColumns).eq('id', quest_id).single()
            ]);

            if (ugcResult.data) {
                quest = ugcResult.data;
                isUgcV2 = true;
                // UGCクエストのplay_countインクリメント（fire-and-forget）
                void supabase.rpc('increment_ugc_play_count', { p_scenario_id: quest_id }).then(({ error }) => { if (error) console.warn('UGC play count increment failed:', error); });
            } else if (officialResult.data) {
                quest = officialResult.data;
            } else {
                return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
            }
        }

        console.log(`[QuestComplete] ID: ${quest_id}, UGCv2: ${isUgcV2}, Rewards:`, quest?.rewards, 'NodeRewards:', node_rewards);

        const { data: user, error: uError } = await supabase
            .from('user_profiles').select('id, gold, level, exp, age, age_days, accumulated_days, max_hp, hp, atk, def, attack, max_vitality, vitality, max_deck_cost, order_pts, chaos_pts, justice_pts, evil_pts, title_name, current_location_id, blessing_data, current_quest_id').eq('id', user_id).single();

        if (uError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // [Security] アクティブクエスト検証：進行中でないクエストの完了をブロック
        if (!user.current_quest_id || String(user.current_quest_id) !== String(quest_id)) {
            console.warn(`[Security] API rejected quest completion. User ${user_id} attempted to complete ${quest_id} but active quest is ${user.current_quest_id}`);
            return NextResponse.json({ error: 'You are not currently in this quest.' }, { status: 403 });
        }

        // [Security] バトル検証トークンの必須化と検証
        let battleCount = 0;
        let hasBattles = false;
        if (Array.isArray(history)) {
            if (history.length > 0 && typeof history[0] === 'object') {
                battleCount = history.filter((h: any) => h.nodeType === 'battle' || h.type === 'battle').length;
                hasBattles = history.some((h: any) => h.nodeType === 'battle' || h.type === 'battle');
            } else {
                const nodes = quest?.script_data?.nodes || {};
                battleCount = history.filter((nodeId: string) => {
                    const node = nodes[nodeId];
                    return node && (node.type === 'battle' || node.nodeType === 'battle');
                }).length;
                hasBattles = battleCount > 0;
            }
        }
        if (result === 'success' && hasBattles) {
            const { battle_completion_token } = body;
            if (!battle_completion_token) {
                console.warn(`[Security] API rejected quest completion. User ${user_id} won quest ${quest_id} but omitted battle_completion_token.`);
                return NextResponse.json({ error: 'Battle completion token is required for this quest.' }, { status: 403 });
            }

            const { valid, payload } = verifyBattleCompletionToken(battle_completion_token);
            if (!valid) {
                console.warn(`[Security] API rejected quest completion. Invalid battle completion token from user ${user_id} for quest ${quest_id}.`);
                return NextResponse.json({ error: 'Invalid or expired battle completion token.' }, { status: 403 });
            }

            if (payload.user_id !== user_id || payload.result !== 'victory') {
                console.warn(`[Security] API rejected quest completion. Token user mismatch or result not victory (token user: ${payload.user_id}, result: ${payload.result}) for user ${user_id}.`);
                return NextResponse.json({ error: 'Battle completion token user mismatch or result is not victory.' }, { status: 403 });
            }
        }

        const validation = await QuestService.validateRequirements(supabase, user_id, quest.requirements);
        if (!validation.valid) {
            console.warn(`[Security] API rejected quest completion. User ${user_id} blocked from ${quest_id}: ${validation.reason}`);
            return NextResponse.json({ error: 'Quest prerequisites not met: ' + validation.reason }, { status: 403 });
        }

        // ═══════════════════════════════════════
        // §2. 加齢 + ステータス減衰
        // ═══════════════════════════════════════
        let daysPassed = 1;
        if (result === 'success') daysPassed = quest.days_success ?? 1;
        else if (result === 'failure') daysPassed = quest.days_failure ?? 1;

        const { newAge, newAgeDays, decay } = processAging(
            user.age || 18, user.age_days || 0, daysPassed
        );

        const updates: any = { age: newAge, age_days: newAgeDays };

        if (decay.vit > 0 || decay.atk > 0 || decay.def > 0) {
            updates.max_vitality = Math.max(0, (user.max_vitality || 100) - decay.vit);
            updates.vitality = Math.min(user.vitality || 100, updates.max_vitality);
            updates.atk = Math.max(1, (user.atk || user.attack || 1) - decay.atk);
            updates.def = Math.max(1, (user.def || 1) - decay.def);
        }

        // バトル敗北、撤退、ギブアップ等によるクエスト失敗ペナルティ（一律 VIT -1）
        let battleDefeatVitPenalty = 0;
        if (result === 'failure') {
            battleDefeatVitPenalty = 1;
            const currentVit = updates.vitality ?? user.vitality ?? 100;
            updates.vitality = Math.max(0, currentVit - battleDefeatVitPenalty);
            updates.hp = user.max_hp || 100;
        }

        // ═══════════════════════════════════════
        // §3. EXP + レベルアップ
        // ═══════════════════════════════════════
        let levelUpInfo: any = null;
        let earnedExp = 0;
        if (result === 'success') {
            const currentLevel = user.level || 1;
            const currentExp = Number(user.exp || 0);
            const difficulty = quest.difficulty || 1;
            const expFallback = difficulty * (Math.floor(Math.random() * 41) + 10);
            const questExp = (quest.rewards?.exp) || expFallback;
            const battleBonus = battleCount * (Math.floor(Math.random() * 101) + 100);
            earnedExp = questExp + battleBonus;

            const growthResult = calculateGrowth(
                currentLevel, currentExp, earnedExp,
                updates.atk || user.atk || 1,
                updates.def || user.def || 1,
                user.max_hp || 85
            );

            updates.exp = growthResult.newExp;

            if (growthResult.levelInfo.level_up) {
                const info = growthResult.levelInfo;
                updates.level = info.new_level;
                updates.max_hp = info.new_max_hp;
                updates.hp = info.new_max_hp;
                updates.max_deck_cost = info.new_max_cost;
                updates.atk = (updates.atk || user.atk || 1) + info.atk_increase;
                updates.def = (updates.def || user.def || 1) + info.def_increase;
                levelUpInfo = info;
            }
        }

        // 累積日数
        let currentTotalDays = user.accumulated_days || 0;
        updates.accumulated_days = currentTotalDays + daysPassed;

        // ═══════════════════════════════════════
        // §4. 報酬 + 移動 + アライメント
        // ═══════════════════════════════════════
        let alignmentShift: Record<string, number> | null = null;
        const qRewards = quest.rewards || {};
        const nRewards = node_rewards || {};

        // Merge items safely: if both have items, combine them. If one has items, use that.
        const mergedItems = (Array.isArray(qRewards.items) && qRewards.items.length > 0)
            ? qRewards.items
            : (Array.isArray(nRewards.items) ? nRewards.items : undefined);

        // Merge skills safely
        const mergedSkills = (Array.isArray(qRewards.skills) && qRewards.skills.length > 0)
            ? qRewards.skills
            : (Array.isArray(nRewards.skills) ? nRewards.skills : undefined);

        const effectiveRewards = result === 'success'
            ? {
                ...qRewards,
                ...nRewards,
                items: mergedItems ? [...mergedItems] : [],
                skills: mergedSkills ? [...mergedSkills] : [],
                alignment_shift: (qRewards.alignment_shift || nRewards.alignment_shift)
                    ? {
                        ...(qRewards.alignment_shift || {}),
                        ...(nRewards.alignment_shift || {})
                      }
                    : undefined
            }
            : { ...qRewards };

        // Colosseum salvage rewards (Weighted random selection based on rarity)
        if (result === 'success' && String(quest_id).startsWith('colosseum_')) {
            const { data: itemPool } = await supabase
                .from('colosseum_reward_pool')
                .select('reward_id, rarity')
                .eq('reward_type', 'item');
            
            const { data: skillPool } = await supabase
                .from('colosseum_reward_pool')
                .select('reward_id, rarity')
                .eq('reward_type', 'skill');

            const difficulty = String(quest_id).replace('colosseum_', ''); // easy, normal, hard
            const count = difficulty === 'hard' ? 2 : 1;

            const chooseWeightedReward = (pool: { reward_id: string; rarity: string }[]): string | null => {
                if (!pool || pool.length === 0) return null;
                // Easy: 70/25/5, Normal: 40/50/10, Hard: 30/40/30
                let weightMap: Record<string, number> = { common: 70, rare: 25, super_rare: 5 };
                if (difficulty === 'normal') {
                    weightMap = { common: 40, rare: 50, super_rare: 10 };
                } else if (difficulty === 'hard') {
                    weightMap = { common: 30, rare: 40, super_rare: 30 };
                }

                let totalWeight = 0;
                for (const item of pool) {
                    totalWeight += weightMap[item.rarity] || 0;
                }
                let randomVal = Math.random() * totalWeight;
                for (const item of pool) {
                    const weight = weightMap[item.rarity] || 0;
                    if (randomVal < weight) {
                        return item.reward_id;
                    }
                    randomVal -= weight;
                }
                return pool[0].reward_id;
            };

            if (difficulty === 'hard') {
                if (itemPool && itemPool.length > 0) {
                    if (!effectiveRewards.items) effectiveRewards.items = [];
                    const chosen = chooseWeightedReward(itemPool);
                    if (chosen) effectiveRewards.items.push(chosen);
                }
                if (skillPool && skillPool.length > 0) {
                    if (!effectiveRewards.skills) effectiveRewards.skills = [];
                    const chosen = chooseWeightedReward(skillPool);
                    if (chosen) effectiveRewards.skills.push(chosen);
                }
            } else {
                // Easy & Normal: EITHER 1 item OR 1 skill (50% chance each)
                const rewardType = Math.random() < 0.5 ? 'item' : 'skill';
                if (rewardType === 'item' && itemPool && itemPool.length > 0) {
                    if (!effectiveRewards.items) effectiveRewards.items = [];
                    const chosen = chooseWeightedReward(itemPool);
                    if (chosen) effectiveRewards.items.push(chosen);
                } else if (rewardType === 'skill' && skillPool && skillPool.length > 0) {
                    if (!effectiveRewards.skills) effectiveRewards.skills = [];
                    const chosen = chooseWeightedReward(skillPool);
                    if (chosen) effectiveRewards.skills.push(chosen);
                } else {
                    // Fallback in case the chosen pool is empty
                    if (itemPool && itemPool.length > 0) {
                        if (!effectiveRewards.items) effectiveRewards.items = [];
                        const chosen = chooseWeightedReward(itemPool);
                        if (chosen) effectiveRewards.items.push(chosen);
                    } else if (skillPool && skillPool.length > 0) {
                        if (!effectiveRewards.skills) effectiveRewards.skills = [];
                        const chosen = chooseWeightedReward(skillPool);
                        if (chosen) effectiveRewards.skills.push(chosen);
                    }
                }
            }
        }


        if (result === 'success') {
            const rewards = effectiveRewards;

            if (rewards.move_to) {
                const newLocationId = await resolveLocationId(supabase, rewards.move_to);
                if (newLocationId) {
                    updates.current_location_id = newLocationId;
                } else {
                    console.warn(`Quest Complete: Location '${rewards.move_to}' not found.`);
                }
            }

            alignmentShift = await applyAlignmentShift(supabase, user, updates, rewards);
        }

        // ═══════════════════════════════════════
        // §5. Hub / WorldState 更新
        // ═══════════════════════════════════════
        await updateHubAndWorldState(supabase, user_id, user, updates);

        // ═══════════════════════════════════════
        // §6. ロック解除 + プロフィール更新
        // ═══════════════════════════════════════
        updates.current_quest_id = null;
        updates.blessing_data = null;

        console.log('[QuestComplete] Updates payload:', JSON.stringify(updates, null, 2));

        const { error: updateError } = await supabase
            .from('user_profiles').update(updates).eq('id', user_id);
        if (updateError) throw updateError;

        // Record quest activity log (Spec Dashboard Extensions) - Removed redundant insert to prevent duplicate user_chronicles records



        if (result === 'success') {
            const rewardPromises: PromiseLike<any>[] = [];

            // Gold
            if (isUgcV2) {
                rewardPromises.push(
                    supabase.rpc('increment_gold', { p_user_id: user_id, p_amount: UGC_REWARD_LIMITS.fixed_gold })
                        .then(({ error }: any) => { if (error) console.error('Failed to increment UGC gold:', error); }),
                    supabase.rpc('increment_ugc_clear_count', { p_scenario_id: quest_id })
                        .then(({ error }: any) => { if (error) console.warn('UGC clear count failed:', error); })
                );
            } else if (effectiveRewards?.gold) {
                rewardPromises.push(
                    supabase.rpc('increment_gold', { p_user_id: user_id, p_amount: effectiveRewards.gold })
                        .then(({ error }: any) => { if (error) console.error('Failed to increment gold via RPC:', error); })
                );
            }

            // Items + Loot
            rewardPromises.push(grantRewardItems(supabase, user_id, effectiveRewards, lootSaved));
            rewardPromises.push(persistLootPool(supabase, user_id, loot_pool));

            await Promise.all(rewardPromises);
        }

        // ═══════════════════════════════════════
        // §8-§9. ゲストNPC正規雇用 + パーティVIT摩耗 (parallelized)
        // ═══════════════════════════════════════
        const defeatedIds: string[] = Array.isArray(body.defeated_member_ids)
            ? body.defeated_member_ids.map((id: any) => String(id))
            : [];
        const [guestConversion, partyChanges] = await Promise.all([
            result === 'success' ? convertGuestToPartyMember(supabase, user_id, body) : Promise.resolve(null),
            processPartyWearCycle(supabase, user_id, result, defeatedIds)
        ]);

        // ═══════════════════════════════════════
        // §11. 号外シェアシステム
        // ═══════════════════════════════════════
        const shareDataList: any[] = [];

        if (result === 'success') {
            const questSlug = quest.slug || '';

            // UGC First Blood
            if (quest.is_ugc) {
                const { count: priorClears } = await supabase
                    .from('user_completed_quests').select('id', { count: 'exact', head: true })
                    .eq('ugc_scenario_id', quest_id);
                if (priorClears === 0) {
                    const sd = buildShareData('ugc_first_blood', { quest_name: quest.title || '' });
                    if (sd) shareDataList.push(sd);
                }
            }

            let isMainQuestCleared = false;
            // メインクエスト章クリア
            if (questSlug.startsWith('main_ep')) {
                const fired = await checkAndFireTrigger(supabase, user_id, 'main_quest_clear', questSlug);
                if (fired) {
                    const chapter = questSlug.replace('main_ep', '').replace(/^0+/, '') || '?';
                    const sd = buildShareData('main_quest_clear', { chapter, quest_name: quest.title || '' });
                    if (sd) {
                        shareDataList.push(sd);
                        isMainQuestCleared = true;
                    }
                }
            }

            // 全クエスト初回クリア
            if (questSlug) {
                const fired = await checkAndFireTrigger(supabase, user_id, 'quest_first_clear', questSlug);
                if (fired && !isMainQuestCleared) {
                    if (quest.share_text) {
                        shareDataList.push({ text: quest.share_text, slug: 'quest_first_clear', vars: { quest_name: quest.title || '' } });
                    } else {
                        const sd = buildShareData('quest_first_clear', { quest_name: quest.title || '' });
                        if (sd) shareDataList.push(sd);
                    }
                }
            }

            // レベルアップ節目
            if (levelUpInfo && LEVEL_MILESTONES.includes(levelUpInfo.new_level)) {
                const lv = levelUpInfo.new_level;
                const fired = await checkAndFireTrigger(supabase, user_id, 'level_milestone', String(lv));
                if (fired) {
                    const flavor = getFlavor('level', String(lv));
                    const sd = buildShareData('level_milestone', { level: lv, flavor });
                    if (sd) shareDataList.push(sd);
                }
            }
        }

        const finalShareText = shareDataList.length > 0 ? shareDataList[0].text : null;
        // ═══════════════════════════════════════
        // §12. 名声変動
        // ═══════════════════════════════════════
        const repChange = await processReputationChange(supabase, user_id, user, result, effectiveRewards, updates);

        // ─── 先行宣言: 新しい拠点名とステータス変化 ───
        let newLocationName: string | null = null;
        if (updates.current_location_id) {
            const { data: locData } = await supabase.from('locations').select('name').eq('id', updates.current_location_id).maybeSingle();
            newLocationName = locData?.name || null;
        }

        const changes = {
            gold_gained: isUgcV2 ? UGC_REWARD_LIMITS.fixed_gold : (effectiveRewards?.gold || 0),
            old_age: user.age,
            new_age: updates.age,
            aged_up: (newAge - (user.age || 18)) > 0,
            years_added: Math.floor(daysPassed / 365),
            vit_penalty: decay.vit,
            atk_decay: decay.atk,
            def_decay: decay.def,
            level_up: levelUpInfo,
            battle_defeat_vit_penalty: battleDefeatVitPenalty,
            alignment_shift: alignmentShift,
        };

        // ═══════════════════════════════════════
        // §13. クエスト完了履歴（user_chroniclesへの直接書き込み）
        // ═══════════════════════════════════════
        const historyPromises: PromiseLike<any>[] = [];

        // 13a. クエスト結果ログ（成功: quest_success / 失敗・放棄: quest_failure）
        const paramChanges: any = {
            gold: changes.gold_gained || 0,
            exp: earnedExp || 0,
            aged_days: daysPassed,
        };

        if (repChange) {
            paramChanges.reputation = {
                location_name: repChange.location,
                delta: repChange.amount
            };
        }

        if (alignmentShift) {
            paramChanges.alignment = alignmentShift;
        }

        const isMajor = (quest.rec_level && quest.rec_level >= 5) || (quest.slug && quest.slug.startsWith('main_ep'));

        historyPromises.push(
            supabase.from('user_chronicles').insert({
                user_id,
                event_type: result === 'success' ? 'quest_success' : 'quest_failure',
                accumulated_days: updates.accumulated_days,
                location_id: quest.location_id || updates.current_location_id || user.current_location_id,
                location_name: newLocationName || (repChange ? repChange.location : null),
                scenario_id: (isUgcV2 || String(quest_id).startsWith('colosseum_')) ? null : quest_id,
                ugc_scenario_id: isUgcV2 ? quest_id : null,
                title: result === 'success' ? `クエストクリア: ${quest.title}` : `クエスト失敗/放棄: ${quest.title}`,
                description: result === 'success' 
                    ? `クエスト『${quest.title}』を達成し、多くの報酬を得た。`
                    : `クエスト『${quest.title}』の遂行中に撤退、または失敗した。`,
                param_changes: paramChanges,
                is_major_event: isMajor,
                share_text: finalShareText
            }).then(({ error }: any) => {
                if (error) console.error('[Quest Complete] Failed to write quest result to user_chronicles:', error);
            })
        );

        // Record Colosseum activity log on success
        if (result === 'success' && String(quest_id).startsWith('colosseum_')) {
            const difficulty = String(quest_id).replace('colosseum_', '');
            historyPromises.push(
                supabase.from('colosseum_activity_logs')
                    .insert({
                        user_id,
                        difficulty,
                        action: 'complete',
                        gold_cost: 0
                    })
                    .then(({ error }: any) => {
                        if (error) console.error('[Quest Complete] Failed to write colosseum_activity_logs:', error);
                    })
            );
        }

        // 13b. 加齢イベント（年齢値が上がった場合のみ）
        if (changes.aged_up) {
            historyPromises.push(
                supabase.from('user_chronicles').insert({
                    user_id,
                    event_type: 'age_up',
                    accumulated_days: updates.accumulated_days,
                    location_id: updates.current_location_id || user.current_location_id,
                    location_name: newLocationName,
                    title: `加齢: ${updates.age}歳`,
                    description: `旅の中で時間が流れ、${user.age || 18}歳から${updates.age}歳へと年齢を重ねた。`,
                    param_changes: {
                        age_from: user.age,
                        age_to: updates.age
                    }
                }).then(({ error }: any) => {
                    if (error) console.error('[Quest Complete] Failed to write age_up to user_chronicles:', error);
                })
            );
        }

        // 13c. レベルアップイベント
        if (levelUpInfo) {
            historyPromises.push(
                supabase.from('user_chronicles').insert({
                    user_id,
                    event_type: 'level_up',
                    accumulated_days: updates.accumulated_days,
                    location_id: updates.current_location_id || user.current_location_id,
                    location_name: newLocationName,
                    title: `レベルアップ: Lv.${levelUpInfo.new_level}`,
                    description: `試練を乗り越え、実力が向上した。（Lv.${levelUpInfo.old_level} → Lv.${levelUpInfo.new_level}）`,
                    param_changes: {
                        level_from: levelUpInfo.old_level,
                        level_to: levelUpInfo.new_level,
                        atk_increase: levelUpInfo.atk_increase,
                        def_increase: levelUpInfo.def_increase,
                    }
                }).then(({ error }: any) => {
                    if (error) console.error('[Quest Complete] Failed to write level_up to user_chronicles:', error);
                })
            );
        }

        await Promise.all(historyPromises);

        // ─── 旧 §14 の位置（宣言を前に移動したためプレースホルダーのみ） ───

        // 所持金マイルストーン
        if (result === 'success') {
            const finalGold = (user.gold || 0) + (effectiveRewards?.gold || 0);
            for (const milestone of GOLD_MILESTONES) {
                if (finalGold >= milestone && (user.gold || 0) < milestone) {
                    const fired = await checkAndFireTrigger(supabase, user_id, 'gold_milestone', String(milestone));
                    if (fired) {
                        const sd = buildShareData('gold_milestone', { amount: milestone.toLocaleString() });
                        if (sd) shareDataList.push(sd);
                    }
                }
            }
        }

        // 名声シェアトリガー
        if (repChange && repChange.amount !== 0) {
            const repLocName = repChange.location;
            const { data: currentRep } = await supabase
                .from('reputations').select('score')
                .eq('user_id', user_id).eq('location_name', repLocName).maybeSingle();
            const currentScore = currentRep?.score || 0;

            if (currentScore >= FAME_HERO_THRESHOLD) {
                const sd = buildShareData('fame_hero', { location: repLocName });
                if (sd) shareDataList.push(sd);
            } else if (currentScore <= FAME_VILLAIN_THRESHOLD) {
                const sd = buildShareData('fame_villain', { location: repLocName });
                if (sd) shareDataList.push(sd);
            }
            if (currentScore <= FAME_BANNED_THRESHOLD && (currentScore - repChange.amount) > FAME_BANNED_THRESHOLD) {
                const sd = buildShareData('location_banned', { location: repLocName });
                if (sd) shareDataList.push(sd);
            }
        }

        return NextResponse.json({
            success: true,
            quest_title: quest.title || '',
            days_passed: daysPassed,
            new_location: updates.current_location_id,
            new_location_name: newLocationName,
            rewards: effectiveRewards,
            earned_exp: result === 'success' ? (effectiveRewards?.exp || 0) : 0,
            loot_saved: lootSaved,
            share_text: finalShareText,
            share_data_list: shareDataList,
            rep_change: repChange,
            party_changes: partyChanges,
            guest_conversion: guestConversion,
            changes
        });

    } catch (e: any) {
        console.error('Quest Complete API Critical Error:', e);
        return NextResponse.json({
            error: e.message || 'Unknown server error'
        }, { status: 500 });
    }
}
