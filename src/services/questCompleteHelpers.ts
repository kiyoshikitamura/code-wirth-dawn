/**
 * questCompleteHelpers.ts
 * quest/complete API のサブモジュール群
 * 804行のAPIを機能ごとに分割して保守性を向上
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { resolveLocationId } from '@/services/questService';

// ────────────────────────────────────────
// §1. アライメント処理
// ────────────────────────────────────────

/**
 * 個人アライメント + 拠点アライメントを一括更新
 */
export async function applyAlignmentShift(
    supabase: SupabaseClient,
    user: any,
    updates: any,
    rewards: any
): Promise<Record<string, number> | null> {
    if (!rewards.alignment_shift || typeof rewards.alignment_shift !== 'object') return null;

    const alignmentShift = rewards.alignment_shift;
    const columnMap: Record<string, string> = {
        order: 'order_pts', chaos: 'chaos_pts',
        justice: 'justice_pts', evil: 'evil_pts'
    };

    for (const [key, val] of Object.entries(alignmentShift)) {
        const col = columnMap[key];
        if (col && typeof val === 'number') {
            const currentVal = (user as any)[col] || 0;
            updates[col] = Math.max(0, currentVal + val);
        }
    }
    console.log(`[QuestComplete] Alignment shift:`, alignmentShift);

    // 拠点アライメント加算
    const questLocationId = user.current_location_id;
    if (questLocationId) {
        const { data: loc } = await supabase
            .from('locations')
            .select('name')
            .eq('id', questLocationId)
            .maybeSingle();
        const questLocationName = loc?.name;

        const worldColMap: Record<string, string> = {
            order: 'order_score', chaos: 'chaos_score',
            justice: 'justice_score', evil: 'evil_score'
        };
        for (const [key, val] of Object.entries(alignmentShift)) {
            const wCol = worldColMap[key];
            if (wCol && typeof val === 'number' && val > 0 && questLocationName) {
                // Read-Modify-Write による競合（ロストアップデート）を防ぐため、アトミックな RPC を使用して加算
                const { error: rpcError } = await supabase.rpc('increment_world_state_alignment', {
                    p_location_name: questLocationName,
                    p_column_name: wCol,
                    p_amount: val
                });
                if (rpcError) {
                    console.error(`[QuestComplete] Failed to increment location alignment via RPC:`, rpcError.message);
                }
            }
        }
        console.log(`[QuestComplete] Location alignment synced atomically to ${questLocationName || questLocationId}`);
    }

    return alignmentShift;
}

// ────────────────────────────────────────
// §2. Hub / WorldState 更新
// ────────────────────────────────────────

/**
 * Hub状態更新 + WorldState のtotal_days_passed同期
 */
export async function updateHubAndWorldState(
    supabase: SupabaseClient,
    user_id: string,
    user: any,
    updates: any
): Promise<void> {
    if (updates.current_location_id) {
        const hubId = await resolveLocationId(supabase, '名もなき旅人の拠所');
        const isReturningToHub = updates.current_location_id === hubId;

        const { error: hubError } = await supabase
            .from('user_hub_states')
            .upsert({ user_id, is_in_hub: isReturningToHub }, { onConflict: 'user_id' });
        if (hubError) console.error("Failed to update Hub State:", hubError);

        try {
            const { data: locData } = await supabase
                .from('locations').select('name')
                .eq('id', updates.current_location_id).single();

            if (locData) {
                const { data: existingWS } = await supabase
                    .from('world_states').select('id')
                    .eq('location_name', locData.name).maybeSingle();

                if (existingWS) {
                    await supabase.from('world_states')
                        .update({ total_days_passed: updates.accumulated_days })
                        .eq('id', existingWS.id);
                } else {
                    await supabase.from('world_states').insert({
                        location_name: locData.name,
                        total_days_passed: updates.accumulated_days,
                        status: '安定', prosperity_level: 3, controlling_nation: 'Neutral'
                    });
                }
            }
        } catch (wsErr) {
            console.error("Failed to update World State time:", wsErr);
        }
    } else if (user.current_location_id) {
        try {
            const { data: locData } = await supabase
                .from('locations').select('name')
                .eq('id', user.current_location_id).single();
            if (locData) {
                const { data: existingWS } = await supabase
                    .from('world_states').select('id')
                    .eq('location_name', locData.name).maybeSingle();
                if (existingWS) {
                    await supabase.from('world_states')
                        .update({ total_days_passed: updates.accumulated_days })
                        .eq('id', existingWS.id);
                }
            }
        } catch (wsErr) {
            console.error("Failed to update World State time for current location:", wsErr);
        }
    }
}

