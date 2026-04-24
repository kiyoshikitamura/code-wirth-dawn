
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScenarioDB } from '@/types/game';
import { getAssetUrl } from '@/config/assets';
import { Scroll, Sword, Skull, ArrowRight, MapPin, Shield, Star, User } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { useRouter } from 'next/navigation';
import StatusModal from '@/components/inn/StatusModal';
import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/soundManager';
import { useScenarioNodeProcessor } from './hooks/useScenarioNodeProcessor';

interface Props {
    scenario: ScenarioDB;
    onComplete: (result: 'success' | 'failure' | 'abort', history: string[]) => void;
    onBattleStart?: (enemyId: string, successNodeId: string, bgKey?: string) => void;
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

    // Phase 2: UX改善 State
    const [endReady, setEndReady] = useState<{ result: 'success' | 'failure' | 'abort'; history: string[] } | null>(null);
    const [isProcessingResult, setIsProcessingResult] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Phase 3: タイプライター演出
    const [displayedText, setDisplayedText] = useState('');
    const [typewriterDone, setTypewriterDone] = useState(false);
    const typewriterRef = useRef<NodeJS.Timeout | null>(null);
    const setTypewriterComplete = (complete: boolean) => {
        if (complete && typewriterRef.current) {
            clearInterval(typewriterRef.current);
            typewriterRef.current = null;
        }
        if (complete) {
            const fullText = currentNode?.text || (
                currentNode?.type === 'travel' ? '移動中... (数日が経過した)' :
                currentNode?.type === 'guest_join' ? '新たな仲間が合流したようだ。' : '...'
            );
            setDisplayedText(fullText);
        }
        setTypewriterDone(complete);
    };

    // グローバル状態へのアクセス
    const { userProfile, worldState, battleState, inventory } = useGameStore();
    const questState = useQuestState();
    const router = useRouter();

