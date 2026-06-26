
import { createClient } from '@supabase/supabase-js';
import { UserProfile, ScenarioReward, LocationDB } from '@/types/game';
import { GROWTH_RULES } from '@/constants/game_rules';
import { supabaseServer } from '@/lib/supabase-admin';
import { calcAlignmentPcts, getUserAlignmentPcts } from '@/lib/alignment';

// v15.0: game_rules.ts に一元化（ATK/DEF 上限廃止・ランダム成長対応）
const BASE_HP = GROWTH_RULES.BASE_HP_FALLBACK;
const BASE_DECK_COST = GROWTH_RULES.BASE_DECK_COST;
const COST_PER_LEVEL = GROWTH_RULES.COST_PER_LEVEL;
const MAX_DECK_COST = GROWTH_RULES.MAX_DECK_COST;

// v15.0: ランダムヘルパー（サーバーサイド専用）
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

interface LevelUpInfo {
    level_up: boolean;
    new_level: number;
    hp_increase: number;
    cost_increase: number;
    atk_increase: number;
    def_increase: number;
    new_max_hp: number;
    new_max_cost: number;
}

/**
 * Calculate level up and stat growth based on EXP
 * Spec v15.0: 上方修正・ランダム成長
 * - HP: +randInt(3, 6) / Lv（累積加算）
 * - ATK/DEF: +randInt(0, 2) / Lv（毎Lv・上限なし）
 * - DeckCost: 上限 MAX_DECK_COST(30) でキャップ
 */
export function calculateGrowth(
    currentLevel: number,
    currentExp: number,
    expGained: number,
    currentAtk: number = 1,
    currentDef: number = 1,
    currentMaxHp: number = BASE_HP
): { newExp: number; levelInfo: LevelUpInfo } {
    let level = currentLevel;
    let exp = currentExp + expGained;
    let leveledUp = false;
    let hpInc = 0;
    let costInc = 0;
    let atkInc = 0;
    let defInc = 0;

    while (exp >= GROWTH_RULES.EXP_FORMULA(level)) {
        exp -= GROWTH_RULES.EXP_FORMULA(level);
        level++;
        leveledUp = true;

        // HP: レベル帯ごとの可変成長（累積加算）
        const { min, max } = GROWTH_RULES.getHpLevelGain(level);
        hpInc += randInt(min, max);

        // DeckCost: 上限 MAX_DECK_COST でキャップ
        const projectedCost = BASE_DECK_COST + (level * COST_PER_LEVEL);
        if (projectedCost <= MAX_DECK_COST) {
            costInc += COST_PER_LEVEL;
        }

        // ATK/DEF: +randInt(0, 2) / Lv（毎Lv・上限なし）
        atkInc += randInt(
            GROWTH_RULES.ATK_LEVEL_GAIN_MIN,
            GROWTH_RULES.ATK_LEVEL_GAIN_MAX
        );
        defInc += randInt(
            GROWTH_RULES.DEF_LEVEL_GAIN_MIN,
            GROWTH_RULES.DEF_LEVEL_GAIN_MAX
        );
    }

    return {
        newExp: exp,
        levelInfo: {
            level_up: leveledUp,
            new_level: level,
            hp_increase: hpInc,
            cost_increase: costInc,
            atk_increase: atkInc,
            def_increase: defInc,
            // v15.0: currentMaxHp からの累積加算（固定式ではなく加算方式）
            new_max_hp: currentMaxHp + hpInc,
            new_max_cost: Math.min(MAX_DECK_COST, BASE_DECK_COST + (level * COST_PER_LEVEL))
        }
    };
}

/**
 * Resolve Location Slug or ID to ID
 */
export async function resolveLocationId(
    supabase: any,
    identifier: string // UUID or Slug or Name
): Promise<string | null> {
    // 1. Try as UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) return identifier;

    // 2. Try as Slug
    const { data: bySlug } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', identifier)
        .maybeSingle();

    if (bySlug) return bySlug.id;

    // 3. Try as Name
    const { data: byName } = await supabase
        .from('locations')
        .select('id')
        .eq('name', identifier)
        .maybeSingle();

    return byName?.id || null;
}


/**
 * Handle Aging and Vitality Decay
 * Spec v9.3: Aging & Decay
 */
