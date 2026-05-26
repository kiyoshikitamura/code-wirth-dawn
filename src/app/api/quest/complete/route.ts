
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as anonSupabase } from '@/lib/supabase';
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
        let user_id: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authErr } = await anonSupabase.auth.getUser(token);
            if (!authErr && user) user_id = user.id;
        }

        if (!quest_id || !user_id) {
            return NextResponse.json({ error: 'Missing parameters or authentication required' }, { status: 401 });
        }

        // ═══════════════════════════════════════
        // §1. データ取得 + バリデーション
        // ═══════════════════════════════════════
        // UGC v2: ugc_scenariosから先に検索し、見つからなければ公式scenariosから取得
        let quest: any = null;
        let isUgcV2 = false;

        const { data: ugcQuest } = await supabase
            .from('ugc_scenarios').select('*').eq('id', quest_id).single();

        if (ugcQuest) {
            quest = ugcQuest;
            isUgcV2 = true;
            // UGCクエストのplay_count/clear_countインクリメント
            await supabase.rpc('increment_ugc_play_count', { p_scenario_id: quest_id });
        } else {
            const { data: officialQuest, error: qError } = await supabase
                .from('scenarios').select('*').eq('id', quest_id).single();
            if (qError || !officialQuest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
            quest = officialQuest;
        }

        console.log(`[QuestComplete] ID: ${quest_id}, UGCv2: ${isUgcV2}, Rewards:`, quest?.rewards, 'NodeRewards:', node_rewards);

        const { data: user, error: uError } = await supabase
            .from('user_profiles').select('*').eq('id', user_id).single();

        if (uError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

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

        // バトル敗北ペナルティ
        let battleDefeatVitPenalty = 0;
        if (result === 'failure' && battle_defeat) {
            battleDefeatVitPenalty = 1;
            const currentVit = updates.vitality ?? user.vitality ?? 100;
            updates.vitality = Math.max(0, currentVit - battleDefeatVitPenalty);
            updates.hp = user.max_hp || 100;
        }

        // ═══════════════════════════════════════
        // §3. EXP + レベルアップ
        // ═══════════════════════════════════════
        let levelUpInfo: any = null;
        if (result === 'success') {
            const currentLevel = user.level || 1;
            const currentExp = Number(user.exp || 0);
            const difficulty = quest.difficulty || 1;
            const expFallback = difficulty * (Math.floor(Math.random() * 41) + 10);
            const questExp = (quest.rewards?.exp) || expFallback;
            const battleCount = Array.isArray(history) ? history.filter((h: any) => h.nodeType === 'battle').length : 0;
            const battleBonus = battleCount * (Math.floor(Math.random() * 101) + 100);
            const earnedExp = questExp + battleBonus;

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
        if (currentTotalDays === 0 && (user.age || 18) > 18) {
            currentTotalDays = ((user.age || 18) - 18) * 365 + (user.age_days || 0);
        }
        updates.accumulated_days = currentTotalDays + daysPassed;

        // ═══════════════════════════════════════
        // §4. 報酬 + 移動 + アライメント
        // ═══════════════════════════════════════
        let alignmentShift: Record<string, number> | null = null;
        if (result === 'success') {
            const rewards = node_rewards || quest.rewards || {};

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

        // ═══════════════════════════════════════
        // §7. Gold + アイテム/スキル付与
        // ═══════════════════════════════════════
        const effectiveRewards = (result === 'success' && node_rewards) ? node_rewards : quest.rewards;

        // UGC v2: 固定報酬上書き
        if (isUgcV2 && result === 'success') {
            const ugcGold = UGC_REWARD_LIMITS.fixed_gold;
            const { error: goldError } = await supabase
                .rpc('increment_gold', { p_user_id: user_id, p_amount: ugcGold });
            if (goldError) console.error('Failed to increment UGC gold:', goldError);
            // clear_countインクリメント
            await supabase.rpc('increment_ugc_clear_count', { p_scenario_id: quest_id });
        } else if (result === 'success' && effectiveRewards?.gold) {
            const { error: goldError } = await supabase
                .rpc('increment_gold', { p_user_id: user_id, p_amount: effectiveRewards.gold });
            if (goldError) console.error('Failed to increment gold via RPC:', goldError);
        }

        if (result === 'success') {
            await grantRewardItems(supabase, user_id, effectiveRewards, lootSaved);
        }

        // ═══════════════════════════════════════
        // §8. ゲストNPC正規雇用
        // ═══════════════════════════════════════
        const guestConversion = result === 'success'
            ? await convertGuestToPartyMember(supabase, user_id, body)
            : null;

        // ═══════════════════════════════════════
        // §9. パーティVIT摩耗 + メメント
        // ═══════════════════════════════════════
        const defeatedIds: string[] = Array.isArray(body.defeated_member_ids)
            ? body.defeated_member_ids.map((id: any) => String(id))
            : [];
        const partyChanges = await processPartyWearCycle(supabase, user_id, result, defeatedIds);

        // ═══════════════════════════════════════
        // §10. 戦利品保存
        // ═══════════════════════════════════════
        if (result === 'success') {
            await persistLootPool(supabase, user_id, loot_pool);
        }

        // ═══════════════════════════════════════
        // §11. 号外シェアシステム
        // ═══════════════════════════════════════
        const shareDataList: any[] = [];

        if (result === 'success') {
            const questSlug = quest.slug || '';

            // UGC First Blood
            if (quest.is_ugc) {
                const { count: priorClears } = await supabase
                    .from('user_completed_quests').select('*', { count: 'exact', head: true })
                    .eq('scenario_id', quest_id);
                if (priorClears === 0) {
                    const sd = buildShareData('ugc_first_blood', { quest_name: quest.title || '' });
                    if (sd) shareDataList.push(sd);
                }
            }

            // メインクエスト章クリア
            if (questSlug.startsWith('main_ep')) {
                const fired = await checkAndFireTrigger(supabase, user_id, 'main_quest_clear', questSlug);
                if (fired) {
                    const chapter = questSlug.replace('main_ep', '').replace(/^0+/, '') || '?';
                    const sd = buildShareData('main_quest_clear', { chapter, quest_name: quest.title || '' });
                    if (sd) shareDataList.push(sd);
                }
            }

            // 全クエスト初回クリア
            if (questSlug) {
                const fired = await checkAndFireTrigger(supabase, user_id, 'quest_first_clear', questSlug);
                if (fired) {
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

        // ═══════════════════════════════════════
        // §13. クエスト完了履歴
        // ═══════════════════════════════════════
        if (result === 'success') {
            const { error: historyError } = await supabase
                .from('user_completed_quests')
                .upsert({
                    user_id, scenario_id: quest_id,
                    accumulated_days_at_completion: user.accumulated_days ?? 0
                }, { onConflict: 'user_id,scenario_id' });
            if (historyError) console.error("Failed to save quest completion history:", historyError);
        }

        // Record quest activity log (Spec Dashboard Extensions)
        const { error: logErr } = await supabase
            .from('quest_activity_logs')
            .insert({
                user_id,
                scenario_id: quest_id,
                action: result === 'success' ? 'complete' : 'abandon'
            });
        if (logErr) {
            console.error('[Quest Complete] Failed to write quest_activity_logs:', logErr);
        }

        // ═══════════════════════════════════════
        // §14. レスポンス構築
        // ═══════════════════════════════════════
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