    // フィードの最下部へスクロール
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [feed]);

    // トースト表示ヘルパー（3秒で自動消去）
    const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage({ text, type });
        toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
    };

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

    let currentNode = script.nodes?.[currentNodeId];

    // --- タイプライターeffect ---
    useEffect(() => {
        // リセット
        setDisplayedText('');
        setTypewriterDone(false);
        if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
            typewriterRef.current = null;
        }

        const fullText = currentNode?.text || (
            currentNode?.type === 'travel' ? '移動中... (数日が経過した)' :
            currentNode?.type === 'guest_join' ? '新たな仲間が合流したようだ。' : '...'
        );

        // 非テキストノードは即時表示
        if (!currentNode || ['battle', 'camp', 'shop_access', 'supply'].includes(currentNode.type || '')) {
            setDisplayedText(fullText);
            setTypewriterDone(true);
            return;
        }

        let charIndex = 0;
        typewriterRef.current = setInterval(() => {
            charIndex++;
            if (charIndex >= fullText.length) {
                setDisplayedText(fullText);
                setTypewriterDone(true);
                if (typewriterRef.current) {
                    clearInterval(typewriterRef.current);
                    typewriterRef.current = null;
                }
            } else {
                setDisplayedText(fullText.substring(0, charIndex));
            }
        }, 30);

        return () => {
            if (typewriterRef.current) {
                clearInterval(typewriterRef.current);
                typewriterRef.current = null;
            }
        };
    }, [currentNodeId]);

    // --- ノードプロセッサー (useScenarioNodeProcessor フックに委譲) ---
    useScenarioNodeProcessor({
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
    });


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

    // Special Shop UI
    if (currentNode?.type === 'shop_special') {
        const nextId = currentNode.next || currentNode.choices?.[0]?.next;
        const defaultShopItems = [
            { id: 1, name: '薬草', price: 50, desc: 'HPを小回復' },
            { id: 3001, name: '傷薬', price: 100, desc: 'HPを中回復' }
        ];
        const shopItems = currentNode.params?.shop_items || defaultShopItems;

        return (
            <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-6">
                <div className="absolute inset-0 bg-[url('/backgrounds/city/market.jpg')] opacity-15 pointer-events-none bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                <h2 className="text-2xl font-serif text-amber-400 mb-1 z-10 drop-shadow-md">特別補給部隊</h2>
                <p className="text-slate-500 mb-6 z-10 text-sm italic">「ここでは冒険に役立つ物資を扱っているよ。」</p>

                <div className="flex flex-col gap-3 mb-6 z-10 w-full max-w-sm">
                    {shopItems.map((item: { id: number; name: string; price: number; desc: string }) => (
                        <div key={item.id} className="bg-slate-900/90 backdrop-blur-sm text-slate-200 p-4 rounded-xl border border-amber-900/40 flex flex-col gap-2 shadow-lg">
                            <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                                <span className="font-bold text-base">{item.name}</span>
                                <span className="text-amber-400 font-mono text-sm">{item.price} G</span>
                            </div>
                            <p className="text-xs text-slate-400">{item.desc}</p>
                            <button
                                onClick={() => handlePurchase(item.id, item.price, item.name)}
                                className="mt-1 bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 text-center py-2.5 rounded-lg border border-amber-700/50 transition-all text-sm font-bold tracking-wider active:scale-[0.98]"
                            >
                                購入する
                            </button>
                        </div>
                    ))}
                </div>

                <div className="z-10 bg-slate-900/80 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-700/50 mb-6">
                    <span className="text-slate-400 text-sm mr-2">所持金:</span>
                    <span className="text-amber-400 font-bold font-mono text-lg">{userProfile?.gold || 0} G</span>
                </div>

                <button
                    onClick={() => nextId && setCurrentNodeId(nextId)}
                    className="z-10 text-slate-500 hover:text-slate-200 border-b border-transparent hover:border-slate-400 transition-all text-sm"
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
            <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-6">
                <div className="absolute inset-0 bg-[url('/backgrounds/camp.jpg')] opacity-20 pointer-events-none bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                <div className="z-10 w-16 h-16 rounded-full bg-orange-900/30 border-2 border-orange-600/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,88,12,0.2)]">
                    <span className="text-3xl">🔥</span>
                </div>
                <h2 className="text-2xl font-serif text-amber-400 mb-1 z-10 drop-shadow-md">野営地</h2>
                <p className="text-slate-500 mb-6 z-10 text-sm italic text-center max-w-xs">「焚き火の温もりが身体を癒やしてくれる。装備を整える時間はありそうだ。」</p>

                <div className="z-10 bg-slate-900/80 backdrop-blur-sm px-6 py-5 rounded-xl border border-amber-900/40 mb-6 text-center max-w-sm">
                    <p className="text-amber-400/80 font-bold text-sm mb-4">※ここでは特別に、デッキ・装備変更が許可されます。</p>
                    <button
                        onClick={() => setShowCampStatus(true)}
                        className="bg-amber-900/40 text-amber-100 border border-amber-700/50 px-8 py-3 hover:bg-amber-800/60 transition-all tracking-wider text-base font-bold rounded-lg active:scale-[0.98]"
                    >
                        デッキ編成・装備変更
                    </button>
                </div>

                <button
                    onClick={() => nextId && setCurrentNodeId(nextId)}
                    className="z-10 text-slate-500 hover:text-slate-200 border-b border-slate-600 border-dashed hover:border-solid hover:border-slate-300 transition-all text-sm font-bold"
                >
                    休憩を終えて出発する
                </button>

                {showCampStatus && <StatusModal onClose={() => setShowCampStatus(false)} isCampMode={true} />}
            </div>
        );
    }

    if (!currentNode) {
        // ★ ノード未発見フォールバック — DB未更新時でもクラッシュしない
        console.warn(`[ScenarioEngine] Node "${currentNodeId}" not found. Recovery mode.`);
        
        const endNodeEntry = Object.entries(script.nodes || {}).find(([, n]: [string, any]) => n.type === 'end' && n.result === 'success');
        const recoveryNext = endNodeEntry ? endNodeEntry[0] : undefined;
        
        currentNode = {
            text: `（シナリオデータの読み込みに問題がありました。ここから続けることができます）`,
            type: recoveryNext ? 'text' : 'end',
            result: recoveryNext ? undefined : 'success',
            choices: recoveryNext ? [{ label: '物語を続ける', next: recoveryNext }] : [],
        };
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

            {/* Phase 2: トースト通知UI */}
            {toastMessage && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-lg shadow-xl border text-sm font-bold tracking-wider animate-in fade-in slide-in-from-top-3 duration-300 ${
                    toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-300' :
                    toastMessage.type === 'error' ? 'bg-red-950/90 border-red-700/50 text-red-300' :
                    'bg-slate-800/90 border-slate-600/50 text-slate-300'
                }`}>
                    {toastMessage.text}
                </div>
            )}

            {/* Background Image Layer — 背景画像を全面表示 */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
                style={{ backgroundImage: `url(${bgUrl})` }}
            />
            {/* 下部グラデーション（テキスト領域の可読性確保） */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />

            {/* 話者キャラ画像 — テキストログ内にアイコンがあるため背景表示は削除 */}

            <div className="relative z-20 px-4 pb-8 space-y-4 w-full mx-auto md:pb-12 max-h-[85vh] flex flex-col justify-end">
                {/* Main Text Dialog */}
                <div className="bg-slate-950/40 backdrop-blur-sm border border-amber-900/40 rounded-xl p-3 shadow-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0">
                    {/* アイコン: 話者画像あり→ポートレート / 「」台詞→汎用アイコン / ナレーション→非表示 */}
                    {(() => {
                        const speakerName = currentNode.speaker_name || currentNode.speaker || currentNode.params?.speaker_name;
                        const hasPortrait = !!currentNode.speaker_image_url;
                        const isDialogue = currentNode.text?.startsWith('「');
                        
                        if (hasPortrait) {
                            return (
                                <div className="flex-shrink-0 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-800 border-2 border-amber-600/30 flex items-center justify-center overflow-hidden shadow-inner">
                                        <img src={currentNode.speaker_image_url} alt="Face" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            );
                        } else if (isDialogue && !speakerName) {
                            // 汎用キャラ台詞（「」で始まるがspeaker_nameなし）
                            return (
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-800/50 border-2 border-slate-600/30 flex items-center justify-center shadow-inner">
                                        <User size={28} className="text-slate-500/50" />
                                    </div>
                                </div>
                            );
                        }
                        // ナレーション → アイコンなし
                        return null;
                    })()}
                    <div className="flex-1 relative pb-1 pt-1">
                        {/* 話者名タグ: キャラ名あり→金色 / 「」台詞→灰色「名もなき者」 / ナレーション→なし */}
                        {(() => {
                            const speakerName = currentNode.speaker_name || currentNode.speaker || currentNode.params?.speaker_name;
                            const isDialogue = currentNode.text?.startsWith('「');
                            
                            if (speakerName) {
                                return (
                                    <div className="text-amber-400 text-[10px] font-bold tracking-widest mb-1">
                                        ◆ {speakerName}
                                    </div>
                                );
                            } else if (isDialogue) {
                                return (
                                    <div className="text-slate-500 text-[10px] tracking-wider mb-1">
                                        ◇ 名もなき者
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        {/* 固定高さテキスト領域 + スクロール */}
                        <div
                            className="h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pt-1 pr-1 cursor-pointer"
                            onClick={() => setTypewriterComplete(true)}
                        >
                            <p className="text-slate-200 text-sm leading-relaxed font-serif whitespace-pre-wrap selection:bg-amber-900/50">
                                {showingTravel ? (
                                    <span className="text-gray-500 italic animate-pulse">移動準備中...</span>
                                ) : (
                                    <>
                                        {displayedText}
                                        {!typewriterDone && <span className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 animate-pulse align-middle" />}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Choices */}
                <div className="flex flex-col gap-2 shrink-0">
                    {currentNode.type === 'battle' ? (
                        <div className="flex flex-col gap-3">
                            {/* 遭遇演出 — 敵情報の事前表示 */}
                            <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="w-12 h-12 rounded-lg bg-red-900/30 border border-red-800/50 flex items-center justify-center shrink-0">
                                    <Skull size={24} className="text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-red-300 text-xs font-bold tracking-wider uppercase">⚠ 敵遭遇</p>
                                    <p className="text-red-200/80 text-sm font-serif truncate">
                                        {currentNode.enemy_name || currentNode.params?.enemy_name || '敵勢力'}
                                    </p>
                                    {(currentNode.enemy_level || currentNode.params?.enemy_level) && (
                                        <p className="text-red-500/70 text-[10px] font-mono">推定脅威度 Lv.{currentNode.enemy_level || currentNode.params?.enemy_level}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (onBattleStart) {
                                        // 勝利後ノード: battle_success_next（CSVのnext_node由来） → choices[0].next → fallback
                                        const successId = currentNode.battle_success_next
                                            || currentNode.choices?.[0]?.next
                                            || currentNode.next
                                            || 'end_success';
                                        const enemyId = currentNode.enemy_group_id || 'slime';
                                        onBattleStart(enemyId, successId, currentNode.bg_key);
                                    }
                                }}
                                className="w-full bg-red-950/80 border border-red-800 text-red-300 py-4 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(153,27,27,0.5)] active:scale-[0.98] transition-all hover:bg-red-900/80 uppercase tracking-widest"
                            >
                                ⚔️ 戦闘開始
                            </button>
                        </div>
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
                                            <Sword size={8} /> 体力 -{choice.cost_vitality}
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
                            <div className="flex flex-col items-center gap-3">
                                <div className="text-center font-bold text-xl py-2 animate-pulse tracking-widest">
                                    {currentNode.result === 'success' ? (
                                        <span className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">クエスト達成</span>
                                    ) : (
                                        <span className="text-red-500 drop-shadow-lg">クエスト失敗</span>
                                    )}
                                </div>
                                {/* Phase 2: ユーザーボタン操作による遷移 */}
                                <button
                                    onClick={() => {
                                        if (endReady && !isProcessingResult) {
                                            setIsProcessingResult(true);
                                            onComplete(endReady.result, endReady.history);
                                        }
                                    }}
                                    disabled={!endReady || isProcessingResult}
                                    className={`w-full py-4 rounded-lg text-sm font-bold tracking-widest transition-all active:scale-[0.98] ${
                                        currentNode.result === 'success'
                                            ? 'bg-amber-900/40 border border-amber-600 text-amber-200 hover:bg-amber-900/60'
                                            : 'bg-red-950/50 border border-red-800 text-red-300 hover:bg-red-900/60'
                                    } ${(!endReady || isProcessingResult) ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {isProcessingResult ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            結果を処理中...
                                        </span>
                                    ) : endReady ? '結果を確認する' : '判定中...'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 italic pb-2 text-sm tracking-widest">...</div>
                        )
                    )}
                </div>
            </div>

            {/* Guest Join Modal */}
            {showingGuestJoin && (
                <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500 p-6">
                    <div className="bg-slate-900 border border-amber-900/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-1 font-bold tracking-widest text-xs rounded-full shadow-lg">
                            新たな仲間
                        </div>

                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-600/40 flex items-center justify-center mx-auto mt-4 mb-3 overflow-hidden">
                            {(showingGuestJoin.data.image_url || showingGuestJoin.data.icon_url || showingGuestJoin.data.image) ? (
                                <img
                                    src={showingGuestJoin.data.image_url || showingGuestJoin.data.icon_url || showingGuestJoin.data.image}
                                    alt={showingGuestJoin.data.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.removeProperty('display'); }}
                                />
                            ) : null}
                            <User size={36} className="text-amber-500/60" style={(showingGuestJoin.data.image_url || showingGuestJoin.data.icon_url || showingGuestJoin.data.image) ? { display: 'none' } : undefined} />
                        </div>

                        <h3 className="text-xl font-serif text-amber-400 mb-1">{showingGuestJoin.data.name}</h3>
                        <p className="text-slate-500 mb-4 italic text-sm">"{showingGuestJoin.data.introduction || 'よろしくお願いします。'}"</p>

                        <div className="flex justify-center gap-3 mb-5">
                            <div className="text-xs text-amber-400/80 border border-amber-900/40 bg-amber-950/30 px-3 py-1 rounded-full">
                                {showingGuestJoin.data.job_class}
                            </div>
                            <div className="text-xs text-slate-400 border border-slate-700 bg-slate-800/50 px-3 py-1 rounded-full">
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
                            className="w-full bg-amber-900/40 text-amber-100 border border-amber-700/50 px-6 py-3 rounded-lg hover:bg-amber-800/60 transition-all font-bold tracking-wider active:scale-[0.98]"
                        >
                            仲間に入れる
                        </button>
                    </div>
                </div>
            )}

            {/* Travel Modal */}
            {showingTravel && (
                <div className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-700 p-6">

                    {/* Linear Route Map Display */}
                    <div className="w-full max-w-sm mb-6 relative bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 flex items-center justify-center gap-3 overflow-x-auto">
                        {/* Current Location */}
                        <div className="flex flex-col items-center min-w-[70px]">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-blue-900/40 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                <MapPin size={18} className="text-blue-300" />
                            </div>
                            <span className="text-[11px] text-blue-300 mt-2 font-bold text-center">{userProfile?.current_location_name}</span>
                            <span className="text-[10px] text-slate-500">現在地</span>
                        </div>

                        <div className="text-slate-600 animate-pulse"><ArrowRight size={18} /></div>

                        {/* Destination */}
                        <div className="flex flex-col items-center min-w-[70px]">
                            <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-900/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
                                <MapPin size={22} className="text-amber-400" />
                            </div>
                            <span className="text-sm text-amber-400 mt-2 font-bold text-center">{showingTravel.dest}</span>
                            <span className="text-[10px] text-amber-500/70 font-bold">目的地</span>
                        </div>

                        {/* Future Stops */}
                        {showingTravel.slug !== 'loc_charon' && (
                            <>
                                <div className="text-slate-700"><ArrowRight size={18} /></div>
                                <div className="flex flex-col items-center min-w-[50px] opacity-40">
                                    <div className="w-8 h-8 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center">
                                        <Star size={12} className="text-slate-500" />
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-2">???</span>
                                </div>
                            </>
                        )}
                    </div>

                    <h2 className="text-xl font-serif text-amber-400 mb-3 tracking-wider">
                        {showingTravel.status === 'confirm' ? '移動ルート' : '移動中...'}
                    </h2>

                    <div className="text-center mb-6 bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 max-w-sm w-full">
                        <p className="text-slate-400 text-base flex items-center justify-center gap-2">
                            <span>行き先:</span>
                            <span className="text-amber-400 font-bold text-lg">{showingTravel.dest}</span>
                        </p>
                        <p className="text-slate-500 mt-1 flex items-center justify-center gap-2 text-sm">
                            <Scroll size={14} />
                            <span>所要日数: {showingTravel.days} 日</span>
                        </p>
                        {showingTravel.gold_cost > 0 && (
                            <p className={`mt-1 flex items-center justify-center gap-2 text-sm font-bold ${(userProfile?.gold ?? 0) < showingTravel.gold_cost ? 'text-red-400' : 'text-amber-400'}`}>
                                <span>移動費用: {showingTravel.gold_cost} G</span>
                            </p>
                        )}
                        {showingTravel.gold_cost > 0 && (userProfile?.gold ?? 0) < showingTravel.gold_cost && (
                            <p className="text-xs text-red-400 mt-2">ゴールドが不足しています</p>
                        )}
                    </div>

                    {showingTravel.status === 'confirm' ? (
                        <button
                            onClick={() => {
                                setShowingTravel({ ...showingTravel, status: 'animating' });
                                setTimeout(async () => {
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
                                            await useGameStore.getState().fetchUserProfile();
                                            questState.travelTo(showingTravel.dest, data.travel_days);
                                            setHistory(prev => [...prev, `[Travel] ${data.travel_days}日かけて移動した... (残り寿命 -${data.travel_days})`]);

                                            const roll = Math.random();
                                            const isBattle = showingTravel.encounterRate && roll < showingTravel.encounterRate;
                                            setShowingTravel(null);

                                            if (isBattle && showingTravel.nextBattle && onBattleStart) {
                                                setCurrentNodeId(showingTravel.nextBattle);
                                            } else {
                                                if (showingTravel.next) setCurrentNodeId(showingTravel.next);
                                            }
                                        } else {
                                            alert("移動に失敗しました");
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
                            className={`px-10 py-3 tracking-wider text-base font-bold rounded-lg transition-all active:scale-[0.98] ${
                                showingTravel.gold_cost > 0 && (userProfile?.gold ?? 0) < showingTravel.gold_cost
                                    ? 'bg-slate-800 text-slate-500 border border-slate-600 cursor-not-allowed'
                                    : 'bg-amber-900/50 text-amber-100 border border-amber-700/50 hover:bg-amber-800/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            }`}
                        >
                            出発する
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-500 text-sm italic">移動中...</span>
                        </div>
                    )}
                </div>
            )}

        </div >
    );
}