export function processAging(
    age: number,
    ageDays: number,
    daysPassed: number
): { newAge: number; newAgeDays: number; decay: { vit: number; atk: number; def: number } } {
    let newAge = age;
    let newAgeDays = ageDays + daysPassed;
    let decay = { vit: 0, atk: 0, def: 0 };

    while (newAgeDays >= 365) {
        newAge++;
        newAgeDays -= 365;

        // Decay Logic (Spec v9.3)
        if (newAge >= 60) {
            decay.vit += 10;
            decay.atk += 2;
            decay.def += 2;
        } else if (newAge >= 50) {
            decay.vit += 5;
            decay.atk += 1;
            decay.def += 1;
        } else if (newAge >= 40) {
            decay.vit += 2;
            if (newAge % 2 === 0) { // Spec: "2年に1回" -> Simplify to even years? Or Accumulate?
                // Spec says "2年に1回" for 40-49. Let's just say even years for now.
                decay.atk += 1;
                decay.def += 1;
            }
        }
    }

    return { newAge, newAgeDays, decay };
}

export class QuestService {
    /**
     * Validate if a user meets the requirements for a scenario
     * v27.1: 全16種の requirements キーをサーバーサイドで検証
     */
    static async validateRequirements(supabase: any, userId: string, requirements: any): Promise<{ valid: boolean; reason?: string }> {
        if (!requirements || Object.keys(requirements).length === 0) return { valid: true };

        // ユーザープロフィール取得（複数チェックで使い回す）
        const { data: user } = await supabase
            .from('user_profiles')
            .select('level, current_location_id, vitality, order_pts, chaos_pts, justice_pts, evil_pts, gold')
            .eq('id', userId)
            .single();

        if (!user) return { valid: false, reason: 'User profile not found' };

        // Reconstruct alignment mapping for backwards compatibility with validation checks
        user.alignment = {
            order: user.order_pts || 0,
            chaos: user.chaos_pts || 0,
            justice: user.justice_pts || 0,
            evil: user.evil_pts || 0
        };

        // 1. min_level: 最低レベルチェック
        if (requirements.min_level) {
            if ((user.level || 1) < requirements.min_level) {
                return { valid: false, reason: `Level ${requirements.min_level} required (Current: ${user.level || 1})` };
            }
        }

        // 2. required_generations / min_generation: 世代チェック
        const reqGen = requirements.required_generations || requirements.min_generation;
        if (reqGen) {
            const { count } = await supabase
                .from('retired_characters')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            const generation = (count || 0) + 1;
            if (generation < reqGen) {
                return { valid: false, reason: `Generation ${reqGen} or higher required (Current: ${generation})` };
            }
        }

        // 3. completed_quest: 前提クエスト完了チェック (ID or Slug) - Supports multiple quests (AND with |, comma, or as array; OR with ||)
        if (requirements.completed_quest) {
            const rawCompletedQuest = requirements.completed_quest;
            const isOrCondition = typeof rawCompletedQuest === 'string' && rawCompletedQuest.includes('||');

            if (isOrCondition) {
                const reqVals = String(rawCompletedQuest).split('||').map(v => v.trim());
                let anyCompleted = false;

                for (const reqVal of reqVals) {
                    let targetId: string | null = null;
                    if (!isNaN(Number(reqVal))) {
                        targetId = reqVal;
                    } else {
                        const { data: targetQuest } = await supabase
                            .from('scenarios')
                            .select('id')
                            .eq('slug', reqVal)
                            .maybeSingle();
                        if (targetQuest) targetId = targetQuest.id;
                    }

                    if (targetId) {
                        const { data } = await supabase
                            .from('user_completed_quests')
                            .select('scenario_id')
                            .eq('user_id', userId)
                            .eq('scenario_id', targetId)
                            .maybeSingle();
                        if (data) {
                            anyCompleted = true;
                            break;
                        }
                    }
                }

                if (!anyCompleted) {
                    return { valid: false, reason: `None of the prerequisite quests (${reqVals.join(' or ')}) are completed` };
                }
            } else {
                const reqVals = Array.isArray(rawCompletedQuest)
                    ? rawCompletedQuest
                    : String(rawCompletedQuest).split(/[|,]/).map(v => v.trim());

                for (const reqVal of reqVals) {
                    let targetId: string | null = null;
                    if (!isNaN(Number(reqVal))) {
                        targetId = reqVal;
                    } else {
                        const { data: targetQuest } = await supabase
                            .from('scenarios')
                            .select('id')
                            .eq('slug', reqVal)
                            .maybeSingle();
                        if (targetQuest) targetId = targetQuest.id;
                    }

                    if (targetId) {
                        const { data } = await supabase
                            .from('user_completed_quests')
                            .select('scenario_id')
                            .eq('user_id', userId)
                            .eq('scenario_id', targetId)
                            .maybeSingle();
                        if (!data) return { valid: false, reason: `Prerequisite quest (${reqVal}) not completed` };
                    } else {
                        return { valid: false, reason: `Invalid prerequisite quest definition: ${reqVal}` };
                    }
                }
            }
        }

        // 4. nation_id: ユーザーの現在地の国家チェック
        if (requirements.nation_id) {
            if (user.current_location_id) {
                const { data: loc } = await supabase
                    .from('locations')
                    .select('name, slug, nation_id, ruling_nation_id')
                    .eq('id', user.current_location_id)
                    .maybeSingle();
                
                let locNation = loc?.ruling_nation_id || loc?.nation_id || loc?.slug;
                if (loc?.name) {
                    const { data: ws } = await supabase
                        .from('world_states')
                        .select('controlling_nation')
                        .eq('location_name', loc.name)
                        .maybeSingle();
                    if (ws?.controlling_nation) {
                        locNation = ws.controlling_nation;
                    }
                }

                const nationSlugToLocationTag: Record<string, string> = {
                    'Roland': 'loc_holy_empire',
                    'Markand': 'loc_marcund',
                    'Yato': 'loc_yatoshin',
                    'Karyu': 'loc_haryu',
                };
                
                const currentTag = locNation ? (nationSlugToLocationTag[locNation] || locNation) : null;
                const reqTag = requirements.nation_id;
                
                const isNationMatch = currentTag === reqTag || 
                                     (reqTag === 'loc_roland' && currentTag === 'loc_holy_empire') ||
                                     locNation === reqTag;

                if (!isNationMatch) {
                    return { valid: false, reason: `Must be in nation ${requirements.nation_id} (Current: ${locNation || 'unknown'})` };
                }
            } else {
                return { valid: false, reason: 'User location not set' };
            }
        }

        // 13. location_id: 特定のロケーションチェック
        if (requirements.location_id) {
            if (user.current_location_id) {
                const { data: loc } = await supabase
                    .from('locations')
                    .select('slug')
                    .eq('id', user.current_location_id)
                    .maybeSingle();
                if (loc?.slug !== requirements.location_id) {
                    return { valid: false, reason: `Must be in location ${requirements.location_id} (Current: ${loc?.slug || 'unknown'})` };
                }
            } else {
                return { valid: false, reason: 'User location not set' };
            }
        }

        // 5. min_reputation / max_reputation: 名声スコアチェック
        if (requirements.min_reputation !== undefined || requirements.max_reputation !== undefined) {
            // 現在地の名声を取得
            let repLocationName: string | null = null;
            if (user.current_location_id) {
                const { data: locData } = await supabase
                    .from('locations').select('name').eq('id', user.current_location_id).maybeSingle();
                repLocationName = locData?.name || null;
            }
            let repScore = 0;
            if (repLocationName) {
                const { data: repData } = await supabase
                    .from('reputations')
                    .select('score')
                    .eq('user_id', userId)
                    .eq('location_name', repLocationName)
                    .maybeSingle();
                repScore = repData?.score || 0;
            }
            if (requirements.min_reputation !== undefined && repScore < requirements.min_reputation) {
                return { valid: false, reason: `Reputation ${requirements.min_reputation} required (Current: ${repScore})` };
            }
            if (requirements.max_reputation !== undefined && repScore > requirements.max_reputation) {
                return { valid: false, reason: `Reputation must be ${requirements.max_reputation} or below (Current: ${repScore})` };
            }
        }

        // 6. require_item_id: 特定アイテム所持チェック
        if (requirements.require_item_id) {
            const { data: invItem } = await supabase
                .from('inventory')
                .select('id')
                .eq('user_id', userId)
                .eq('item_id', requirements.require_item_id)
                .maybeSingle();
            if (!invItem) {
                return { valid: false, reason: `Required item (ID: ${requirements.require_item_id}) not in inventory` };
            }
        }

        // 7. min_alignment_pct: アライメント割合チェック
        if (requirements.min_alignment_pct) {
            const { alignment: alignKey, min_pct } = requirements.min_alignment_pct;
            const { data: allWorldStates } = await supabase
                .from('world_states')
                .select('order_score, chaos_score, justice_score, evil_score');
            let totalOrder = 0, totalChaos = 0, totalJustice = 0, totalEvil = 0;
            if (allWorldStates) {
                for (const ws of allWorldStates) {
                    totalOrder += (ws as any).order_score || 0;
                    totalChaos += (ws as any).chaos_score || 0;
                    totalJustice += (ws as any).justice_score || 0;
                    totalEvil += (ws as any).evil_score || 0;
                }
            }
            const worldAlignPcts = calcAlignmentPcts(totalOrder, totalChaos, totalJustice, totalEvil);
            const ratioKey = alignKey + '_ratio';
            const pct = (worldAlignPcts as any)[ratioKey] || 50;
            if (pct < min_pct) {
                return { valid: false, reason: `World alignment ${alignKey} must be ${min_pct}%+ (Current: ${pct}%)` };
            }
        }

        // 8. align_evil: 悪アライメント優勢チェック
        if (requirements.align_evil) {
            const { data: allWorldStates } = await supabase
                .from('world_states')
                .select('order_score, chaos_score, justice_score, evil_score');
            let totalOrder = 0, totalChaos = 0, totalJustice = 0, totalEvil = 0;
            if (allWorldStates) {
                for (const ws of allWorldStates) {
                    totalOrder += (ws as any).order_score || 0;
                    totalChaos += (ws as any).chaos_score || 0;
                    totalJustice += (ws as any).justice_score || 0;
                    totalEvil += (ws as any).evil_score || 0;
                }
            }
            const worldAlignPcts = calcAlignmentPcts(totalOrder, totalChaos, totalJustice, totalEvil);
            if (worldAlignPcts.evil_ratio <= 50) {
                return { valid: false, reason: 'World Evil alignment must exceed 50%' };
            }
        }

        // 9. min_align_order / min_align_chaos: アライメント最小値チェック
        if (requirements.min_align_order || requirements.min_align_chaos) {
            const { data: allWorldStates } = await supabase
                .from('world_states')
                .select('order_score, chaos_score');
            let totalOrder = 0, totalChaos = 0;
            if (allWorldStates) {
                for (const ws of allWorldStates) {
                    totalOrder += (ws as any).order_score || 0;
                    totalChaos += (ws as any).chaos_score || 0;
                }
            }
            if (requirements.min_align_order && totalOrder < requirements.min_align_order) {
                return { valid: false, reason: `World Order alignment ${requirements.min_align_order} required (Current: ${totalOrder})` };
            }
            if (requirements.min_align_chaos && totalChaos < requirements.min_align_chaos) {
                return { valid: false, reason: `World Chaos alignment ${requirements.min_align_chaos} required (Current: ${totalChaos})` };
            }
        }

        // 10. min_vitality: 体力最小値チェック
        if (requirements.min_vitality) {
            if ((user.vitality || 0) < requirements.min_vitality) {
                return { valid: false, reason: `Vitality ${requirements.min_vitality} required (Current: ${user.vitality || 0})` };
            }
        }

        // 11. min_prosperity / max_prosperity: 繁栄度チェック（現在地の拠点）
        if (requirements.min_prosperity !== undefined || requirements.max_prosperity !== undefined) {
            let prosperity = 5; // デフォルト
            if (user.current_location_id) {
                const { data: loc } = await supabase
                    .from('locations')
                    .select('name')
                    .eq('id', user.current_location_id)
                    .maybeSingle();
                if (loc) {
                    const { data: ws } = await supabase
                        .from('world_states')
                        .select('prosperity_level')
                        .eq('location_name', loc.name)
                        .maybeSingle();
                    if (ws) prosperity = ws.prosperity_level ?? 5;
                }
            }
            if (requirements.min_prosperity !== undefined && prosperity < requirements.min_prosperity) {
                return { valid: false, reason: `Location prosperity ${requirements.min_prosperity} required (Current: ${prosperity})` };
            }
            if (requirements.max_prosperity !== undefined && prosperity > requirements.max_prosperity) {
                return { valid: false, reason: `Location prosperity must be ${requirements.max_prosperity} or below (Current: ${prosperity})` };
            }
        }

        // 12. event_trigger: イベントトリガーチェック（将来の拡張ポイント）
        if (requirements.event_trigger) {
            // 現在はワールドイベントシステムが未実装のため、常にパスさせる
            // TODO: world_events テーブルとの照合を実装
            console.warn(`[validateRequirements] event_trigger '${requirements.event_trigger}' check not yet implemented`);
        }

        return { valid: true };
    }