// ────────────────────────────────────────
// §3. 報酬付与（アイテム・スキル）
// ────────────────────────────────────────

/**
 * アイテム/スキル報酬をインベントリに付与
 */
export async function grantRewardItems(
    supabase: SupabaseClient,
    user_id: string,
    effectiveRewards: any,
    lootSaved: any[]
): Promise<void> {
    if (!effectiveRewards) return;

    // アイテム付与
    if (effectiveRewards.items && Array.isArray(effectiveRewards.items)) {
        for (const itemIdStr of effectiveRewards.items) {
            let itemId = parseInt(String(itemIdStr), 10);
            let itemDef: any = null;

            try {
                if (isNaN(itemId)) {
                    // 文字列Slug（"item_bear_pelt"など）が渡された場合、DBからIDを逆引きする
                    const { data: found } = await supabase
                        .from('items')
                        .select('id, name')
                        .eq('slug', itemIdStr)
                        .maybeSingle();
                    if (found) {
                        itemId = found.id;
                        itemDef = found;
                    } else {
                        console.warn(`[QuestComplete] Item slug '${itemIdStr}' not found in items table.`);
                        continue;
                    }
                } else {
                    const { data: found } = await supabase
                        .from('items')
                        .select('name')
                        .eq('id', itemId)
                        .maybeSingle();
                    if (found) {
                        itemDef = found;
                    } else {
                        console.warn(`[QuestComplete] Item ID '${itemId}' not found in items table. Skipping grant to prevent FK violation.`);
                        continue;
                    }
                }
            } catch (queryErr) {
                console.error(`[QuestComplete] Database error during item definition lookup for ${itemIdStr}:`, queryErr);
                itemDef = { name: `アイテム #${itemId}` };
            }

            const itemName = itemDef?.name || `アイテム #${itemId}`;

            try {
                const { data: existing } = await supabase
                    .from('inventory').select('id, quantity')
                    .eq('user_id', user_id).eq('item_id', itemId).maybeSingle();

                if (existing) {
                    await supabase.from('inventory').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
                } else {
                    await supabase.from('inventory').insert({ user_id, item_id: itemId, quantity: 1 });
                }
                console.log(`[QuestComplete] Granted item ${itemId} (${itemName})`);
            } catch (inventoryErr) {
                console.error(`[QuestComplete] Failed to update inventory for item ${itemId}:`, inventoryErr);
            }

            try {
                await supabase.from('user_item_history')
                    .insert({ user_id, item_id: itemId });
            } catch (histErr) {
                console.warn('[QuestComplete] Item history recording failed:', histErr);
            }

            lootSaved.push({ itemId, name: itemName, quantity: 1, type: 'item' });
        }
    }

    // スキル付与
    if (effectiveRewards.skills && Array.isArray(effectiveRewards.skills)) {
        for (const skillIdStr of effectiveRewards.skills) {
            const skillId = parseInt(String(skillIdStr), 10);
            if (isNaN(skillId)) continue;

            const { data: skillDef } = await supabase.from('skills').select('name').eq('id', skillId).maybeSingle();
            const skillName = skillDef?.name || `スキル #${skillId}`;

            const { data: existingSkill } = await supabase
                .from('user_skills').select('id')
                .eq('user_id', user_id).eq('skill_id', skillId).maybeSingle();

            if (!existingSkill) {
                await supabase.from('user_skills').insert({ user_id, skill_id: skillId });
                console.log(`[QuestComplete] Granted skill ${skillId}`);
                lootSaved.push({ itemId: skillId, name: skillName, quantity: 1, type: 'skill' });
            } else {
                // If skill is already learned, grant a random trade good instead
                console.log(`[QuestComplete] Skill ${skillId} (${skillName}) already owned, replacing with random trade good.`);
                const { data: tradeGoods } = await supabase
                    .from('items')
                    .select('id, name')
                    .in('type', ['trade_good', 'material']);
                
                if (tradeGoods && tradeGoods.length > 0) {
                    const picked = tradeGoods[Math.floor(Math.random() * tradeGoods.length)];
                    const tradeGoodId = picked.id;
                    const tradeGoodName = picked.name;

                    const { data: existingInv } = await supabase
                        .from('inventory').select('id, quantity')
                        .eq('user_id', user_id).eq('item_id', tradeGoodId).maybeSingle();

                    if (existingInv) {
                        await supabase.from('inventory').update({ quantity: existingInv.quantity + 1 }).eq('id', existingInv.id);
                    } else {
                        await supabase.from('inventory').insert({ user_id, item_id: tradeGoodId, quantity: 1 });
                    }
                    console.log(`[QuestComplete] Granted replaced trade good item ${tradeGoodId} (${tradeGoodName}) instead of skill ${skillId}`);

                    try {
                        await supabase.from('user_item_history').insert({ user_id, item_id: tradeGoodId });
                    } catch (histErr) {
                        console.warn('[QuestComplete] Item history recording failed:', histErr);
                    }

                    lootSaved.push({
                        itemId: tradeGoodId,
                        name: `${tradeGoodName} (スキル重複変換)`,
                        quantity: 1,
                        type: 'item'
                    });
                }
            }
        }
    }
}

