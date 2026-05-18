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
        const worldColMap: Record<string, string> = {
            order: 'order_score', chaos: 'chaos_score',
            justice: 'justice_score', evil: 'evil_score'
        };
        for (const [key, val] of Object.entries(alignmentShift)) {
            const wCol = worldColMap[key];
            if (wCol && typeof val === 'number' && val > 0) {
                const { data: ws } = await supabase
                    .from('world_states').select('*')
                    .eq('location_id', questLocationId).maybeSingle();
                if (ws) {
                    await supabase.from('world_states')
                        .update({ [wCol]: ((ws as any)[wCol] || 0) + val })
                        .eq('id', (ws as any).id);
                }
            }
        }
        console.log(`[QuestComplete] Location alignment synced to ${questLocationId}`);
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
                    .eq('location_id', updates.current_location_id).maybeSingle();

                if (existingWS) {
                    await supabase.from('world_states')
                        .update({ total_days_passed: updates.accumulated_days })
                        .eq('id', existingWS.id);
                } else {
                    await supabase.from('world_states').insert({
                        location_id: updates.current_location_id,
                        location_name: locData.name,
                        total_days_passed: updates.accumulated_days,
                        status: '安定', prosperity_level: 50, controlling_nation: 'Neutral'
                    });
                }
            }
        } catch (wsErr) {
            console.error("Failed to update World State time:", wsErr);
        }
    } else if (user.current_location_id) {
        const { data: existingWS } = await supabase
            .from('world_states').select('id')
            .eq('location_id', user.current_location_id).maybeSingle();
        if (existingWS) {
            await supabase.from('world_states')
                .update({ total_days_passed: updates.accumulated_days })
                .eq('id', existingWS.id);
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
            const itemId = parseInt(String(itemIdStr), 10);
            if (isNaN(itemId)) continue;

            const { data: itemDef } = await supabase.from('items').select('name').eq('id', itemId).maybeSingle();
            const itemName = itemDef?.name || `アイテム #${itemId}`;

            const { data: existing } = await supabase
                .from('inventory').select('id, quantity')
                .eq('user_id', user_id).eq('item_id', itemId).maybeSingle();

            if (existing) {
                await supabase.from('inventory').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
            } else {
                await supabase.from('inventory').insert({ user_id, item_id: itemId, quantity: 1 });
            }
            console.log(`[QuestComplete] Granted item ${itemId}`);

            try {
                await supabase.from('user_item_history')
                    .upsert({ user_id, item_id: itemId }, { onConflict: 'user_id,item_id', ignoreDuplicates: true });
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
    body: any
): Promise<{ name: string; success: boolean; reason?: string } | null> {
    if (!body.remaining_guest?.slug) return null;

    const guestSlug = body.remaining_guest.slug;
    const guestName = body.remaining_guest.name || 'ゲストNPC';
    console.log(`[QuestComplete] ゲスト残留検出: ${guestName} (${guestSlug})`);

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
                durability: guestMaxHp, max_durability: guestMaxHp,
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
    const basePenalty = result === 'success' ? 5 : 10;

    const { data: activeParty } = await supabase
        .from('party_members').select('id, name, durability, inject_cards, is_active')
        .eq('owner_id', user_id);

    if (!activeParty || activeParty.length === 0) return partyChanges;

    for (const member of activeParty) {
        const oldDurability = member.durability ?? 100;
        const effectiveOldDur = member.is_active === false ? 0 : oldDurability;
        const defeatedPenalty = defeatedIds.includes(String(member.id)) ? 10 : 0;
        const totalPenalty = basePenalty + defeatedPenalty;
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
        const locId = updates.current_location_id || user.current_location_id;
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
                .upsert({ user_id, item_id: loot.itemId }, { onConflict: 'user_id,item_id', ignoreDuplicates: true });
        } catch (histErr) {
            console.warn('[QuestComplete] Loot item history recording failed:', histErr);
        }
    }
}
