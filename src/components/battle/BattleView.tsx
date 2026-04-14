'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull, Clock, Target, Users, User, LogOut, ScrollText, Zap, X } from 'lucide-react';
import Image from 'next/image';
import { hasTaunt, StatusEffect, getEffectName } from '@/lib/statusEffects';
import XShareButton from '../shared/XShareButton';
import { Enemy } from '@/types/game';
import StatusEffectBadges from './StatusEffectBadges';

interface BattleViewProps {
    onBattleEnd: (result: 'win' | 'lose' | 'escape') => void;
    battleTitle?: string;
    bgImageUrl?: string;
}

export default function BattleView({ onBattleEnd, battleTitle, bgImageUrl }: BattleViewProps) {
    const router = useRouter();
    const hasHydrated = useGameStore(state => state._hasHydrated);
    const {
        battleState,
        hand,
        attackEnemy,
        endTurn,
        runNpcPhase,
        runEnemyPhase,
        waitTurn,
        setTactic,
        fleeBattle,
        selectedScenario,
        fetchUserProfile,
        userProfile,
        setTarget,
        useBattleItem,
    } = useGameStore();

    const [logs, setLogs] = useState<string[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [selectedPartyMember, setSelectedPartyMember] = useState<any | null>(null);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [showItemPanel, setShowItemPanel] = useState(false); // v25: バトルアイテムパネル

    // Typewriter state
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
    const [typingText, setTypingText] = useState<string>('');
    // v3.3: HPバーをタイプライターと同期するためのゴースト HP 状態
    const [liveHp, setLiveHp] = useState<number | null>(null);
    // v3.3: パーティHPバーをタイプライターと同期するためのゴースト durability Map
    const [livePartyDurability, setLivePartyDurability] = useState<Record<string, number>>({});
    const typingQueue = useRef<string[]>([]);
    const isTyping = useRef(false);
    const currentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // v15.0: isTypingDone = ログキュー空かどうか
    const [isTypingDone, setIsTypingDone] = useState(true);
    // キュー登録済みの battleState.messages インデックス上限（stale closure 防止）
    const enqueuedUpToRef = useRef(0);
    // v15.0: オーバーレイ表示管理（ターン/フェーズ）
    const lastShownTurnRef = useRef(0);        // TURN N overlay表示済み番号
    const [showPhaseOverlay, setShowPhaseOverlay] = useState<null | 'player' | 'enemy'>(null);

    // v15.0: キューを即時フラッシュ（NEXT ボタンで早送り）
    const flushQueue = useCallback(() => {
        if (currentTimerRef.current) {
            clearInterval(currentTimerRef.current);
            currentTimerRef.current = null;
        }
        const remaining = typingQueue.current.filter(m => !m.startsWith('__'));
        typingQueue.current = [];
        isTyping.current = false;
        if (remaining.length > 0) {
            setDisplayedLogs(prev => [...prev, ...remaining]);
        }
        setTypingText('');
        setIsTypingDone(true);
    }, []);

    // Process typewriter queue
    const processQueue = useCallback(() => {
        // キューが空で入力中でもなければ完了フラグを立てる
        if (typingQueue.current.length === 0 && !isTyping.current) {
            setIsTypingDone(true);
            return;
        }
        if (isTyping.current || typingQueue.current.length === 0) return;

        const message = typingQueue.current.shift()!;

        // __hp_sync:NNN マーカーは表示せず、HPバーのみ更新
        if (message.startsWith('__hp_sync:')) {
            const newHp = parseInt(message.slice(10), 10);
            if (!isNaN(newHp)) setLiveHp(newHp);
            setTimeout(() => processQueue(), 0);
            return;
        }

        // __party_sync:ID:DUR マーカーは表示せず、パーティHPバーのみ更新
        if (message.startsWith('__party_sync:')) {
            const parts = message.slice(13).split(':');
            const memberId = parts[0];
            const newDur = parseInt(parts[1], 10);
            if (memberId && !isNaN(newDur)) {
                setLivePartyDurability(prev => ({ ...prev, [memberId]: newDur }));
            }
            setTimeout(() => processQueue(), 0);
            return;
        }

        // ターン区切りメッセージ（--- ターン N ---）はタイプライターなしで即時表示
        if (/^--- .+ ---$/.test(message)) {
            setDisplayedLogs(prev => [...prev, message]);
            setTypingText('');
            if (typingQueue.current.length === 0) {
                setIsTypingDone(true);
            } else {
                setTimeout(() => processQueue(), 80);
            }
            return;
        }

        isTyping.current = true;
        setIsTypingDone(false);
        let charIdx = 0;
        setTypingText('');

        const timerId = setInterval(() => {
            charIdx++;
            if (charIdx <= message.length) {
                setTypingText(message.slice(0, charIdx));
            } else {
                clearInterval(timerId);
                if (currentTimerRef.current === timerId) currentTimerRef.current = null;
                setDisplayedLogs(prev => [...prev, message]);
                setTypingText('');
                isTyping.current = false;
                if (typingQueue.current.length > 0) {
                    setTimeout(() => processQueue(), 80);
                } else {
                    setIsTypingDone(true);
                }
            }
        }, 20);
        currentTimerRef.current = timerId;
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [displayedLogs, typingText]);

    // Track previous messages to detect full reset (new battle)
    const prevMessagesRef = useRef<string[]>([]);

    // Enqueue new messages — detect new battle by checking if messages array was fully replaced
    useEffect(() => {
        const prev = prevMessagesRef.current;
        const curr = battleState.messages;

        // Detect new battle: messages array was fully replaced (not appended)
        const isNewBattle = curr.length > 0 && prev.length > 0 &&
            (curr.length < prev.length || curr[0] !== prev[0]);

        if (isNewBattle) {
            // Full reset for new battle
            typingQueue.current = [];
            isTyping.current = false;
            setDisplayedLogs([]);
            setTypingText('');
            setIsTypingDone(false); // 新バトル開始 → ロック
            enqueuedUpToRef.current = curr.length; // 全メッセージをキューに積む
            typingQueue.current.push(...curr);
            setLiveHp(userProfile?.hp ?? null); // 新バトル開始時に HP バーをリセット
            setTimeout(() => processQueue(), 50);
        } else {
            // Normal append: enqueuedUpToRef で「どこまで登録済みか」を管理
            // displayedLogs.length はステールになりうるため使わない
            const startIdx = enqueuedUpToRef.current;
            const newMessages = curr.slice(startIdx);
            if (newMessages.length > 0) {
                enqueuedUpToRef.current = curr.length; // 先に更新（再エントリ防止）
                setIsTypingDone(false); // 新メッセージ追加 → ロック
                typingQueue.current.push(...newMessages);
                processQueue();
            }
        }

        prevMessagesRef.current = [...curr];
        setLogs(curr);
    }, [battleState.messages]);

    // ログ完了かつストアがプレイヤーターンの時にターン処理ロックを解除
    // ★ useEffect依存でなく processQueue 内部で useGameStore.getState() を直接確認する方式に変更。
    //   Reactバッチ更新の影響を受けがれの isTypingDone ・ストアフラグを使わず、
    //   キュー内から直接ストアをつきさして判定するためタイミングの1フレーム窓問題を完全回避。

    // v15.0: ターン/フェーズ オーバーレイ制御
    // battlePhase:'player' に遷移した時 = 新しいプレイヤーターン開始
    useEffect(() => {
        if (battleState.battlePhase === 'player' &&
            battleState.turn > lastShownTurnRef.current &&
            !battleState.isVictory && !battleState.isDefeat) {
            lastShownTurnRef.current = battleState.turn;
            // TURN N オーバーレイ → PLAYER オーバーレイ の順に表示
            setShowTurnOverlay(true);
            const t1 = setTimeout(() => {
                setShowTurnOverlay(false);
                setShowPhaseOverlay('player');
            }, 1200);
            const t2 = setTimeout(() => setShowPhaseOverlay(null), 2200);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [battleState.battlePhase, battleState.turn]);


    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log("[BattlePage] Mounted. Enemy:", battleState.enemy, "Hand:", hand.length);
        }
        fetchUserProfile();
        const hydrated = useGameStore.persist.hasHydrated();
        if (hydrated && !battleState.enemy) {
            console.warn('[BattlePage] 敵がいません。/inn に戻ります。');
            router.push('/inn');
        }
    }, []);

    // v25: バトル開始時（party が存在し始めた時）のみ livePartyDurability を初期化
    // battleState.party 全体を監視すると毎ターンのメンバー更新で不要なレンダリングが発生するため
    // length のみ監視し、0 → N の変化（= 新しいバトル開始）時のみ実行する
    const prevPartyLengthRef = useRef(0);
    useEffect(() => {
        const len = battleState.party?.length ?? 0;
        if (len > 0 && prevPartyLengthRef.current === 0) {
            // 新しいバトル開始: livePartyDurability を初期化
            const initial: Record<string, number> = {};
            for (const m of battleState.party) {
                initial[String(m.id)] = m.durability ?? (m as any).hp ?? 0;
            }
            setLivePartyDurability(initial);
        }
        prevPartyLengthRef.current = len;
    }, [battleState.party?.length]);

    // Handle Pub NPC Death
    useEffect(() => {
        if (battleState.isVictory && !selectedScenario && battleState.enemy?.id) {
            fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'kill', npc_id: battleState.enemy.id })
            }).catch(err => console.error("Failed to eliminate NPC:", err));
        }
    }, [battleState.isVictory, selectedScenario, battleState.enemy]);

    // v15.0: canInteract = プレイヤーフェーズ中のみ操作可能
    // battlePhaseが'player'でない間（npc_done / enemy_done）は常にロック
    const battlePhase = battleState.battlePhase ?? 'player';
    const canInteract = battlePhase === 'player' && !battleState.isVictory && !battleState.isDefeat;
    // NEXT ボタンの押下可否: ログ再生中（isTypingDone=false）かつプレイヤーフェーズ外は不可
    // プレイヤーフェーズ中はログ再生中でも NEXT 可能（早送り）
    const canPressNext = !battleState.isVictory && !battleState.isDefeat &&
        (battlePhase === 'player' || isTypingDone);

    const handleCardClick = async (index: number) => {
        if (!canInteract) return;
        const card = hand[index];
        const apCost = card.ap_cost ?? 1;
        if (battleState.current_ap < apCost) return;

        if (selectedCardIndex === index) {
            // 2段階目: 実行
            setSelectedCardIndex(null);
            // バフ・防御系カードはSLASHアニメーションを出さない
            const isBuff = card.type === 'Support' ||
                card.type === 'Defense' ||
                card.type === 'Heal' ||
                (card.effect_id && ['def_up', 'atk_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(card.effect_id)) ||
                card.name.includes('防御') ||
                card.name.includes('鉄壁') ||
                card.name.includes('応急') ||
                card.name.includes('回復') ||
                card.name.includes('ヒール') ||
                card.name.includes('集中') ||
                card.name.includes('挑発') ||
                card.name.includes('クイック');
            if (!isBuff) {
                let effect = card.animation_type;
                if (!effect) {
                    if (card.name.includes('風') || card.name.includes('疾')) effect = 'WIND';
                    else if (card.name.includes('突') || card.name.includes('槍') || card.name.includes('針')) effect = 'PIERCE';
                    else if (card.name.includes('打') || card.name.includes('砕') || card.name.includes('バッシュ')) effect = 'BLUNT';
                    else effect = 'SLASH';
                }
                setActiveEffect(effect);
                setTimeout(() => setActiveEffect(null), 500);
            } else {
                setActiveEffect('BUFF');
                setTimeout(() => setActiveEffect(null), 700);
            }
            await attackEnemy(card);
        } else {
            // 1段階目: 選択
            setSelectedCardIndex(index);
        }
    };

    const handleFlee = () => {
        if (!canInteract) return; // プレイヤーフェーズのみ
        if (confirm("本当に撤退しますか？\n敗北扱いとなります。")) {
            fleeBattle();
        }
    };

    // v15.0: NEXT ボタンのフェーズ分岐処理
    const handleNext = async () => {
        if (!canPressNext) return;
        if (battlePhase === 'player') {
            // プレイヤーフェーズ: 残ログを早送り → NPC フェーズ実行
            flushQueue();
            await runNpcPhase();
        } else if (battlePhase === 'npc_done' && isTypingDone) {
            // NPC 完了 → ENEMY オーバーレイ + 敵フェーズ実行
            setShowPhaseOverlay('enemy');
            const t = setTimeout(() => setShowPhaseOverlay(null), 1000);
            setTimeout(async () => {
                await runEnemyPhase();
            }, 600); // オーバーレイと同タイミングで开始
            return () => clearTimeout(t);
        } else if (battlePhase === 'enemy_done' && isTypingDone) {
            // 敵フェーズ完了 → 次ターンへ（processEnemyTurn内でdealHand済み）
            // 何もしない（次ターンはすでにプレイヤーフェーズに移行済み）
        }
    };

    // 後方互換エイリアス（waitTurn から呼ばれる）
    const handleEndTurn = async () => { await handleNext(); };


    // Result overlay — ログが全て表示完了してから遷移
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const [isReviewingLogs, setIsReviewingLogs] = useState(false);
    const isEscaped = !battleState.isVictory && battleState.messages.includes("一行は逃げ出した...");

    useEffect(() => {
        if (battleState.isVictory || battleState.isDefeat || isEscaped) {
            // ログキューが空になるまで待ってからオーバーレイ表示
            const checkInterval = setInterval(() => {
                if (!isTyping.current && typingQueue.current.length === 0) {
                    clearInterval(checkInterval);
                    setTimeout(() => setShowResultOverlay(true), 800);
                }
            }, 200);
            return () => clearInterval(checkInterval);
        }
    }, [battleState.isVictory, battleState.isDefeat, battleState.messages]);

    if (!hasHydrated) return <div className="p-8 text-white min-h-screen bg-gray-900 flex items-center justify-center">Loading Data...</div>;
    if (!battleState.enemy && !battleState.isVictory && !battleState.isDefeat) return <div className="p-8 text-white min-h-screen bg-gray-900 flex items-center justify-center">Loading Battle...</div>;

    const target = battleState.enemy;
    const enemies = battleState.enemies || (battleState.enemy ? [battleState.enemy] : []);
    const isResultActive = (battleState.isVictory || battleState.isDefeat || isEscaped);
    const shouldShowOverlay = isResultActive && showResultOverlay && !isReviewingLogs;
    const isBossEncounter = enemies.some(e => e.spawn_type === 'bounty' || e.hp >= 150 || ['enemy_slime_king', 'enemy_hobgoblin', 'enemy_chimera', 'enemy_lich', 'enemy_bandit_boss', 'enemy_assassin_boss'].includes(e.slug || ''));

    // Party + Guest NPCs
    const partyMembers = battleState.party || [];



    // Victory/Defeat action handler
    const handleResultAction = (resultType: 'win' | 'lose' | 'escape') => {
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const returnUrl = urlParams.get('return_url');
        const bType = urlParams.get('type');

        // v20: Bounty敗北ペナルティはgameStore.processEnemyTurn内で処理済み

        if (returnUrl) {
            const separator = returnUrl.includes('?') ? '&' : '?';
            router.push(`${returnUrl}${separator}battle_result=${resultType}${bType ? `&type=${bType}` : ''}`);
        } else if (selectedScenario) {
            onBattleEnd(resultType);
        } else {
            router.push(`/inn?battle_result=${resultType}${bType ? `&type=${bType}` : ''}`);
        }
    };

    return (
        <div className={`h-full w-full font-sans relative flex flex-col overflow-hidden text-slate-200 transition-colors duration-1000 ${isBossEncounter ? 'bg-red-950/20 shadow-[inset_0_0_100px_rgba(153,27,27,0.5)]' : 'bg-slate-900'}`}>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes targetPulse {
                    0%, 100% { border-color: rgb(239 68 68); box-shadow: 0 0 8px rgba(239,68,68,0.4); }
                    50% { border-color: rgb(239 68 68 / 0.4); box-shadow: 0 0 2px rgba(239,68,68,0.1); }
                }
                @keyframes cardSelectPulse {
                    0%, 100% { border-color: rgb(255 255 255); box-shadow: 0 0 12px rgba(255,255,255,0.6); }
                    50% { border-color: rgb(255 255 255 / 0.3); box-shadow: 0 0 4px rgba(255,255,255,0.2); }
                }
            `}</style>

            {/* BATTLE HEADER — safe-area対応 */}
            <div className="relative z-40 bg-black/40 border-b border-white/20 px-4 pt-[env(safe-area-inset-top,10px)] pb-2 flex items-center justify-between backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                    <Sword size={14} className="text-red-400 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-300 truncate">
                        {battleTitle || selectedScenario?.title || 'BATTLE'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-shrink-0">
                    <span>TURN {battleState.turn}</span>
                </div>
            </div>



            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-60" 
                    style={{ backgroundImage: `url('${bgImageUrl || "https://images.unsplash.com/photo-1542261226-9fcfd06ec4da?auto=format&fit=crop&w=1000&q=80"}')` }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Turn Overlay */}
            {showTurnOverlay && (
                <div className="absolute inset-x-0 top-1/4 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-500">
                    <div className="bg-red-950/80 text-red-500 px-10 py-3 border-y border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-red-500/50" />
                        <span className="font-serif text-3xl font-bold tracking-[0.3em] italic">TURN {battleState.turn}</span>
                        <span className="w-8 h-[1px] bg-red-500/50" />
                    </div>
                </div>
            )}

            {/* Phase Overlay (PLAYER / ENEMY) */}
            {showPhaseOverlay && (
                <div className="absolute inset-x-0 top-1/3 flex items-center justify-center z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-400">
                    <div className={`px-12 py-2 border-y flex items-center gap-3 ${
                        showPhaseOverlay === 'player'
                            ? 'bg-sky-950/80 text-sky-400 border-sky-500/50 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                            : 'bg-orange-950/80 text-orange-400 border-orange-500/50 shadow-[0_0_30px_rgba(251,146,60,0.4)]'
                    }`}>
                        <span className="w-6 h-[1px] opacity-60" style={{background:'currentColor'}} />
                        <span className="font-serif text-2xl font-bold tracking-[0.4em]">
                            {showPhaseOverlay === 'player' ? 'PLAYER' : 'ENEMY'}
                        </span>
                        <span className="w-6 h-[1px] opacity-60" style={{background:'currentColor'}} />
                    </div>
                </div>
            )}

            {/* Enemies Layout — 左:ターゲット大（スプライト表示） / 右:非ターゲット小（アイコンリスト） */}
            <div className="w-full relative z-10 bg-gradient-to-b from-transparent to-slate-950/80 pt-2 pb-1 flex-shrink-0">
                <div className="w-full flex items-center justify-center gap-6 sm:gap-10 px-4">
                    {/* LEFT: Target enemy (Sprite) */}
                    {target && (
                        <div className="relative transition-all duration-500 flex flex-col items-center flex-shrink-0 z-20">
                            {/* Huge Sprite Image */}
                            <div className={`w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] relative transition-all duration-500 flex items-center justify-center
                                ${target.hp > 0 ? 'drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-105' : 'opacity-40 grayscale blur-[1px]'}
                            `}>
                                {target.image_url ? (
                                    <img src={target.image_url} alt={target.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500"><Skull size={64} /></div>
                                )}

                            {/* 大スプライト左上：状態異常バッジ */}
                                {target.hp > 0 && (target.status_effects || []).length > 0 && (
                                    <div className="absolute top-1 left-1 z-50 pointer-events-none">
                                        <StatusEffectBadges
                                            effects={target.status_effects || []}
                                            size="md"
                                        />
                                    </div>
                                )}

                                {/* Action Animations strictly for attack on target */}
                                {target.hp > 0 && activeEffect && activeEffect !== 'BUFF' && (
                                    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                                        {activeEffect === 'SLASH' && (
                                            <div className="w-[120%] h-[3px] bg-red-400 rotate-45 shadow-[0_0_25px_rgba(248,113,113,1)] animate-in slide-in-from-top-12 duration-300" />
                                        )}
                                        {activeEffect === 'WIND' && (
                                            <div className="block">
                                                <div className="w-24 h-[2px] bg-sky-200 shadow-[0_0_20px_rgba(186,230,253,1)] animate-in slide-in-from-right-16 fade-in duration-300 mb-3" />
                                                <div className="w-16 h-[2px] bg-sky-300 shadow-[0_0_20px_rgba(186,230,253,1)] animate-in slide-in-from-left-16 fade-in duration-300" />
                                            </div>
                                        )}
                                        {activeEffect === 'PIERCE' && (
                                            <div className="w-2 h-24 bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,1)] animate-in slide-in-from-bottom-16 fade-in duration-200" />
                                        )}
                                        {activeEffect === 'BLUNT' && (
                                            <div className="w-16 h-16 rounded-full border-[6px] border-amber-500 bg-amber-200/40 shadow-[0_0_25px_rgba(245,158,11,1)] animate-in zoom-in fade-in duration-300" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Floating Info Base */}
                            <div className="mt-2 w-[140px] sm:w-[160px] flex flex-col items-center bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-2xl z-10 transition-all duration-300">
                                <div className={`text-[10px] sm:text-[12px] font-bold text-center w-full leading-tight truncate ${target.hp <= 0 ? 'text-gray-500 line-through' : 'text-slate-100 drop-shadow-md'}`}>
                                    {target.name}
                                </div>
                                <div className="flex items-center w-full mt-1.5 gap-1.5">
                                    <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold whitespace-nowrap">Lv.{target.level}</span>
                                    {target.hp > 0 ? (
                                        <div className="flex-1 h-2 bg-slate-900/80 rounded-full overflow-hidden border border-black/80 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                                            <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300" style={{ width: `${(target.hp / target.maxHp) * 100}%` }} />
                                        </div>
                                    ) : (
                                        <div className="flex-1 h-2" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RIGHT: Non-target enemies (Icon list) */}
                    {(() => {
                        const others = enemies.filter(e => target?.id !== e.id).slice(0, 4);
                        if (others.length === 0) return null;

                        return (
                            <div className="flex flex-col items-start gap-2 flex-shrink-0 ml-2 z-10">
                                {others.map((enemy) => {
                                    const isDead = enemy.hp <= 0;
                                    return (
                                        <div
                                            key={enemy.id}
                                            className={`flex items-center gap-2 cursor-pointer transition-all duration-300 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg border
                                                ${isDead ? 'opacity-40 grayscale border-transparent' : 'bg-black/30 backdrop-blur-md hover:bg-black/50 border-white/20 hover:border-white/50 shadow-lg hover:scale-105 active:scale-95'}
                                            `}
                                            onClick={() => !isDead && setTarget(enemy.id)}
                                        >
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden bg-black/50 border border-white/20 flex items-center justify-center flex-shrink-0 relative">
                                                {enemy.image_url ? (
                                                    <img src={enemy.image_url} alt={enemy.name} className="max-w-full max-h-full object-cover" />
                                                ) : (
                                                    <Skull size={16} className="text-slate-600" />
                                                )}
                                                {/* 非ターゲット敵アイコン左上：状態異常バッジ */}
                                                {!isDead && (enemy.status_effects || []).length > 0 && (
                                                    <div className="absolute top-0 left-0 z-10 pointer-events-none">
                                                        <StatusEffectBadges effects={enemy.status_effects || []} size="sm" maxBadges={3} />
                                                    </div>
                                                )}
                                            </div>
                                            {!isDead && (
                                                <div className="flex flex-col justify-center w-[72px] sm:w-[90px]">
                                                    <div className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-md truncate w-full leading-tight">
                                                        {enemy.name}
                                                    </div>
                                                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/10 relative shadow-inner">
                                                        <div className="h-full bg-red-600/80 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* PLAYER & PARTY STATUS PANEL */}
            <div className="relative z-20 px-3 mt-1 w-full flex-shrink-0">
                <div className="bg-black/40 border border-white/20 rounded-lg p-2 backdrop-blur-md drop-shadow-md">
                    <div className="flex items-center gap-1.5">
                        <div className="flex flex-col justify-center items-center w-12 h-14 bg-white/10 rounded-lg border border-white/20 flex-shrink-0 shadow-inner mr-1 backdrop-blur-sm">
                            <span className="text-[9px] text-slate-300 font-bold mb-0.5 drop-shadow-md">AP</span>
                            <span className="text-xl font-bold text-amber-400 font-mono leading-none drop-shadow-md">{battleState.current_ap || 0}</span>
                        </div>

                        {/* Scrolling Members List — pt-3 でバッジが上に飛び出せる余白を確保 */}
                        <div className="flex-1 flex items-start gap-3 overflow-x-auto no-scrollbar pb-1 pt-3">
                            {/* Player Icon */}
                            <button
                                onClick={() => setShowUserDetail(true)}
                                className="flex flex-col items-center flex-shrink-0 active:scale-90 transition-transform relative"
                            >
                                <div className="w-10 h-10 rounded-full border-[2px] border-amber-400 bg-black/50 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm">
                                    {userProfile?.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-amber-500" />
                                    )}
                                </div>
                                {/* プレイヤーアイコン左上：状態異常バッジ — button 相対に配置しoverflow-hiddenを回避 */}
                                {(battleState.player_effects || []).length > 0 && (
                                    <div className="absolute top-0 left-0 -translate-y-1/4 z-30 pointer-events-none">
                                        <StatusEffectBadges
                                            effects={battleState.player_effects as StatusEffect[]}
                                            size="sm"
                                        />
                                    </div>
                                )}
                                <div className="w-10 h-1.5 mt-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((liveHp ?? userProfile?.hp ?? 0) / (userProfile?.max_hp || 1)) * 100))}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-100 font-bold w-[44px] text-center truncate mt-0.5 drop-shadow-md">{userProfile?.name || '旅人'}</span>
                            </button>

                            {/* Party Members */}
                            {partyMembers.slice(0, 9).map((member: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedPartyMember(member)}
                                    className="flex flex-col items-center flex-shrink-0 active:scale-90 transition-transform relative"
                                >
                                    <div className={`w-10 h-10 rounded-full border-[2px] ${(member.durability ?? member.hp) > 0 ? 'border-sky-400/80 bg-black/50' : 'border-white/20 bg-black/80 opacity-60'} flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm`}>
                                        {(member.icon_url || member.image_url || member.avatar_url) ? (
                                            <img src={member.icon_url || member.image_url || member.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} className={member.is_guest ? 'text-emerald-400' : 'text-sky-400'} />
                                        )}
                                    </div>
                                    {/* パーティアイコン左上：状態異常バッジ — button 相対に配置しoverflow-hiddenを回避 */}
                                    {(member.status_effects || []).length > 0 && (member.durability ?? member.hp) > 0 && (
                                        <div className="absolute top-0 left-0 -translate-y-1/4 z-30 pointer-events-none">
                                            <StatusEffectBadges effects={member.status_effects || []} size="sm" maxBadges={3} />
                                        </div>
                                    )}
                                    <div className="w-10 h-1.5 mt-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                        {/* v25: max_hp (= max_durability) を使った正しいHPバー計算 */}
                                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((livePartyDurability[String(member.id)] ?? member.durability ?? member.hp ?? 0) / (member.max_hp || member.max_durability || member.durability || 1)) * 100))}%` }} />
                                    </div>
                                    <span className="text-[9px] text-slate-200 font-bold w-[44px] text-center truncate mt-0.5 drop-shadow-md">{member.name?.slice(0, 4) || 'NPC'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Party Member Detail Popup */}
            {selectedPartyMember && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPartyMember(null)}>
                    <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl p-4 w-[280px] shadow-2xl drop-shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full border-2 border-sky-500 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    {(selectedPartyMember.icon_url || selectedPartyMember.image_url || selectedPartyMember.avatar_url) ? (
                                        <img src={selectedPartyMember.icon_url || selectedPartyMember.image_url || selectedPartyMember.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-sky-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200">{selectedPartyMember.name || 'NPC'}</p>
                                    <p className="text-[9px] text-slate-500">{selectedPartyMember.is_guest ? 'ゲストNPC' : 'パーティメンバー'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPartyMember(null)} className="text-slate-500 hover:text-slate-300">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-green-400 font-bold">HP</span>
                                <span className="text-slate-200 font-mono">{selectedPartyMember.durability ?? selectedPartyMember.hp ?? 0} / {selectedPartyMember.max_durability ?? selectedPartyMember.durability ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-red-400 font-bold">攻撃力</span>
                                <span className="text-slate-200 font-mono">{selectedPartyMember.atk ?? selectedPartyMember.attack ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-sky-400 font-bold">防御力</span>
                                <span className="text-slate-200 font-mono">{selectedPartyMember.def ?? selectedPartyMember.defense ?? 0}</span>
                            </div>
                            <div className="bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-amber-400 font-bold text-[10px]">スキル</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {(selectedPartyMember.skill_names || selectedPartyMember.skills || selectedPartyMember.abilities || []).length > 0 ? (
                                        (selectedPartyMember.skill_names || selectedPartyMember.skills || selectedPartyMember.abilities).map((skill: any, si: number) => (
                                            <span key={si} className="px-1.5 py-0.5 bg-amber-900/30 border border-amber-800/50 rounded text-[9px] text-amber-300">
                                                {typeof skill === 'string' ? skill : skill.name || skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[9px] text-slate-500 italic">なし</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Anim for Buffs */}
            {activeEffect === 'BUFF' && (
                <div className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-sky-200/20 animate-in fade-in duration-300" />
                    <div className="w-full h-full border-[10px] border-sky-400/30 rounded-lg animate-in zoom-in fade-in duration-500 scale-110 blur-sm" />
                    <div className="absolute bottom-1/4 w-32 h-64 bg-gradient-to-t from-sky-300/40 to-transparent blur-xl animate-in slide-in-from-bottom-32 fade-in duration-500" />
                </div>
            )}

            {/* User Status Detail Popup */}
            {showUserDetail && userProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUserDetail(false)}>
                    <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl p-4 w-[280px] shadow-2xl drop-shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full border-2 border-amber-500 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    {userProfile.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200">{userProfile.name || '旅人'}</p>
                                    <p className="text-[9px] text-amber-500 font-bold">Lv.{userProfile.level || 1}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowUserDetail(false)} className="text-slate-500 hover:text-slate-300">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-green-400 font-bold">HP</span>
                                <span className="text-slate-200 font-mono">
                                    {userProfile.hp || 0} / {(userProfile.max_hp || 0) + (battleState.equipBonus?.hp || 0)}
                                    {(battleState.equipBonus?.hp || 0) > 0 && <span className="text-[9px] text-emerald-400 ml-1">(装備+{battleState.equipBonus!.hp})</span>}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-sky-400 font-bold">VIT</span>
                                <span className="text-slate-200 font-mono">{userProfile.vitality || 0} / {userProfile.max_vitality || 100}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-red-400 font-bold">攻撃力</span>
                                <span className="text-slate-200 font-mono">
                                    {/* 実効ATK = (base + equipBonus) * resonanceMod */}
                                    {Math.floor(((userProfile.atk || 0) + (battleState.equipBonus?.atk || 0)) * (battleState.resonanceActive ? 1.1 : 1.0))}
                                    {(battleState.equipBonus?.atk || 0) > 0 && <span className="text-[9px] text-orange-400 ml-1">(装備+{battleState.equipBonus!.atk})</span>}
                                    {battleState.resonanceActive && <span className="text-[9px] text-yellow-400 ml-1">(共鳴×1.1)</span>}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-blue-400 font-bold">防御力</span>
                                <span className="text-slate-200 font-mono">
                                    {/* 実効DEF = (base + equipBonus) * resonanceMod */}
                                    {Math.floor(((userProfile.def || 0) + (battleState.equipBonus?.def || 0)) * (battleState.resonanceActive ? 1.1 : 1.0))}
                                    {(battleState.equipBonus?.def || 0) > 0 && <span className="text-[9px] text-cyan-400 ml-1">(装備+{battleState.equipBonus!.def})</span>}
                                    {battleState.resonanceActive && <span className="text-[9px] text-yellow-400 ml-1">(共鳴×1.1)</span>}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-amber-400 font-bold">AP</span>
                                <span className="text-slate-200 font-mono">{battleState.current_ap || 0} / 15</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-yellow-400 font-bold">所持金</span>
                                <span className="text-slate-200 font-mono">{userProfile.gold || 0} G</span>
                            </div>
                            {battleState.resonanceActive && (
                                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded px-2 py-1.5 text-center">
                                    <span className="text-yellow-300 font-bold text-[10px] animate-pulse">⚡ 共鳴ボーナス発動中 (ATK/DEF +10%)</span>
                                </div>
                            )}

                            {(battleState.player_effects as any[])?.length > 0 && (
                                <div className="bg-slate-800/50 rounded px-2 py-1.5">
                                    <span className="text-purple-400 font-bold text-[10px]">状態効果</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(battleState.player_effects as any[]).map((eff: any, ei: number) => {
                                            const isDebuff = ['stun', 'bind', 'poison', 'bleed', 'bleed_minor', 'fear', 'blind', 'blind_minor', 'atk_down'].includes(eff.id);
                                            return (
                                                <span key={ei} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                    isDebuff
                                                        ? 'bg-red-900/30 border-red-800/50 text-red-300'
                                                        : 'bg-sky-900/30 border-sky-800/50 text-sky-300'
                                                }`}>
                                                    {getEffectName(eff.id)} ({eff.duration ?? '?'}T)
                                                    {eff.value != null && eff.value > 0 && <span className="ml-0.5 text-[8px] opacity-70">+{eff.value}</span>}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* デッキスキル */}
                            {hand?.length > 0 && (
                                <div className="bg-slate-800/50 rounded px-2 py-1.5">
                                    <span className="text-amber-400 font-bold text-[10px]">手札スキル ({hand.length}枚)</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {hand.filter((c: any) => c.type !== 'noise').slice(0, 8).map((c: any, ci: number) => (
                                            <span key={ci} className={`px-1.5 py-0.5 rounded text-[9px] border ${
                                                c.cost_type === 'item'
                                                    ? 'bg-teal-900/30 border-teal-700/50 text-teal-300'
                                                    : c.type === 'Support'
                                                        ? 'bg-purple-900/30 border-purple-700/50 text-purple-300'
                                                        : 'bg-orange-900/30 border-orange-700/50 text-orange-300'
                                            }`}>
                                                {c.name}
                                                {c.ap_cost != null && <span className="ml-0.5 text-[8px] opacity-60">({c.ap_cost}AP)</span>}
                                            </span>
                                        ))}
                                        {hand.filter((c: any) => c.type !== 'noise').length > 8 && (
                                            <span className="text-[9px] text-slate-500">...他{hand.filter((c: any) => c.type !== 'noise').length - 8}枚</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BATTLE LOG — スクロール可能 + タイプライター */}
            <div className="relative z-20 px-3 w-full flex-shrink-0 drop-shadow-md">
                <div
                    ref={logContainerRef}
                    className="bg-black/30 backdrop-blur-md border border-white/20 rounded p-1.5 text-[10px] font-mono leading-relaxed h-[5.5rem] overflow-y-auto scroll-smooth shadow-inner"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
                >
                    {displayedLogs.map((log, idx) => {
                        const isLatest = idx === displayedLogs.length - 1 && !typingText;
                        // ログ色分け: ユーザー=緑, エネミー=赤, パーティ=青, システム=黄
                        const isPlayerLog = log.includes('あなた') || log.includes('を使用') || log.includes('のダメージ！');
                        const isEnemyLog = log.includes('の行動') || log.includes('に攻撃') || log.includes('あなたに') && log.includes('ダメージ');
                        const isPartyLog = log.includes('がかばった') || log.includes('パーティ') || (battleState.party || []).some((m: any) => log.startsWith(m.name));
                        const isSystemLog = log.startsWith('---') || log.includes('勝利') || log.includes('敗北') || log.includes('ターゲット') || log.includes('逃') || log.includes('力尽きた') || log.includes('全ての敵');
                        let logColor = isLatest ? 'text-white drop-shadow' : 'text-slate-300 drop-shadow; opacity-80';
                        let bulletColor = isLatest ? 'text-amber-400 drop-shadow' : 'text-slate-500 drop-shadow';
                        if (isSystemLog) { logColor = isLatest ? 'text-yellow-300 drop-shadow' : 'text-yellow-600 drop-shadow'; bulletColor = 'text-yellow-500 drop-shadow'; }
                        else if (isEnemyLog) { logColor = isLatest ? 'text-red-300 drop-shadow' : 'text-red-700 drop-shadow'; bulletColor = 'text-red-500 drop-shadow'; }
                        else if (isPartyLog) { logColor = isLatest ? 'text-sky-300 drop-shadow' : 'text-sky-600 drop-shadow'; bulletColor = 'text-sky-400 drop-shadow'; }
                        else if (isPlayerLog) { logColor = isLatest ? 'text-green-300 drop-shadow' : 'text-green-600 drop-shadow'; bulletColor = 'text-green-500 drop-shadow'; }
                        return (
                            <div key={idx} className={`flex gap-1.5 ${logColor} ${isLatest ? 'font-bold' : ''}`}>
                                <span className={`shrink-0 ${bulletColor}`}>▸</span>
                                <span className="break-all">{log}</span>
                            </div>
                        );
                    })}
                    {typingText && (
                        <div className="flex gap-1.5 text-slate-200 font-bold">
                            <span className="shrink-0 text-amber-500">▸</span>
                            <span className="break-all">{typingText}<span className="animate-pulse text-amber-400">|</span></span>
                        </div>
                    )}
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* BOTTOM: CARDS + ACTION BUTTONS — フロー配置 */}
            <div className="w-full relative z-30 px-3 pb-2 flex-shrink-0">

                {/* Hand Cards (Fan Layout) — 2段階アクション対応 */}
                <div className="relative w-full h-36 flex justify-center items-end overflow-visible">
                    {hand.map((card, idx) => {
                        const centerIndex = (hand.length - 1) / 2;
                        const offset = idx - centerIndex;
                        const rotation = selectedCardIndex === idx ? 0 : offset * 8;
                        const translateY = selectedCardIndex === idx ? -16 : Math.abs(offset) * 12;
                        const overlapPx = hand.length > 4 ? -16 : hand.length > 2 ? -12 : -8;
                        const apCost = card.ap_cost ?? 1;
                        const isActivePlayable = battleState.current_ap >= apCost;
                        const isSelected = selectedCardIndex === idx;

                        const getCostStyles = (ap: number) => {
                            if (ap >= 4) return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)] ring-1 ring-amber-400 animate-pulse bg-gradient-to-t from-amber-950/50 to-black/40 backdrop-blur-md';
                            if (ap === 3) return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] ring-1 ring-blue-400 bg-gradient-to-t from-blue-950/50 to-black/40 backdrop-blur-md';
                            return 'border-slate-500 shadow-sm bg-black/40 backdrop-blur-md hover:border-slate-400';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleCardClick(idx)}
                                disabled={!canInteract || !isActivePlayable}
                                className={`relative group origin-bottom transition-all duration-300 flex-shrink-0 first:ml-0
                                    ${isSelected ? 'w-[80px] sm:w-28 scale-110 z-50' : 'w-[72px] sm:w-24'}
                                    ${(!canInteract || !isActivePlayable) ? 'opacity-40 grayscale pointer-events-none' : isSelected ? '' : 'hover:-translate-y-4 hover:scale-105'}
                                    ${selectedCardIndex !== null && !isSelected ? 'opacity-50 scale-95' : ''}
                                 `}
                                style={{
                                    marginLeft: idx === 0 ? 0 : overlapPx,
                                    transform: `rotate(${rotation}deg) translateY(${translateY}px)${isSelected ? ' scale(1.1)' : ''}`,
                                    zIndex: isSelected ? 50 : idx
                                }}
                                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.zIndex = '50')}
                                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.zIndex = String(idx))}
                            >
                                <div className={`h-32 sm:h-36 border-2 rounded-xl flex flex-col overflow-hidden pointer-events-none transition-all
                                    ${isSelected ? 'animate-[cardSelectPulse_1s_ease-in-out_infinite] border-white' : getCostStyles(apCost)}
                                    ${!isSelected ? 'group-hover:border-amber-400 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.8)]' : ''}
                                `}>
                                    <div className="h-1/2 bg-transparent border-b border-white/20 relative backdrop-blur-sm">
                                        {card.image_url ? (
                                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-amber-500/80 drop-shadow-md">
                                                {card.type === 'Skill' ? <Sparkles size={24} /> : card.type === 'Item' ? <Heart size={24} /> : <Sword size={24} />}
                                            </div>
                                        )}
                                        <div className="absolute top-0.5 left-0.5 bg-black/60 backdrop-blur rounded-full w-5 h-5 flex items-center justify-center font-bold text-white text-[10px] border border-white/20 shadow-md">
                                            {apCost}
                                        </div>
                                    </div>
                                    <div className="h-1/2 bg-black/30 backdrop-blur p-1 flex flex-col justify-between drop-shadow-md">
                                        <div className="text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 text-white drop-shadow">
                                            {card.name}
                                        </div>
                                        <div className="text-[7px] sm:text-[8px] text-slate-300 line-clamp-2 drop-shadow">
                                            {card.description}
                                        </div>
                                    </div>
                                </div>
                                {/* Tap to execute label */}
                                {isSelected && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white/90 text-slate-900 text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-bounce">
                                        タップで実行
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Action Buttons — v15.0 NEXT button */}
            <div className="flex justify-end gap-1.5 px-3 py-1.5 flex-shrink-0 z-30 drop-shadow-md">
                {/* アイテムボタン */}
                {(battleState.battleItems || []).length > 0 && (
                    <button
                        onClick={() => setShowItemPanel(true)}
                        disabled={!canInteract}
                        className="bg-black/40 backdrop-blur-md border border-amber-600/50 text-amber-300 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold hover:bg-amber-900/30 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        🎒
                        <span>アイテム</span>
                    </button>
                )}
                {/* v15.0: NEXT ボタン */}
                <button
                    onClick={handleNext}
                    disabled={!canPressNext}
                    className={`backdrop-blur-md rounded-lg px-4 py-1.5 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all text-[11px] font-bold border ${
                        battlePhase === 'player'
                            ? 'bg-sky-900/60 border-sky-400/60 text-sky-200 hover:bg-sky-800/70'
                            : (isTypingDone
                                ? 'bg-orange-900/60 border-orange-400/60 text-orange-200 hover:bg-orange-800/70 animate-pulse'
                                : 'bg-black/40 border-white/20 text-white/50')
                    } disabled:opacity-40 disabled:pointer-events-none`}
                >
                    <Clock size={12} />
                    {battlePhase === 'npc_done' && isTypingDone ? '▶ ENEMY PHASE' :
                     battlePhase === 'enemy_done' && isTypingDone ? '▶ NEXT TURN' : 'NEXT'}
                </button>
                {/* 撤退: プレイヤーフェーズのみ */}
                {battlePhase === 'player' && (
                    <button
                        onClick={handleFlee}
                        disabled={!canInteract}
                        className="bg-black/40 backdrop-blur-md border border-red-500/50 text-red-300 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold hover:bg-red-950/50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <LogOut size={12} />
                        撤退
                    </button>
                )}
            </div>


            {/* v25: バトルアイテムパネル */}
            {showItemPanel && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    onClick={() => setShowItemPanel(false)}
                >
                    <div
                        className="w-full max-w-lg bg-slate-950/95 backdrop-blur-xl border-t border-amber-600/40 rounded-t-2xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎒</span>
                                <span className="text-sm font-bold text-amber-300">所持品（バトル中使用）</span>
                            </div>
                            <button onClick={() => setShowItemPanel(false)} className="text-gray-500 hover:text-white p-1">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {(battleState.battleItems || []).map(item => {
                                const qty = item.quantity || 0;
                                const ed = (item as any).effect_data || {};
                                const currentHp = liveHp ?? userProfile?.hp ?? 0;
                                const maxHp = (userProfile?.max_hp || 0) + (battleState.equipBonus?.hp || 0);
                                const healAmount = ed.heal || ed.heal_hp || ed.heal_amount || 0;
                                const isHealOnly = !!(ed.heal_full || ed.heal_all || healAmount > 0 || ed.heal_pct > 0) && !ed.escape && !ed.remove_effect && !ed.effect_id;
                                const isHpFull = isHealOnly && maxHp > 0 && currentHp >= maxHp;
                                const disabled = qty <= 0 || battleState.isVictory || battleState.isDefeat || isHpFull;
                                const imgUrl = (item as any).image_url || null;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={disabled}
                                        onClick={async () => {
                                            setShowItemPanel(false);
                                            await useBattleItem(item);
                                        }}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${
                                            disabled
                                                ? 'border-gray-800 bg-gray-900/50 opacity-40 cursor-not-allowed'
                                                : 'border-amber-600/50 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-400'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                                            {imgUrl
                                                ? <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                                                : <Heart size={20} className="text-green-400" />
                                            }
                                        </div>
                                        <div className="text-[9px] text-center text-gray-300 leading-tight line-clamp-2">{item.name}</div>
                                        {isHpFull
                                            ? <div className="text-[8px] font-bold text-sky-500">HP満</div>
                                            : <div className="text-[8px] font-bold text-amber-400">x{qty}</div>
                                        }
                                    </button>
                                );
                            })}
                        </div>
                        {(battleState.battleItems || []).every(i => (i.quantity || 0) <= 0) && (
                            <div className="text-center text-gray-600 text-xs py-4">使用可能なアイテムがありません。</div>
                        )}
                    </div>
                </div>
            )}

            {/* BATTLE RESULT OVERLAY */}
            {shouldShowOverlay && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-1000">
                    <div className="text-center space-y-4 p-6 border-y-2 border-double w-full bg-black/40">

                        {battleState.isVictory && (
                            <>
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-700 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                    VICTORY
                                </h2>
                                <p className="text-yellow-200/80 font-sans tracking-widest text-sm">強敵を打ち倒した！</p>

                                {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('type') === 'bounty_hunter' && (
                                    <div className="max-w-xs mx-auto mt-2">
                                        <XShareButton
                                            text={`「賞金首として狙われたが、襲撃してきた賞金稼ぎを返り討ちにしてやったぞ。私の首は貴様らには重すぎるようだ。」 #Wirth_Dawn #賞金首の意地`}
                                            variant="large"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <button
                                        onClick={() => handleResultAction('win')}
                                        className="px-6 py-2 bg-gradient-to-r from-yellow-900 to-yellow-700 text-yellow-100 border border-yellow-500 rounded text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.3)] font-bold"
                                    >
                                        {selectedScenario ? '次へ進む' : '凱旋する'}
                                    </button>
                                    <button
                                        onClick={() => setIsReviewingLogs(true)}
                                        className="px-3 py-2 bg-slate-800 text-slate-400 border border-slate-600 rounded text-[10px] hover:bg-slate-700 transition-colors"
                                    >
                                        <ScrollText size={14} />
                                    </button>
                                </div>
                            </>
                        )}

                        {!battleState.isVictory && battleState.messages.includes("一行は逃げ出した...") && (
                            <>
                                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-400 drop-shadow-md">
                                    ESCAPED
                                </h2>
                                <p className="text-gray-500 font-sans tracking-widest text-sm">戦略的撤退...</p>
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleResultAction('escape')}
                                        className="px-6 py-2 bg-gray-800 text-gray-300 border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors font-bold"
                                    >
                                        戦線離脱
                                    </button>
                                    <button
                                        onClick={() => setIsReviewingLogs(true)}
                                        className="px-3 py-2 bg-slate-800 text-slate-400 border border-slate-600 rounded text-[10px] hover:bg-slate-700 transition-colors"
                                    >
                                        <ScrollText size={14} />
                                    </button>
                                </div>
                            </>
                        )}

                        {battleState.isDefeat && !isEscaped && (
                            <>
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
                                    DEFEATED
                                </h2>
                                <p className="text-red-400/80 font-sans tracking-widest text-sm">意識が遠のいていく...</p>
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleResultAction('lose')}
                                        className="px-6 py-2 bg-red-950/80 text-red-200 border border-red-800 rounded text-sm hover:bg-red-900 transition-colors font-bold"
                                    >
                                        運ばれる
                                    </button>
                                    <button
                                        onClick={() => setIsReviewingLogs(true)}
                                        className="px-3 py-2 bg-slate-800 text-slate-400 border border-slate-600 rounded text-[10px] hover:bg-slate-700 transition-colors"
                                    >
                                        <ScrollText size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Log Review Mode */}
            {isResultActive && isReviewingLogs && (
                <div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <button
                        onClick={() => setIsReviewingLogs(false)}
                        className="pointer-events-auto bg-black/80 text-white border border-gray-500 px-5 py-1.5 rounded-full shadow-lg hover:bg-gray-800 text-sm"
                    >
                        結果画面に戻る
                    </button>
                </div>
            )}
        </div>
    );
}