// ────────────────────────────────────────
// §4. ゲストNPC正規雇用変換
// ────────────────────────────────────────

export async function convertGuestToPartyMember(
    supabase: SupabaseClient,
    user_id: string,
    body: any,
    quest?: any
): Promise<{ name: string; success: boolean; reason?: string } | null> {
    if (!body.remaining_guest?.slug) return null;

    const guestSlug = body.remaining_guest.slug;
    const guestName = body.remaining_guest.name || 'ゲストNPC';
    console.log(`[QuestComplete] ゲスト残留検出: ${guestName} (${guestSlug})`);

    const questId = body.quest_id;
    if (!questId) {
        console.warn(`[QuestComplete] ゲストNPC雇用試行時に quest_id が指定されていません`);
        return null;
    }

    // [Security] ゲストNPCのなりすまし検証（このクエストで出現したNPCか確認）
    let isGuestAllowed = false;
    const isColosseum = String(questId).startsWith('colosseum_');
    if (!isColosseum) {
        const scriptData = quest?.script_data;
        if (scriptData && scriptData.nodes) {
            const nodes = scriptData.nodes;
            for (const nodeId of Object.keys(nodes)) {
                const node = nodes[nodeId];
                if (node && node.type === 'guest_join' && node.params?.guest_id) {
                    if (String(node.params.guest_id).trim() === guestSlug) {
                        isGuestAllowed = true;
                        break;
                    }
                }
            }
        }
    }

    if (!isGuestAllowed) {
        console.warn(`[Security] Unauthorized guest NPC conversion blocked: user_id=${user_id}, quest_id=${questId}, npc_slug=${guestSlug}`);
        return { name: guestName, success: false, reason: 'このクエストで仲間になったNPCではありません。' };
    }

    try {
        const { data: npcData } = await supabase
            .from('npcs').select('*').eq('slug', guestSlug).maybeSingle();

        if (!npcData) {
            console.warn(`[QuestComplete] ゲストNPC "${guestSlug}" がnpcsテーブルに見つかりません`);
            return { name: guestName, success: false, reason: 'NPCデータが見つかりません。' };
        }

        const { count: partyCount } = await supabase
            .from('party_members').select('*', { count: 'exact', head: true })
            .eq('owner_id', user_id).eq('is_active', true);

        if ((partyCount || 0) >= 4) {
            return { name: guestName, success: false, reason: 'パーティが満員です（最大4名）。酒場で再契約できます。' };
        }

        const { data: existingMember } = await supabase
            .from('party_members').select('id')
            .eq('owner_id', user_id).eq('name', npcData.name).eq('is_active', true).maybeSingle();

        if (existingMember) {
            return { name: guestName, success: false, reason: '既にパーティに在籍しています。' };
        }

        const guestMaxHp = npcData.max_hp || npcData.hp || 100;
        let cardIds: number[] = [];
        if (npcData.default_cards && Array.isArray(npcData.default_cards)) {
            cardIds = npcData.default_cards;
        } else if (npcData.inject_card_ids && typeof npcData.inject_card_ids === 'string') {
            cardIds = npcData.inject_card_ids.split('|').map(Number).filter(Boolean);
        }

        const { error: insertError } = await supabase
            .from('party_members')
            .insert({
                owner_id: user_id, name: npcData.name, slug: npcData.slug,
                epithet: npcData.epithet || null,
                image_url: `/images/npcs/${npcData.slug}.png`,
                origin_type: 'quest_guest', level: npcData.level || 1,
                atk: npcData.atk || 0, def: npcData.def || 0,
                durability: 100, max_durability: guestMaxHp, // 初期VITを100に設定
                inject_cards: cardIds, is_active: true, royalty_rate: 0,
            });

        if (insertError) {
            console.error(`[QuestComplete] ゲスト雇用INSERT失敗:`, insertError.message);
            return { name: guestName, success: false, reason: insertError.message };
        }

        console.log(`[QuestComplete] ✅ ${guestName} がパーティに正式加入`);
        return { name: guestName, success: true };
    } catch (guestErr: any) {
        console.error('[QuestComplete] ゲスト→雇用変換エラー:', guestErr);
        return { name: guestName, success: false, reason: guestErr.message };
    }
}

