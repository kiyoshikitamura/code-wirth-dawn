
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as anonSupabase } from '@/lib/supabase';
import { QuestService, calculateGrowth, processAging, resolveLocationId } from '@/services/questService';
import { ECONOMY_RULES } from '@/constants/game_rules';

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
 * Handles quest completion logic v3.0 (Refactored)
 */
export async function POST(req: Request) {
    try {
        if (!supabaseServiceKey) {
            console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Key' }, { status: 500 });
        }

        const body = await req.json();
        const { quest_id, result, history, loot_pool, consumed_items } = body;

        // [Security] JWT認証必須化 — body.user_idを信頼しない
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

        // 1. Fetch Quest
        const { data: quest, error: qError } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', quest_id)
            .single();

        console.log(`[QuestComplete] ID: ${quest_id}, Rewards:`, quest?.rewards);

        if (qError || !quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });

        // 2. Fetch User
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (uError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 2.5 Security Validation
        const validation = await QuestService.validateRequirements(supabase, user_id, quest.requirements);
        if (!validation.valid) {
            console.warn(`[Security] API rejected quest completion. User ${user_id} blocked from ${quest_id}: ${validation.reason}`);
            return NextResponse.json({ error: 'Quest prerequisites not met: ' + validation.reason }, { status: 403 });
        }

        // 3. Aging Logic
        let daysPassed = 1;
        if (result === 'success') daysPassed = quest.days_success ?? 1; // Allow 0
        else if (result === 'failure') daysPassed = quest.days_failure ?? 1; // Allow 0

        const { newAge, newAgeDays, decay } = processAging(
            user.age || 18,
            user.age_days || 0,
            daysPassed
        );

        const updates: any = {
            age: newAge,
            age_days: newAgeDays
        };

        // Apply Vitality/ATK/DEF Decay
        if (decay.vit > 0 || decay.atk > 0 || decay.def > 0) {
            updates.max_vitality = Math.max(0, (user.max_vitality || 100) - decay.vit);
            updates.vitality = Math.min(user.vitality || 100, updates.max_vitality);

            const currentAtk = user.atk || user.attack || 1;
            const currentDef = user.def || 1;
            updates.atk = Math.max(1, currentAtk - decay.atk);
            updates.def = Math.max(1, currentDef - decay.def);
        }


        // 5. EXP & Level Up Logic
        let levelUpInfo: any = null;
        if (result === 'success') {
            const currentLevel = user.level || 1;
            const currentExp = Number(user.exp || 0);

            const difficulty = quest.difficulty || 1;
            // v15.0: フォールバックEXPをランダム化 (difficulty * randInt(10, 50))
            const expFallback = difficulty * (Math.floor(Math.random() * 41) + 10); // difficulty * 10〜50
            const questExp = (quest.rewards?.exp) || expFallback;

            // v15.0: バトルボーナスをランダム化 (battleCount * randInt(100, 200))
            const battleCount = Array.isArray(history) ? history.filter((h: any) => h.nodeType === 'battle').length : 0;
            const battleBonus = battleCount * (Math.floor(Math.random() * 101) + 100); // 100〜200/戦闘
            const earnedExp = questExp + battleBonus;

            // Use Service for calculation
            const growthResult = calculateGrowth(
                currentLevel,
                currentExp,
                earnedExp,
                updates.atk || user.atk || 1,
                updates.def || user.def || 1,
                user.max_hp || 85  // v15.0: currentMaxHp を渡して累積加算方式に対応
            );

            updates.exp = growthResult.newExp;

            if (growthResult.levelInfo.level_up) {
                const info = growthResult.levelInfo;
                updates.level = info.new_level;
                updates.max_hp = info.new_max_hp;
                updates.hp = info.new_max_hp; // Heal on level up
                updates.max_deck_cost = info.new_max_cost;

                // Add growth to current (possibly decayed) stats
                const preGrowthAtk = updates.atk || user.atk || 1;
                const preGrowthDef = updates.def || user.def || 1;

                updates.atk = preGrowthAtk + info.atk_increase;
                updates.def = preGrowthDef + info.def_increase;

                levelUpInfo = info;
            }
        }

        // Update Accumulated Days (Total Play Time)
        // If accumulated_days is missing/zero, approximate it from age
        let currentTotalDays = user.accumulated_days || 0;
        if (currentTotalDays === 0 && (user.age || 18) > 18) {
            currentTotalDays = ((user.age || 18) - 18) * 365 + (user.age_days || 0);
        }
        updates.accumulated_days = currentTotalDays + daysPassed;

        // 4. Rewards & Travel (Success Only)
        if (result === 'success') {
            const rewards = quest.rewards || {};

            // Gold (handled via RPC now, do not put in updates)
            if (rewards.gold) {
                // updates.gold = (user.gold || 0) + rewards.gold; // Removed to use RPC later
            }

            // Travel (move_to)
            if (rewards.move_to) {
                const newLocationId = await resolveLocationId(supabase, rewards.move_to);
                if (newLocationId) {
                    updates.current_location_id = newLocationId;
                } else {
                    console.warn(`Quest Complete: Location '${rewards.move_to}' not found.`);
                }
            }
        }

        // 6. Update Hub State (if moved)
        if (updates.current_location_id) {
            const hubId = await resolveLocationId(supabase, '名もなき旅人の拠所');
            const isReturningToHub = updates.current_location_id === hubId;

            const { error: hubError } = await supabase
                .from('user_hub_states')
                .upsert({
                    user_id: user_id,
                    is_in_hub: isReturningToHub,
                }, { onConflict: 'user_id' });

            if (hubError) {
                console.error("Failed to update Hub State:", hubError);
            }

            // Update World State for the Target Location
            // We want to force the world time to match the user's journey time (for consistency in single player view)
            try {
                // Get Location Name
                const { data: locData } = await supabase
                    .from('locations')
                    .select('name')
                    .eq('id', updates.current_location_id)
                    .single();

                if (locData) {
                    // Update or Insert World State
                    // If it doesn't exist, we just init with basic defaults + correct time
                    const payload = {
                        location_id: updates.current_location_id,
                        location_name: locData.name,
                        total_days_passed: updates.accumulated_days,
                        // Default values if inserting
                        status: '安定',
                        prosperity_level: 50,
                        controlling_nation: 'Neutral'
                    };

                    // We use upsert. Note: logic to not overwrite existing prosperity/nation if exists?
                    // On conflict (location_id) DO UPDATE SET total_days_passed = EXCLUDED.total_days_passed
                    // Supabase upsert handles this if we specify conflict target. 
                    // However, we don't want to reset prosperity if it exists.

                    const { data: existingWS } = await supabase
                        .from('world_states')
                        .select('id')
                        .eq('location_id', updates.current_location_id)
                        .maybeSingle();

                    if (existingWS) {
                        await supabase
                            .from('world_states')
                            .update({ total_days_passed: updates.accumulated_days })
                            .eq('id', existingWS.id);
                    } else {
                        await supabase
                            .from('world_states')
                            .insert(payload);
                    }
                }
            } catch (wsErr) {
                console.error("Failed to update World State time:", wsErr);
            }
        } else {
            // If we didn't move (stayed in same location), update current location's time?
            // Assuming we have location_id from user profile (previous)
            if (user.current_location_id) {
                const { data: existingWS } = await supabase
                    .from('world_states')
                    .select('id')
                    .eq('location_id', user.current_location_id)
                    .maybeSingle();

                if (existingWS) {
                    await supabase
                        .from('world_states')
                        .update({ total_days_passed: updates.accumulated_days })
                        .eq('id', existingWS.id);
                }
            }
        }


        // 7. Release Quest Lock & Clear Blessing (spec_v16 §4: バトル終了でBlessingを消費)
        updates.current_quest_id = null;
        updates.blessing_data = null; // Blessing は次のバトル終了で消費される

        console.log('[QuestComplete] Updates payload:', JSON.stringify(updates, null, 2));

        // Apply User Updates
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user_id);

        if (updateError) throw updateError;
        
        // Apply Gold Update via RPC if rewards.gold exists
        if (result === 'success' && quest.rewards?.gold) {
            const { error: goldError } = await supabase
                .rpc('increment_gold', { p_user_id: user_id, p_amount: quest.rewards.gold });
            if (goldError) {
                console.error("Failed to increment gold via RPC:", goldError);
            }
        }

        // 7.5 Moore Wear Cycle (摩耗サイクル) & Memento Generation
        if (result === 'success') {
            const { data: activeParty } = await supabase
                .from('party_members')
                .select('id, name, durability, inject_cards')
                .eq('owner_id', user_id)
                .eq('is_active', true);
            
            if (activeParty && activeParty.length > 0) {
                for (const member of activeParty) {
                    const newDurability = Math.max(0, (member.durability || 100) - 10); // Minus 10 per quest
                    
                    if (newDurability <= 0) {
                        // Delete member
                        await supabase.from('party_members').delete().eq('id', member.id);
                        console.log(`[Moore] Party member ${member.name} perished due to wear.`);

                        // Generate Memento Item (形見アイテム) from their signature deck
                        if (member.inject_cards && member.inject_cards.length > 0) {
                            // Give them the first valid card as an item or just a generic Memento
                            const skillCardId = member.inject_cards[0];
                            const { data: card } = await supabase.from('cards').select('id, name').eq('id', skillCardId).maybeSingle();
                            if (card) {
                                // Assume there's a corresponding item_id for this card, or we just insert it
                                // For simplicity, we insert the skill item directly if we can find its item master,
                                // but we need the `items` table id. We can look it up by `linked_card_id`.
                                const { data: item } = await supabase.from('items').select('id, name').eq('linked_card_id', card.id).maybeSingle();
                                if (item) {
                                    const { data: existingInv } = await supabase
                                        .from('inventory')
                                        .select('id, quantity')
                                        .eq('user_id', user_id)
                                        .eq('item_id', item.id)
                                        .maybeSingle();

                                    if (existingInv) {
                                        await supabase.from('inventory').update({ quantity: existingInv.quantity + 1 }).eq('id', existingInv.id);
                                    } else {
                                        await supabase.from('inventory').insert({ user_id, item_id: item.id, quantity: 1 });
                                    }
                                    console.log(`[Memento] Created memento item ${item.name} from perished shadow ${member.name}.`);
                                }
                            }
                        }
                    } else {
                        // Just update durability
                        await supabase.from('party_members').update({ durability: newDurability }).eq('id', member.id);
                    }
                }
            }
        }

        // 8. Loot Pool Persistence (Success only)
        let lootSaved: any[] = [];
        if (result === 'success' && Array.isArray(loot_pool) && loot_pool.length > 0) {
            for (const loot of loot_pool) {
                const { data: existing } = await supabase
                    .from('inventory')
                    .select('id, quantity')
                    .eq('user_id', user_id)
                    .eq('item_id', loot.itemId)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('inventory')
                        .update({ quantity: existing.quantity + (loot.quantity || 1) })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('inventory')
                        .insert({ user_id, item_id: loot.itemId, quantity: loot.quantity || 1 });
                }
                lootSaved.push(loot);
            }
        }

        // 8.5 UGC First Blood Check & Share Text
        let finalShareText = quest.share_text || null;
        if (result === 'success' && quest.is_ugc) {
            const { count: priorClears } = await supabase
                .from('user_completed_quests')
                .select('*', { count: 'exact', head: true })
                .eq('scenario_id', quest_id);

            if (priorClears === 0) {
                finalShareText = `名も無き旅人の依頼『${quest.title}』を世界で初めて踏破した。 #Wirth_Dawn #未知への到達`;
            }
        }

        // 8.7 クエスト失敗時の名声ペナルティ (spec_v16 §3.1)
        if (result === 'failure' && user.current_location_id) {
            const penaltyMin = Math.abs(ECONOMY_RULES.QUEST_FAIL_REP_PENALTY_MIN); // 5
            const penaltyMax = Math.abs(ECONOMY_RULES.QUEST_FAIL_REP_PENALTY_MAX); // 10
            const repPenalty = -(Math.floor(Math.random() * (penaltyMax - penaltyMin + 1)) + penaltyMin);

            // upsert: 既存レコードがあれば加算、なければ新規作成
            // location_nameを取得
            const { data: locForRep } = await supabase.from('locations').select('name').eq('id', user.current_location_id).maybeSingle();
            const repLocName = locForRep?.name;
            if (repLocName) {
                const { data: existingRep } = await supabase
                    .from('reputations')
                    .select('id, score')
                    .eq('user_id', user_id)
                    .eq('location_name', repLocName)
                    .maybeSingle();

                if (existingRep) {
                    await supabase
                        .from('reputations')
                        .update({ score: existingRep.score + repPenalty })
                        .eq('id', existingRep.id);
                } else {
                    await supabase
                        .from('reputations')
                        .insert({ user_id, location_name: repLocName, score: repPenalty });
                }
                console.log(`[QuestComplete] Failure rep penalty: ${repPenalty} for user ${user_id} at ${repLocName}`);
            }
        }

        // 9. World Impact & Quest Completion History
        if (result === 'success') {
            // Save quest completion history
            // Use onConflict to ignore if already completed (though we shouldn't get here if they couldn't start it again,
            // but for repeatable quests, we might just update completed_at or do nothing)
            const { error: historyError } = await supabase
                .from('user_completed_quests')
                .upsert({
                    user_id: user_id,
                    scenario_id: quest_id,
                    // spec_v15.1 §4: はれ時のゲーム内経過日数を記録（聖界性暦変換に使用）
                    accumulated_days_at_completion: user.accumulated_days ?? 0
                }, { onConflict: 'user_id,scenario_id' });

            if (historyError) {
                console.error("Failed to save quest completion history:", historyError);
            }

            // (Simplified World Impact logic was here, kept omitted as in original)
        }

        // Calculate changes for UI
        const changes = {
            gold_gained: (quest.rewards?.gold || 0),
            old_age: user.age,
            new_age: updates.age,
            aged_up: (newAge - (user.age || 18)) > 0,
            years_added: Math.floor(daysPassed / 365), // Approx
            vit_penalty: decay.vit,
            atk_decay: decay.atk,
            def_decay: decay.def,
            level_up: levelUpInfo
        };

        return NextResponse.json({
            success: true,
            days_passed: daysPassed,
            new_location: updates.current_location_id,
            rewards: quest.rewards,
            loot_saved: lootSaved,
            share_text: finalShareText,
            changes
        });

    } catch (e: any) {
        console.error('Quest Complete API Critical Error:', e);
        return NextResponse.json({
            error: e.message || 'Unknown server error'
        }, { status: 500 });
    }
}
