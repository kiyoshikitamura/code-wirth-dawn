
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScenarioDB } from '@/types/game';
import { getAssetUrl } from '@/config/assets';
import { Scroll, Sword, Skull, ArrowRight, MapPin, Shield, Star, User } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { useRouter } from 'next/navigation';
import WorldMap from '@/components/world/WorldMap';
import StatusModal from '@/components/inn/StatusModal';
import { supabase } from '@/lib/supabase';

interface Props {
    scenario: ScenarioDB;
    onComplete: (result: 'success' | 'failure' | 'abort', history: string[]) => void;
    onBattleStart?: (enemyId: string, successNodeId: string) => void;
    initialNodeId?: string;
}

export default function ScenarioEngine({ scenario, onComplete, onBattleStart, initialNodeId }: Props) {
    const defaultNodeId = 'start';
    const [currentNodeId, setCurrentNodeId] = useState(initialNodeId || defaultNodeId);
    const [history, setHistory] = useState<string[]>([]);
    const [feed, setFeed] = useState<string[]>([]);
    const feedEndRef = useRef<HTMLDivElement>(null);

    // initialNodeId の変更に反応 (Quest Resume にとって重要)
    useEffect(() => {
        if (initialNodeId) setCurrentNodeId(initialNodeId);
    }, [initialNodeId]);

    // v3.6 UI State
    const [showingGuestJoin, setShowingGuestJoin] = useState<any>(null);
    const [showingTravel, setShowingTravel] = useState<{ dest: string, slug?: string, days: number, gold_cost: number, next: string, nextBattle?: string, encounterRate?: number, status: 'confirm' | 'animating' } | null>(null);
    const [showCampStatus, setShowCampStatus] = useState(false);

    // グローバル状態へのアクセス
    const { userProfile, worldState, battleState, inventory } = useGameStore();
    const questState = useQuestState();
    const router = useRouter();

    // フィードの最下部へスクロール
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [feed]);

    // スクリプトデータの解析 (BYORK JSON) または V3 フローノード
    const script = React.useMemo(() => {
        let s = scenario.script_data;

        // v3.4 アダプター: flow_nodes 配列を BYORK ライクなノードマップに変換
        if (!s && scenario.flow_nodes && Array.isArray(scenario.flow_nodes)) {
            const nodes: Record<string, any> = {};
            scenario.flow_nodes.forEach((node: any) => {
                nodes[node.id] = {
                    ...node,
                    choices: node.choices?.map((c: any) => ({
                        ...c,
                        next: c.next_node || c.next // Map next_node -> next, fallback to next
                    })),
                    next: node.next || node.next_node, // Map next_node -> next
                    params: node.params
                };
            });
            s = { nodes };
        }

        if (!s) {
            s = {
                nodes: {
                    start: {
                        text: scenario.full_description || scenario.description || "...",
                        choices: [{ label: "進む", next: "end_success" }]
                    },
                    end_success: {
                        type: 'end',
                        result: 'success',
                        text: "依頼を達成した。"
                    }
                }
            };
        }
        return s;
    }, [scenario]);

    const currentNode = script.nodes?.[currentNodeId];

    // --- ノードプロセッサー ---
    useEffect(() => {
        if (!currentNode) return;
        let timeoutId: NodeJS.Timeout;

        const processNode = async () => {
            // 1. 特殊ロジックノード
            if (currentNode.type === 'check_world') {
                // ... (変更なし)
            }
            else if (currentNode.type === 'random_branch') {
                const prob = currentNode.prob || 50;
                const roll = Math.random() * 100;
                // ...
                const hitChoice = currentNode.choices?.find((c: any) => c.label === 'hit');
                const missChoice = currentNode.choices?.find((c: any) => c.label === 'miss');
                if (hitChoice && missChoice) {
                    const selected = roll < prob ? hitChoice : missChoice;
                    setCurrentNodeId(selected.next);
                }
            }
            else if (currentNode.type === 'check_status') {
                // ...
                const stat = currentNode.req_stat;
                const val = currentNode.req_val || 0;
                let passed = false;
                if (stat === 'order' && (userProfile?.alignment?.order || 0) >= val) passed = true;

                const successChoice = currentNode.choices?.find((c: any) => c.label === 'success');
                const failChoice = currentNode.choices?.find((c: any) => c.label === 'failure');

                if (successChoice && failChoice) {
                    setCurrentNodeId(passed ? successChoice.next : failChoice.next);
                }
            }
            else if (currentNode.type === 'check_possession') {
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;

                console.log("[DEBUG check_possession] Required:", requiredItemId, "Qty:", reqQty);
                console.log("[DEBUG check_possession] Inventory:", inventory?.map(i => ({ item_id: i.item_id, qty: i.quantity, name: i.name })));

                const hasItem = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + i.quantity, 0) >= reqQty;

                console.log("[DEBUG check_possession] hasItem:", hasItem);

                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;

                setCurrentNodeId(hasItem ? successNode : failNode);
            }
            else if (currentNode.type === 'check_equipped') {
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;

                console.log("[DEBUG check_equipped] Required:", requiredItemId, "Qty:", reqQty);
                const hasEquipped = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId) && i.is_equipped).reduce((sum: number, i: any) => sum + i.quantity, 0) >= reqQty;

                console.log("[DEBUG check_equipped] hasEquipped:", hasEquipped);

                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;

                setCurrentNodeId(hasEquipped ? successNode : failNode);
            }
            else if (currentNode.type === 'check_delivery') {
                const requiredItemId = currentNode.params?.item_id || currentNode.item_id;
                const reqQty = currentNode.params?.quantity || currentNode.quantity || 1;
                const removeOnSuccess = currentNode.params?.remove_on_success ?? currentNode.remove_on_success ?? true;

                console.log("[DEBUG check_delivery] Required:", requiredItemId, "Qty:", reqQty);
                console.log("[DEBUG check_delivery] Inventory:", inventory?.map(i => ({ item_id: i.item_id, qty: i.quantity, name: i.name })));

                const hasItem = (inventory || []).filter((i: any) => String(i.item_id) === String(requiredItemId)).reduce((sum: number, i: any) => sum + i.quantity, 0) >= reqQty;

                console.log("[DEBUG check_delivery] hasItem:", hasItem);

                const successNode = currentNode.next || currentNode.choices?.[0]?.next;
                const failNode = currentNode.fallback || currentNode.choices?.[1]?.next || currentNode.next_node_failure;

                if (hasItem) {
                    if (removeOnSuccess) {
                        try {
                            const { data: { session }, error } = await supabase.auth.getSession();
                            const token = session?.access_token;
                            const userId = useGameStore.getState().userProfile?.id;

                            console.log("[DEBUG check_delivery] Token for consume:", token ? "Present" : "Missing", "Session Error:", error, "Session:", session);

                            const res = await fetch('/api/inventory/consume', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                    ...(userId ? { 'x-user-id': userId } : {})
                                },
                                body: JSON.stringify({ item_id: requiredItemId, quantity: reqQty })
                            });
                            if (res.ok) {
                                await useGameStore.getState().fetchInventory();
                                if (successNode) setCurrentNodeId(successNode);
                            } else {
                                console.error("Failed to consume item");
                                if (failNode) setCurrentNodeId(failNode);
                            }
                        } catch (e) {
                            console.error("Item consume error:", e);
                            if (failNode) setCurrentNodeId(failNode);
                        }
                    } else {
                        if (successNode) setCurrentNodeId(successNode);
                    }
                } else {
                    if (failNode) setCurrentNodeId(failNode);
                }
            }
            // ...
            else if (currentNode.action === 'heal_partial') {
                // Heal 50%
                questState.healParty(0.5);
            }

            // 2. アクションノード
            if (currentNode.type === 'battle') {
                // 手動開始 (親または専用コンポーネントによって処理される)
            }
            // v3.4 拡張
            else if (currentNode.type === 'travel') {
                if (showingTravel) return; // アニメーション/モーダル中の再計算を防ぐ

                const targetSlug = currentNode.target_location_slug || currentNode.params?.target_location_slug;
                const encounterRate = currentNode.encounter_rate || 0;
                const nextSuccess = currentNode.next_node_success || currentNode.next;
                const nextBattle = currentNode.next_node_battle;

                if (targetSlug) {
                    // ... (既存の解決ロジックを維持)
                    const resolveLocation = async () => {
                        try {
                            const { data: { session } } = await supabase.auth.getSession();
                            const token = session?.access_token;
                            const userId = useGameStore.getState().userProfile?.id;
                            const res = await fetch('/api/travel/cost', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                    ...(userId ? { 'x-user-id': userId } : {})
                                },
                                body: JSON.stringify({ target_location_slug: targetSlug })
                            });

                            if (res.ok) {
                                const costData = await res.json();
                                console.log(`[Travel Calc API] From: ${costData.from} To: ${costData.to} Days: ${costData.days} GoldCost: ${costData.gold_cost}`);
                                setShowingTravel({
                                    dest: costData.to,
                                    slug: targetSlug,
                                    days: costData.days,
                                    gold_cost: costData.gold_cost ?? 0,
                                    next: nextSuccess,
                                    nextBattle,
                                    encounterRate,
                                    status: 'confirm'
                                });
                            } else {
                                console.error("Travel cost check failed");
                                if (nextSuccess) setCurrentNodeId(nextSuccess);
                            }
                        } catch (e) {
                            console.error("Travel resolution error", e);
                            if (nextSuccess) setCurrentNodeId(nextSuccess);
                        }
                    };
                    resolveLocation();
                } else if (nextSuccess) {
                    setCurrentNodeId(nextSuccess);
                }
            }
            else if (currentNode.type === 'guest_join') {
                // ... (既存のゲスト参加ロジック)
                const guestId = currentNode.params?.guest_id;
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;

                if (guestId) {
                    try {
                        const res = await fetch(`/api/party/member?id=${guestId}&context=guest`);
                        if (res.ok) {
                            const guestData = await res.json();
                            setShowingGuestJoin({ data: guestData, next: nextId });
                        } else {
                            if (nextId) setCurrentNodeId(nextId);
                        }
                    } catch (e) {
                        if (nextId) setCurrentNodeId(nextId);
                    }
                } else if (nextId) {
                    setCurrentNodeId(nextId);
                }
            }
            else if (currentNode.type === 'shop_special') {
                // 特別ショップロジック - リダイレクトではなくUI状態で処理
                // ショップモーダルを表示する状態を設定します
                // とりあえず、状態を渡すかレンダリングすると仮定します
                // 'showingShop' 状態を使用 (追加が必要)
            }
            else if (currentNode.type === 'shop_access') {
                // レガシーなリダイレクトロジック
                const questId = questState.questId;
                router.push(`/shop?quest_id=${questId}&return_to=quest`);
            }
            else if (currentNode.type === 'end' || currentNode.result) {
                const res = currentNode.result || (currentNode.type === 'end_failure' ? 'failure' : 'success');
                timeoutId = setTimeout(() => {
                    onComplete(res, history);
                }, 2000);
            }
        };

        processNode();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };

    }, [currentNodeId, currentNode, userProfile, history, onBattleStart, onComplete]);


    // --- アクション ---
    const handlePurchase = async (itemId: number, price: number, itemName: string) => {
        if ((Number(userProfile?.gold) || 0) < price) {
            alert("金貨が足りません！");
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const userId = useGameStore.getState().userProfile?.id;
            const res = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userId ? { 'x-user-id': userId } : {})
                },
                body: JSON.stringify({ item_id: itemId, price })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`${itemName} を購入しました！`);
                useGameStore.getState().fetchUserProfile(); // Refresh gold
                useGameStore.getState().fetchInventory();   // Refresh inventory
            } else {
                const err = await res.json();
                alert(`購入失敗: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error("Purchase error", e);
            alert("通信エラーが発生しました");
        }
    };

    // --- レンダリング ---

    // Specila Shop UI
    if (currentNode?.type === 'shop_special') {
        const nextId = currentNode.next || currentNode.choices?.[0]?.next;
        const defaultShopItems = [
            { id: 1, name: '薬草', price: 50, desc: 'HPを小回復' },
            { id: 3001, name: '傷薬', price: 100, desc: 'HPを中回復' }
        ];
        // パラメータがあれば使用、なければデフォルト
        const shopItems = currentNode.params?.shop_items || defaultShopItems;

        return (
            <div className="relative w-full h-[70vh] bg-[#1a120b] border-4 border-[#8b5a2b] overflow-hidden flex flex-col shadow-2xl rounded-lg p-6 md:p-10 items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/backgrounds/city/market.jpg')] opacity-20 pointer-events-none bg-cover bg-center" />

                <h2 className="text-3xl font-serif text-[#e3d5b8] mb-2 z-10 drop-shadow-md">特別補給部隊</h2>
                <p className="text-gray-400 mb-8 z-10 text-sm">「ここでは冒険に役立つ物資を扱っているよ。」</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 z-10 w-full max-w-2xl">
                    {shopItems.map((item: { id: number; name: string; price: number; desc: string }) => (
                        <div key={item.id} className="bg-[#3e2723]/90 text-[#e3d5b8] p-4 rounded border border-[#a38b6b] flex flex-col gap-2 shadow-lg">
                            <div className="flex justify-between items-center border-b border-[#a38b6b]/50 pb-2">
                                <span className="font-bold text-lg">{item.name}</span>
                                <span className="text-yellow-400 font-mono">{item.price} G</span>
                            </div>
                            <p className="text-xs text-gray-300">{item.desc}</p>
                            <button
                                onClick={() => handlePurchase(item.id, item.price, item.name)}
                                className="mt-2 bg-[#1a120b] hover:bg-[#5d4037] text-center py-2 rounded border border-[#8b5a2b] transition-colors text-sm font-bold tracking-wider"
                            >
                                購入する (BUY)
                            </button>
                        </div>
                    ))}
                </div>

                <div className="z-10 bg-black/50 px-6 py-2 rounded-full border border-[#a38b6b]/30 mb-8 backdrop-blur-sm">
                    <span className="text-gray-400 text-sm mr-2">所持金:</span>
                    <span className="text-yellow-400 font-bold font-mono text-xl">{userProfile?.gold || 0} G</span>
                </div>

                <button
                    onClick={() => nextId && setCurrentNodeId(nextId)}
                    className="z-10 text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-all pb-1 hover:pb-0"
                >
                    補給を終えて戻る
                </button>
            </div>
        );
    }

    // Camp UI
    if (currentNode?.type === 'camp') {
        const nextId = currentNode.next || currentNode.choices?.[0]?.next;

        return (
            <div className="relative w-full h-[70vh] bg-[#1a120b] border-4 border-[#8b5a2b] overflow-hidden flex flex-col shadow-2xl rounded-lg p-6 md:p-10 items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/backgrounds/camp.jpg')] opacity-30 pointer-events-none bg-cover bg-center" />

                <h2 className="text-3xl font-serif text-[#e3d5b8] mb-2 z-10 drop-shadow-md">野営地 (Camp)</h2>
                <p className="text-gray-400 mb-8 z-10 text-sm">「焚き火の温もりが身体を癒やしてくれる。装備を整える時間はありそうだ。」</p>

                <div className="z-10 bg-black/50 px-6 py-6 rounded border border-[#a38b6b]/30 mb-8 backdrop-blur-sm text-center">
                    <p className="text-yellow-400 font-bold text-sm mb-4">※ここでは特別に、クエスト中のデッキ・装備変更が許可されます。</p>
                    <button
                        onClick={() => setShowCampStatus(true)}
                        className="bg-[#3e2723] text-[#e3d5b8] border border-[#a38b6b] px-8 py-3 hover:bg-[#5d4037] transition-all tracking-widest text-lg font-bold shadow-lg hover:scale-105"
                    >
                        デッキ編成 (装備変更)
                    </button>
                </div>

                <button
                    onClick={() => nextId && setCurrentNodeId(nextId)}
                    className="z-10 text-gray-400 hover:text-white border-b border-white border-dashed hover:border-solid hover:text-white transition-all pb-1 hover:pb-0 font-bold"
                >
                    休憩を終えて出発する
                </button>

                {showCampStatus && <StatusModal onClose={() => setShowCampStatus(false)} isCampMode={true} />}
            </div>
        );
    }

    // 安全性チェック
    if (!currentNode) {
        return <div className="p-8 text-red-500">Error: Node '{currentNodeId}' not found.</div>;
    }

    const handleChoice = (choice: any) => {
        // 要件の検証
        if (choice.req) {
            const { type, val } = choice.req;
            if (type === 'has_item') {
                // Check inventory
                // const has = ... 
                // For MVP skipping strict client-side validation if not critical, or assume always enabled for choices
            }
        }

        // コストチェック
        if (choice.cost_vitality) {
            if ((userProfile?.vitality || 0) < choice.cost_vitality) {
                alert("体力が足りません！");
                return;
            }
            // Deduction handled by API on complete or intermediate? 
            // Usually API handles final cost, but for multi-step, we might track debt?
            // For now, allow proceed.
        }

        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(choice.next);
    };

    // ビジュアル
    const bgUrl = getAssetUrl(currentNode.bg_key || 'default');

    return (
        <div className="relative w-full h-full flex flex-col justify-end bg-slate-900 overflow-hidden">
            {/* Debug Overlay */}
            <div className="absolute top-0 left-0 bg-red-900/80 text-white text-[10px] p-1 z-50 font-mono shadow-md rounded-br-lg">
                Nodes: {Object.keys(script.nodes || {}).length} | ID: {currentNodeId} | Type: {currentNode?.type || 'none'}
            </div>

            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out opacity-40 mix-blend-overlay"
                style={{ backgroundImage: `url(${bgUrl})` }}
            />

            <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
                <div className="w-64 h-[80%] bg-slate-800 rounded-t-full border-t border-amber-900/30 flex flex-col items-center justify-end overflow-hidden mb-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    {currentNode.speaker_image_url ? (
                        <div className="w-[120%] h-auto max-h-[100%] flex items-end justify-center z-0 opacity-80 mix-blend-screen transition-all duration-1000 ease-in-out">
                            <img
                                src={currentNode.speaker_image_url}
                                alt="Speaker"
                                className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
                            />
                        </div>
                    ) : (
                        <div className="text-slate-700 transform scale-[4] opacity-20 mb-12"><User size={200} /></div>
                    )}
                </div>
            </div>

            <div className="relative z-20 px-4 pb-8 space-y-4 w-full mx-auto md:pb-12 max-h-[85vh] flex flex-col justify-end">
                {/* Main Text Dialog */}
                <div className="bg-slate-900/85 backdrop-blur-md border border-amber-900/50 rounded-xl p-3 shadow-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0">
                    <div className="flex-shrink-0 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-800 border-2 border-amber-600/30 flex items-center justify-center overflow-hidden shadow-inner">
                            {currentNode.speaker_image_url ? (
                                <img src={currentNode.speaker_image_url} alt="Face" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-amber-600/40" />
                            )}
                        </div>
                    </div>
                    <div className="flex-1 relative pb-1 pt-1 min-h-[60px]">
                        {currentNode.speaker && (
                            <div className="absolute -top-6 -left-1 bg-amber-900 text-amber-100 text-[10px] px-3 py-0.5 rounded-sm border border-amber-600 font-bold uppercase tracking-widest shadow-lg">
                                {currentNode.speaker}
                            </div>
                        )}
                        <div className="h-full max-h-[30vh] overflow-y-auto no-scrollbar pt-1 pr-1">
                            <p className="text-slate-200 text-sm leading-relaxed font-serif whitespace-pre-wrap selection:bg-amber-900/50">
                                {showingTravel ? (
                                    <span className="text-gray-500 italic animate-pulse">移動準備中...</span>
                                ) : currentNode.text || (
                                    currentNode.type === 'travel' ? "移動中... (数日が経過した)" :
                                        currentNode.type === 'guest_join' ? "新たな仲間が合流したようだ。" :
                                            "..."
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Choices */}
                <div className="flex flex-col gap-2 shrink-0">
                    {currentNode.type === 'battle' ? (
                        <button
                            onClick={() => {
                                if (onBattleStart) {
                                    const successChoice = currentNode.choices?.find((c: any) => c.label === 'win') || currentNode.choices?.[0];
                                    const successId = successChoice?.next || 'end_success';
                                    const enemyId = currentNode.enemy_group_id || 'slime';
                                    onBattleStart(enemyId, successId);
                                }
                            }}
                            className="w-full bg-red-950/80 border border-red-800 text-red-300 py-4 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(153,27,27,0.5)] active:scale-[0.98] transition-all hover:bg-red-900/80 uppercase tracking-widest"
                        >
                            戦闘開始 (FIGHT)
                        </button>
                    ) : currentNode.choices && currentNode.choices.length > 0 ? (
                        currentNode.choices.map((choice: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => handleChoice(choice)}
                                className="w-full py-4 px-4 bg-amber-900/40 border border-amber-600 text-amber-100 rounded-lg font-bold text-sm text-center shadow-lg hover:bg-amber-900/60 transition-all active:scale-[0.98] flex items-center justify-between"
                            >
                                <span className="flex-1 text-center font-serif truncate px-2">{choice.label}</span>

                                {/* Info tags */}
                                <div className="flex flex-col items-end gap-1 absolute right-6 text-right shrink-0">
                                    {choice.cost_vitality && (
                                        <div className="flex items-center gap-1 text-[9px] text-red-400 font-mono italic">
                                            <Sword size={8} /> Vit -{choice.cost_vitality}
                                        </div>
                                    )}
                                    {choice.req_tag && (
                                        <div className="flex items-center gap-1 text-[9px] text-blue-400 font-mono border border-blue-900/50 bg-blue-900/40 px-1 rounded-sm">
                                            <Shield size={8} /> {choice.req_tag.substring(0, 8)}..
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : currentNode.next ? (
                        <button
                            onClick={() => {
                                setHistory(prev => [...prev, currentNodeId]);
                                setCurrentNodeId(currentNode.next);
                            }}
                            className="w-full py-4 bg-slate-800/60 border border-slate-600 text-slate-300 rounded-lg font-bold text-sm text-center shadow-lg hover:bg-slate-700/60 transition-all active:scale-[0.98] tracking-widest flex items-center justify-center gap-2"
                        >
                            <span>次へ</span>
                            <ArrowRight size={14} className="opacity-70" />
                        </button>
                    ) : (
                        currentNode.type === 'end' || currentNode.result ? (
                            <div className="text-center font-bold text-xl py-4 animate-pulse tracking-widest">
                                {currentNode.result === 'success' ? (
                                    <span className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">QUEST COMPLETED</span>
                                ) : (
                                    <span className="text-red-500 drop-shadow-lg">QUEST FAILED</span>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 italic pb-2 text-sm tracking-widest">...</div>
                        )
                    )}
                </div>
            </div>

            {/* Guest Join Modal */}
            {showingGuestJoin && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center animate-in fade-in duration-500 rounded-lg">
                    <div className="bg-[#1a120b] border-2 border-[#a38b6b] p-8 max-w-md w-full text-center shadow-2xl relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#a38b6b] text-[#1a120b] px-4 py-1 font-bold tracking-widest uppercase text-sm border border-[#e3d5b8]">
                            New Member
                        </div>
                        <h3 className="text-2xl font-serif text-[#e3d5b8] mb-2">{showingGuestJoin.data.name}</h3>
                        <p className="text-gray-400 mb-6 italic">"{showingGuestJoin.data.introduction || 'よろしくお願いします。'}"</p>

                        <div className="flex justify-center gap-4 mb-6">
                            <div className="text-xs text-[#a38b6b] border border-[#3e2723] px-2 py-1 rounded">
                                {showingGuestJoin.data.job_class}
                            </div>
                            <div className="text-xs text-[#a38b6b] border border-[#3e2723] px-2 py-1 rounded">
                                Lv.{showingGuestJoin.data.level}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                questState.addGuest(showingGuestJoin.data);
                                setHistory(prev => [...prev, `[Guest] ${showingGuestJoin.data.name} が同行した。`]);
                                setShowingGuestJoin(null);
                                if (showingGuestJoin.next) setCurrentNodeId(showingGuestJoin.next);
                            }}
                            className="bg-[#3e2723] text-[#e3d5b8] border border-[#a38b6b] px-8 py-2 hover:bg-[#5d4037] transition-colors w-full"
                        >
                            仲間に入れる
                        </button>
                    </div>
                </div>
            )}

            {/* Travel Modal */}
            {showingTravel && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-700 rounded-lg p-8">

                    {/* Linear Route Map Display */}
                    <div className="w-full h-full max-h-[60%] mb-6 relative bg-[#1a120b] border-2 border-[#8b5a2b] rounded-lg p-4 flex items-center justify-center gap-2 md:gap-4 overflow-x-auto">
                        {/* Current Location */}
                        <div className="flex flex-col items-center min-w-[80px]">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-blue-900/50 flex items-center justify-center shadow-[0_0_10px_blue]">
                                <MapPin size={20} className="text-blue-300" />
                            </div>
                            <span className="text-xs text-blue-300 mt-2 font-bold text-center">{userProfile?.current_location_name}</span>
                            <span className="text-[10px] text-gray-500">現在地</span>
                        </div>

                        {/* Arrow 1 */}
                        <div className="text-gray-500 animate-pulse">
                            <ArrowRight size={20} />
                        </div>

                        {/* Destination */}
                        <div className="flex flex-col items-center min-w-[80px]">
                            <div className="w-12 h-12 rounded-full border-2 border-[#e3d5b8] bg-[#3e2723] flex items-center justify-center shadow-[0_0_15px_#e3d5b8] animate-bounce">
                                <MapPin size={24} className="text-[#e3d5b8]" />
                            </div>
                            <span className="text-sm text-[#e3d5b8] mt-2 font-bold text-center">{showingTravel.dest}</span>
                            <span className="text-[10px] text-yellow-500 font-bold">Next Stop</span>
                        </div>

                        {/* Future Stops (Hide if destination is Final) */}
                        {showingTravel.dest !== '帝都カロン' && (
                            <>
                                <div className="text-gray-700">
                                    <ArrowRight size={20} />
                                </div>
                                <div className="flex flex-col items-center min-w-[60px] opacity-50 grayscale">
                                    <div className="w-8 h-8 rounded-full border border-gray-600 bg-black flex items-center justify-center">
                                        <Star size={14} className="text-gray-400" />
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-2 text-center">???</span>
                                </div>
                            </>
                        )}
                    </div>

                    <h2 className="text-3xl font-serif text-[#e3d5b8] mb-2 tracking-widest animate-pulse">
                        {showingTravel.status === 'confirm' ? 'TRAVEL ROUTE' : 'TRAVELING...'}
                    </h2>

                    <div className="text-center mb-8 bg-black/50 p-4 rounded border border-[#a38b6b]/30 backdrop-blur-sm">
                        <p className="text-gray-400 text-lg flex items-center justify-center gap-2">
                            <span>To:</span>
                            <span className="text-[#e3d5b8] font-bold text-xl drop-shadow-[0_0_5px_rgba(227,213,184,0.5)]">
                                {showingTravel.dest}
                            </span>
                        </p>
                        <p className="text-gray-500 mt-1 flex items-center justify-center gap-2 text-sm">
                            <Scroll size={14} />
                            <span>所要日数: {showingTravel.days} 日</span>
                        </p>
                        {showingTravel.gold_cost > 0 && (
                            <p className={`mt-1 flex items-center justify-center gap-2 text-sm font-bold ${(userProfile?.gold ?? 0) < showingTravel.gold_cost ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                <span>移動費用: {showingTravel.gold_cost} G</span>
                            </p>
                        )}
                        {showingTravel.gold_cost > 0 && (userProfile?.gold ?? 0) < showingTravel.gold_cost && (
                            <p className="text-xs text-red-400 mt-2">ゴールドが不足しています</p>
                        )}
                    </div>

                    {showingTravel.status === 'confirm' ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowingTravel({ ...showingTravel, status: 'animating' });
                                        // Auto-advance after animation duration (e.g. 3s)
                                        setTimeout(async () => {
                                            // 1. Execute Server Move
                                            try {
                                                const { data: { session } } = await supabase.auth.getSession();
                                                const token = session?.access_token;
                                                const userId = useGameStore.getState().userProfile?.id;
                                                const res = await fetch('/api/move', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                                        ...(userId ? { 'x-user-id': userId } : {})
                                                    },
                                                    body: JSON.stringify({
                                                        target_location_name: showingTravel.dest,
                                                        target_location_slug: showingTravel.slug,
                                                        is_quest_travel: true
                                                    })
                                                });

                                                if (res.ok) {
                                                    const data = await res.json();
                                                    // Refresh Global State
                                                    await useGameStore.getState().fetchUserProfile();

                                                    // Update Local Quest State
                                                    questState.travelTo(showingTravel.dest, data.travel_days);
                                                    setHistory(prev => [...prev, `[Travel] ${data.travel_days}日かけて移動した... (残り寿命 -${data.travel_days})`]);

                                                    // 2. Encounter Check
                                                    const roll = Math.random();
                                                    const isBattle = showingTravel.encounterRate && roll < showingTravel.encounterRate;

                                                    setShowingTravel(null);

                                                    if (isBattle && showingTravel.nextBattle && onBattleStart) {
                                                        console.log("Encounter Triggered!", roll, "<", showingTravel.encounterRate);
                                                        setCurrentNodeId(showingTravel.nextBattle);
                                                    } else {
                                                        // Success / Safe
                                                        if (showingTravel.next) setCurrentNodeId(showingTravel.next);
                                                    }

                                                } else {
                                                    alert("移動に失敗しました (API Error)");
                                                    setShowingTravel(null);
                                                }
                                            } catch (e) {
                                                console.error("Travel error", e);
                                                alert("通信エラー");
                                                setShowingTravel(null);
                                            }
                                        }, 3000);
                                    }}
                                    disabled={showingTravel.gold_cost > 0 && (userProfile?.gold ?? 0) < showingTravel.gold_cost}
                                    className={`px-12 py-3 tracking-widest text-lg font-bold transition-all ${showingTravel.gold_cost > 0 && (userProfile?.gold ?? 0) < showingTravel.gold_cost
                                        ? 'bg-gray-800 text-gray-500 border border-gray-600 cursor-not-allowed'
                                        : 'bg-[#3e2723] text-[#e3d5b8] border border-[#a38b6b] hover:bg-[#5d4037] shadow-[0_0_15px_rgba(139,90,43,0.3)] hover:scale-105'
                                        }`}
                                >
                                    DEPART
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm animate-pulse italic">
                            移動中...
                        </div>
                    )}
                </div>
            )}

        </div >
    );
}