// ────────────────────────────────────────
// §5. パーティVIT摩耗 + メメント生成
// ────────────────────────────────────────

export async function processPartyWearCycle(
    supabase: SupabaseClient,
    user_id: string,
    result: string,
    defeatedIds: string[]
): Promise<any[]> {
    const partyChanges: any[] = [];

    const { data: activeParty } = await supabase
        .from('party_members').select('id, name, durability, inject_cards, is_active')
        .eq('owner_id', user_id);

    if (!activeParty || activeParty.length === 0) return partyChanges;

    for (const member of activeParty) {
        const oldDurability = member.durability ?? 100;
        const effectiveOldDur = member.is_active === false ? 0 : oldDurability;
        // クエスト1回ごとにVITが1〜5ランダムでメンバー個別に減少する
        const totalPenalty = Math.floor(Math.random() * 5) + 1;
        const newDurability = Math.max(0, effectiveOldDur - totalPenalty);

        if (newDurability <= 0) {
            const { error: deleteError } = await supabase.from('party_members').delete().eq('id', member.id);
            if (deleteError) {
                console.error(`[Vitality] Failed to delete party member ${member.name}:`, deleteError.message);
                await supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', member.id);
            }
            console.log(`[Vitality] Party member ${member.name} perished (VIT 0). penalty=${totalPenalty}`);

            let mementoName: string | null = null;
            if (member.inject_cards && member.inject_cards.length > 0) {
                const skillCardId = member.inject_cards[0];
                const { data: card } = await supabase.from('cards').select('id, name').eq('id', skillCardId).maybeSingle();
                if (card) {
                    const { data: item } = await supabase.from('items').select('id, name').eq('linked_card_id', card.id).maybeSingle();
                    if (item) {
                        const { data: existingInv } = await supabase
                            .from('inventory').select('id, quantity')
                            .eq('user_id', user_id).eq('item_id', item.id).maybeSingle();
                        if (existingInv) {
                            await supabase.from('inventory').update({ quantity: existingInv.quantity + 1 }).eq('id', existingInv.id);
                        } else {
                            await supabase.from('inventory').insert({ user_id, item_id: item.id, quantity: 1 });
                        }
                        mementoName = item.name;
                        console.log(`[Memento] Created memento item ${item.name} from perished shadow ${member.name}.`);
                    } else {
                        // Fallback to "物資ボックス" (ID: 701, slug: 'item_supply_box') for basic/unlinked skills
                        const fallbackItemId = 701;
                        const { data: fallbackItem } = await supabase.from('items').select('id, name').eq('id', fallbackItemId).maybeSingle();
                        if (fallbackItem) {
                            const { data: existingInv } = await supabase
                                .from('inventory').select('id, quantity')
                                .eq('user_id', user_id).eq('item_id', fallbackItem.id).maybeSingle();
                            if (existingInv) {
                                await supabase.from('inventory').update({ quantity: existingInv.quantity + 1 }).eq('id', existingInv.id);
                            } else {
                                await supabase.from('inventory').insert({ user_id, item_id: fallbackItem.id, quantity: 1 });
                            }
                            mementoName = fallbackItem.name;
                            console.log(`[Memento] Created fallback memento item ${fallbackItem.name} from perished shadow ${member.name}.`);
                        }
                    }
                }
            }
            partyChanges.push({ name: member.name, oldDurability, newDurability: 0, perished: true, memento: mementoName });
        } else {
            await supabase.from('party_members').update({ durability: newDurability }).eq('id', member.id);
            partyChanges.push({ name: member.name, oldDurability, newDurability, perished: false });
        }
    }

    return partyChanges;
}