    static async getQuestsForLocation(userId: string, locationId: string | null, prefetchQuestId?: string | null): Promise<{ quests: any[]; special_quests: any[]; normal_quests: any[] }> {
        const { data: user, error: uError } = await supabaseServer
            .from('user_profiles')
            .select('id, level, gold, vitality, order_pts, chaos_pts, justice_pts, evil_pts, current_location_id')
            .eq('id', userId)
            .single();

        if (uError || !user) {
            throw new Error(uError?.message || 'User not found');
        }

        const [worldStateResult, allWorldStatesResult, inventoryResult, reputationsResult, completedQuestsResult, locationResult, scenariosResult, retiredResult] = await Promise.all([
            supabaseServer.from('world_states').select('id, prosperity_level, location_name').maybeSingle(),
            supabaseServer.from('world_states').select('id, order_score, chaos_score, justice_score, evil_score, updated_at'),
            supabaseServer.from('inventory').select('item_id, quantity').eq('user_id', userId),
            supabaseServer.from('reputations').select('location_name, score').eq('user_id', userId),
            supabaseServer.from('user_completed_quests').select('scenario_id').eq('user_id', userId),
            locationId
                ? supabaseServer.from('locations').select('name, ruling_nation_id, slug').eq('id', locationId).maybeSingle()
                : Promise.resolve({ data: null }),
            supabaseServer.from('scenarios')
                .select('id, slug, title, description, quest_type, requirements, conditions, rewards, rec_level, difficulty, is_urgent, client_name, impact, location_id, max_reputation, script_data, days_success, days_failure')
                .in('quest_type', ['normal', 'special'])
                .not('slug', 'like', 'ugc_%')
                .limit(200),
            supabaseServer.from('retired_characters').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const worldState = worldStateResult.data;
        const inventory = inventoryResult.data;
        const reputations = reputationsResult.data;
        const completedQuests = completedQuestsResult.data;
        const retiredCount = retiredResult.count || 0;
        const generation = retiredCount + 1;

         let currentNationSlug: string | null = locationResult.data?.ruling_nation_id || null;
        let currentLocationSlug: string | null = locationResult.data?.slug || null;
        if (locationResult.data?.name) {
            const { data: ws } = await supabaseServer.from('world_states')
                .select('controlling_nation')
                .eq('location_name', locationResult.data.name)
                .maybeSingle();
            if (ws?.controlling_nation) {
                currentNationSlug = ws.controlling_nation;
            }
        }
        const quests = scenariosResult.data || [];
        const currentProsperity = worldState?.prosperity_level || 3;

        let allWorldStates = allWorldStatesResult.data || [];

        // worldStateReset 処理は廃止され、世界状態の更新は Cron (updateWorldSimulation) に統合されたため、リセット処理は削除

        let worldAlignPcts = { order_ratio: 50, justice_ratio: 50, chaos_ratio: 50, evil_ratio: 50 };
        let worldAlignPts = { order: 0, chaos: 0, justice: 0, evil: 0 };
        if (allWorldStates && allWorldStates.length > 0) {
            let totalOrder = 0, totalChaos = 0, totalJustice = 0, totalEvil = 0;
            for (const ws of allWorldStates) {
                totalOrder += (ws as any).order_score || 0;
                totalChaos += (ws as any).chaos_score || 0;
                totalJustice += (ws as any).justice_score || 0;
                totalEvil += (ws as any).evil_score || 0;
            }
            worldAlignPcts = calcAlignmentPcts(totalOrder, totalChaos, totalJustice, totalEvil);
            worldAlignPts = { order: totalOrder, chaos: totalChaos, justice: totalJustice, evil: totalEvil };
        }

        const ownedItemIds = new Set((inventory || []).map((i: any) => String(i.item_id)));

        const repMap: Record<string, number> = {};
        for (const rep of (reputations || [])) {
            repMap[rep.location_name] = rep.score || 0;
        }

        const completedQuestIds = new Set((completedQuests || []).map((q: any) => String(q.scenario_id)));
        if (prefetchQuestId) {
            completedQuestIds.add(String(prefetchQuestId));
        }

        const slugToIdMap: Record<string, string> = {};
        for (const q of quests) {
            if (q.slug) slugToIdMap[q.slug] = String(q.id);
        }

        const nationSlugToLocationTag: Record<string, string> = {
            'Roland': 'loc_holy_empire',
            'Markand': 'loc_marcund',
            'Yato': 'loc_yatoshin',
            'Karyu': 'loc_haryu',
        };
        const currentLocationTag = currentNationSlug ? nationSlugToLocationTag[currentNationSlug] || null : null;

        const hasCompletedPrereq = (reqValue: string | number): boolean => {
            const reqStr = String(reqValue);
            if (completedQuestIds.has(reqStr)) return true;
            const resolvedId = slugToIdMap[reqStr];
            if (resolvedId && completedQuestIds.has(resolvedId)) return true;
            return false;
        };

        const specialQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'special') return false;
            if (completedQuestIds.has(String(q.id))) return false;

            const reqs = q.requirements || {};
            
            // 世代チェック (required_generations / min_generation)
            const reqGen = reqs.required_generations || reqs.min_generation;
            if (reqGen && generation < reqGen) return false;
            
            // ユーザーの現在地が指定の国家 (nation_id) に属しているかチェック
            if (reqs.nation_id && currentLocationTag) {
                const isNationMatch = reqs.nation_id === currentLocationTag ||
                                     (reqs.nation_id === 'loc_roland' && currentLocationTag === 'loc_holy_empire');
                if (!isNationMatch) return false;
            }

            // location_id チェック
            if (reqs.location_id && currentLocationSlug && reqs.location_id !== currentLocationSlug) {
                return false;
            }
            if (reqs.event_trigger) return false;
            if (reqs.require_item_id && !ownedItemIds.has(String(reqs.require_item_id))) return false;
            if (reqs.has_item && !ownedItemIds.has(String(reqs.has_item))) return false;

            if (reqs.completed_quest) {
                if (!hasCompletedPrereq(reqs.completed_quest)) return false;
            }

            const userAlignPcts = getUserAlignmentPcts(user as any);

            // 世界アライメント割合判定（対立軸ベース）
            if (reqs.align_evil && worldAlignPcts.evil_ratio <= 50) return false;
            if (reqs.min_align_chaos_pct && worldAlignPcts.chaos_ratio < reqs.min_align_chaos_pct) return false;
            if (reqs.min_align_order_pct && worldAlignPcts.order_ratio < reqs.min_align_order_pct) return false;
            if (reqs.min_align_evil_pct && worldAlignPcts.evil_ratio < reqs.min_align_evil_pct) return false;
            if (reqs.min_align_justice_pct && worldAlignPcts.justice_ratio < reqs.min_align_justice_pct) return false;
            if (reqs.min_align_chaos && !reqs.min_align_chaos_pct && worldAlignPts.chaos < reqs.min_align_chaos) return false;
            if (reqs.min_align_order && !reqs.min_align_order_pct && worldAlignPts.order < reqs.min_align_order) return false;

            const worldAlignReq = reqs.min_world_alignment || reqs.min_alignment_pct;
            if (worldAlignReq) {
                const axis = worldAlignReq.axis || worldAlignReq.alignment;
                const minPct = worldAlignReq.min_pct || 50;
                const currentPct = (worldAlignPcts as any)[axis + '_ratio'] || 50;
                if (currentPct < minPct) return false;
            }

            if (reqs.alignment_and && Array.isArray(reqs.alignment_and)) {
                for (const cond of reqs.alignment_and) {
                    const source = cond.scope === 'world' ? worldAlignPcts : userAlignPcts;
                    const ratioKey = cond.axis + '_ratio';
                    const currentVal = (source as any)[ratioKey] || 50;
                    if (currentVal < (cond.min_pct || 0)) return false;
                }
            }

            if (reqs.max_prosperity && currentProsperity > reqs.max_prosperity) return false;
            if (reqs.min_prosperity && currentProsperity < reqs.min_prosperity) return false;
            if (reqs.min_vitality && (user.vitality || 0) < reqs.min_vitality) return false;
            if (reqs.min_level && user.level < reqs.min_level) return false;

            if (reqs.min_reputation) {
                const repRequired = typeof reqs.min_reputation === 'number'
                    ? reqs.min_reputation
                    : (reqs.min_reputation[locationId || q.location_id] || 0);
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual < repRequired) return false;
            }

            if (q.max_reputation !== null && q.max_reputation !== undefined) {
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual > q.max_reputation) return false;
            }

