'use client';
/**
 * useScenarioNodeProcessor.ts
 *
 * ScenarioEngine.tsx の processNode() 自動実行ロジックをフックに分離。
 * ノードサイドエフェクト（APIコール・状態更新・サウンド）を担う。
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { supabase } from '@/lib/supabase';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';

async function updateProfileStatusHelper(updates: { hp?: number; gold?: number }, userProfileId: string) {
    try {
        const authHeaders = await getAuthHeaders();
        await fetch('/api/profile/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            },
            body: JSON.stringify({
                updates,
                profileId: userProfileId
            })
        });
    } catch (e) {
        console.error('[ScenarioNodeProcessor] Failed to sync status:', e);
    }
}

interface NodeProcessorOptions {
    currentNode: any;
    currentNodeId: string;
    setCurrentNodeId: (id: string) => void;
    setHistory: React.Dispatch<React.SetStateAction<string[]>>;
    setShowingGuestJoin: (data: any) => void;
    setShowingTravel: (data: any) => void;
    setEndReady: (data: { result: 'success' | 'failure' | 'abort'; nodeRewards?: any } | null) => void;
    historyRef: React.MutableRefObject<string[]>;
    onBattleStart?: (enemyId: string, successNodeId: string, bgKey?: string, bgm?: string) => void;
    onComplete: (result: 'success' | 'failure' | 'abort', history: string[]) => void;
    showingTravel: any;
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
    nodeTrigger: number;
    script: any;
}

export function useScenarioNodeProcessor({
    currentNode,
    currentNodeId,
    setCurrentNodeId,
    setHistory,
    setShowingGuestJoin,
    setShowingTravel,
    setEndReady,
    historyRef,
    onBattleStart,
    onComplete,
    showingTravel,
    showToast,
    nodeTrigger,
    script,
}: NodeProcessorOptions) {
    const { userProfile, inventory } = useGameStore();
    const questState = useQuestState();
    // KI §4: 同一ノードの再処理を防止する（userProfile更新によるuseEffect再トリガー対策）
    const processedNodeRef = useRef<string>('');
    const lastTriggerRef = useRef<number>(-1);
    // タイムアウトをRefで管理（useEffectのcleanupによるキャンセルを防止）
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // アンマウント時のクリーンアップ専用
    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    useEffect(() => {
        if (!currentNode) return;

        const isNewTransition = lastTriggerRef.current !== nodeTrigger;
        lastTriggerRef.current = nodeTrigger;

        // 同一遷移でかつ同じノードIDならスキップ（setState→userProfile変更→useEffect再発火の防止）
        if (!isNewTransition && processedNodeRef.current === currentNodeId) return;

        // 新ノード: 前のノードのタイマーをクリア
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = undefined; }
        processedNodeRef.current = currentNodeId;

        const processNode = async () => {
            // BGM切替 (定義がない場合は履歴を遡って再生)
            let bgmKey = currentNode.bgm || currentNode.bgm_key || currentNode.params?.bgm || currentNode.params?.bgm_key;
            if (!bgmKey && script?.nodes) {
                const hist = historyRef.current || [];
                for (let i = hist.length - 1; i >= 0; i--) {
                    const prevNodeId = hist[i];
                    const prevNode = script.nodes[prevNodeId];
                    if (prevNode?.bgm || prevNode?.bgm_key || prevNode?.params?.bgm || prevNode?.params?.bgm_key) {
                        bgmKey = prevNode.bgm || prevNode.bgm_key || prevNode.params?.bgm || prevNode.params?.bgm_key;
                        break;
                    }
                }
            }
            if (!bgmKey) {
                bgmKey = 'bgm_quest_calm'; // デフォルトフォールバック
            }
            if (bgmKey && soundManager) soundManager.playBgm(bgmKey);

            // 終了ノードSE
            if (currentNode.type === 'end' && soundManager) {
                const nodeResult = currentNode.params?.result || currentNode.result || 'success';
                if (nodeResult === 'success') soundManager.playSE('se_quest_success');
                else if (nodeResult === 'failure') soundManager.playSE('se_quest_fail');
            }

            // ─── 自動分岐ノード群 ─────────────────────────────────────

            if (currentNode.type === 'check_world') {
                const stat = currentNode.params?.stat || currentNode.params?.key || currentNode.req_stat;
                const val = currentNode.params?.threshold ?? currentNode.params?.value ?? currentNode.req_val ?? 0;
                const operator = currentNode.params?.operator || '>=';
                
                const worldState = useGameStore.getState().worldState;
                let passed = false;
                
                if (worldState) {
                    let worldVal = 0;
                    if (stat === 'order') worldVal = worldState.order_score || 0;
                    else if (stat === 'chaos') worldVal = worldState.chaos_score || 0;
                    else if (stat === 'justice') worldVal = worldState.justice_score || 0;
                    else if (stat === 'evil') worldVal = worldState.evil_score || 0;
                    else if (stat === 'prosperity') worldVal = worldState.prosperity_level || 3;
                    
                    if (operator === '>=' && worldVal >= val) passed = true;
                    else if (operator === '<=' && worldVal <= val) passed = true;
                    else if (operator === '==' && worldVal === val) passed = true;
                    else if (operator === '>' && worldVal > val) passed = true;
                    else if (operator === '<' && worldVal < val) passed = true;
                }
                
                const successNode = currentNode.next || currentNode.choices?.find((c: any) => c.label === 'success')?.next;
                const failNode = currentNode.fallback || currentNode.choices?.find((c: any) => c.label === 'failure')?.next;
                
                if (successNode || failNode) {
                    setCurrentNodeId(passed ? (successNode || currentNode.next) : (failNode || currentNode.fallback));
                } else {
                    const fallbackNext = currentNode.next || currentNode.condNext;
                    const fallbackFail = currentNode.fallback || currentNode.condFallback;
                    setCurrentNodeId(passed ? (fallbackNext || currentNode.next) : (fallbackFail || currentNode.fallback));
                }
            }


            else if (currentNode.type === 'random_branch' || currentNode.type === 'check_random') {
                let prob = currentNode.prob || currentNode.params?.prob || currentNode.probability || currentNode.params?.probability || 50;
                if (prob > 0 && prob < 1) {
                    prob = prob * 100;
                }
                const roll = Math.random() * 100;
                const isSuccess = roll < prob;
                // CSV互換: CHOICE行のlabelは hit/miss または success/failure/fallback のいずれか
                const successChoice = currentNode.choices?.find((c: any) =>
                    c.label === 'hit' || c.label === 'success');
                const failChoice = currentNode.choices?.find((c: any) =>
                    c.label === 'miss' || c.label === 'failure' || c.label === 'fallback');
                console.log(`[random_branch/check_random] prob=${prob}, roll=${roll.toFixed(1)}, result=${isSuccess ? 'SUCCESS' : 'FAIL'}`);
                if (successChoice && failChoice) {
                    setCurrentNodeId(isSuccess ? successChoice.next : failChoice.next);
                } else {
                    // フォールバック: choices が見つからない場合は params または next / fallback へ遷移
                    const successNode = currentNode.success || currentNode.params?.success || currentNode.next || currentNode.condNext;
                    const failNode = currentNode.fallback || currentNode.params?.fallback || currentNode.condFallback;
                    if (successNode && failNode) {
                        setCurrentNodeId(isSuccess ? successNode : failNode);
                    } else if (successNode) {
                        setCurrentNodeId(successNode);
                    }
                    console.warn(`[random_branch/check_random] choices not found, using fallback: success=${successNode}, fail=${failNode}`);
                }
            }

            else if (currentNode.type === 'damage') {
                const effectType = currentNode.params?.effect_type || currentNode.effect_type || 'hp';
                const damageVal = currentNode.params?.damage_val || currentNode.damage_val || 0;
                const damagePct = currentNode.params?.damage_pct || currentNode.damage_pct || 0;

                const store = useGameStore.getState();
                if (store.userProfile) {
                    let hpDamage = 0;
                    let goldDamage = 0;

                    if (effectType === 'hp') {
                        if (damagePct > 0) {
                            const maxHp = store.userProfile.max_hp || 100;
                            hpDamage = Math.floor(maxHp * damagePct);
                        } else {
                            hpDamage = damageVal;
                        }
                    } else if (effectType === 'gold') {
                        goldDamage = damageVal;
                    }

                    const nextHp = Math.max(0, (store.userProfile.hp || 0) - hpDamage);
                    const nextGold = Math.max(0, (store.gold || 0) - goldDamage);

                    // Zustand の状態を即時更新
                    useGameStore.setState({
                        userProfile: {
                            ...store.userProfile,
                            hp: nextHp,
                            gold: nextGold
                        },
                        gold: nextGold
                    });

                    // QuestState (playerHp) も同期更新
                    if (effectType === 'hp') {
                        useQuestState.setState({ playerHp: nextHp });
                    }

                    // DB へ同期
                    await updateProfileStatusHelper({ hp: nextHp, gold: nextGold }, store.userProfile.id);

                    const playerName = store.userProfile?.name || '主人公';
                    // トースト通知 & SE再生
                    if (hpDamage > 0) {
                        showToast(`トラップ発動！ ${playerName}に ${hpDamage} ダメージ！`, 'error');
                        if (soundManager) soundManager.playSE('se_taunt');
                    } else if (goldDamage > 0) {
                        showToast(`トラップ発動！ ${playerName}の所持金が ${goldDamage} G 減少した...`, 'error');
                        if (soundManager) soundManager.playSE('se_quest_fail');
                    }
                }

                // 完了後、自動遷移はさせず手動で「次へ」進めるようにする（テキストがない場合は自動遷移）
                const nextNodeId = currentNode.next || currentNode.next_node || currentNode.condNext;
                if (!currentNode.text && nextNodeId) {
                    timeoutRef.current = setTimeout(() => {
                        setCurrentNodeId(nextNodeId);
                    }, 50);
                } else {
                    console.log(`[damage] Damage applied, waiting for manual proceed.`);
                }
            }

            else if (currentNode.type === 'check_status') {
                const stat = currentNode.req_stat || currentNode.params?.req_stat;
                const val = currentNode.req_val || currentNode.params?.req_val || 0;
                let passed = false;
                
                const isPct = stat?.endsWith('_pct') || currentNode.params?.use_pct === true;
                const baseStat = stat?.endsWith('_pct') ? stat.replace('_pct', '') : stat;
                
                if (isPct) {
                    const order = userProfile?.order_pts || 0;
                    const chaos = userProfile?.chaos_pts || 0;
                    const justice = userProfile?.justice_pts || 0;
                    const evil = userProfile?.evil_pts || 0;
                    
                    if (baseStat === 'order' || baseStat === 'chaos') {
                        const total = order + chaos;
                        const pct = total > 0 ? (baseStat === 'order' ? order : chaos) / total * 100 : 50;
                        passed = pct >= val;
                    } else if (baseStat === 'justice' || baseStat === 'evil') {
                        const total = justice + evil;
                        const pct = total > 0 ? (baseStat === 'justice' ? justice : evil) / total * 100 : 50;
                        passed = pct >= val;
                    }
                } else {
                    if (stat === 'order' && (userProfile?.order_pts || 0) >= val) passed = true;
                    else if (stat === 'chaos' && (userProfile?.chaos_pts || 0) >= val) passed = true;
                    else if (stat === 'justice' && (userProfile?.justice_pts || 0) >= val) passed = true;
                    else if (stat === 'evil' && (userProfile?.evil_pts || 0) >= val) passed = true;
                    else if (stat === 'gold') {
                        const currentGold = Number([
                            useGameStore.getState().gold,
                            useGameStore.getState().userProfile?.gold,
                            userProfile?.gold,
                            0
                        ].find(g => g !== undefined && g !== null));
                        if (currentGold >= Number(val)) passed = true;
                    }
                }
                
                const successChoice = currentNode.choices?.find((c: any) => c.label === 'success');
                const failChoice = currentNode.choices?.find((c: any) => c.label === 'failure');
                
                if (successChoice && failChoice) {
                    setCurrentNodeId(passed ? successChoice.next : failChoice.next);
                } else {
                    const fallbackNext = currentNode.next || currentNode.condNext;
                    const fallbackFail = currentNode.fallback || currentNode.condFallback;
                    setCurrentNodeId(passed ? (fallbackNext || currentNode.next) : (fallbackFail || currentNode.fallback));
                }
            }


            else if (currentNode.type === 'check_possession') {
                let requiredItemId: any = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const activeNodeId = currentNodeId;
                // slug文字列の場合は数値IDに解決
                if (typeof requiredItemId === 'string' && isNaN(parseInt(requiredItemId, 10))) {
                    try {
                        const { data: itemRow } = await supabase.from('items').select('id').eq('slug', requiredItemId).maybeSingle();
                        if (processedNodeRef.current !== activeNodeId) return;
                        if (itemRow) requiredItemId = itemRow.id;
                    } catch (e) { console.error('[check_possession] Slug resolution error:', e); }
                }
                await useGameStore.getState().fetchInventory();
                if (processedNodeRef.current !== activeNodeId) return;
                const latestInv = useGameStore.getState().inventory || [];
                const alreadyConsumedCount = (questState.consumedItems || []).filter(id => String(id) === String(requiredItemId)).length;
                
                // クエスト戦利品プール（未永続化アイテム）の個数を合算
                const questLootCount = (questState.lootPool || [])
                    .filter((i: any) => String(i.itemId) === String(requiredItemId))
                    .reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
                
                const hasItem = (latestInv.filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) - alreadyConsumedCount + questLootCount) >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fallback || currentNode.condFallback || currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                if (!currentNode.params?.silent && !currentNode.silent) {
                    showToast(hasItem ? '✅ 必要なアイテムを所持している。' : '❌ 必要なアイテムが足りない...', hasItem ? 'success' : 'error');
                }
                setCurrentNodeId(hasItem ? successNode : failNode);
            }

            else if (currentNode.type === 'check_item') {
                // 複数アイテム一括所持チェック（6020 ゼウス分岐用）
                const requiredItems: number[] = currentNode.params?.items || [];
                const successNode = currentNode.params?.success_node || currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fail_node || currentNode.fallback || currentNode.choices?.[1]?.next;

                // インベントリ最新化してからチェック
                await useGameStore.getState().fetchInventory();
                const latestInventory = useGameStore.getState().inventory || [];

                const ownedIds = new Set(latestInventory.map((i: any) => Number(i.item_id)));
                const hasAll = requiredItems.length > 0 && requiredItems.every(id => ownedIds.has(id));
                const ownedCount = requiredItems.filter(id => ownedIds.has(id)).length;

                if (hasAll) {
                    showToast(`✅ 英霊の遺産が全て揃っている！ (${ownedCount}/${requiredItems.length})`, 'success');
                } else {
                    showToast(`❌ 英霊の遺産が足りない… (${ownedCount}/${requiredItems.length})`, 'error');
                }
                setHistory(prev => [...prev, `[Check] 遺産チェック: ${ownedCount}/${requiredItems.length} → ${hasAll ? '加護あり' : '加護なし'}`]);

                // 即時遷移（setTimeoutによる無限ループ防止）
                setCurrentNodeId(hasAll ? successNode : failNode);
            }

            else if (currentNode.type === 'check_equipped') {
                let requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const activeNodeId = currentNodeId;

                // slug文字列の場合は数値IDに解決
                if (typeof requiredItemId === 'string' && isNaN(parseInt(requiredItemId, 10))) {
                    try {
                        const { data: itemRow } = await supabase.from('items').select('id').eq('slug', requiredItemId).maybeSingle();
                        if (processedNodeRef.current !== activeNodeId) return;
                        if (itemRow) requiredItemId = itemRow.id;
                    } catch (e) { console.error('[check_equipped] Slug resolution error:', e); }
                }

                const hasEquipped = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId) && i.is_equipped).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fallback || currentNode.condFallback || currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                showToast(hasEquipped ? '✅ 指定の装備を確認。' : '❌ 指定の装備がされていない...', hasEquipped ? 'success' : 'error');
                setCurrentNodeId(hasEquipped ? successNode : failNode);
            }

            else if (currentNode.type === 'check_delivery') {
                const removeOnSuccess = currentNode.params?.remove_on_success ?? currentNode.remove_on_success ?? true;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fallback || currentNode.condFallback || currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                const activeNodeId = currentNodeId;

                // 最新インベントリを取得してからチェック
                await useGameStore.getState().fetchInventory();
                if (processedNodeRef.current !== activeNodeId) return;

                const latestInv = useGameStore.getState().inventory || [];

                // 判定アイテムのリストを構築
                let checkItems: { itemId: string; reqQty: number }[] = [];

                if (currentNode.params?.items && Array.isArray(currentNode.params.items)) {
                    for (const item of currentNode.params.items) {
                        let itemId = String(item.item_id);
                        if (isNaN(parseInt(itemId, 10))) {
                            try {
                                const { data: itemRow } = await supabase.from('items').select('id').eq('slug', itemId).maybeSingle();
                                if (processedNodeRef.current !== activeNodeId) return;
                                if (itemRow) itemId = String(itemRow.id);
                            } catch (e) { console.error('[check_delivery] Multi slug resolution error:', e); }
                        }
                        checkItems.push({ itemId, reqQty: item.quantity || 1 });
                    }
                } else if (currentNode.items && Array.isArray(currentNode.items)) {
                    for (const item of currentNode.items) {
                        checkItems.push({ itemId: String(item.item_id), reqQty: item.quantity || 1 });
                    }
                } else {
                    let requiredItemId: any = currentNode.params?.item_id || currentNode.item_id;
                    const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                    if (requiredItemId) {
                        if (typeof requiredItemId === 'string' && isNaN(parseInt(requiredItemId, 10))) {
                            try {
                                const { data: itemRow } = await supabase.from('items').select('id').eq('slug', requiredItemId).maybeSingle();
                                if (processedNodeRef.current !== activeNodeId) return;
                                if (itemRow) requiredItemId = itemRow.id;
                            } catch (e) { console.error('[check_delivery] Single slug resolution error:', e); }
                        }
                        checkItems.push({ itemId: String(requiredItemId), reqQty });
                    }
                }

                // すべてのアイテムの所持数を検証
                let allPassed = true;

                for (const check of checkItems) {
                    const alreadyConsumedCount = (questState.consumedItems || []).filter(id => String(id) === String(check.itemId)).length;
                    const questLootCount = (questState.lootPool || [])
                        .filter((i: any) => String(i.itemId) === String(check.itemId))
                        .reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);

                    const hasQty = latestInv
                        .filter((i: any) => String(i.item_id) === String(check.itemId))
                        .reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) - alreadyConsumedCount + questLootCount;

                    if (hasQty < check.reqQty) {
                        allPassed = false;
                        break;
                    }
                }

                const consumedList: string[] = [];
                if (allPassed && removeOnSuccess) {
                    for (const check of checkItems) {
                        for (let i = 0; i < check.reqQty; i++) {
                            consumedList.push(String(check.itemId));
                        }
                    }
                }

                if (allPassed && checkItems.length > 0) {
                    if (removeOnSuccess && consumedList.length > 0) {
                        useQuestState.getState().updateAfterBattle({
                            playerHp: useGameStore.getState().userProfile?.hp || 0,
                            partyHp: {},
                            deadNpcIds: [],
                            droppedItems: [],
                            usedConsumables: [...(questState.consumedItems || []), ...consumedList]
                        });
                        showToast('✅ アイテムを納品した。', 'success');
                    } else {
                        showToast('✅ アイテムを確認した。', 'success');
                    }
                    if (successNode) setCurrentNodeId(successNode);
                } else {
                    showToast('❌ 必要なアイテムが足りない...', 'error');
                    if (failNode) setCurrentNodeId(failNode);
                }
            }

            else if (currentNode.action === 'heal_partial' || currentNode.params?.action === 'heal_partial') {
                questState.healParty(0.5);
                showToast('💚 湧き水によって傷が癒やされた。 (HP回復)', 'success');
                setHistory(prev => [...prev, '[System] 湧き水を飲み、体力を回復した。']);
            }

            else if (currentNode.type === 'camp') {
                const activeNodeId = currentNodeId;
                const isCheckpointDone = questState.getFlag(`checkpoint_done_${activeNodeId}`);
                
                if (!isCheckpointDone) {
                    try {
                        const authHeaders = await getAuthHeaders();
                        const res = await fetch('/api/quest/checkpoint', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...authHeaders
                            },
                            body: JSON.stringify({
                                quest_id: questState.questId,
                                loot_pool: questState.lootPool || [],
                                consumed_items: questState.consumedItems || [],
                                reputation_changes: questState.reputationChanges || {}
                            })
                        });

                        if (res.ok && processedNodeRef.current === activeNodeId) {
                            // Clear client-side temporary stores and set flag in a single batch update to prevent React render glitches
                            const latestState = useQuestState.getState();
                            useQuestState.setState({
                                playerHp: useGameStore.getState().userProfile?.hp || 0,
                                partyHp: {},
                                deadNpcs: [],
                                lootPool: [], // Completely clear lootPool
                                consumedItems: [], // Completely clear consumedItems
                                reputationChanges: {},
                                questFlags: {
                                    ...(latestState.questFlags || {}),
                                    [`checkpoint_done_${activeNodeId}`]: 1
                                }
                            });

                            showToast('💾 チェックポイント: 戦利品を保存しました。', 'success');

                            // Refresh local profile/inventory so they can be equipped immediately
                            await Promise.all([
                                useGameStore.getState().fetchUserProfile(),
                                useGameStore.getState().fetchInventory()
                            ]);
                        }
                    } catch (e) {
                        console.error('[Checkpoint] Checkpoint API error:', e);
                    }
                }
            }

            else if (currentNode.type === 'meet_player' || currentNode.action === 'meet_player' || currentNode.params?.action === 'meet_player') {
                const activeNodeId = currentNodeId;
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;

                try {
                    const authHeaders = await getAuthHeaders();
                    const res = await fetch('/api/quest/meet-player', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...authHeaders
                        }
                    });

                    if (res.ok && processedNodeRef.current === activeNodeId) {
                        const data = await res.json();
                        if (data.player_name && data.is_real) {
                            questState.setFlag('met_player_name', data.player_name, true);
                            questState.setFlag('met_player_is_real', 1, true);
                        } else {
                            questState.setFlag('met_player_name', '', true);
                            questState.setFlag('met_player_is_real', 0, true);
                        }
                    } else {
                        questState.setFlag('met_player_name', '', true);
                        questState.setFlag('met_player_is_real', 0, true);
                    }
                } catch (e) {
                    console.error('[meet_player] Failed to fetch nearby player:', e);
                    questState.setFlag('met_player_name', '', true);
                    questState.setFlag('met_player_is_real', 0, true);
                }

                if (processedNodeRef.current === activeNodeId && nextId) {
                    setCurrentNodeId(nextId);
                }
            }

            // ─── アクションノード群 ──────────────────────────────────────

            if (currentNode.type === 'battle') {
                // 戦闘は親コンポーネント側で処理
            }
            else if (currentNode.type === 'travel') {
                if (showingTravel) return;
                const targetSlug = currentNode.target_location_slug || currentNode.params?.target_location_slug;
                const encounterRate = currentNode.encounter_rate || 0;
                const nextSuccess = currentNode.next_node_success || currentNode.next;
                const nextBattle = currentNode.next_node_battle;

                if (targetSlug) {
                    try {
                        const authHeaders = await getAuthHeaders();
                        const res = await fetch('/api/travel/cost', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders },
                            body: JSON.stringify({ target_location_slug: targetSlug })
                        });
                        if (res.ok) {
                            const costData = await res.json();
                            setShowingTravel({ dest: costData.to, slug: targetSlug, days: costData.days, gold_cost: costData.gold_cost ?? 0, next: nextSuccess, nextBattle, encounterRate, status: 'confirm' });
                        } else if (nextSuccess) {
                            setCurrentNodeId(nextSuccess);
                        }
                    } catch (e) {
                        if (nextSuccess) setCurrentNodeId(nextSuccess);
                    }
                } else if (nextSuccess) {
                    setCurrentNodeId(nextSuccess);
                }
            }
            else if (currentNode.type === 'guest_join') {
                const guestId = currentNode.params?.guest_id;
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (guestId) {
                    try {
                        const authHeaders = await getAuthHeaders();
                        const res = await fetch(`/api/party/member?id=${guestId}&context=guest`, {
                            headers: authHeaders
                        });
                        if (res.ok) {
                            const guestData = await res.json();
                            setShowingGuestJoin({ data: guestData, next: nextId });
                        } else if (nextId) setCurrentNodeId(nextId);
                    } catch (e) {
                        if (nextId) setCurrentNodeId(nextId);
                    }
                } else if (nextId) setCurrentNodeId(nextId);
            }
            else if (currentNode.type === 'leave') {
                // leaveはテキスト表示ノードとして扱い、removeGuestのみサイドエフェクトで実行
                // 「続ける」ボタン（CSV auto-advance）でユーザーが手動で次ノードへ進む
                if (questState.guest) {
                    const guestName = questState.guest.name || '仲間';
                    questState.removeGuest();
                    showToast(`${guestName} が離脱した。`, 'info');
                }
            }
            else if (currentNode.type === 'trap' || currentNode.type === 'modify_state' || currentNode.type === 'hp_damage') {
                const hpPercent = currentNode.params?.hp_percent || currentNode.params?.percent;
                const hpFlat = currentNode.params?.hp_flat;
                if (hpPercent || hpFlat) {
                    // questState（クエスト内HP管理）に適用
                    questState.applyTrapDamage({ hp_percent: hpPercent, hp_flat: hpFlat });

                    // gameStore の userProfile.hp にも同期（バトルシステムはこちらを参照する）
                    const profile = useGameStore.getState().userProfile;
                    if (profile) {
                        const maxHp = profile.max_hp || profile.hp || 100;
                        let damage = 0;
                        if (hpPercent) damage = Math.floor(maxHp * (hpPercent / 100));
                        if (hpFlat) damage += hpFlat;
                        const newHp = Math.max(1, (profile.hp || maxHp) - damage);
                        useGameStore.setState(state => ({
                            userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                        }));
                        console.log(`[hp_damage] profile.hp: ${profile.hp} → ${newHp} (damage=${damage}, percent=${hpPercent}, flat=${hpFlat})`);
                    }

                    const dmgText = hpPercent ? `最大HPの${hpPercent}%` : `${hpFlat}`;
                    showToast(`⚠ トラップ発動！ HP -${dmgText}`, 'error');
                    setHistory(prev => [...prev, `[Trap] ダメージを受けた (-${dmgText} HP)`]);
                }
                // setTimeoutを削除。手動遷移（「続ける」ボタン）に変更
            }
            else if (currentNode.type === 'modify_flag') {
                const flagKey = currentNode.params?.flag || currentNode.params?.key;
                // value が明示されていれば代入、delta や指定なしなら加算
                const isSet = currentNode.params?.value !== undefined;
                const flagVal = isSet 
                    ? Number(currentNode.params.value) 
                    : (currentNode.params?.delta ?? 1);
                
                if (flagKey) {
                    questState.setFlag(flagKey, flagVal, isSet);
                }
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) setCurrentNodeId(nextId);
            }
            else if (currentNode.type === 'check_flags' || currentNode.type === 'check_flag') {
                const flagKey = currentNode.params?.flag || currentNode.params?.key;
                const threshold = currentNode.params?.threshold ?? currentNode.params?.value ?? 1;
                const operator = currentNode.params?.operator || '>=';
                let passed = false;

                // 特殊対応: 6020_main_ep20 の Zeno relic check (flagKey が無いが、特定の choices がある場合)
                if (!flagKey && (currentNodeId === 'check_items' || currentNode.choices?.some((c: any) => c.label === 'items_all_relics'))) {
                    await useGameStore.getState().fetchInventory();
                    const latestInventory = useGameStore.getState().inventory || [];
                    const ownedIds = new Set(latestInventory.map((i: any) => Number(i.item_id)));
                    const relicIds = [505, 506, 507]; // 冥王の護符、軍神の剣、女神の鎧
                    const hasAll = relicIds.every(id => ownedIds.has(id));

                    const targetLabel = hasAll ? 'items_all_relics' : 'items_missing';
                    const targetChoice = currentNode.choices?.find((c: any) => c.label === targetLabel);
                    if (targetChoice) {
                        setCurrentNodeId(targetChoice.next);
                        return;
                    }
                }

                if (flagKey) {
                    const flagVal = questState.getFlag(flagKey);
                    if (operator === '>=' && flagVal >= threshold) passed = true;
                    else if (operator === '<=' && flagVal <= threshold) passed = true;
                    else if (operator === '==' && flagVal === threshold) passed = true;
                    else if (operator === '>' && flagVal > threshold) passed = true;
                    else if (operator === '<' && flagVal < threshold) passed = true;
                }
                const successNode = currentNode.next || currentNode.choices?.find((c: any) => c.label === 'success')?.next;
                const failNode = currentNode.fallback || currentNode.choices?.find((c: any) => c.label === 'failure')?.next;
                setCurrentNodeId(passed ? successNode : failNode);
            }
            else if (currentNode.type === 'modify_reputation') {
                const amount = currentNode.params?.amount || currentNode.params?.value || 0;
                const locName = currentNode.params?.location_name || '現在地';
                const activeNodeId = currentNodeId;
                if (amount !== 0) {
                    questState.addReputationChange(locName, amount);
                    showToast(`名声 ${amount > 0 ? '+' : ''}${amount} (${locName})`, amount > 0 ? 'success' : 'error');
                    setHistory(prev => [...prev, `[Reputation] 名声が ${amount > 0 ? '+' : ''}${amount} 変動した`]);
                }
                
                // 非同期処理中にノードが切り替わっていないか検証
                if (processedNodeRef.current !== activeNodeId) return;

                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) timeoutRef.current = setTimeout(() => {
                    if (processedNodeRef.current === activeNodeId) {
                        setCurrentNodeId(nextId);
                    }
                }, 1000);
            }
            else if (currentNode.type === 'reward' || currentNode.type === 'treasure') {
                let rawItems = currentNode.params?.items || currentNode.params?.rewards?.items || currentNode.rewards?.items;
                let rewardGold = currentNode.params?.gold || currentNode.params?.rewards?.gold || currentNode.rewards?.gold;
                const singleItemId = currentNode.params?.item_id || currentNode.item_id || currentNode.params?.rewards?.item_id || currentNode.rewards?.item_id;
                const alignmentShift = currentNode.params?.alignment_shift || currentNode.params?.rewards?.alignment_shift || currentNode.rewards?.alignment_shift;

                // 特殊対応: 商人取引による購入
                const isMerchantBuy = currentNode.params?.is_merchant_buy || currentNodeId.includes('merchant_buy');
                if (isMerchantBuy) {
                    const mItemId = questState.getFlag('merchant_item_id');
                    const mPrice = questState.getFlag('merchant_price') || 30000;
                    if (mItemId) {
                        rawItems = [{ item_id: Number(mItemId), quantity: 1 }];
                        rewardGold = -Number(mPrice); // ゴールド減算
                        console.log(`[reward/merchant_buy] Intercepted merchant reward: Item=${mItemId}, Gold=${rewardGold}`);
                    }
                }
                // 確率プール抽選
                else if (currentNode.params?.item_pool && Array.isArray(currentNode.params.item_pool)) {
                    const pool = currentNode.params.item_pool;
                    const totalWeight = pool.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
                    const roll = Math.random() * totalWeight;
                    let currentSum = 0;
                    let selectedItem = null;
                    
                    for (const item of pool) {
                        currentSum += item.weight || 0;
                        if (roll <= currentSum) {
                            selectedItem = item;
                            break;
                        }
                    }
                    
                    if (selectedItem) {
                        rawItems = [{ item_id: selectedItem.item_id, quantity: selectedItem.quantity || 1 }];
                        console.log(`[reward/item_pool] Rolled item ID=${selectedItem.item_id} from pool`);
                    }
                }

                console.log('[reward] rawItems:', JSON.stringify(rawItems), 'singleItemId:', singleItemId, 'gold:', rewardGold, 'alignment:', alignmentShift);

                const activeNodeId = currentNodeId;
                let rewardItems: any[] | undefined;

                if (Array.isArray(rawItems)) {
                    rewardItems = rawItems.map((item: any) => {
                        if (typeof item === 'string' || typeof item === 'number') {
                            return { item_id: parseInt(String(item), 10), quantity: 1 };
                        }
                        return item;
                    });
                } else if (singleItemId) {
                    const singleQty = currentNode.params?.quantity || currentNode.quantity || 1;
                    const parsedId = parseInt(String(singleItemId), 10);
                    if (!isNaN(parsedId)) {
                        rewardItems = [{ item_id: parsedId, quantity: singleQty }];
                    } else {
                        try {
                            const { data: itemRow } = await supabase.from('items').select('id, name').eq('slug', singleItemId).maybeSingle();
                            if (processedNodeRef.current !== activeNodeId) return;
                            if (itemRow) {
                                rewardItems = [{ item_id: itemRow.id, quantity: singleQty, name: itemRow.name }];
                                console.log(`[reward] Resolved slug '${singleItemId}' → id=${itemRow.id} (${itemRow.name})`);
                            } else {
                                console.error(`[reward] Item slug '${singleItemId}' not found in DB`);
                            }
                        } catch (e) { console.error('[reward] Slug resolution error:', e); }
                    }
                }

                if (processedNodeRef.current !== activeNodeId) return;

                const itemsToGrant: any[] = [];
                const msgs: string[] = [];

                if (alignmentShift && typeof alignmentShift === 'object') {
                    for (const [key, val] of Object.entries(alignmentShift)) {
                        const amount = Number(val);
                        if (amount !== 0 && ['order', 'chaos', 'justice', 'evil'].includes(key)) {
                            itemsToGrant.push({
                                itemId: `align_${key}`,
                                itemName: `アライメント (${key})`,
                                quantity: amount
                            });
                            msgs.push(`${key} ${amount > 0 ? '+' : ''}${amount}`);
                        }
                    }
                }

                if (rewardGold) {
                    itemsToGrant.push({ itemId: 'gold', itemName: 'ゴールド', quantity: rewardGold });
                    msgs.push(`${rewardGold}G`);
                }

                if (rewardItems && rewardItems.length > 0) {
                    for (const item of rewardItems) {
                        let itemName = item.name || `item_${item.item_id}`;
                        if (!item.name) {
                            try {
                                const { data: itemRow } = await supabase.from('items').select('name').eq('id', item.item_id).maybeSingle();
                                if (itemRow) itemName = itemRow.name;
                            } catch (e) { console.error('[reward] Item name lookup failed:', e); }
                        }
                        if (processedNodeRef.current !== activeNodeId) return;

                        itemsToGrant.push({ itemId: String(item.item_id), itemName, quantity: item.quantity || 1 });
                        msgs.push(`${itemName} x${item.quantity || 1}`);
                    }
                }

                // useQuestState の戦利品プールに蓄積（即時永続化は廃止）
                useQuestState.getState().updateAfterBattle({
                    playerHp: useGameStore.getState().userProfile?.hp || 0,
                    partyHp: {},
                    deadNpcIds: [],
                    droppedItems: itemsToGrant,
                    usedConsumables: []
                });

                if (msgs.length > 0) {
                    showToast(`報酬獲得: ${msgs.join(' / ')}`, 'success');
                    setHistory(prev => [...prev, `[Reward] ${msgs.join(' / ')} を獲得 (予定)`]);
                }

                // 完了後、自動遷移はさせず手動で「次へ」進めるようにする（テキストがない場合は自動遷移）
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (!currentNode.text && nextId) {
                    timeoutRef.current = setTimeout(() => {
                        if (processedNodeRef.current === activeNodeId) {
                            setCurrentNodeId(nextId);
                        }
                    }, 50);
                } else {
                    console.log(`[reward] Reward granted, waiting for manual proceed.`);
                }
            }
            else if (currentNode.type === 'merchant_trade') {
                const pool = currentNode.params?.merchant_pool || currentNode.merchant_pool;
                const price = currentNode.params?.price || currentNode.price || 30000;
                
                if (!questState.getFlag('merchant_item_id') && Array.isArray(pool)) {
                    const totalWeight = pool.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
                    const roll = Math.random() * totalWeight;
                    let currentSum = 0;
                    let selectedItem = null;
                    
                    for (const item of pool) {
                        currentSum += item.weight || 0;
                        if (roll <= currentSum) {
                            selectedItem = item;
                            break;
                        }
                    }
                    
                    if (selectedItem) {
                        questState.setFlag('merchant_item_id', selectedItem.item_id);
                        questState.setFlag('merchant_price', price);
                        console.log(`[merchant_trade] Randomized merchant item: ID=${selectedItem.item_id}, Price=${price}`);
                    }
                }

                // Ensure merchant_item_name is fetched and stored
                const mItemId = questState.getFlag('merchant_item_id');
                if (mItemId && !questState.getFlag('merchant_item_name')) {
                    try {
                        const { data: itemData } = await supabase.from('items').select('name').eq('id', Number(mItemId)).maybeSingle();
                        if (itemData?.name) {
                            questState.setFlag('merchant_item_name', itemData.name);
                            console.log(`[merchant_trade] Resolved item name: ${itemData.name}`);
                        }
                    } catch (err) {
                        console.error('[merchant_trade] Failed to fetch item name:', err);
                    }
                }
            }
            else if (currentNode.type === 'shop_access') {
                const questId = questState.questId;
                window.location.href = `/shop?quest_id=${questId}&return_to=quest`;
            }
            else if (currentNode.type === 'end' || currentNode.type === 'end_success' || currentNode.type === 'end_failure' || currentNode.params?.result || currentNode.result) {
                const res = currentNode.params?.result || currentNode.result || (currentNode.type === 'end_failure' ? 'failure' : 'success');
                // endノードにrewardsが埋め込まれている場合（ルート分岐報酬等）、nodeRewardsとして渡す
                const nodeRewards = currentNode.params?.rewards || currentNode.rewards || null;
                setEndReady({ result: res, nodeRewards });
            }

            // 護衛失敗チェック
            if (questState.isEscortMission && questState.checkEscortFailure()) {
                showToast('⚠ 護衛対象が倒れた… クエスト失敗', 'error');
                setHistory(prev => [...prev, '[Escort] 護衛対象が死亡し、クエストは失敗となった。']);
                setEndReady({ result: 'failure' });
            }
        };

        processNode();
        // cleanup不要: timeoutRefで管理、processedNodeRefガードで再実行防止

    }, [currentNodeId, currentNode, userProfile, nodeTrigger]);

    // [Security/Resume] Sync quest state to server DB
    useEffect(() => {
        if (!questState.isInQuest || !questState.questId) return;

        // Skip test play / debug bypass
        if (typeof window !== 'undefined') {
            const search = window.location.search;
            if (search.includes('test_play=true') || search.includes('debug_bypass=true')) {
                return;
            }
        }

        const syncState = async () => {
            try {
                const latestQuestState = useQuestState.getState();
                const statePayload = {
                    isInQuest: latestQuestState.isInQuest,
                    questId: latestQuestState.questId,
                    questType: latestQuestState.questType,
                    playerHp: latestQuestState.playerHp,
                    playerMaxHp: latestQuestState.playerMaxHp,
                    partyHp: latestQuestState.partyHp || {},
                    deadNpcs: latestQuestState.deadNpcs || [],
                    lootPool: latestQuestState.lootPool || [],
                    consumedItems: latestQuestState.consumedItems || [],
                    guest: latestQuestState.guest,
                    currentLocationId: latestQuestState.currentLocationId,
                    elapsedDays: latestQuestState.elapsedDays,
                    questFlags: latestQuestState.questFlags,
                    isEscortMission: latestQuestState.isEscortMission,
                    currentNodeId: currentNodeId,
                    reputationChanges: latestQuestState.reputationChanges || {},
                };

                const authHeaders = await getAuthHeaders();
                await fetch('/api/quest/save-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify({
                        quest_id: latestQuestState.questId,
                        quest_state: statePayload
                    })
                });
            } catch (err) {
                console.error('[Quest State Sync] Failed to sync state:', err);
            }
        };

        const timer = setTimeout(syncState, 300);
        return () => clearTimeout(timer);
    }, [
        currentNodeId,
        questState.questId,
        questState.isInQuest,
        questState.playerHp,
        questState.guest,
        (questState.lootPool || []).length,
        (questState.consumedItems || []).length,
        questState.elapsedDays
    ]);
}