// ────────────────────────────────────────
// §6. 名声変動
// ────────────────────────────────────────

export async function processReputationChange(
    supabase: SupabaseClient,
    user_id: string,
    user: any,
    result: string,
    effectiveRewards: any,
    updates: any
): Promise<{ amount: number; location: string } | null> {
    // 成功時: rewards.reputation を名声報酬として加算
    if (result === 'success' && effectiveRewards?.reputation) {
        const repAmount = effectiveRewards.reputation;
        const locId = user.current_location_id || updates.current_location_id;
        if (locId) {
            const { data: locForRep } = await supabase.from('locations').select('name').eq('id', locId).maybeSingle();
            const repLocName = locForRep?.name;
            if (repLocName) {
                const { data: existingRep } = await supabase
                    .from('reputations').select('id, score').eq('user_id', user_id).eq('location_name', repLocName).maybeSingle();
                if (existingRep) {
                    await supabase.from('reputations').update({ score: existingRep.score + repAmount }).eq('id', existingRep.id);
                } else {
                    await supabase.from('reputations').insert({ user_id, location_name: repLocName, score: repAmount });
                }
                console.log(`[QuestComplete] Success rep reward: +${repAmount} at ${repLocName}`);
                return { amount: repAmount, location: repLocName };
            }
        }
    }

    // 失敗時: ランダムペナルティ
    if (result === 'failure' && user.current_location_id) {
        const repPenalty = -(Math.floor(Math.random() * 8) + 3); // ランダム -3〜-10
        const { data: locForRep } = await supabase.from('locations').select('name').eq('id', user.current_location_id).maybeSingle();
        const repLocName = locForRep?.name;
        if (repLocName) {
            const { data: existingRep } = await supabase
                .from('reputations').select('id, score').eq('user_id', user_id).eq('location_name', repLocName).maybeSingle();
            if (existingRep) {
                await supabase.from('reputations').update({ score: existingRep.score + repPenalty }).eq('id', existingRep.id);
            } else {
                await supabase.from('reputations').insert({ user_id, location_name: repLocName, score: repPenalty });
            }
            console.log(`[QuestComplete] Failure rep penalty: ${repPenalty} at ${repLocName}`);
            return { amount: repPenalty, location: repLocName };
        }
    }

    return null;
}

// ────────────────────────────────────────
// §7. 戦利品保存
// ────────────────────────────────────────