            return true;
        });

        const normalQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'normal') return false;

            const conds = q.conditions || {};
            const reqs = q.requirements || {};

            if (conds.min_prosperity && currentProsperity < conds.min_prosperity) return false;
            if (conds.max_prosperity && currentProsperity > conds.max_prosperity) return false;

            if (conds.location_tags) {
                const tags = Array.isArray(conds.location_tags)
                    ? conds.location_tags
                    : String(conds.location_tags).split(',').map((t: string) => t.trim());
                if (!tags.includes('all')) {
                    if (!currentLocationTag || !tags.includes(currentLocationTag)) return false;
                }
            }

            if (conds.completed_quest) {
                if (!hasCompletedPrereq(conds.completed_quest)) return false;
            }

            const minRep = conds.min_reputation || reqs.min_reputation;
            if (minRep) {
                const repRequired = typeof minRep === 'number'
                    ? minRep
                    : (minRep[locationId || q.location_id] || 0);
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual < repRequired) return false;
            }

            const maxRep = conds.max_reputation ?? q.max_reputation;
            if (maxRep !== null && maxRep !== undefined) {
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual > maxRep) return false;
            }

            return true;
        });

        const getDifficultyTier = (recLevel: number): 'easy' | 'normal' | 'hard' => {
            if (recLevel <= 3) return 'easy';
            if (recLevel <= 7) return 'normal';
            return 'hard';
        };

        const mapQuest = (q: any) => {
            const recLevel = q.rec_level || q.requirements?.min_level || 1;
            const rewards = q.rewards || {};
            return {
                ...q,
                reward_gold: rewards.gold || 0,
                reward_exp: rewards.exp || 0,
                reward_reputation: rewards.reputation || 0,
                reward_items: rewards.items || [],
                reward_alignment: rewards.alignment_shift || null,
                reward_vitality: rewards.vitality_cost || 0,
                reward_npc: rewards.npc_reward || null,
                impacts: q.impact,
                difficulty_tier: getDifficultyTier(recLevel),
                short_flavor: q.script_data?.short_description || q.description || '',
                long_flavor: q.script_data?.nodes?.start?.text || q.description || '',
                is_ugc: q.slug?.startsWith('ugc_') || false,
                days_success: q.days_success ?? 1,
                days_failure: q.days_failure ?? 1,
            };
        };

        const shuffled = [...normalQuests].sort(() => Math.random() - 0.5);
        const tierLimits: Record<string, number> = { easy: 0, normal: 0, hard: 0 };
        const TIER_MAX: Record<string, number> = { easy: 5, normal: 3, hard: 1 };
        const limitedNormalQuests = shuffled.filter((q: any) => {
            const recLevel = q.rec_level || q.requirements?.min_level || 1;
            const tier = getDifficultyTier(recLevel);
            if (tierLimits[tier] >= TIER_MAX[tier]) return false;
            tierLimits[tier]++;
            return true;
        });

        const SPECIAL_TIER_MAX: Record<string, number> = { easy: 3, normal: 2, hard: 2 };
        const specialTierLimits: Record<string, number> = { easy: 0, normal: 0, hard: 0 };
        const shuffledSpecial = [...specialQuests].sort(() => Math.random() - 0.5);
        const limitedSpecialQuests = shuffledSpecial.filter((q: any) => {
            const isMainScenario = q.slug && q.slug.startsWith('main_ep');
            if (isMainScenario) return true;
            const recLevel = q.rec_level || q.requirements?.min_level || 1;
            const tier = getDifficultyTier(recLevel);
            if (specialTierLimits[tier] >= SPECIAL_TIER_MAX[tier]) return false;
            specialTierLimits[tier]++;
            return true;
        });

        const allQuests = [...limitedSpecialQuests, ...limitedNormalQuests]
            .sort((a: any, b: any) => {
                if (a.is_urgent !== b.is_urgent) return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0);
                return (a.rec_level || 1) - (b.rec_level || 1);
            })
            .map(mapQuest);

        return {
            quests: allQuests,
            special_quests: allQuests.filter((q: any) => q.quest_type === 'special'),
            normal_quests: allQuests.filter((q: any) => q.quest_type === 'normal')
        };
    }
}

