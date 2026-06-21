'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useBattleTypewriter } from './hooks/useBattleTypewriter';
import { BattleLogBox } from './BattleLogBox';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull, Clock, Target, Users, User, LogOut, ScrollText, Zap, X } from 'lucide-react';
import Image from 'next/image';
import { hasTaunt, StatusEffect, getEffectName, isStunned } from '@/lib/statusEffects';
import XShareButton from '../shared/XShareButton';
import { Enemy } from '@/types/game';
import StatusEffectBadges from './StatusEffectBadges';
import { getCardEffectInfo } from '@/lib/cardEffects';
import { getAuthToken } from '@/lib/authToken';

interface BattleViewProps {
    onBattleEnd: (result: 'win' | 'lose' | 'escape') => void;
    battleTitle?: string;
    bgImageUrl?: string;
    disableRedirect?: boolean;
}

export default function BattleView({ onBattleEnd, battleTitle, bgImageUrl, disableRedirect }: BattleViewProps) {
    const router = useRouter();
    const hasHydrated = useGameStore(state => state._hasHydrated);

    // v30: Onboarding & Battle UX/Visual Enhancements
    const [shouldShake, setShouldShake] = useState(false);
    const [shouldEnemyShake, setShouldEnemyShake] = useState(false);
    const [enemyActiveSkill, setEnemyActiveSkill] = useState<string | null>(null);
    const [isStrongEnemyActive, setIsStrongEnemyActive] = useState(false);
    const [isStrongActive, setIsStrongActive] = useState(false);
    const [floatingDamages, setFloatingDamages] = useState<{ id: number; amount: number; isPlayer: boolean }[]>([]);
    const [apErrorActive, setApErrorActive] = useState(false);

    const prevLiveHpRef = useRef<number | null>(null);
    const prevTargetHpRef = useRef<number | null>(null);
    const prevTargetIdRef = useRef<string | null>(null);

    // Concurrency phase lock for NEXT button
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isResultTransitioning, setIsResultTransitioning] = useState(false);
    const nextTimeoutRef1 = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nextTimeoutRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [selectedPartyMember, setSelectedPartyMember] = useState<any | null>(null);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [showItemPanel, setShowItemPanel] = useState(false); // v25: バトルアイテムパネル
    const [healTargetMode, setHealTargetMode] = useState<{ cardIndex: number; card: any } | null>(null); // v2.9.3i: ヒール対象選択モード

    // ─── タイプライターフック ────────────────────────────────────────────────
    const {
        displayedLogs, setDisplayedLogs,
        activeMessage,
        isTypingDone, setIsTypingDone,
        liveHp, setLiveHp,
        livePartyDurability, setLivePartyDurability,
        typingQueue,
        isTypingRef: isTyping,
        processQueue,
        flushQueue,
        completeActiveMessage,
        enqueuedUpToRef,
    } = useBattleTypewriter(userProfile?.hp, (msg) => {
        if (msg.includes('の『')) {
            const isEnemyPhase = battleState.battlePhase !== 'player';
            if (isEnemyPhase) {
                const match = msg.match(/の『(.+?)』/);
                const skillName = match ? match[1] : '';
                if (skillName) {
                    setEnemyActiveSkill(skillName);
                    const isStrong = /終焉|暗黒|雷撃|魂|石化|咆哮|神罰|極|超|真|神|絶|暴君/g.test(skillName);
                    if (isStrong) {
                        setIsStrongEnemyActive(true);
                        setShouldShake(true);
                        setTimeout(() => setShouldShake(false), 300);
                        setTimeout(() => {
                            setShouldShake(true);
                            setTimeout(() => setShouldShake(false), 300);
                        }, 150);
                    } else {
                        // 弱・通常攻撃時も軽く揺らして臨場感を出す
                        setShouldShake(true);
                        setTimeout(() => setShouldShake(false), 200);
                    }
                    setTimeout(() => {
                        setEnemyActiveSkill(null);
                        setIsStrongEnemyActive(false);
                    }, 1000);
                }
            }
        }

        // あなた（プレイヤー）への被ダメージメッセージ開始時にも即時画面を揺らす（ディレイ解消）
        if (msg.includes('あなたに') && (msg.includes('ダメージ') || msg.includes('のダメージ'))) {
            setShouldShake(true);
            setTimeout(() => setShouldShake(false), 300);
        }
    });

    // プレイヤーの被ダメージ検知
    useEffect(() => {
        if (liveHp !== null && prevLiveHpRef.current !== null) {
            const diff = prevLiveHpRef.current - liveHp;
            if (diff > 0) {
                setShouldShake(true);
                setTimeout(() => setShouldShake(false), 300);

                const id = Date.now() + Math.random();
                setFloatingDamages(prev => [...prev, { id, amount: diff, isPlayer: true }]);
                setTimeout(() => {
                    setFloatingDamages(prev => prev.filter(d => d.id !== id));
                }, 1000);
            }
        }
        prevLiveHpRef.current = liveHp;
    }, [liveHp]);

    // 敵の被ダメージ検知
    useEffect(() => {
        const currentTarget = battleState.enemy;
        if (currentTarget && currentTarget.hp !== null) {
            // ターゲットIDが一致し、かつ前回のHP記録がある場合のみ被ダメージ検知を行う
            if (prevTargetIdRef.current === currentTarget.id && prevTargetHpRef.current !== null) {
                const diff = prevTargetHpRef.current - currentTarget.hp;
                if (diff > 0) {
                    setShouldShake(true);
                    setTimeout(() => setShouldShake(false), 300);

                    setShouldEnemyShake(true);
                    setTimeout(() => setShouldEnemyShake(false), 300);

                    const id = Date.now() + Math.random();
                    setFloatingDamages(prev => [...prev, { id, amount: diff, isPlayer: false }]);
                    setTimeout(() => {
                        setFloatingDamages(prev => prev.filter(d => d.id !== id));
                    }, 1000);
                }
            }
            prevTargetHpRef.current = currentTarget.hp;
            prevTargetIdRef.current = currentTarget.id;
        } else {
            prevTargetHpRef.current = null;
            prevTargetIdRef.current = null;
        }
    }, [battleState.enemy?.hp, battleState.enemy?.id]);

    // v15.0: オーバーレイ表示管理（ターン/フェーズ）
    const lastShownTurnRef = useRef(0);        // TURN N overlay表示済み番号
    const [showPhaseOverlay, setShowPhaseOverlay] = useState<null | 'player' | 'enemy'>(null);



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
            // TURN N オーバーレイ（2000ms） → PLAYER オーバーレイ（1000ms）
            setShowTurnOverlay(true);
            const t1 = setTimeout(() => {
                setShowTurnOverlay(false);
                setShowPhaseOverlay('player');
            }, 2000);
            const t2 = setTimeout(() => setShowPhaseOverlay(null), 3000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [battleState.battlePhase, battleState.turn]);


    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log("[BattlePage] Mounted. Enemy:", battleState.enemy, "Hand:", hand.length);
        }
        fetchUserProfile();
        const hydrated = useGameStore.persist.hasHydrated();
        if (!disableRedirect && hydrated && !battleState.enemy) {
            console.warn('[BattlePage] 敵がいません。/inn に戻ります。');
            router.push('/inn');
        }
    }, [disableRedirect]);

    const [isActioning, setIsActioning] = useState(false);

    // v25: バトル開始時（party が存在し始めた時）のみ livePartyDurability を初期化
    // battleState.party 全体を監視すると毎ターンのメンバー更新で不要なレンダリングが発生するため
    // length のみ監視し、0 → N の変化（= 新しいバトル開始）時のみ実行する
    const prevPartyLengthRef = useRef(0);
    const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    // マウント解除時にタイマーをクリーンアップ
    useEffect(() => {
        return () => {
            if (nextTimeoutRef1.current) clearTimeout(nextTimeoutRef1.current);
            if (nextTimeoutRef2.current) clearTimeout(nextTimeoutRef2.current);
            if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
        };
    }, []);

    // v15.0: canInteract = プレイヤーフェーズ中のみ操作可能
    // battlePhaseが'player'でない間（npc_done / enemy_done）は常にロック
    const battlePhase = battleState.battlePhase ?? 'player';
    // Bug fix: ターン1のボーナスログ再生中はカード操作をロック（ログ乱れ防止）
    const isInitialLogPlaying = battleState.turn === 1 && !isTypingDone && displayedLogs.length < battleState.messages.length;
    
    // プレイヤーがスタン・拘束・凍結状態の場合は操作をロック (Bug E)
    const playerEffectsNow = battleState.player_effects as StatusEffect[];
    const isPlayerStunned = isStunned(playerEffectsNow);
    const canInteract = battlePhase === 'player' && !battleState.isVictory && !battleState.isDefeat && !isInitialLogPlaying && !isActioning && !isPlayerStunned;
    
    // NEXT ボタンの押下可否: ログ再生中（isTypingDone=false）かつプレイヤーフェーズ外は不可
    // トランジション中、またはアクション実行中は不可
    const canPressNext = !battleState.isVictory && !battleState.isDefeat &&
        (battlePhase === 'player' || isTypingDone) && !isTransitioning && !isActioning;

    const handleCardClick = async (index: number) => {
        if (!canInteract) return;
        const card = hand[index];
        const apCost = card.ap_cost ?? 1;
        if (battleState.current_ap < apCost) {
            setApErrorActive(true);
            setTimeout(() => setApErrorActive(false), 800);
            return;
        }

        if (selectedCardIndex === index) {
            // 2段階目: 実行

            // v2.9.3i: ヒールカードの場合、ターゲット選択モードに移行
            // target_typeがDB未設定でもcardEffectsのheal判定でフォールバック
            const cardEffect = getCardEffectInfo(card);
            const isHealCard = card.target_type === 'single_ally' ||
                cardEffect.effectType === 'heal' ||
                card.type === 'Heal' || card.name.includes('回復') || card.name.includes('治癒') || card.name.includes('応急') || card.name.includes('ヒール') || card.name.includes('癒');
            // 全体回復カード（target_type === 'all_allies'）の場合は単体選択モードに入らないようにする (Bug X)
            const isAllyHeal = isHealCard && card.target_type !== 'all_allies' && cardEffect.effectType !== 'buff_party' && cardEffect.effectType !== 'cure_self';

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

            // 強スキル判定（威力25以上は除外）
            const isStrong = apCost >= 3 || /極|超|真|神|絶|終焉|バースト|メガ|ギガ|テラ/g.test(card.name);
            if (isStrong) {
                setIsStrongActive(true);
                // バフ・回復系スキルの場合は画面揺れを行わない
                if (!isBuff) {
                    setShouldShake(true);
                    setTimeout(() => setShouldShake(false), 300);
                    setTimeout(() => {
                        setShouldShake(true);
                        setTimeout(() => setShouldShake(false), 300);
                    }, 150);
                }
                setTimeout(() => setIsStrongActive(false), 1000);
            }

            if (isAllyHeal) {
                setSelectedCardIndex(null);
                if ((battleState.party?.length ?? 0) > 0) {
                    setHealTargetMode({ cardIndex: index, card });
                } else {
                    // ソロ時は自分自身をターゲットにして即時実行
                    setActiveEffect('BUFF');
                    setTimeout(() => setActiveEffect(null), 700);
                    try {
                        setIsActioning(true);
                        attackEnemy(card, 'player').then(success => {
                            if (success) {
                                actionTimeoutRef.current = setTimeout(() => {
                                    setIsActioning(false);
                                }, 750);
                            } else {
                                setIsActioning(false);
                            }
                        }).catch(() => {
                            setIsActioning(false);
                        });
                    } catch (e) {
                        setIsActioning(false);
                    }
                }
                return;
            }

            setSelectedCardIndex(null);
            if (!isBuff) {
                let effect = card.animation_type;
                if (!effect) {
                    if (card.name.includes('風') || card.name.includes('疾')) effect = 'WIND';
                    else if (card.name.includes('突') || card.name.includes('槍') || card.name.includes('針')) effect = 'PIERCE';
                    else if (card.name.includes('打') || card.name.includes('砕') || card.name.includes('バッシュ')) effect = 'BLUNT';
                    else if (card.name.includes('火') || card.name.includes('炎') || card.name.includes('爆') || card.name.includes('バーン') || card.name.includes('ファイア') || card.name.includes('デトネーション') || card.name.includes('プロミネンス')) effect = 'FIRE';
                    else if (card.name.includes('雷') || card.name.includes('電') || card.name.includes('サンダー') || card.name.includes('ライトニング') || card.name.includes('プラズマ')) effect = 'LIGHTNING';
                    else if (card.name.includes('氷') || card.name.includes('凍') || card.name.includes('フリーズ') || card.name.includes('アイス') || card.name.includes('アブソリュート')) effect = 'ICE';
                    else if (card.name.includes('闇') || card.name.includes('影') || card.name.includes('ダーク') || card.name.includes('シャドウ') || card.name.includes('デス')) effect = 'DARK';
                    else if (card.name.includes('光') || card.name.includes('聖') || card.name.includes('シャイン') || card.name.includes('ホーリー')) effect = 'HOLY';
                    else effect = 'SLASH';
                }
                setActiveEffect(effect);
                setTimeout(() => setActiveEffect(null), 800);
            } else {
                setActiveEffect('BUFF');
                setTimeout(() => setActiveEffect(null), 700);
            }
            try {
                setIsActioning(true);
                attackEnemy(card).then(success => {
                    if (success) {
                        actionTimeoutRef.current = setTimeout(() => {
                            setIsActioning(false);
                        }, 750);
                    } else {
                        setIsActioning(false);
                    }
                }).catch(() => {
                    setIsActioning(false);
                });
            } catch (e) {
                setIsActioning(false);
            }
        } else {
            // 1段階目: 選択
            setSelectedCardIndex(index);
        }
    };

    // v2.9.3i: ヒール対象選択コールバック
    const handleHealTargetSelect = async (targetMemberId: string) => {
        if (!healTargetMode) return;
        const { card } = healTargetMode;
        setHealTargetMode(null);

        // 強スキル判定（威力25以上は除外）
        const apCost = card.ap_cost ?? 1;
        const isStrong = apCost >= 3 || /極|超|真|神|絶|終焉|バースト|メガ|ギガ|テラ/g.test(card.name);
        if (isStrong) {
            setIsStrongActive(true);
            // 回復系スキルのため、画面揺れ（setShouldShake）は行わない
            setTimeout(() => setIsStrongActive(false), 1000);
        }

        setActiveEffect('BUFF');
        setTimeout(() => setActiveEffect(null), 700);
        try {
            setIsActioning(true);
            attackEnemy(card, targetMemberId).then(success => {
                if (success) {
                    actionTimeoutRef.current = setTimeout(() => {
                        setIsActioning(false);
                    }, 750);
                } else {
                    setIsActioning(false);
                }
            }).catch(() => {
                setIsActioning(false);
            });
        } catch (e) {
            setIsActioning(false);
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
            try {
                setIsTransitioning(true);
                await runNpcPhase();
            } finally {
                setIsTransitioning(false);
            }
        } else if (battlePhase === 'npc_done' && isTypingDone) {
            // NPC 完了 → 勝利済みならスキップ、そうでなければ ENEMY フェーズ
            if (battleState.isVictory || battleState.battle_result === 'victory') {
                // 勝利済み: enemy_done相当へ
                useGameStore.getState().advanceTurn();
                return;
            }
            setIsTransitioning(true);
            setShowPhaseOverlay('enemy');
            nextTimeoutRef1.current = setTimeout(() => setShowPhaseOverlay(null), 1200);
            // オーバーレイと同タイミングで敵フェーズ開始（600ms後）
            nextTimeoutRef2.current = setTimeout(async () => {
                try {
                    await runEnemyPhase();
                } finally {
                    setIsTransitioning(false);
                }
            }, 600);
        } else if (battlePhase === 'enemy_done' && isTypingDone) {
            // 敵フェーズ完了 → 次ターン開始（手札配布 + battlePhase:'player'へ）
            // advanceTurn()が dealHand() + battlePhase:'player' をセット
            useGameStore.getState().advanceTurn();
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

    if (!hasHydrated) return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950/80 text-white p-8">
            {bgImageUrl && (
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-60 z-0 pointer-events-none" 
                    style={{ backgroundImage: `url('${bgImageUrl}')` }} 
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-300 font-serif tracking-widest">Loading Data...</p>
            </div>
        </div>
    );
    if (!battleState.enemy && !battleState.isVictory && !battleState.isDefeat) return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950/80 text-white p-8">
            {bgImageUrl && (
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-60 z-0 pointer-events-none" 
                    style={{ backgroundImage: `url('${bgImageUrl}')` }} 
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-300 font-serif tracking-widest">Loading Battle...</p>
            </div>
        </div>
    );

    const target = battleState.enemy;
    const enemies = battleState.enemies || (battleState.enemy ? [battleState.enemy] : []);
    const isResultActive = (battleState.isVictory || battleState.isDefeat || isEscaped);
    const shouldShowOverlay = isResultActive && showResultOverlay && !isReviewingLogs;
    const isBossEncounter = enemies.some(e => e.spawn_type === 'bounty' || e.hp >= 150 || ['enemy_slime_king', 'enemy_hobgoblin', 'enemy_chimera', 'enemy_lich', 'enemy_bandit_boss', 'enemy_assassin_boss'].includes(e.slug || ''));

    // Party + Guest NPCs
    const partyMembers = battleState.party || [];



    // Victory/Defeat action handler
    const handleResultAction = async (resultType: 'win' | 'lose' | 'escape') => {
        if (isResultTransitioning) return;
        setIsResultTransitioning(true);

        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const returnUrl = urlParams.get('return_url');
        const bType = urlParams.get('type');
        const target = urlParams.get('target');
        const origin = urlParams.get('origin');
        const days = urlParams.get('days');

        const isEncounterType = bType === 'bandit_ambush' || bType === 'bounty_hunter_ambush' || bType === 'random_encounter';

        // 厳密なパラメータチェックと Zustand ストアからのフォールバック適用
        const fallbackLocation = userProfile?.current_location_id || '1001';
        const finalTarget = (target && target !== 'undefined' && target !== 'null') ? target : fallbackLocation;
        const finalOrigin = (origin && origin !== 'undefined' && origin !== 'null') ? origin : fallbackLocation;

        // 移動中エンカウント時の結果反映処理 (v27.4 追加)
        if (isEncounterType) {
            try {
                const token = await getAuthToken();
                const res = await fetch('/api/move/encounter-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({
                        encounter_type: bType === 'bounty_hunter_ambush' ? 'bounty_hunter_ambush' : 'random_encounter',
                        result: resultType === 'win' ? 'win' : 'lose',
                        target_location_id: finalTarget,
                        origin_location_id: finalOrigin,
                        travel_days: Number(days || 1)
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    alert(data.message || (resultType === 'win' ? "勝利しました！" : "敗北しました..."));
                } else {
                    console.error("Failed to post encounter result to API");
                }
            } catch (err) {
                console.error("Encounter result API error:", err);
            }
        }

        // v20: Bounty敗北ペナルティはgameStore.processEnemyTurn内で処理済み

        try {
            if (returnUrl) {
                const separator = returnUrl.includes('?') ? '&' : '?';
                router.push(`${returnUrl}${separator}battle_result=${resultType}${bType ? `&type=${bType}` : ''}`);
            } else if (onBattleEnd) {
                // クエスト中バトル: 親コンポーネント(QuestPage)のハンドラーを呼ぶ
                await onBattleEnd(resultType);
            } else if (selectedScenario) {
                // battle-testなどスタンドアロンバトル
                router.push(`/inn?battle_result=${resultType}`);
            } else {
                router.push(`/inn?battle_result=${resultType}${bType ? `&type=${bType}` : ''}`);
            }
        } catch (err) {
            console.error("Error executing result action:", err);
            setIsResultTransitioning(false);
        }
    };

    return (
        <div className={`h-full w-full font-sans relative flex flex-col overflow-hidden text-slate-200 transition-colors duration-1000 ${
            isBossEncounter ? 'bg-red-950/20 shadow-[inset_0_0_100px_rgba(153,27,27,0.5)]' : 'bg-slate-900'
        } ${shouldShake ? 'shake-active' : ''}`}>

            {/* 強スキル発動時のフラッシュオーバーレイ */}
            {isStrongActive && (
                <div className="absolute inset-0 z-50 pointer-events-none bg-white animate-strong-flash" />
            )}

            {/* エネミースキル警告カットイン ＆ 被攻撃スワイプ爪痕エフェクト */}
            {enemyActiveSkill && (
                <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute w-[150%] h-[8px] bg-red-600/90 shadow-[0_0_20px_rgba(220,38,38,1)] rotate-12 translate-y-[-20px] animate-enemy-swipe1" />
                    <div className="absolute w-[150%] h-[8px] bg-red-600/90 shadow-[0_0_20px_rgba(220,38,38,1)] -rotate-12 translate-y-[20px] animate-enemy-swipe2" />
                    <div className="absolute inset-0 bg-red-950/20 animate-pulse" />
                    
                    <div className="absolute inset-x-0 top-1/4 flex flex-col items-center justify-center z-50">
                        <div className={`w-full py-3 border-y flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm ${
                            isStrongEnemyActive
                                ? 'bg-red-950/90 text-red-500 border-red-500/50 shadow-[0_0_40px_rgba(220,38,38,0.8)]'
                                : 'bg-amber-950/90 text-amber-500 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                        }`}>
                            <span className="text-[10px] uppercase tracking-[0.3em] opacity-80 font-bold mb-1">ENEMY SKILL WARNING</span>
                            <span className="font-serif text-2xl md:text-3xl font-extrabold tracking-widest animate-pulse">
                                『{enemyActiveSkill}』
                            </span>
                        </div>
                    </div>
                </div>
            )}

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
                @keyframes shake {
                    0%, 100% { transform: translate(0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-3px, -2px); }
                    20%, 40%, 60%, 80% { transform: translate(3px, 2px); }
                }
                .shake-active {
                    animation: shake 0.3s ease-in-out;
                }
                @keyframes flashRed {
                    0% { filter: brightness(2) contrast(1.2) drop-shadow(0 0 25px rgba(239,68,68,0.8)); }
                    100% { filter: brightness(1) contrast(1) drop-shadow(0 0 20px rgba(220,38,38,0.6)); }
                }
                .flash-active {
                    animation: flashRed 0.35s ease-out;
                }
                @keyframes floatDamage {
                    0% { transform: translateY(0) scale(0.6); opacity: 0; }
                    15% { transform: translateY(-25px) scale(1.2); opacity: 1; }
                    40% { transform: translateY(-35px) scale(1.0); }
                    100% { transform: translateY(-45px) scale(1.0); opacity: 0; }
                }
                .damage-pop-player {
                    animation: floatDamage 1.0s forwards;
                    color: #ef4444; /* red-500 */
                    text-shadow: 0 0 8px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.9);
                }
                .damage-pop-enemy {
                    animation: floatDamage 1.0s forwards;
                    color: #f59e0b; /* amber-500 */
                    text-shadow: 0 0 8px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.9);
                }
                @keyframes pulseRedBorder {
                    0%, 100% { border-color: rgb(239, 68, 68); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
                    50% { border-color: rgb(153, 27, 27); box-shadow: 0 0 2px rgba(153, 27, 27, 0.1); }
                }
                .ap-pulse-error {
                    animation: pulseRedBorder 0.4s ease-in-out 2;
                }

                @keyframes enemyShake {
                    0%, 100% { transform: translate(0, 0); }
                    15% { transform: translate(-8px, 0); }
                    30% { transform: translate(6px, 0); }
                    45% { transform: translate(-6px, 0); }
                    60% { transform: translate(4px, 0); }
                    75% { transform: translate(-3px, 0); }
                    90% { transform: translate(2px, 0); }
                }
                .animate-enemy-shake {
                    animation: enemyShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes strongFlash {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    30% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
                .animate-strong-flash {
                    animation: strongFlash 0.8s ease-out forwards;
                }

                /* Slash 1 & 2 */
                @keyframes slash1 {
                    0% { transform: rotate(45deg) scaleX(0); opacity: 0; }
                    30% { transform: rotate(45deg) scaleX(1.2); opacity: 1; }
                    100% { transform: rotate(45deg) scaleX(1); opacity: 0; }
                }
                @keyframes slash2 {
                    0% { transform: rotate(-45deg) scaleX(0); opacity: 0; }
                    30% { transform: rotate(-45deg) scaleX(1.2); opacity: 1; }
                    100% { transform: rotate(-45deg) scaleX(1); opacity: 0; }
                }
                .animate-slash1 { animation: slash1 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
                .animate-slash2 { animation: slash2 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }

                /* Wind */
                @keyframes wind1 {
                    0% { transform: translateX(100px) rotate(12deg); opacity: 0; }
                    50% { transform: translateX(-20px) rotate(12deg); opacity: 1; }
                    100% { transform: translateX(-100px) rotate(12deg); opacity: 0; }
                }
                @keyframes wind2 {
                    0% { transform: translateX(-100px) rotate(-12deg); opacity: 0; }
                    50% { transform: translateX(20px) rotate(-12deg); opacity: 1; }
                    100% { transform: translateX(100px) rotate(-12deg); opacity: 0; }
                }
                .animate-wind1 { animation: wind1 0.4s ease-in-out forwards; }
                .animate-wind2 { animation: wind2 0.4s ease-in-out forwards; }

                /* Pierce */
                @keyframes pierce {
                    0% { transform: translateY(80px) scaleY(0.2); opacity: 0; }
                    40% { transform: translateY(-10px) scaleY(1.2); opacity: 1; }
                    100% { transform: translateY(-40px) scaleY(0.8); opacity: 0; }
                }
                .animate-pierce { animation: pierce 0.35s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }

                /* Blunt */
                @keyframes blunt {
                    0% { transform: scale(0.2); opacity: 0; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0; }
                }
                @keyframes shockwave {
                    0% { transform: scale(0.5); opacity: 0.8; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                .animate-blunt { animation: blunt 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-shockwave { animation: shockwave 0.5s ease-out forwards; }

                /* Fire */
                @keyframes fireExplosion {
                    0% { transform: scale(0.3); opacity: 0; filter: blur(5px); }
                    30% { transform: scale(1.1); opacity: 0.9; filter: blur(2px); }
                    100% { transform: scale(1.4); opacity: 0; filter: blur(10px); }
                }
                @keyframes fireCore {
                    0% { transform: scale(0.2); opacity: 0; }
                    40% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                .animate-fire-explosion { animation: fireExplosion 0.6s ease-out forwards; }
                .animate-fire-core { animation: fireCore 0.5s ease-out forwards; }

                /* Sparkles */
                @keyframes sparkle1 {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(-40px, -60px) scale(0.2); opacity: 0; }
                }
                @keyframes sparkle2 {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(50px, -50px) scale(0.2); opacity: 0; }
                }
                @keyframes sparkle3 {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(-20px, -80px) scale(0.2); opacity: 0; }
                }
                .animate-sparkle-1 { animation: sparkle1 0.6s ease-out forwards; }
                .animate-sparkle-2 { animation: sparkle2 0.6s ease-out forwards; }
                .animate-sparkle-3 { animation: sparkle3 0.6s ease-out forwards; }

                /* Lightning */
                @keyframes lightningFlash {
                    0%, 100% { opacity: 0; }
                    20%, 40% { opacity: 1; }
                    30%, 50% { opacity: 0.5; }
                }
                @keyframes lightningBolt {
                    0% { transform: scaleY(0); transform-origin: top; opacity: 0; }
                    10% { transform: scaleY(1.1); opacity: 1; }
                    30% { transform: scaleY(1) skewX(-10deg); opacity: 1; }
                    35% { transform: scaleY(1) skewX(10deg); opacity: 0.8; }
                    100% { transform: scaleY(1); opacity: 0; }
                }
                .animate-lightning-flash { animation: lightningFlash 0.5s ease-out forwards; }
                .animate-lightning-bolt { animation: lightningBolt 0.5s ease-in-out forwards; }

                /* Ice */
                @keyframes iceCrystal {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(90deg); opacity: 0.7; }
                    100% { transform: scale(1) rotate(180deg); opacity: 0; }
                }
                @keyframes iceFreeze {
                    0% { transform: scale(0.3); opacity: 0; }
                    40% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                .animate-ice-crystal { animation: iceCrystal 0.6s ease-out forwards; }
                .animate-ice-freeze { animation: iceFreeze 0.5s ease-out forwards; }

                @keyframes shard1 {
                    0% { transform: translate(0, 0) rotate(0); opacity: 1; }
                    100% { transform: translate(-50px, 40px) rotate(360deg); opacity: 0; }
                }
                @keyframes shard2 {
                    0% { transform: translate(0, 0) rotate(0); opacity: 1; }
                    100% { transform: translate(60px, 30px) rotate(-360deg); opacity: 0; }
                }
                .animate-ice-shard-1 { animation: shard1 0.6s ease-out forwards; }
                .animate-ice-shard-2 { animation: shard2 0.6s ease-out forwards; }

                /* Dark */
                @keyframes darkHole {
                    0% { transform: scale(0.1) rotate(0deg); opacity: 0; }
                    20% { transform: scale(1.2) rotate(180deg); opacity: 1; }
                    80% { transform: scale(1) rotate(720deg); opacity: 0.9; }
                    100% { transform: scale(0) rotate(1080deg); opacity: 0; }
                }
                .animate-dark-hole { animation: darkHole 0.8s ease-in-out forwards; }

                /* Holy */
                @keyframes holyPillar {
                    0% { transform: scaleX(0.1); opacity: 0; }
                    30% { transform: scaleX(1.3); opacity: 1; }
                    50% { transform: scaleX(1); opacity: 0.9; }
                    100% { transform: scaleX(0.8); opacity: 0; }
                }
                @keyframes holyRing {
                    0% { transform: scale(0.1) translateY(40px); opacity: 0; }
                    40% { transform: scale(1) translateY(0); opacity: 0.8; }
                    100% { transform: scale(1.4) translateY(-30px); opacity: 0; }
                }
                .animate-holy-pillar { animation: holyPillar 0.7s ease-in-out forwards; }
                .animate-holy-ring { animation: holyRing 0.7s ease-out forwards; }

                /* Enemy Swipe */
                @keyframes swipe1 {
                    0% { transform: translate(-100px, -100px) rotate(12deg) scaleX(0); opacity: 0; }
                    30% { transform: translate(0, 0) rotate(12deg) scaleX(1.2); opacity: 1; }
                    100% { transform: translate(100px, 100px) rotate(12deg) scaleX(1); opacity: 0; }
                }
                @keyframes swipe2 {
                    0% { transform: translate(100px, -100px) rotate(-12deg) scaleX(0); opacity: 0; }
                    30% { transform: translate(0, 0) rotate(-12deg) scaleX(1.2); opacity: 1; }
                    100% { transform: translate(-100px, 100px) rotate(-12deg) scaleX(1); opacity: 0; }
                }
                .animate-enemy-swipe1 { animation: swipe1 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
                .animate-enemy-swipe2 { animation: swipe2 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }

                .animate-delay-100 { animation-delay: 100ms; }
                .animate-delay-150 { animation-delay: 150ms; }
                .animate-delay-200 { animation-delay: 200ms; }
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
                    style={{ backgroundImage: bgImageUrl ? `url('${bgImageUrl}')` : 'none' }} 
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
                                ${activeEffect && activeEffect !== 'BUFF' ? 'flash-active' : ''}
                                ${shouldEnemyShake ? 'animate-enemy-shake' : ''}
                            `}>
                                {target.image_url ? (
                                    <img src={target.image_url} alt={target.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500"><Skull size={64} /></div>
                                )}

                                {/* Floating Damage Numbers for Enemy */}
                                {floatingDamages.filter(d => !d.isPlayer).map(d => (
                                    <div key={d.id} className="absolute z-50 pointer-events-none font-serif text-3xl font-black tracking-wider damage-pop-enemy">
                                        -{d.amount}
                                    </div>
                                ))}

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
                                    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
                                        {activeEffect === 'SLASH' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-[120%] h-[4px] bg-red-400 rotate-45 shadow-[0_0_25px_rgba(248,113,113,1)] animate-slash1" />
                                                <div className="absolute w-[120%] h-[4px] bg-red-300 -rotate-45 shadow-[0_0_25px_rgba(248,113,113,1)] animate-slash2 animate-delay-150" />
                                                <div className="absolute w-12 h-12 rounded-full border border-red-500/50 bg-red-500/20 animate-ping" />
                                            </div>
                                        )}
                                        {activeEffect === 'WIND' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-32 h-[3px] bg-sky-200 shadow-[0_0_20px_rgba(186,230,253,1)] rotate-12 animate-wind1" />
                                                <div className="absolute w-24 h-[2px] bg-sky-300 shadow-[0_0_20px_rgba(186,230,253,1)] -rotate-12 animate-wind2 animate-delay-100" />
                                                <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-sky-300/40 animate-spin" />
                                            </div>
                                        )}
                                        {activeEffect === 'PIERCE' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-3 h-32 bg-slate-100 shadow-[0_0_25px_rgba(255,255,255,1)] animate-pierce" />
                                                <div className="absolute w-1.5 h-24 bg-sky-200 shadow-[0_0_20px_rgba(186,230,253,1)] translate-x-4 -translate-y-4 animate-pierce animate-delay-100" />
                                                <div className="absolute w-1.5 h-24 bg-sky-200 shadow-[0_0_20px_rgba(186,230,253,1)] -translate-x-4 translate-y-4 animate-pierce animate-delay-200" />
                                            </div>
                                        )}
                                        {activeEffect === 'BLUNT' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-16 h-16 rounded-full border-[6px] border-amber-500 bg-amber-200/40 shadow-[0_0_25px_rgba(245,158,11,1)] animate-blunt" />
                                                <div className="absolute w-24 h-24 rounded-full border-2 border-amber-400 animate-ping" />
                                                <div className="absolute w-32 h-32 rounded-full border border-orange-500/30 animate-shockwave" />
                                            </div>
                                        )}
                                        {activeEffect === 'FIRE' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 opacity-80 blur-sm animate-fire-explosion" />
                                                <div className="absolute w-16 h-16 rounded-full bg-white opacity-90 blur-xs animate-fire-core" />
                                                <div className="absolute w-2 h-2 bg-orange-400 rounded-full animate-sparkle-1" />
                                                <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-sparkle-2" />
                                                <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full animate-sparkle-3" />
                                            </div>
                                        )}
                                        {activeEffect === 'LIGHTNING' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute inset-0 bg-blue-400/20 opacity-0 animate-lightning-flash" />
                                                <div className="absolute w-[8px] h-48 bg-white shadow-[0_0_20px_rgba(191,219,254,1)] animate-lightning-bolt" />
                                                <div className="absolute w-[4px] h-40 bg-sky-200 shadow-[0_0_15px_rgba(56,189,248,1)] rotate-15 translate-x-4 animate-lightning-bolt animate-delay-100" />
                                                <div className="absolute w-[4px] h-40 bg-sky-200 shadow-[0_0_15px_rgba(56,189,248,1)] -rotate-15 -translate-x-4 animate-lightning-bolt animate-delay-150" />
                                            </div>
                                        )}
                                        {activeEffect === 'ICE' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-28 h-28 border-2 border-sky-300 rotate-45 opacity-60 animate-ice-crystal" />
                                                <div className="absolute w-28 h-28 border-2 border-sky-300 -rotate-45 opacity-60 animate-ice-crystal animate-delay-150" />
                                                <div className="absolute w-16 h-16 bg-sky-200/30 backdrop-blur-xs rounded-full animate-ice-freeze" />
                                                <div className="absolute w-2 h-2 bg-sky-100 rotate-12 animate-ice-shard-1" />
                                                <div className="absolute w-2 h-2 bg-sky-100 -rotate-12 animate-ice-shard-2" />
                                            </div>
                                        )}
                                        {activeEffect === 'DARK' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-20 h-20 rounded-full bg-black border-4 border-purple-600/80 shadow-[0_0_30px_rgba(147,51,234,0.8)] animate-dark-hole" />
                                                <div className="absolute w-28 h-28 border border-purple-500/40 rounded-full border-dashed animate-spin duration-1000" />
                                                <div className="absolute w-32 h-32 bg-gradient-to-r from-purple-900/30 to-black/30 rounded-full blur-md animate-ping" />
                                            </div>
                                        )}
                                        {activeEffect === 'HOLY' && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="absolute w-12 h-64 bg-gradient-to-b from-yellow-100/10 via-yellow-200/80 to-white/90 shadow-[0_0_35px_rgba(253,224,71,0.8)] animate-holy-pillar" />
                                                <div className="absolute w-24 h-24 rounded-full border-4 border-yellow-300/60 animate-holy-ring" />
                                                <div className="absolute w-32 h-32 rounded-full border border-yellow-200/30 animate-holy-ring animate-delay-200" />
                                            </div>
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
                        {/* Scrolling Members List — pt-3 でバッジが上に飛び出せる余白を確保 */}
                        <div className="flex-1 overflow-x-auto no-scrollbar pb-1 pt-3">
                            <div className="flex items-start justify-center gap-3 w-max min-w-full px-2">
                            {/* Player Icon */}
                            <button
                                onClick={() => setShowUserDetail(true)}
                                className="flex flex-col items-center flex-shrink-0 active:scale-90 transition-transform relative"
                            >
                                {/* Floating Damage Numbers for Player */}
                                {floatingDamages.filter(d => d.isPlayer).map(d => (
                                    <div key={d.id} className="absolute z-50 pointer-events-none font-serif text-2xl font-black tracking-wider damage-pop-player">
                                        -{d.amount}
                                    </div>
                                ))}
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
                                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((liveHp ?? userProfile?.hp ?? 0) / ((userProfile?.max_hp || 1) + (battleState.equipBonus?.hp || 0))) * 100))}%` }} />
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
            </div>

            {/* Party Member Detail Popup */}
            {selectedPartyMember && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPartyMember(null)}>
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

            {/* v2.9.3i: ヒール対象選択オーバーレイ */}
            {healTargetMode && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setHealTargetMode(null)}>
                    <div className="bg-black/70 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4 w-[300px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Heart size={16} className="text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-300">{healTargetMode.card.name} — 対象選択</span>
                            </div>
                            <button onClick={() => setHealTargetMode(null)} className="text-slate-500 hover:text-slate-300">
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3">回復する味方を選んでください</p>
                        <div className="space-y-2">
                            {/* プレイヤー自身 */}
                            <button
                                onClick={() => handleHealTargetSelect('player')}
                                className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/50 hover:bg-emerald-900/30 border border-white/10 hover:border-emerald-500/40 rounded-lg transition-all"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-amber-500 bg-black/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {userProfile?.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={14} className="text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-slate-200 truncate">{userProfile?.name || '旅人'}</div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-green-500 transition-all" style={{ width: `${((userProfile?.hp ?? 0) / ((userProfile?.max_hp || 1) + (battleState.equipBonus?.hp || 0))) * 100}%` }} />
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{userProfile?.hp ?? 0}/{(userProfile?.max_hp ?? 0) + (battleState.equipBonus?.hp || 0)}</span>
                            </button>
                            {/* パーティメンバー */}
                            {(battleState.party || []).filter(m => m.is_active && (m.durability ?? 0) > 0).map((member: any) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleHealTargetSelect(String(member.id))}
                                    className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/50 hover:bg-emerald-900/30 border border-white/10 hover:border-emerald-500/40 rounded-lg transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full border-2 border-sky-500 bg-black/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {(member.icon_url || member.image_url) ? (
                                            <img src={member.icon_url || member.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-sky-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold text-slate-200 truncate">{member.name}</div>
                                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-green-500 transition-all" style={{ width: `${((member.durability ?? 0) / ((member as any).max_hp || member.max_durability || member.durability || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{member.durability ?? 0}/{(member as any).max_hp || member.max_durability || '?'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Anim for Buffs */}
            {activeEffect === 'BUFF' && (
                <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-sky-200/20 animate-in fade-in duration-300" />
                    <div className="w-full h-full border-[10px] border-sky-400/30 rounded-lg animate-in zoom-in fade-in duration-500 scale-110 blur-sm" />
                    <div className="absolute bottom-1/4 w-32 h-64 bg-gradient-to-t from-sky-300/40 to-transparent blur-xl animate-in slide-in-from-bottom-32 fade-in duration-500" />
                </div>
            )}

            {/* User Status Detail Popup */}
            {showUserDetail && userProfile && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUserDetail(false)}>
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
            <BattleLogBox
                displayedLogs={displayedLogs}
                activeMessage={activeMessage}
                onMessageComplete={completeActiveMessage}
                partyNames={(battleState.party || []).map((m: any) => m.name)}
            />

            {/* Spacer to push cards and buttons to the bottom on long screens */}
            <div className="flex-grow" />

            {/* BOTTOM: CARDS + ACTION BUTTONS — フロー配置 */}
            <div className="w-full relative z-30 px-3 pb-2 flex-shrink-0">
                {/* AP Display (Moved from player status panel) */}
                <div className={`absolute top-0 left-3 z-40 flex flex-col justify-center items-center w-12 h-14 bg-black/60 rounded-lg border flex-shrink-0 shadow-lg backdrop-blur-md transition-colors ${
                    apErrorActive ? 'border-red-600 bg-red-950/40 ap-pulse-error' : 'border-white/20'
                }`}>
                    <span className={`text-[9px] font-bold mb-0.5 drop-shadow-md ${apErrorActive ? 'text-red-400' : 'text-slate-300'}`}>AP</span>
                    <span className={`text-xl font-bold font-mono leading-none drop-shadow-md ${apErrorActive ? 'text-red-500' : 'text-amber-400'}`}>{battleState.current_ap || 0}</span>
                    {apErrorActive && (
                        <span className="absolute -bottom-4 text-[7px] text-red-500 font-bold bg-black/80 px-1 py-0.5 rounded border border-red-600 shadow-lg leading-none">AP不足</span>
                    )}
                </div>

                {/* Hand Cards (Horizontal Scrollable Layout) — 2段階アクション対応 */}
                <div className="relative w-full h-48 flex items-end">
                    <div 
                        className="w-full h-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex items-end px-[10%] pb-3 pt-12 gap-0"
                        style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
                    >
                        {hand.map((card, idx) => {
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
                                    disabled={!canInteract}
                                    className={`relative group transition-all duration-300 flex-shrink-0 snap-center
                                        ${isSelected ? 'w-[80px] sm:w-28 scale-110 z-50 -translate-y-6' : 'w-[72px] sm:w-24'}
                                        ${!canInteract ? 'opacity-40 grayscale pointer-events-none' : ''}
                                        ${!isActivePlayable ? 'opacity-65 grayscale-[50%]' : ''}
                                        ${selectedCardIndex !== null && !isSelected ? 'opacity-50 scale-95' : ''}
                                        ${idx > 0 ? '-ml-6 sm:-ml-8' : ''}
                                     `}
                                    style={{
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
            </div>

            {/* Action Buttons — v15.0 NEXT button */}
            <div className="grid grid-cols-3 items-center gap-1 px-3 py-1.5 flex-shrink-0 z-30 drop-shadow-md">
                {/* 左カラム: アイテムボタン */}
                <div className="flex justify-start">
                    {(battleState.battleItems || []).length > 0 && (
                        <button
                            onClick={() => setShowItemPanel(true)}
                            disabled={!canInteract}
                            className="bg-black/40 backdrop-blur-md border border-amber-600/50 text-amber-300 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold hover:bg-amber-900/30 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
                        >
                            🎒
                            <span>アイテム</span>
                        </button>
                    )}
                </div>
                {/* 中央カラム: NEXT ボタン */}
                <div className="flex justify-center">
                    <button
                        onClick={handleNext}
                        disabled={!canPressNext}
                        className={`backdrop-blur-md rounded-lg px-5 py-2 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all text-[12px] font-bold border whitespace-nowrap ${
                            canPressNext
                                ? 'bg-amber-600/90 border-amber-400 text-white hover:bg-amber-500 scale-105 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                                : (battlePhase === 'player'
                                    ? 'bg-sky-900/40 border-sky-400/30 text-sky-200/60'
                                    : 'bg-black/40 border-white/20 text-white/50')
                        } disabled:opacity-40 disabled:pointer-events-none`}
                    >
                        <Clock size={12} />
                        NEXT
                    </button>
                </div>
                {/* 右カラム: 撤退 */}
                <div className="flex justify-end">
                    {battlePhase === 'player' && (
                        <button
                            onClick={handleFlee}
                            disabled={!canInteract}
                            className="bg-black/40 backdrop-blur-md border border-red-500/50 text-red-300 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold hover:bg-red-950/50 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
                        >
                            <LogOut size={12} />
                            撤退
                        </button>
                    )}
                </div>
                {/* デバッグ/テストプレイモード: 即時勝利ボタン (ADMIN_SECRET_KEY必須) */}
                {(() => {
                    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
                    // [Security] ADMIN_SECRET_KEY認証 — debug_bypass/test_play単体では発動しない (v27.2)
                    const adminKey = urlParams.get('admin_secret');
                    const isDebug = !!adminKey && adminKey.length >= 16;
                    if (!isDebug || battleState.isVictory || battleState.isDefeat) return null;
                    return (
                        <button
                            onClick={() => {
                                // 全敵を即死させて勝利判定を発火
                                const store = useGameStore.getState();
                                const allEnemies = store.battleState.enemies || (store.battleState.enemy ? [store.battleState.enemy] : []);
                                for (const e of allEnemies) {
                                    e.hp = 0;
                                }
                                useGameStore.setState((state: any) => ({
                                    battleState: {
                                        ...state.battleState,
                                        enemies: allEnemies,
                                        enemy: { ...allEnemies[0], hp: 0 },
                                        isVictory: true,
                                        battle_result: 'victory',
                                        messages: [...state.battleState.messages, '--- 🏆 デバッグ: 即時勝利 ---'],
                                    }
                                }));
                            }}
                            className="bg-emerald-900/60 backdrop-blur-md border border-emerald-400/60 text-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-lg active:scale-95 transition-all text-[10px] font-bold hover:bg-emerald-800/70"
                        >
                            🏆 勝利
                        </button>
                    );
                })()}
            </div>


            {/* v25: バトルアイテムパネル */}
            {showItemPanel && (
                <div
                    className="absolute inset-0 z-[60] flex items-end justify-center"
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
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-1000">
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
                                            text={`「賞金首として狙われたが、襲撃してきた賞金稼ぎを返り討ちにしてやったぞ。私の首は貴様らには重すぎるようだ。」 #WirthDawn #CWD #賞金首の意地`}
                                            shareUrl={`${window.location.origin}/share?t=bounty_hunter_win`}
                                            variant="large"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <button
                                        disabled={isResultTransitioning}
                                        onClick={() => handleResultAction('win')}
                                        className={`px-6 py-2 bg-gradient-to-r from-yellow-900 to-yellow-700 text-yellow-100 border border-yellow-500 rounded text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all ${
                                            isResultTransitioning
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:scale-105'
                                        }`}
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
                                        disabled={isResultTransitioning}
                                        onClick={() => handleResultAction('escape')}
                                        className={`px-6 py-2 bg-gray-800 text-gray-300 border border-gray-600 rounded text-sm font-bold transition-all ${
                                            isResultTransitioning
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-gray-700'
                                        }`}
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
                                        disabled={isResultTransitioning}
                                        onClick={() => handleResultAction('lose')}
                                        className={`px-6 py-2 bg-red-950/80 text-red-200 border border-red-800 rounded text-sm font-bold transition-all ${
                                            isResultTransitioning
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-red-900'
                                        }`}
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
                <div className="absolute bottom-28 left-0 right-0 z-50 flex justify-center pointer-events-none">
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