export async function persistLootPool(
    supabase: SupabaseClient,
    user_id: string,
    loot_pool: any[]
): Promise<void> {
    if (!Array.isArray(loot_pool) || loot_pool.length === 0) return;

    for (const loot of loot_pool) {
        const { data: existing } = await supabase
            .from('inventory').select('id, quantity')
            .eq('user_id', user_id).eq('item_id', loot.itemId).maybeSingle();

        if (existing) {
            await supabase.from('inventory')
                .update({ quantity: existing.quantity + (loot.quantity || 1) })
                .eq('id', existing.id);
        } else {
            await supabase.from('inventory')
                .insert({ user_id, item_id: loot.itemId, quantity: loot.quantity || 1 });
        }

        try {
            await supabase.from('user_item_history')
                .insert({ user_id, item_id: loot.itemId });
        } catch (histErr) {
            console.warn('[QuestComplete] Loot item history recording failed:', histErr);
        }
    }
}

// ────────────────────────────────────────
// §8. 使用済みアイテム一括遅延消費
// ────────────────────────────────────────

export async function consumeUsedItems(
    supabase: SupabaseClient,
    user_id: string,
    consumed_items: string[]
): Promise<void> {
    if (!Array.isArray(consumed_items) || consumed_items.length === 0) return;

    for (const itemRef of consumed_items) {
        if (!itemRef) continue;

        let query = supabase.from('inventory').select('id, quantity, item_id');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemRef);
        const isNumber = !isNaN(parseInt(itemRef, 10)) && String(parseInt(itemRef, 10)) === String(itemRef);

        if (isUuid) {
            query = query.eq('id', itemRef).eq('user_id', user_id);
        } else if (isNumber) {
            query = query.eq('item_id', parseInt(itemRef, 10)).eq('user_id', user_id);
        } else {
            try {
                const { data: itemRow } = await supabase.from('items').select('id').eq('slug', itemRef).maybeSingle();
                if (itemRow) {
                    query = query.eq('item_id', itemRow.id).eq('user_id', user_id);
                } else {
                    console.warn(`[QuestComplete] Consumed item slug '${itemRef}' not found in DB`);
                    continue;
                }
            } catch (e) {
                console.error(`[QuestComplete] Consumed item slug resolution error for '${itemRef}':`, e);
                continue;
            }
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            const newQty = (existing.quantity || 1) - 1;
            if (newQty <= 0) {
                await supabase.from('inventory').delete().eq('id', existing.id);
                console.log(`[QuestComplete] Item ${itemRef} completely consumed (deleted from inventory).`);
            } else {
                await supabase.from('inventory').update({ quantity: newQty }).eq('id', existing.id);
                console.log(`[QuestComplete] Item ${itemRef} quantity decremented to ${newQty}.`);
            }
        } else {
            console.warn(`[QuestComplete] Item ${itemRef} intended for consumption but not found in inventory.`);
        }
    }
}

/**
 * クエスト中に蓄積された名声変動を一括適用
 */
export async function grantReputationChanges(
    supabase: any,
    user_id: string,
    reputation_changes: Record<string, number>,
    currentLocationId: string | null
): Promise<void> {
    if (!reputation_changes || Object.keys(reputation_changes).length === 0) return;

    for (const [locationName, amount] of Object.entries(reputation_changes)) {
        let targetLoc = locationName;
        if (targetLoc === '現在地' && currentLocationId) {
            const { data: loc } = await supabase.from('locations').select('name').eq('id', currentLocationId).maybeSingle();
            if (loc) targetLoc = loc.name;
        }

        if (!targetLoc || targetLoc === '現在地') continue;

        const { data: existing } = await supabase
            .from('reputations')
            .select('id, score')
            .eq('user_id', user_id)
            .eq('location_name', targetLoc)
            .maybeSingle();

        if (existing) {
            await supabase.from('reputations')
                .update({ score: (existing.score || 0) + amount })
                .eq('id', existing.id);
        } else {
            await supabase.from('reputations')
                .insert({ user_id, location_name: targetLoc, score: amount });
        }
        console.log(`[QuestComplete/Reputation] Applied accumulated reputation change: ${amount} at ${targetLoc}`);
    }
}
