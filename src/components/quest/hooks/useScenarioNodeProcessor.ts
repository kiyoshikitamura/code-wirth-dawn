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
            // BGM切替
            const bgmKey = currentNode.bgm || currentNode.bgm_key;
            if (bgmKey && soundManager) soundManager.playBgm(bgmKey);

            // 終了ノードSE
            if (currentNode.type === 'end' && soundManager) {
                const nodeResult = currentNode.params?.result || currentNode.result || 'success';
                if (nodeResult === 'success') soundManager.playSE('se_quest_success');
                else if (nodeResult === 'failure') soundManager.playSE('se_quest_fail');
            }

            // ─── 自動分岐ノード群 ─────────────────────────────────────

            if (currentNode.type === 'check_world') {
                // (変更なし - 既存ロジックを維持)
            }

            else if (currentNode.type === 'random_branch') {
                const prob = currentNode.prob || currentNode.params?.prob || 50;
                const roll = Math.random() * 100;
                const isSuccess = roll < prob;
                // CSV互換: CHOICE行のlabelは hit/miss または success/failure のいずれか
                const successChoice = currentNode.choices?.find((c: any) =>
                    c.label === 'hit' || c.label === 'success');
                const failChoice = currentNode.choices?.find((c: any) =>
                    c.label === 'miss' || c.label === 'failure');
                console.log(`[random_branch] prob=${prob}, roll=${roll.toFixed(1)}, result=${isSuccess ? 'SUCCESS' : 'FAIL'}`);
                if (successChoice && failChoice) {
                    setCurrentNodeId(isSuccess ? successChoice.next : failChoice.next);
                } else {
                    // フォールバック: choices が見つからない場合は next へ遷移
                    const fallbackNext = currentNode.next || currentNode.condNext;
                    const fallbackFail = currentNode.condFallback || currentNode.fallback;
                    if (fallbackNext && fallbackFail) {
                        setCurrentNodeId(isSuccess ? fallbackNext : fallbackFail);
                    } else if (fallbackNext) {
                        setCurrentNodeId(fallbackNext);
                    }
                    console.warn(`[random_branch] choices not found, using fallback: next=${fallbackNext}, fail=${fallbackFail}`);
                }
            }

            else if (currentNode.type === 'check_status') {
                const stat = currentNode.req_stat;
                const val = currentNode.req_val || 0;
                let passed = false;
                if (stat === 'order' && (userProfile?.alignment?.order || 0) >= val) passed = true;
                const successChoice = currentNode.choices?.find((c: any) => c.label === 'success');
                const failChoice = currentNode.choices?.find((c: any) => c.label === 'failure');
                if (successChoice && failChoice) setCurrentNodeId(passed ? successChoice.next : failChoice.next);
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
                const alreadyConsumedCount = questState.consumedItems.filter(id => String(id) === String(requiredItemId)).length;
                const hasItem = latestInv.filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) - alreadyConsumedCount >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fallback || currentNode.condFallback || currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                showToast(hasItem ? '✅ 必要なアイテムを所持している。' : '❌ 必要なアイテムが足りない...', hasItem ? 'success' : 'error');
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
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const hasEquipped = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId) && i.is_equipped).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fallback || currentNode.condFallback || currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                showToast(hasEquipped ? '✅ 指定の装備を確認。' : '❌ 指定の装備がされていない...', hasEquipped ? 'success' : 'error');
                setCurrentNodeId(hasEquipped ? successNode : failNode);
            }

            else if (currentNode.type === 'check_delivery') {
                let requiredItemId: any = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const removeOnSuccess = currentNode.params?.remove_on_success ?? currentNode.remove_on_success ?? true;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.params?.fallback || currentNode.condFallback || currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;

                const activeNodeId = currentNodeId;

                // slug文字列の場合は数値IDに解決（インベントリは数値IDで格納されている）
                if (typeof requiredItemId === 'string' && isNaN(parseInt(requiredItemId, 10))) {
                    try {
                        const { data: itemRow } = await supabase.from('items').select('id').eq('slug', requiredItemId).maybeSingle();
                        if (processedNodeRef.current !== activeNodeId) return;
                        if (itemRow) {
                            console.log(`[check_delivery] Resolved slug '${requiredItemId}' → id=${itemRow.id}`);
                            requiredItemId = itemRow.id;
                        } else {
                            console.error(`[check_delivery] Item slug '${requiredItemId}' not found in DB`);
                        }
                    } catch (e) { console.error('[check_delivery] Slug resolution error:', e); }
                }

                // 最新インベントリを取得してからチェック
                await useGameStore.getState().fetchInventory();
                if (processedNodeRef.current !== activeNodeId) return;

                const latestInv = useGameStore.getState().inventory || [];
                // すでにクエスト内で「消費予定」として蓄積されている分をカウントして差し引く
                const alreadyConsumedCount = questState.consumedItems.filter(id => String(id) === String(requiredItemId)).length;
                const hasItem = latestInv.filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) - alreadyConsumedCount >= reqQty;
                console.log(`[check_delivery] item_id=${requiredItemId}, reqQty=${reqQty}, hasItem=${hasItem}, consumed=${alreadyConsumedCount}, inv count=${latestInv.length}`);

                if (hasItem) {
                    if (removeOnSuccess) {
                        // 即時消費API呼び出しを廃止し、Zustandの consumedItems に遅延消費として蓄積
                        const consumedList: string[] = [];
                        for (let i = 0; i < reqQty; i++) {
                            consumedList.push(String(requiredItemId));
                        }

                        useQuestState.getState().updateAfterBattle({
                            playerHp: useGameStore.getState().userProfile?.hp || 0,
                            partyHp: {},
                            deadNpcIds: [],
                            droppedItems: [],
                            usedConsumables: consumedList
                        });

                        showToast('✅ アイテムを納品した。', 'success');
                        if (successNode) setCurrentNodeId(successNode);
                    } else {
                        showToast('✅ アイテムを確認した。', 'success');
                        if (successNode) setCurrentNodeId(successNode);
                    }
                } else {
                    showToast('❌ 必要なアイテムが足りない...', 'error');
                    if (failNode) setCurrentNodeId(failNode);
                }
            }

            else if (currentNode.action === 'heal_partial') {
                questState.healParty(0.5);
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
                const locName = currentNode.params?.location_name;
                const activeNodeId = currentNodeId;
                if (amount !== 0) {
                    try {
                        const authHeaders = await getAuthHeaders();
                        const res = await fetch('/api/reputation/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeaders },
                            body: JSON.stringify({ amount, locationName: locName })
                        });
                        // 非同期処理中にノードが切り替わっていないか検証
                        if (processedNodeRef.current !== activeNodeId) return;

                        if (res.ok) {
                            const data = await res.json();
                            const resolvedLoc = data?.location || locName || '現在地';
                            showToast(`名声 ${amount > 0 ? '+' : ''}${amount} (${resolvedLoc})`, amount > 0 ? 'success' : 'error');
                            setHistory(prev => [...prev, `[Reputation] 名声が ${amount > 0 ? '+' : ''}${amount} 変動した`]);
                        } else {
                            showToast(`名声 ${amount > 0 ? '+' : ''}${amount} (${locName || '現在地'})`, amount > 0 ? 'success' : 'error');
                        }
                    } catch (e) {
                        console.error('[modify_reputation] API error:', e);
                        showToast(`名声 ${amount > 0 ? '+' : ''}${amount} (${locName || '現在地'})`, amount > 0 ? 'success' : 'error');
                    }
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
            else if (currentNode.type === 'reward') {
                const rawItems = currentNode.params?.items;
                const rewardGold = currentNode.params?.gold;
                const singleItemId = currentNode.params?.item_id || currentNode.item_id;
                console.log('[reward] rawItems:', JSON.stringify(rawItems), 'singleItemId:', singleItemId, 'gold:', rewardGold);

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
                    showToast(`🎁 報酬獲得 (クエスト完了時付与): ${msgs.join(' / ')}`, 'success');
                    setHistory(prev => [...prev, `[Reward] ${msgs.join(' / ')} を獲得 (予定)`]);
                }

                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) timeoutRef.current = setTimeout(() => {
                    if (processedNodeRef.current === activeNodeId) {
                        setCurrentNodeId(nextId);
                    }
                }, 1500);
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
}
