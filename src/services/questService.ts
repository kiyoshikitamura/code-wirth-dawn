
import { createClient } from '@supabase/supabase-js';
import { UserProfile, ScenarioReward, LocationDB } from '@/types/game';
import { GROWTH_RULES } from '@/constants/game_rules';

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

    // 2. Try as Name
    const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('name', identifier)
        .maybeSingle();

    return data?.id || null;
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
            .select('level, current_location_id, vitality, alignment, gold')
            .eq('id', userId)
            .single();

        if (!user) return { valid: false, reason: 'User profile not found' };

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

        // 3. completed_quest: 前提クエスト完了チェック (ID or Slug)
        if (requirements.completed_quest) {
            const reqVal = String(requirements.completed_quest);
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
                if (!data) return { valid: false, reason: 'Prerequisite quest not completed' };
            } else {
                return { valid: false, reason: 'Invalid prerequisite quest definition' };
            }
        }

        // 4. nation_id: ユーザーの現在地の国家チェック
        if (requirements.nation_id) {
            if (user.current_location_id) {
                const { data: loc } = await supabase
                    .from('locations')
                    .select('slug, nation_id')
                    .eq('id', user.current_location_id)
                    .maybeSingle();
                // nation_id は locations テーブルの nation_id カラム、または slug ベースで判定
                const locNation = loc?.nation_id || loc?.slug;
                if (locNation !== requirements.nation_id) {
                    return { valid: false, reason: `Must be in nation ${requirements.nation_id} (Current: ${locNation || 'unknown'})` };
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
                .from('user_inventory')
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
            const alignment = user.alignment || {};
            const total = (alignment.order || 0) + (alignment.chaos || 0) + (alignment.justice || 0) + (alignment.evil || 0);
            const alignVal = alignment[alignKey] || 0;
            const pct = total > 0 ? (alignVal / total) * 100 : 0;
            if (pct < min_pct) {
                return { valid: false, reason: `Alignment ${alignKey} must be ${min_pct}%+ (Current: ${Math.floor(pct)}%)` };
            }
        }

        // 8. align_evil: 悪アライメント優勢チェック
        if (requirements.align_evil) {
            const alignment = user.alignment || {};
            if ((alignment.evil || 0) <= (alignment.justice || 0)) {
                return { valid: false, reason: 'Evil alignment must exceed Justice' };
            }
        }

        // 9. min_align_order / min_align_chaos: アライメント最小値チェック
        if (requirements.min_align_order) {
            const orderVal = user.alignment?.order || 0;
            if (orderVal < requirements.min_align_order) {
                return { valid: false, reason: `Order alignment ${requirements.min_align_order} required (Current: ${orderVal})` };
            }
        }
        if (requirements.min_align_chaos) {
            const chaosVal = user.alignment?.chaos || 0;
            if (chaosVal < requirements.min_align_chaos) {
                return { valid: false, reason: `Chaos alignment ${requirements.min_align_chaos} required (Current: ${chaosVal})` };
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
                const { data: locState } = await supabase
                    .from('location_states')
                    .select('prosperity')
                    .eq('location_id', user.current_location_id)
                    .maybeSingle();
                if (locState) prosperity = locState.prosperity || 5;
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
}
