
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScenarioDB } from '@/types/game';
import { getAssetUrl } from '@/config/assets';
import { Scroll, Sword, Skull, ArrowRight, MapPin, Shield, Star, User } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { useRouter } from 'next/navigation';
import StatusModal from '@/components/inn/StatusModal';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { useScenarioNodeProcessor } from './hooks/useScenarioNodeProcessor';

interface Props {
    scenario: ScenarioDB;
    onComplete: (result: 'success' | 'failure' | 'abort', history: string[], nodeRewards?: any) => void;
    onPrepareResult?: (result: 'success' | 'failure', history: string[], nodeRewards?: any) => void;
    isResultReady?: boolean;
    isPreparingResult?: boolean;
    onBattleStart?: (enemyId: string, successNodeId: string, bgKey?: string, bgm?: string) => void;
    initialNodeId?: string;
}

export default function ScenarioEngine({
    scenario,
    onComplete,
    onPrepareResult,
    isResultReady = true,
    isPreparingResult = false,
    onBattleStart,
    initialNodeId
}: Props) {
    const router = useRouter();
    const { userProfile, worldState, battleState, inventory } = useGameStore();
    const questState = useQuestState();
    const { questFlags } = questState;

    const defaultNodeId = 'start';
    const [currentNodeId, setCurrentNodeIdRaw] = useState(initialNodeId || defaultNodeId);
    const [nodeTrigger, setNodeTrigger] = useState(0);

    const setCurrentNodeId = useCallback((nodeId: string) => {
        setCurrentNodeIdRaw(nodeId);
        setNodeTrigger(prev => prev + 1);
    }, []);

    const [history, setHistory] = useState<string[]>([]);
    const [feed, setFeed] = useState<string[]>([]);
    const feedEndRef = useRef<HTMLDivElement>(null);

    // initialNodeId の変更に反応 (Quest Resume にとって重要)
    useEffect(() => {
        if (initialNodeId) {
            setCurrentNodeId(initialNodeId);
            setIsTransitioning(false); // 外部からのノード復帰時に遷移ロックを確実にリセット
        }
    }, [initialNodeId]);

    // 自動同期 useEffect (Zustand に currentNodeId を同期してリロード時に復元可能にする)
    useEffect(() => {
        if (questState.isInQuest) {
            useQuestState.setState({ currentNodeId });
        }
    }, [currentNodeId, questState.isInQuest]);


    // v3.6 UI State
    const [showingGuestJoin, setShowingGuestJoin] = useState<any>(null);
    const [showingTravel, setShowingTravel] = useState<{ dest: string, slug?: string, days: number, gold_cost: number, next: string, nextBattle?: string, encounterRate?: number, status: 'confirm' | 'animating' } | null>(null);
    const [showCampStatus, setShowCampStatus] = useState(false);

    // Phase 2: UX改善 State
    const [endReady, setEndReady] = useState<{ result: 'success' | 'failure' | 'abort'; nodeRewards?: any } | null>(null);
    const [isProcessingResult, setIsProcessingResult] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
    const prepareTriggeredRef = useRef(false);

    // 背景クロスフェード用: 前回の背景URLを保持し、2レイヤーでスムーズに切り替え
    const [prevBgUrl, setPrevBgUrl] = useState<string>('');
    const [bgReady, setBgReady] = useState(false);

    const historyRef = useRef(history);
    useEffect(() => { historyRef.current = history; }, [history]);

    // プレイヤー名およびアライメント割合のプレースホルダー置換ヘルパー
    const replacePlayerName = (text: string) => {
        if (!text) return text;
        
        // 他プレイヤー名置換
        const metPlayerName = questState.getFlag('met_player_name');
        const metPlayerIsReal = questState.getFlag('met_player_is_real');
        let metPlayerText = '別の冒険者パーティー';
        if (metPlayerName && metPlayerName !== '見知らぬ冒険者' && String(metPlayerIsReal) === '1') {
            metPlayerText = `【${metPlayerName}】のパーティー`;
        }
        let result = text.replace(/{met_player_text}/g, metPlayerText);
        result = result.replace(/\[met_player_text\]/g, metPlayerText);
        result = result.replace(/{met_player_name}/g, String(metPlayerName || '見知らぬ冒険者'));
        result = result.replace(/\[met_player_name\]/g, String(metPlayerName || '見知らぬ冒険者'));

        // 商人アイテム名置換 (v28.2)
        const flagItemName = questState.getFlag('merchant_item_name');
        const merchantItemId = questState.getFlag('merchant_item_id');
        let itemName = '';
        if (flagItemName) {
            itemName = String(flagItemName);
        } else if (merchantItemId) {
            const merchantItemNames: Record<number, string> = {
                311: "妖刀「人食い」",
                312: "破魔の戦斧",
                313: "霊木の杖",
                314: "手裏剣",
                316: "深淵の盾",
                317: "聖霊のローブ",
                318: "暗黒の外套",
                321: "深緑のアミュレット",
                324: "守護のタリスマン",
                325: "怒りの腕輪"
            };
            itemName = merchantItemNames[Number(merchantItemId)] || `未知の遺物(ID:${merchantItemId})`;
        }
        if (itemName) {
            result = result.replace(/\[merchant_item_name\]/g, itemName);
            result = result.replace(/{merchant_item_name}/g, itemName);
        }
        
        // アライメント割合置換
        const order = userProfile?.order_pts || 0;
        const chaos = userProfile?.chaos_pts || 0;
        const justice = userProfile?.justice_pts || 0;
        const evil = userProfile?.evil_pts || 0;
        
        const totalOC = order + chaos;
        const totalJE = justice + evil;
        
        const orderPct = totalOC > 0 ? Math.round((order / totalOC) * 100) : 50;
        const chaosPct = totalOC > 0 ? Math.round((chaos / totalOC) * 100) : 50;
        const justicePct = totalJE > 0 ? Math.round((justice / totalJE) * 100) : 50;
        const evilPct = totalJE > 0 ? Math.round((evil / totalJE) * 100) : 50;
        
        result = result.replace(/{order_pct}/g, String(orderPct));
        result = result.replace(/{chaos_pct}/g, String(chaosPct));
        result = result.replace(/{justice_pct}/g, String(justicePct));
        result = result.replace(/{evil_pct}/g, String(evilPct));
        
        return result;
    };

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
            let fullText = currentNode?.text || (
                currentNode?.type === 'travel' ? '移動中... (数日が経過した)' :
                currentNode?.type === 'guest_join' ? '新たな仲間が合流したようだ。' : '...'
            );
            fullText = replacePlayerName(fullText);
            setDisplayedText(fullText);
        }
        setTypewriterDone(complete);
    };

    // グローバル状態へのアクセス (上の宣言に移行)


    // フィードの最下部へスクロール
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [feed]);

    // トースト表示ヘルパー
    const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage({ text, type });
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
    console.log('[ScenarioEngine] currentNode:', currentNodeId, JSON.stringify(currentNode));

    // --- タイプライターeffect ---
    useEffect(() => {
        // リセット
        setDisplayedText('');
        setTypewriterDone(false);
        if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
            typewriterRef.current = null;
        }

        let fullText = endReady ? (
            endReady.result === 'success' ? '調査を終え、無事に帰還の途についた...' : '冒険はここで潰えてしまった...'
        ) : (currentNode?.text || (
            currentNode?.type === 'travel' ? '移動中... (数日が経過した)' :
            currentNode?.type === 'guest_join' ? '新たな仲間が合流したようだ。' : '...'
        ));
        fullText = replacePlayerName(fullText);

        // 非テキストノードは即時表示（guest_joinはプロセッサが自動遷移するためスキップ、ただしendReady時は通常テキスト扱い）
        if (!endReady && (!currentNode || ['battle', 'camp', 'shop_access', 'supply', 'guest_join'].includes(currentNode.type || ''))) {
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
    }, [currentNodeId, endReady]);

    // --- ノードプロセッサー (useScenarioNodeProcessor フックに委譲) ---
    useScenarioNodeProcessor({
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
        script
    });

    // 背景画像の解決 (指定がない場合は履歴を遡って引き継ぐ)
    let bgKey = currentNode?.bg_key || currentNode?.bg || currentNode?.params?.bg_key || currentNode?.params?.bg;
    if (!bgKey && script?.nodes) {
        const hist = historyRef.current || [];
        for (let i = hist.length - 1; i >= 0; i--) {
            const prevNodeId = hist[i];
            const prevNode = script.nodes[prevNodeId];
            const prevBg = prevNode?.bg_key || prevNode?.bg || prevNode?.params?.bg_key || prevNode?.params?.bg;
            if (prevBg) {
                bgKey = prevBg;
                break;
            }
        }
    }
    const bgUrl = getAssetUrl(bgKey || 'default');
    useEffect(() => {
        if (!bgUrl) return;
        // 同じURLなら何もしない
        if (bgUrl === prevBgUrl && bgReady) return;
        // 新しい背景をプリロードしてからフェードイン
        setBgReady(false);
        let timerId: NodeJS.Timeout | null = null;

        const img = new Image();
        img.onload = () => {
            setPrevBgUrl(bgUrl);
            timerId = setTimeout(() => {
                setBgReady(true);
            }, 50);
        };
        img.onerror = () => {
            setPrevBgUrl(bgUrl);
            timerId = setTimeout(() => {
                setBgReady(true);
            }, 50);
        };
        img.src = bgUrl;

        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [bgUrl]);

    // クエスト結果の先行読み込み（プレフェッチ）トリガーの防衛的制御
    useEffect(() => {
        if (endReady && endReady.result !== 'abort' && onPrepareResult) {
            if (prepareTriggeredRef.current) return;
            prepareTriggeredRef.current = true;
            onPrepareResult(endReady.result as 'success' | 'failure', history, endReady.nodeRewards);
        }
    }, [endReady, history, onPrepareResult]);

    // ノード切り替え時に、プレフェッチ送信済みフラグをリセット
    useEffect(() => {
        prepareTriggeredRef.current = false;
    }, [currentNodeId]);


    // --- アクション ---

    const handlePurchase = async (itemId: number, price: number, itemName: string) => {
        if ((Number(userProfile?.gold) || 0) < price) {
            alert("金貨が足りません！");
            return;
        }
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
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
                    onClick={() => {
                        if (isTransitioning) return;
                        setIsTransitioning(true);
                        if (nextId) setCurrentNodeId(nextId);
                        setTimeout(() => setIsTransitioning(false), 300);
                    }}
                    disabled={isTransitioning}
                    className="z-10 text-slate-500 hover:text-slate-200 border-b border-transparent hover:border-slate-400 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    補給を終えて戻る
                </button>
            </div>
        );
    }

    // Camp UI
    const isCampNode = currentNode?.type === 'camp';
    const isCampHideButtons = isCampNode && (currentNode?.params?.hide_buttons || currentNode?.hide_buttons || false);
    if (isCampNode && !endReady && !isCampHideButtons) {
        const nextId = currentNode.next || 
            currentNode.choices?.find((c: any) => c.next && !c.next.endsWith('_inv') && !c.next.endsWith('_return'))?.next ||
            currentNode.choices?.[0]?.next;
        const hideButtons = currentNode.params?.hide_buttons || currentNode.hide_buttons || false;
        const continueLabel = currentNode.params?.continue_label || currentNode.continue_label || "休憩を終えて出発する";
        const title = currentNode.params?.title !== undefined ? currentNode.params.title : (currentNode.title !== undefined ? currentNode.title : "野営地");
        const description = (currentNode.text || "「焚き火の温もりが身体を癒やしてくれる。装備を整える時間はありそうだ。」").replace(/\\n/g, '\n');

        // 背景画像の取得 (currentNode.bg_key があればそれを使う、なければ default の bg_camp.png)
        const customBg = currentNode.bg_key || currentNode.params?.bg || currentNode.params?.bg_key;
        const campBgUrl = customBg ? getAssetUrl(customBg) : "/images/quests/bg_camp.png";

        return (
            <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col items-center justify-between p-6">
                <div 
                    className="absolute inset-0 opacity-65 pointer-events-none bg-cover bg-center transition-all duration-500" 
                    style={{ backgroundImage: `url('${campBgUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20 pointer-events-none" />

                {/* 中央コンテンツ */}
                <div className="flex-1 flex flex-col items-center justify-center w-full z-10 max-w-sm">
                    {!hideButtons && (
                        <div className="w-12 h-12 rounded-full bg-orange-950/40 border-2 border-orange-600/50 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(234,88,12,0.4)] animate-pulse">
                            <span className="text-2xl">🔥</span>
                        </div>
                    )}
                    {title && <h2 className="text-lg font-serif text-amber-400 mb-1 drop-shadow-md tracking-widest">{title === '野営地' ? '狭間の踊り場' : title}</h2>}
                    <p className="text-slate-200 mb-4 text-xs italic text-center max-w-sm drop-shadow whitespace-pre-wrap">{description}</p>
                </div>

                {/* 最下部ボタンエリア (縦並びにすっきりまとめる) */}
                <div className="w-full max-w-xs z-10 pb-4 flex flex-col gap-2 shrink-0 bg-slate-950/60 backdrop-blur-md p-4 rounded-xl border border-amber-900/20 shadow-lg">
                    <button
                        onClick={() => {
                            if (isTransitioning) return;
                            setIsTransitioning(true);
                            if (nextId) setCurrentNodeId(nextId);
                            setTimeout(() => setIsTransitioning(false), 300);
                        }}
                        disabled={isTransitioning}
                        className="w-full py-2.5 bg-amber-950/40 hover:bg-amber-900/30 border border-amber-500/50 text-amber-100 rounded-lg font-bold text-sm text-center shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all active:scale-[0.98] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {continueLabel === '休憩を終えて出発する' ? '探索を継続する (階段を下りる)' : continueLabel}
                    </button>

                    {!hideButtons && (
                        <>
                            <button
                                onClick={() => setShowCampStatus(true)}
                                className="w-full py-2 bg-slate-900/60 hover:bg-slate-800/80 text-amber-100 border border-amber-700/40 transition-all tracking-wider text-xs font-bold rounded-lg active:scale-[0.98]"
                            >
                                デッキ編成・装備変更
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("ここで調査を終了し、獲得した戦利品を持ち帰って地上に戻りますか？\n(階段を上って地上に戻ります)")) {
                                        setEndReady({ result: 'success' });
                                    }
                                }}
                                className="w-full py-2 bg-orange-950/20 hover:bg-orange-950/40 text-orange-200 border border-orange-800/40 transition-all tracking-wider text-xs font-bold rounded-lg active:scale-[0.98]"
                            >
                                探索を終えて帰還する (階段を上る)
                            </button>
                        </>
                    )}
                </div>

                {showCampStatus && <StatusModal onClose={() => setShowCampStatus(false)} isCampMode={true} />}
            </div>
        );
    }

    if (!currentNode) {
        // ★ ノード未発見フォールバック — DB未更新時でもクラッシュしない
        console.warn(`[ScenarioEngine] Node "${currentNodeId}" not found. Recovery mode.`);
        
        // まず end_success / end_failure ノードを探す
        // end_success を優先する理由: ユーザーが最後まで進んでノード欠落が発生した場合、
        // 「クエスト失敗」を出すのは理不尽。end_success のほうが安全なフォールバック先。
        const getRecoveryResult = (n: any) => n.params?.result || n.result || 'success';
        const endSuccessEntry = Object.entries(script.nodes || {}).find(([, n]: [string, any]) =>
            n.type === 'end_success' || (n.type === 'end' && getRecoveryResult(n) === 'success'));
        const endFailureEntry = Object.entries(script.nodes || {}).find(([, n]: [string, any]) =>
            n.type === 'end_failure' || (n.type === 'end' && getRecoveryResult(n) === 'failure'));
        const recoveryNext = endSuccessEntry ? endSuccessEntry[0] : (endFailureEntry ? endFailureEntry[0] : undefined);
        
        currentNode = {
            text: `（シナリオデータの読み込みに問題がありました。ここから続けることができます）`,
            type: recoveryNext ? 'text' : 'end',
            result: recoveryNext ? undefined : 'failure',
            choices: recoveryNext ? [{ label: '物語を続ける', next: recoveryNext }] : [],
        };
    }

    const questResult = currentNode.params?.result || currentNode.result;
    const isSuccess = endReady
        ? endReady.result === 'success'
        : (questResult === 'success' || currentNode.type === 'end_success');


    const handleChoice = (choice: any) => {
        if (isTransitioning) return;
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

        setIsTransitioning(true);
        setHistory(prev => [...prev, currentNodeId]);
        setCurrentNodeId(choice.next);
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    };

    return (
        <div className="relative w-full h-full flex flex-col justify-end bg-slate-900 overflow-hidden">

            {/* 中央イベント・獲得通知ダイアログ */}
            {toastMessage && (
                <div 
                    onClick={() => setToastMessage(null)}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300 cursor-pointer"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-xs p-6 rounded-2xl border text-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in scale-in duration-200 flex flex-col items-center gap-4 ${
                            toastMessage.type === 'success' ? 'bg-slate-900/95 border-amber-500/40 text-amber-100' :
                            toastMessage.type === 'error' ? 'bg-slate-900/95 border-orange-500/40 text-orange-200' :
                            'bg-slate-900/95 border-slate-700/50 text-slate-300'
                        }`}
                    >
                        <div className="flex items-center justify-center">
                            {toastMessage.type === 'success' ? (
                                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-widest rounded-full uppercase">REWARD</span>
                            ) : toastMessage.type === 'error' ? (
                                <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold tracking-widest rounded-full uppercase">ALERT</span>
                            ) : (
                                <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold tracking-widest rounded-full uppercase">INFO</span>
                            )}
                        </div>
                        
                        <p className="text-sm font-bold tracking-wider leading-relaxed whitespace-pre-line text-slate-200">
                            {toastMessage.text}
                        </p>

                        <button
                            onClick={() => setToastMessage(null)}
                            className="mt-2 px-6 py-2.5 bg-slate-950/60 hover:bg-slate-950/90 border border-amber-600/30 text-amber-400 font-bold text-xs tracking-wider rounded-lg active:scale-95 transition-all w-full"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {/* Background Image Layer — プリロード済み画像のみ表示し、フェードインで切り替え */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: prevBgUrl ? `url(${prevBgUrl})` : undefined,
                    opacity: bgReady ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                }}
            />
            {/* 下部グラデーション（テキスト領域の可読性確保） */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />

            {/* 前景画像レイヤー（キャラクター立ち絵、宝箱など） */}
            {(currentNode?.fg_image || currentNode?.fg || currentNode?.params?.fg_image || currentNode?.params?.fg) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 mb-28 animate-in fade-in duration-500">
                    <img 
                        src={getAssetUrl(currentNode.fg_image || currentNode.fg || currentNode.params?.fg_image || currentNode.params?.fg)} 
                        alt="Foreground Object" 
                        className="max-h-[55%] w-auto object-contain" 
                    />
                </div>
            )}

            <div className="relative z-20 px-4 pb-8 space-y-4 w-full mx-auto md:pb-12 max-h-[85vh] flex flex-col justify-end">
                {/* Main Text Dialog */}
                <div className="bg-slate-950/40 backdrop-blur-sm border border-amber-900/40 rounded-xl p-3 shadow-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0">
                    {/* アイコン: 話者画像あり→ポートレート / なし→非表示 */}
                    {currentNode.speaker_image_url ? (
                        <div className="flex-shrink-0 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-800 border-2 border-amber-600/30 flex items-center justify-center overflow-hidden shadow-inner">
                                <img src={currentNode.speaker_image_url} alt="Face" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    ) : null}
                    <div className="flex-1 relative pb-1 pt-1">
                        {/* 話者名タグ: speaker指定あり→金色表示 / なし→非表示 */}
                        {(currentNode.speaker_name || currentNode.speaker || currentNode.params?.speaker_name || currentNode.params?.speaker) ? (
                            <div className="text-amber-400 text-[10px] font-bold tracking-widest mb-1">
                                ◆ {replacePlayerName(currentNode.speaker_name || currentNode.speaker || currentNode.params?.speaker_name || currentNode.params?.speaker)}
                            </div>
                        ) : null}
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
                    {endReady ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-center font-bold text-xl py-2 animate-pulse tracking-widest">
                                {isSuccess ? (
                                    <span className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">クエスト達成</span>
                                ) : (
                                    <span className="text-red-500 drop-shadow-lg">クエスト失敗</span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (isResultReady && !isProcessingResult) {
                                        setIsProcessingResult(true);
                                        onComplete(endReady.result, history, endReady.nodeRewards);
                                    }
                                }}
                                disabled={!isResultReady || isProcessingResult}
                                className={`w-full py-4 rounded-lg text-sm font-bold tracking-widest transition-all active:scale-[0.98] ${
                                    isSuccess
                                        ? 'bg-amber-900/40 border border-amber-600 text-amber-200 hover:bg-amber-900/60'
                                        : 'bg-red-950/50 border border-red-800 text-red-300 hover:bg-red-900/60'
                                } ${(!isResultReady || isProcessingResult) ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {isProcessingResult ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        画面を切り替え中...
                                    </span>
                                ) : !isResultReady ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        判定中...
                                    </span>
                                ) : '結果を確認する'}
                            </button>
                        </div>
                    ) : (['guest_join', 'random_branch', 'check_status', 'check_possession', 'check_equipped', 'check_item', 'check_flag', 'check_flags', 'check_world', 'check_delivery', 'modify_flag', 'modify_reputation', 'reward', 'treasure', 'damage'].includes(currentNode.type || '') && !currentNode.text) ? (
                        <div className="text-center text-slate-500 text-sm py-3 animate-pulse">処理中...</div>

                    ) : currentNode.type === 'battle' ? (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    if (isTransitioning) return;
                                    setIsTransitioning(true);
                                    if (onBattleStart) {
                                        // 勝利後ノード: battle_success_next（CSVのnext_node由来） → choices[0].next → fallback
                                        const successId = currentNode.battle_success_next
                                            || currentNode.choices?.[0]?.next
                                            || currentNode.next
                                            || 'end_success';
                                        // UGC v2: インラインenemyData → JSON文字列化してQuestPageに渡す
                                        const enemyId = currentNode.enemyData
                                            ? JSON.stringify(currentNode.enemyData)
                                            : (currentNode.enemy_group_id || 'slime');
                                        onBattleStart(enemyId, successId, currentNode.bg_key || currentNode.params?.bg || currentNode.params?.bg_key, currentNode.bgm_key || currentNode.bgm || currentNode.params?.bgm);
                                    }
                                    setTimeout(() => {
                                        setIsTransitioning(false);
                                    }, 300);
                                }}
                                disabled={isTransitioning}
                                className="w-full bg-red-950/80 border border-red-800 text-red-300 py-4 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(153,27,27,0.5)] active:scale-[0.98] transition-all hover:bg-red-900/80 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ⚔️ 戦闘開始
                            </button>
                        </div>
                    ) : currentNode.choices && currentNode.choices.length > 0 ? (
                        currentNode.choices.map((choice: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => handleChoice(choice)}
                                disabled={isTransitioning}
                                className="w-full py-4 px-4 bg-amber-900/40 border border-amber-600 text-amber-100 rounded-lg font-bold text-sm text-center shadow-lg hover:bg-amber-900/60 transition-all active:scale-[0.98] flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
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
                                if (isTransitioning) return;
                                setIsTransitioning(true);
                                setHistory(prev => [...prev, currentNodeId]);
                                setCurrentNodeId(currentNode.next);
                                setTimeout(() => {
                                    setIsTransitioning(false);
                                }, 300);
                            }}
                            disabled={isTransitioning}
                            className="w-full py-4 bg-slate-800/60 border border-slate-600 text-slate-300 rounded-lg font-bold text-sm text-center shadow-lg hover:bg-slate-700/60 transition-all active:scale-[0.98] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>次へ</span>
                            <ArrowRight size={14} className="opacity-70" />
                        </button>
                    ) : (
                        currentNode.type === 'end' || currentNode.type === 'end_success' || currentNode.type === 'end_failure' || questResult ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="text-center font-bold text-xl py-2 animate-pulse tracking-widest">
                                    {isSuccess ? (
                                        <span className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">クエスト達成</span>
                                    ) : (
                                        <span className="text-red-500 drop-shadow-lg">クエスト失敗</span>
                                    )}
                                </div>
                                <button
                                    disabled={true}
                                    className="w-full py-4 rounded-lg text-sm font-bold tracking-widest transition-all opacity-50 cursor-wait bg-amber-900/40 border border-amber-600 text-amber-200"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        判定中...
                                    </span>
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
                                // 護衛対象フラグが設定されている場合、エスコートミッションを有効化
                                if (currentNode?.params?.is_escort_target || currentNode?.is_escort_target) {
                                    questState.setEscortMission(true);
                                }
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
                                        const authHeaders = await getAuthHeaders();
                                        const res = await fetch('/api/move', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                ...authHeaders
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
