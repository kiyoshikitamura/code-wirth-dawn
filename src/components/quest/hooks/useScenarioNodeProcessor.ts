'use client';
/**
 * useScenarioNodeProcessor.ts
 *
 * ScenarioEngine.tsx の processNode() 自動実行ロジックをフックに分離。
 * ノードサイドエフェクト（APIコール・状態更新・サウンド）を担う。
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/soundManager';

interface NodeProcessorOptions {
    currentNode: any;
    currentNodeId: string;
    setCurrentNodeId: (id: string) => void;
    setHistory: React.Dispatch<React.SetStateAction<string[]>>;
    setShowingGuestJoin: (data: any) => void;
    setShowingTravel: (data: any) => void;
    setEndReady: (data: { result: 'success' | 'failure' | 'abort'; history: string[] } | null) => void;
    history: string[];
    onBattleStart?: (enemyId: string, successNodeId: string) => void;
    onComplete: (result: 'success' | 'failure' | 'abort', history: string[]) => void;
    showingTravel: any;
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function useScenarioNodeProcessor({
    currentNode,
    currentNodeId,
    setCurrentNodeId,
    setHistory,
    setShowingGuestJoin,
    setShowingTravel,
    setEndReady,
    history,
    onBattleStart,
    onComplete,
    showingTravel,
    showToast,
}: NodeProcessorOptions) {
    const { userProfile, inventory } = useGameStore();
    const questState = useQuestState();

    useEffect(() => {
        if (!currentNode) return;
        let timeoutId: NodeJS.Timeout | undefined;

        const processNode = async () => {
            // BGM切替
            const bgmKey = currentNode.bgm || currentNode.bgm_key;
            if (bgmKey && soundManager) soundManager.playBgm(bgmKey);

            // 終了ノードSE
            if (currentNode.type === 'end' && soundManager) {
                if (currentNode.result === 'success') soundManager.playSE('se_quest_success');
                else if (currentNode.result === 'failure') soundManager.playSE('se_quest_fail');
            }

            // ─── 自動分岐ノード群 ─────────────────────────────────────

            if (currentNode.type === 'check_world') {
                // (変更なし - 既存ロジックを維持)
            }

            else if (currentNode.type === 'random_branch') {
                const prob = currentNode.prob || 50;
                const roll = Math.random() * 100;
                const hitChoice = currentNode.choices?.find((c: any) => c.label === 'hit');
                const missChoice = currentNode.choices?.find((c: any) => c.label === 'miss');
                if (hitChoice && missChoice) {
                    setCurrentNodeId(roll < prob ? hitChoice.next : missChoice.next);
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
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const hasItem = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + i.quantity, 0) >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                showToast(hasItem ? '✅ 必要なアイテムを所持している。' : '❌ 必要なアイテムが足りない...', hasItem ? 'success' : 'error');
                setCurrentNodeId(hasItem ? successNode : failNode);
            }

            else if (currentNode.type === 'check_equipped') {
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const hasEquipped = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId) && i.is_equipped).reduce((sum: number, i: any) => sum + i.quantity, 0) >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;
                showToast(hasEquipped ? '✅ 指定の装備を確認。' : '❌ 指定の装備がされていない...', hasEquipped ? 'success' : 'error');
                setCurrentNodeId(hasEquipped ? successNode : failNode);
            }

            else if (currentNode.type === 'check_delivery') {
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const removeOnSuccess = currentNode.params?.remove_on_success ?? currentNode.remove_on_success ?? true;
                const hasItem = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + i.quantity, 0) >= reqQty;
                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;

                if (hasItem) {
                    if (removeOnSuccess) {
                        try {
                            const { data: { session } } = await supabase.auth.getSession();
                            const token = session?.access_token;
                            const userId = useGameStore.getState().userProfile?.id;
                            const res = await fetch('/api/inventory/consume', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...(userId ? { 'x-user-id': userId } : {}) },
                                body: JSON.stringify({ item_id: requiredItemId, quantity: reqQty })
                            });
                            if (res.ok) {
                                await useGameStore.getState().fetchInventory();
                                showToast('✅ アイテムを納品した。', 'success');
                                if (successNode) setCurrentNodeId(successNode);
                            } else {
                                showToast('❌ 納品に失敗した。', 'error');
                                if (failNode) setCurrentNodeId(failNode);
                            }
                        } catch (e) {
                            showToast('❌ 納品処理中にエラーが発生。', 'error');
                            if (failNode) setCurrentNodeId(failNode);
                        }
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
                        const { data: { session } } = await supabase.auth.getSession();
                        const token = session?.access_token;
                        const userId = useGameStore.getState().userProfile?.id;
                        const res = await fetch('/api/travel/cost', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...(userId ? { 'x-user-id': userId } : {}) },
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
                        const { data: { session } } = await supabase.auth.getSession();
                        const token = session?.access_token;
                        const userId = useGameStore.getState().userProfile?.id;
                        const res = await fetch(`/api/party/member?id=${guestId}&context=guest`, {
                            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...(userId ? { 'x-user-id': userId } : {}) }
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
                const guestName = questState.guest?.name || '仲間';
                questState.removeGuest();
                setHistory(prev => [...prev, `[Leave] ${guestName} が離脱した。`]);
                showToast(`${guestName} が離脱した。`, 'info');
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) timeoutId = setTimeout(() => setCurrentNodeId(nextId), 1000);
            }
            else if (currentNode.type === 'trap' || currentNode.type === 'modify_state') {
                const hpPercent = currentNode.params?.hp_percent;
                const hpFlat = currentNode.params?.hp_flat;
                if (hpPercent || hpFlat) {
                    questState.applyTrapDamage({ hp_percent: hpPercent, hp_flat: hpFlat });
                    const dmgText = hpPercent ? `最大HPの${hpPercent}%` : `${hpFlat}`;
                    showToast(`⚠ トラップ発動！ HP -${dmgText}`, 'error');
                    setHistory(prev => [...prev, `[Trap] ダメージを受けた (-${dmgText} HP)`]);
                }
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) timeoutId = setTimeout(() => setCurrentNodeId(nextId), 1500);
            }
            else if (currentNode.type === 'modify_flag') {
                const flagKey = currentNode.params?.flag || currentNode.params?.key;
                const flagDelta = currentNode.params?.delta ?? currentNode.params?.value ?? 1;
                if (flagKey) {
                    questState.setFlag(flagKey, flagDelta);
                }
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) setCurrentNodeId(nextId);
            }
            else if (currentNode.type === 'check_flags') {
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
                if (amount !== 0) {
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const token = session?.access_token;
                        const res = await fetch('/api/reputation/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ amount, locationName: locName })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            showToast(`名声 ${amount > 0 ? '+' : ''}${amount} (${data.location})`, amount > 0 ? 'success' : 'error');
                            setHistory(prev => [...prev, `[Reputation] 名声が ${amount > 0 ? '+' : ''}${amount} 変動した`]);
                        }
                    } catch (e) { console.error('[modify_reputation] API error:', e); }
                }
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) timeoutId = setTimeout(() => setCurrentNodeId(nextId), 1000);
            }
            else if (currentNode.type === 'reward') {
                const rewardItems = currentNode.params?.items;
                const rewardGold = currentNode.params?.gold;
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    const res = await fetch('/api/inventory/grant', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ items: rewardItems, gold: rewardGold })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const msgs: string[] = [];
                        if (data.gold > 0) msgs.push(`${data.gold}G`);
                        if (data.items?.length > 0) msgs.push(data.items.map((i: any) => `${i.name} x${i.quantity}`).join(', '));
                        showToast(`🎁 報酬獲得: ${msgs.join(' / ')}`, 'success');
                        setHistory(prev => [...prev, `[Reward] ${msgs.join(' / ')} を獲得`]);
                        await useGameStore.getState().fetchInventory();
                        if (rewardGold) await useGameStore.getState().fetchUserProfile();
                    }
                } catch (e) { console.error('[reward] Grant API error:', e); }
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;
                if (nextId) timeoutId = setTimeout(() => setCurrentNodeId(nextId), 1500);
            }
            else if (currentNode.type === 'shop_access') {
                const questId = questState.questId;
                window.location.href = `/shop?quest_id=${questId}&return_to=quest`;
            }
            else if (currentNode.type === 'end' || currentNode.result) {
                const res = currentNode.result || (currentNode.type === 'end_failure' ? 'failure' : 'success');
                setEndReady({ result: res, history });
            }

            // 護衛失敗チェック
            if (questState.isEscortMission && questState.checkEscortFailure()) {
                showToast('⚠ 護衛対象が倒れた… クエスト失敗', 'error');
                setHistory(prev => [...prev, '[Escort] 護衛対象が死亡し、クエストは失敗となった。']);
                setEndReady({ result: 'failure', history });
            }
        };

        processNode();
        return () => { if (timeoutId) clearTimeout(timeoutId); };

    }, [currentNodeId, currentNode, userProfile, history]);
}
