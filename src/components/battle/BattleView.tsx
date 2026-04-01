'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull, Clock, Target, Users, User, LogOut, ScrollText, Zap, X } from 'lucide-react';
import Image from 'next/image';
import { hasTaunt, StatusEffect } from '@/lib/statusEffects';
import XShareButton from '../shared/XShareButton';
import { Enemy } from '@/types/game';

interface BattleViewProps {
    onBattleEnd: (result: 'win' | 'lose' | 'escape') => void;
    battleTitle?: string;
}

export default function BattleView({ onBattleEnd, battleTitle }: BattleViewProps) {
    const router = useRouter();
    const hasHydrated = useGameStore(state => state._hasHydrated);
    const {
        battleState,
        hand,
        initializeBattle,
        attackEnemy,
        endTurn,
        waitTurn,
        setTactic,
        fleeBattle,
        selectedScenario,
        fetchUserProfile,
        userProfile,
        setTarget
    } = useGameStore();

    const [logs, setLogs] = useState<string[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [selectedPartyMember, setSelectedPartyMember] = useState<any | null>(null);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);

    // Typewriter state
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
    const [typingText, setTypingText] = useState<string>('');
    const typingQueue = useRef<string[]>([]);
    const isTyping = useRef(false);

    // Process typewriter queue
    const processQueue = useCallback(() => {
        if (isTyping.current || typingQueue.current.length === 0) return;
        isTyping.current = true;
        const message = typingQueue.current.shift()!;
        let charIdx = 0;
        setTypingText('');

        const timer = setInterval(() => {
            charIdx++;
            if (charIdx <= message.length) {
                setTypingText(message.slice(0, charIdx));
            } else {
                clearInterval(timer);
                setDisplayedLogs(prev => [...prev, message]);
                setTypingText('');
                isTyping.current = false;
                // Process next in queue
                setTimeout(() => processQueue(), 100);
            }
        }, 30);
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
            // Queue all new messages
            typingQueue.current.push(...curr);
            setTimeout(() => processQueue(), 50);
        } else {
            // Normal append: only queue new messages
            const newMessages = curr.slice(displayedLogs.length + (isTyping.current ? 1 : 0));
            if (newMessages.length > 0) {
                typingQueue.current.push(...newMessages);
                processQueue();
            }
        }

        prevMessagesRef.current = [...curr];
        setLogs(curr);
    }, [battleState.messages]);

    // Show turn overlay
    useEffect(() => {
        if (battleState.turn > 0) {
            setShowTurnOverlay(true);
            const timer = setTimeout(() => setShowTurnOverlay(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [battleState.turn]);

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

    // Handle Pub NPC Death
    useEffect(() => {
        if (battleState.isVictory && !selectedScenario && battleState.enemy?.id) {
            fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'kill', npc_id: battleState.enemy.id })
            }).catch(err => console.error("Failed to eliminate NPC:", err));
        }
    }, [battleState.isVictory, selectedScenario, battleState.enemy]);

    const handleCardClick = async (index: number) => {
        if (battleState.isVictory || battleState.isDefeat) return;
        const card = hand[index];
        const apCost = card.ap_cost ?? 1;
        if (battleState.current_ap < apCost) return;

        if (selectedCardIndex === index) {
            // 2段階目: 実行
            setSelectedCardIndex(null);
            setActiveEffect(card.animation_type || 'SLASH');
            setTimeout(() => setActiveEffect(null), 500);
            await attackEnemy(card);
        } else {
            // 1段階目: 選択
            setSelectedCardIndex(index);
        }
    };

    const handleFlee = () => {
        if (confirm("本当に撤退しますか？\n敗北扱いとなります。")) {
            fleeBattle();
        }
    };

    const handleEndTurn = async () => {
        if (battleState.isVictory || battleState.isDefeat) return;
        await endTurn();
    };

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

    const renderEnemyCard = (enemy: Enemy, isTarget: boolean, isDead: boolean) => (
        <div
            key={enemy.id}
            className={`relative group transition-all duration-300 shrink-0 ${isDead ? 'opacity-50 grayscale' : 'cursor-pointer'} ${isTarget && !isDead ? 'z-20' : 'z-10 opacity-70'}`}
            onClick={() => !isDead && setTarget(enemy.id)}
        >
            {/* WANTED Bounty Hunter Effect */}
            {enemy.spawn_type === 'bounty' && !isDead && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-500 text-[7px] font-black px-1 py-0.5 whitespace-nowrap z-20 skew-x-[-10deg]">
                    BOUNTY
                </div>
            )}

            {/* Card — 80% size */}
            <div className="w-[104px] h-[140px] sm:w-[116px] sm:h-[156px] relative transition-all duration-500">
                <div className={`w-full h-full rounded-lg shadow-2xl flex flex-col border-2 overflow-hidden
                    ${isTarget && !isDead ? 'border-red-500 animate-[targetPulse_1.5s_ease-in-out_infinite] bg-slate-900' : 'border-slate-700 bg-slate-900'}
                `}>
                    <div className="h-3/4 bg-slate-800 relative overflow-hidden">
                        {enemy.image_url ? (
                            <img src={enemy.image_url} alt={enemy.name} className={`w-full h-full object-cover ${isDead ? 'opacity-50 grayscale' : ''}`} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700"><Skull size={36} /></div>
                        )}
                    </div>
                    <div className="h-1/4 bg-slate-950 flex flex-col justify-center px-1.5 py-0.5 relative">
                        <div className={`text-[9px] font-bold truncate ${isDead ? 'text-gray-500 line-through' : 'text-slate-200'}`}>
                            {enemy.name} <span className="text-[7px] text-amber-500 font-normal">Lv.{enemy.level}</span>
                        </div>
                        {!isDead && (
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                                <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Animations */}
                {isTarget && activeEffect && (
                    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                        {activeEffect === 'SLASH' && (
                            <div className="w-full h-[2px] bg-red-400 rotate-45 shadow-[0_0_20px_rgba(248,113,113,1)] animate-in slide-in-from-top-12 duration-300" />
                        )}
                        {activeEffect === 'WIND' && (
                            <div className="block">
                                <div className="w-16 h-[1px] bg-sky-200 shadow-[0_0_15px_rgba(186,230,253,1)] animate-in slide-in-from-right-16 fade-in duration-300 mb-2" />
                                <div className="w-12 h-[1px] bg-sky-300 shadow-[0_0_15px_rgba(186,230,253,1)] animate-in slide-in-from-left-16 fade-in duration-300" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

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
            <div className="relative z-40 bg-slate-950/90 border-b border-slate-800 px-4 pt-[env(safe-area-inset-top,10px)] pb-2 flex items-center justify-between backdrop-blur-sm">
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
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542261226-9fcfd06ec4da?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
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

            {/* Enemies Layout — 左:ターゲット大 / 右:非ターゲット縮小重ね */}
            <div className="w-full relative z-10 bg-gradient-to-b from-transparent to-slate-950/80 pt-2 pb-1 flex-shrink-0">
                <div className="w-full flex items-center justify-center gap-3 px-3">
                    {/* LEFT: Target enemy (large) */}
                    {target && (
                        <div className="relative transition-all duration-500 flex-shrink-0">
                            {target.spawn_type === 'bounty' && target.hp > 0 && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-500 text-[7px] font-black px-1.5 py-0.5 whitespace-nowrap z-20 skew-x-[-10deg]">
                                    BOUNTY
                                </div>
                            )}
                            <div className={`w-[120px] h-[160px] sm:w-[140px] sm:h-[186px] rounded-lg shadow-2xl flex flex-col border-2 overflow-hidden transition-all duration-500
                                ${target.hp > 0 ? 'border-red-500 animate-[targetPulse_1.5s_ease-in-out_infinite] bg-slate-900' : 'border-slate-700 bg-slate-900 opacity-50 grayscale'}
                            `}>
                                <div className="h-3/4 bg-slate-800 relative overflow-hidden">
                                    {target.image_url ? (
                                        <img src={target.image_url} alt={target.name} className={`w-full h-full object-cover ${target.hp <= 0 ? 'opacity-50 grayscale' : ''}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Skull size={36} /></div>
                                    )}
                                </div>
                                <div className="h-1/4 bg-slate-950 flex flex-col justify-center px-2 py-1">
                                    <div className={`text-[10px] font-bold truncate ${target.hp <= 0 ? 'text-gray-500 line-through' : 'text-slate-200'}`}>
                                        {target.name} <span className="text-[8px] text-amber-500">Lv.{target.level}</span>
                                    </div>
                                    {target.hp > 0 && (
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                                            <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(target.hp / target.maxHp) * 100}%` }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Attack animation */}
                            {activeEffect && (
                                <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                                    {activeEffect === 'SLASH' && (
                                        <div className="w-full h-[2px] bg-red-400 rotate-45 shadow-[0_0_20px_rgba(248,113,113,1)] animate-in slide-in-from-top-12 duration-300" />
                                    )}
                                    {activeEffect === 'WIND' && (
                                        <div className="block">
                                            <div className="w-16 h-[1px] bg-sky-200 shadow-[0_0_15px_rgba(186,230,253,1)] animate-in slide-in-from-right-16 fade-in duration-300 mb-2" />
                                            <div className="w-12 h-[1px] bg-sky-300 shadow-[0_0_15px_rgba(186,230,253,1)] animate-in slide-in-from-left-16 fade-in duration-300" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* RIGHT: Non-target enemies (2-2-1 grid, overlapping) */}
                    {(() => {
                        const others = enemies.filter(e => target?.id !== e.id).slice(0, 5);
                        if (others.length === 0) return null;
                        const rows: typeof others[] = [];
                        rows.push(others.slice(0, 2));
                        if (others.length > 2) rows.push(others.slice(2, 4));
                        if (others.length > 4) rows.push(others.slice(4, 5));

                        const renderMiniCard = (enemy: typeof others[0], mi: number) => {
                            const isDead = enemy.hp <= 0;
                            return (
                                <div
                                    key={enemy.id}
                                    className={`relative transition-all duration-300 cursor-pointer hover:scale-110 hover:opacity-90 hover:z-20
                                        ${isDead ? 'opacity-20 grayscale' : 'opacity-70'}
                                    `}
                                    style={{ marginLeft: mi === 0 ? 0 : -10 }}
                                    onClick={() => !isDead && setTarget(enemy.id)}
                                >
                                    <div className={`w-[56px] h-[75px] sm:w-[64px] sm:h-[86px] rounded flex flex-col border overflow-hidden transition-all
                                        ${isDead ? 'border-slate-800' : 'border-slate-600 hover:border-slate-400'} bg-slate-900
                                    `}>
                                        <div className="h-3/4 bg-slate-800 relative overflow-hidden">
                                            {enemy.image_url ? (
                                                <img src={enemy.image_url} alt={enemy.name} className={`w-full h-full object-cover ${isDead ? 'opacity-40' : ''}`} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700"><Skull size={14} /></div>
                                            )}
                                        </div>
                                        <div className="h-1/4 bg-slate-950 flex flex-col justify-center px-0.5">
                                            <div className={`text-[5px] font-bold truncate ${isDead ? 'text-gray-600 line-through' : 'text-slate-400'}`}>
                                                {enemy.name}
                                            </div>
                                            {!isDead && (
                                                <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-600/70" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <div className="flex flex-col items-center flex-shrink-0">
                                {rows.map((row, ri) => (
                                    <div key={ri} className="flex justify-center" style={{ marginTop: ri === 0 ? 0 : -8 }}>
                                        {row.map((enemy, mi) => renderMiniCard(enemy, mi))}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* PLAYER STATUS PANEL */}
            <div className="relative z-20 px-3 mt-1 w-full flex-shrink-0">
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                        {/* Avatar — タップで詳細表示 */}
                        <button
                            onClick={() => setShowUserDetail(true)}
                            className="w-10 h-10 rounded-full border-2 border-amber-500 bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden active:scale-90 transition-transform"
                        >
                            {userProfile?.avatar_url ? (
                                <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} className="text-amber-500" />
                            )}
                        </button>

                        {/* Name + HP + VIT */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-200 truncate">{userProfile?.name || '旅人'}</span>
                                <span className="text-[9px] text-amber-500 font-bold">Lv.{userProfile?.level || 1}</span>
                                {battleState.resonanceActive && (
                                    <span className="text-[8px] text-yellow-400 font-bold animate-pulse">共鳴ボーナス発動中</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] text-green-400 font-bold w-5 flex-shrink-0">HP</span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, ((userProfile?.hp || 0) / (userProfile?.max_hp || 1)) * 100))}%` }} />
                                </div>
                                <span className="text-[8px] text-green-400 font-mono w-14 text-right flex-shrink-0">{userProfile?.hp || 0}/{userProfile?.max_hp || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] text-sky-400 font-bold w-5 flex-shrink-0">VIT</span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, ((userProfile?.vitality || 0) / (userProfile?.max_vitality || 100)) * 100))}%` }} />
                                </div>
                                <span className="text-[8px] text-sky-400 font-mono w-14 text-right flex-shrink-0">{userProfile?.vitality || 0}/{userProfile?.max_vitality || 100}</span>
                            </div>
                        </div>

                        {/* AP */}
                        <div className="flex flex-col items-center gap-0.5 px-2 border-l border-slate-700 flex-shrink-0">
                            <span className="text-[8px] text-slate-500 font-bold">AP</span>
                            <span className="text-base font-bold text-amber-400 font-mono">{battleState.current_ap || 0}<span className="text-[9px] text-slate-600">/{15}</span></span>
                        </div>
                    </div>

                    {/* Party Members + Guest NPCs row */}
                    {partyMembers.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
                            <Users size={12} className="text-slate-600 flex-shrink-0" />
                            {partyMembers.slice(0, 9).map((member: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedPartyMember(member)}
                                    className="flex flex-col items-center flex-shrink-0 active:scale-90 transition-transform"
                                >
                                    <div className={`w-9 h-9 rounded-full border ${(member.durability ?? member.hp) > 0 ? 'border-sky-500/70 bg-slate-800' : 'border-slate-700 bg-slate-900 opacity-40'} flex items-center justify-center overflow-hidden`}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className={member.is_guest ? 'text-emerald-400' : 'text-sky-400'} />
                                        )}
                                    </div>
                                    <div className="w-8 h-1 mt-0.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${(member.maxHp || member.max_hp) ? ((member.durability ?? member.hp) / (member.maxHp || member.max_hp)) * 100 : 100}%` }} />
                                    </div>
                                    <span className="text-[8px] text-slate-500 truncate max-w-[36px]">{member.name?.slice(0, 4) || 'NPC'}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Party Member Detail Popup */}
            {selectedPartyMember && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPartyMember(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-[280px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full border-2 border-sky-500 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    {selectedPartyMember.avatar_url ? (
                                        <img src={selectedPartyMember.avatar_url} alt="" className="w-full h-full object-cover" />
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
                                <span className="text-slate-200 font-mono">{selectedPartyMember.durability ?? selectedPartyMember.hp ?? 0} / {selectedPartyMember.maxHp ?? selectedPartyMember.max_hp ?? selectedPartyMember.hp ?? 0}</span>
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

            {/* User Status Detail Popup */}
            {showUserDetail && userProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUserDetail(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-[280px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                                <span className="text-slate-200 font-mono">{userProfile.hp || 0} / {userProfile.max_hp || 0}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-sky-400 font-bold">VIT</span>
                                <span className="text-slate-200 font-mono">{userProfile.vitality || 0} / {userProfile.max_vitality || 100}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-red-400 font-bold">攻撃力</span>
                                <span className="text-slate-200 font-mono">{userProfile.atk || 0}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                                <span className="text-blue-400 font-bold">防御力</span>
                                <span className="text-slate-200 font-mono">{userProfile.def || 0}</span>
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
                                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded px-2 py-1.5 text-center">
                                    <span className="text-yellow-400 font-bold text-[10px] animate-pulse">✦ 共鳴ボーナス発動中 ✦</span>
                                </div>
                            )}
                            {(battleState.player_effects as any[])?.length > 0 && (
                                <div className="bg-slate-800/50 rounded px-2 py-1.5">
                                    <span className="text-purple-400 font-bold text-[10px]">状態効果</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(battleState.player_effects as any[]).map((eff: any, ei: number) => (
                                            <span key={ei} className="px-1.5 py-0.5 bg-purple-900/30 border border-purple-800/50 rounded text-[9px] text-purple-300">
                                                {eff.id || eff.name || 'Effect'} ({eff.remaining_turns || '?'}T)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BATTLE LOG — スクロール可能 + タイプライター */}
            <div className="relative z-20 px-3 w-full flex-shrink-0">
                <div
                    ref={logContainerRef}
                    className="bg-slate-950/80 border border-slate-800 rounded p-1.5 text-[10px] font-mono leading-relaxed h-[5.5rem] overflow-y-auto backdrop-blur-sm scroll-smooth"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
                >
                    {displayedLogs.map((log, idx) => {
                        const isLatest = idx === displayedLogs.length - 1 && !typingText;
                        // ログ色分け: ユーザー=緑, エネミー=赤, パーティ=青, システム=黄
                        const isPlayerLog = log.includes('あなた') || log.includes('を使用') || log.includes('のダメージ！');
                        const isEnemyLog = log.includes('の行動') || log.includes('に攻撃') || log.includes('あなたに') && log.includes('ダメージ');
                        const isPartyLog = log.includes('がかばった') || log.includes('パーティ') || (battleState.party || []).some((m: any) => log.startsWith(m.name));
                        const isSystemLog = log.startsWith('---') || log.includes('勝利') || log.includes('敗北') || log.includes('ターゲット') || log.includes('逃') || log.includes('力尽きた') || log.includes('全ての敵');
                        let logColor = isLatest ? 'text-slate-200' : 'text-slate-500';
                        let bulletColor = isLatest ? 'text-amber-500' : 'text-slate-700';
                        if (isSystemLog) { logColor = isLatest ? 'text-yellow-300' : 'text-yellow-700'; bulletColor = 'text-yellow-600'; }
                        else if (isEnemyLog) { logColor = isLatest ? 'text-red-300' : 'text-red-800'; bulletColor = 'text-red-600'; }
                        else if (isPartyLog) { logColor = isLatest ? 'text-sky-300' : 'text-sky-800'; bulletColor = 'text-sky-600'; }
                        else if (isPlayerLog) { logColor = isLatest ? 'text-green-300' : 'text-green-800'; bulletColor = 'text-green-600'; }
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
                            if (ap >= 4) return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] bg-gradient-to-t from-amber-950 to-slate-900';
                            if (ap === 3) return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-gradient-to-t from-blue-950 to-slate-900';
                            return 'border-slate-600 bg-slate-800';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleCardClick(idx)}
                                disabled={battleState.isVictory || battleState.isDefeat || !isActivePlayable}
                                className={`relative group origin-bottom transition-all duration-300 flex-shrink-0 first:ml-0
                                    ${isSelected ? 'w-[80px] sm:w-28 scale-110 z-50' : 'w-[72px] sm:w-24'}
                                    ${!isActivePlayable ? 'opacity-40 grayscale pointer-events-none' : isSelected ? '' : 'hover:-translate-y-4 hover:scale-105'}
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
                                    <div className="h-1/2 bg-slate-900/50 border-b border-slate-700 relative backdrop-blur-sm">
                                        {card.image_url ? (
                                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-amber-500/20">
                                                {card.type === 'Skill' ? <Sparkles size={24} /> : card.type === 'Item' ? <Heart size={24} /> : <Sword size={24} />}
                                            </div>
                                        )}
                                        <div className="absolute top-0.5 left-0.5 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center font-bold text-white text-[10px] border border-slate-700">
                                            {apCost}
                                        </div>
                                    </div>
                                    <div className="h-1/2 bg-slate-950/80 backdrop-blur-sm p-1 flex flex-col justify-between">
                                        <div className="text-[9px] sm:text-[10px] font-bold leading-tight line-clamp-2 text-slate-200">
                                            {card.name}
                                        </div>
                                        <div className="text-[7px] sm:text-[8px] text-slate-500 line-clamp-2">
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

            {/* Action Buttons — カード領域の外、右寄せ */}
            <div className="flex justify-end gap-1.5 px-3 py-1.5 flex-shrink-0 z-30">
                <button
                    onClick={handleEndTurn}
                    disabled={battleState.isVictory || battleState.isDefeat}
                    className="bg-slate-800/90 border border-slate-600 text-slate-300 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold"
                >
                    <Clock size={12} />
                    ターンエンド
                </button>
                <button
                    onClick={handleFlee}
                    disabled={battleState.isVictory || battleState.isDefeat}
                    className="bg-slate-800/90 border border-red-900/50 text-red-400 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold"
                >
                    <LogOut size={12} />
                    撤退
                </button>
            </div>

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
