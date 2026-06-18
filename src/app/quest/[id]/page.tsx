'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import ScenarioEngine from '@/components/quest/ScenarioEngine';
import { Scenario, Enemy } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { getAuthToken, getAuthHeaders } from '@/lib/authToken';
import { ArrowLeft, Skull } from 'lucide-react';
import { getAssetUrl } from '@/config/assets';
import QuestResultModal from '@/components/quest/QuestResultModal';
import BattleView from '@/components/battle/BattleView';
import QuestHeader from '@/components/quest/QuestHeader';
import QuestSettingsModal from '@/components/quest/QuestSettingsModal';
import { Swords, ScrollText } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { soundManager } from '@/lib/soundManager';

export default function QuestPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const { userProfile, fetchUserProfile } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isGivingUp, setIsGivingUp] = useState(false);
    const [initialNodeId, setInitialNodeId] = useState<string | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'scenario' | 'battle'>('scenario');
    const [battleBgUrl, setBattleBgUrl] = useState<string>('/images/quests/bg_wasteland.png');
    const [battleBgm, setBattleBgm] = useState<string>('bgm_battle'); // CSVのbattle BGMを保持

    useAuthGuard(); // タイトル画面経由チェック

    const [prefetchedResult, setPrefetchedResult] = useState<{
        result: 'success' | 'failure';
        data: any;
    } | null>(null);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const prefetchStartedRef = useRef(false);

    // シナリオやクエストIDが変わったタイミングでプレフェッチ状態をリセット
    useEffect(() => {
        setPrefetchedResult(null);
        setIsPrefetching(false);
        prefetchStartedRef.current = false;
    }, [id]);

    const resultOverlayState = useState<{ // Renamed variable to avoid conflict
        result: 'success' | 'failure';
        data?: any;
    } | null>(null);
    const resultOverlay = resultOverlayState[0];
    const setResultOverlay = resultOverlayState[1];

    const searchParams = useSearchParams();
    const isTestPlay = searchParams.get('test_play') === 'true' || searchParams.get('debug_bypass') === 'true';

    // UI States for SPA
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPartyOpen, setIsPartyOpen] = useState(true);
    const [vitalityPulse, setVitalityPulse] = useState(true);
    const isStartingBattleRef = useRef(false); // 戦闘開始連打防止ガード

    useEffect(() => {
        const interval = setInterval(() => {
            setVitalityPulse(prev => !prev);
        }, 800);
        return () => clearInterval(interval);
    }, []);



    // Battle Return Logic
    useEffect(() => {
        const pending = localStorage.getItem('pending_quest_resume');
        if (pending) {
            try {
                const { questId, nextNodeId } = JSON.parse(pending);
                // Verify we are in the right quest
                if (questId === id) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const result = urlParams.get('battle_result');

                    if (result === 'win') {
                        setInitialNodeId(nextNodeId);
                        localStorage.removeItem('pending_quest_resume');
                        window.history.replaceState({}, '', `/quest/${id}`); // Clean URL
                    } else if (result === 'lose' || result === 'escape') {
                        localStorage.removeItem('pending_quest_resume');
                        // router.push('/inn'); // Don't auto redirect on lose here, let user see failure or retry logic if any
                        // actually, if we lose, we might want to fail the quest?
                        // For now just resuming.
                    }
                }
            } catch (e) {
                localStorage.removeItem('pending_quest_resume');
            }
        }
    }, [id]);

    const handlePrepareResult = async (result: 'success' | 'failure', history: string[], nodeRewards?: any) => {
        if (prefetchStartedRef.current) return;
        prefetchStartedRef.current = true;
        setIsPrefetching(true);

        const isSuccess = result === 'success';

        if (isTestPlay) {
            // テストプレイ完了: 成功・敗北を問わずクエスト動作確認済みとして記録
            localStorage.setItem(`ugc_tested_${scenario?.id}`, 'true');
            try {
                const authToken = await getAuthToken();
                await fetch('/api/ugc/v2/test-complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                    },
                    body: JSON.stringify({ scenario_id: scenario?.id })
                });
            } catch (e) {
                console.warn('[QuestPage] Failed to record tested_at:', e);
            }
            // テストプレイ: DBを変更せずシナリオ定義から結果を構築
            const rewards = nodeRewards || scenario?.rewards || {};
            const dummyLoot: any[] = [];
            if (isSuccess && rewards.items) {
                const itemsArr = Array.isArray(rewards.items) ? rewards.items : [rewards.items];
                for (const id of itemsArr) {
                    const itemId = parseInt(String(id), 10);
                    if (isNaN(itemId)) continue;
                    const { data: itemDef } = await supabase.from('items').select('name, type').eq('id', itemId).maybeSingle();
                    const lootType = itemDef?.type === 'skill' ? 'skill' : 'item';
                    dummyLoot.push({ itemId: itemId, name: itemDef?.name || `アイテム #${itemId}`, quantity: 1, type: lootType });
                }
            }
            if (isSuccess && rewards.skills) {
                const skillsArr = Array.isArray(rewards.skills) ? rewards.skills : [rewards.skills];
                for (const id of skillsArr) {
                    const skillId = parseInt(String(id), 10);
                    if (isNaN(skillId)) continue;
                    const { data: skillDef } = await supabase.from('skills').select('name').eq('id', skillId).maybeSingle();
                    dummyLoot.push({ itemId: skillId, name: skillDef?.name || `スキル #${skillId}`, quantity: 1, type: 'skill' });
                }
            }

            setPrefetchedResult({
                result,
                data: {
                    quest_title: scenario?.title,
                    rewards: rewards,
                    days_passed: 0, // テストプレイ: 日数経過なし
                    earned_exp: 0, // テストプレイ: 経験値なし
                    share_text: null, // テストプレイではXシェアを非表示
                    changes: {
                        gold_gained: 0,
                        old_age: userProfile?.age,
                        new_age: userProfile?.age,
                        aged_up: false,
                        vit_penalty: 0,
                        atk_decay: 0,
                        def_decay: 0,
                        alignment_shift: null, // テストプレイ: 属性変化なし
                    },
                    rep_change: null, // テストプレイ: 名声変化なし
                    party_changes: null,
                    loot_saved: dummyLoot,
                    guest_conversion: null,
                    new_location_name: null,
                }
            });
            useQuestState.getState().resetQuest();
            useGameStore.setState({ lastInitPageFetchTime: 0 });
            setIsPrefetching(false);
            return;
        }

        // デバッグモード（チートツール）: DB変更せず結果を表示
        const isDebugMode = searchParams.get('debug_bypass') === 'true';
        if (isDebugMode) {
            const rewards = nodeRewards || scenario?.rewards || {};
            const dummyLoot: any[] = [];
            if (isSuccess && rewards.items) {
                const itemsArr = Array.isArray(rewards.items) ? rewards.items : [rewards.items];
                for (const id of itemsArr) {
                    const itemId = parseInt(String(id), 10);
                    if (isNaN(itemId)) continue;
                    const { data: itemDef } = await supabase.from('items').select('name, type').eq('id', itemId).maybeSingle();
                    const lootType = itemDef?.type === 'skill' ? 'skill' : 'item';
                    dummyLoot.push({ itemId: itemId, name: itemDef?.name || `アイテム #${itemId}`, quantity: 1, type: lootType });
                }
            }
            if (isSuccess && rewards.skills) {
                const skillsArr = Array.isArray(rewards.skills) ? rewards.skills : [rewards.skills];
                for (const id of skillsArr) {
                    const skillId = parseInt(String(id), 10);
                    if (isNaN(skillId)) continue;
                    const { data: skillDef } = await supabase.from('skills').select('name').eq('id', skillId).maybeSingle();
                    dummyLoot.push({ itemId: skillId, name: skillDef?.name || `スキル #${skillId}`, quantity: 1, type: 'skill' });
                }
            }

            setPrefetchedResult({
                result,
                data: {
                    quest_title: scenario?.title,
                    rewards: rewards,
                    days_passed: scenario?.time_cost || 0,
                    earned_exp: isSuccess ? (rewards?.exp || 0) : 0,
                    share_text: null, // Xシェア非表示
                    changes: {
                        gold_gained: isSuccess ? (rewards?.gold || 0) : 0,
                        old_age: userProfile?.age,
                        new_age: userProfile?.age,
                        aged_up: false,
                        vit_penalty: 0,
                        atk_decay: 0,
                        def_decay: 0,
                        alignment_shift: isSuccess ? (rewards?.alignment_shift || null) : null,
                    },
                    rep_change: isSuccess && rewards?.reputation
                        ? { amount: rewards.reputation, location: '現在地' }
                        : (!isSuccess ? { amount: -(Math.floor(Math.random() * 8) + 3), location: '現在地' } : null),
                    party_changes: null,
                    loot_saved: dummyLoot,
                    guest_conversion: null,
                    new_location_name: null,
                }
            });
            useQuestState.getState().resetQuest();
            useGameStore.setState({ lastInitPageFetchTime: 0 });
            setIsPrefetching(false);
            return;
        }

        try {
            const authToken = await getAuthToken();

            // バトルでHP0になったパーティメンバーIDを収集
            const bs = useGameStore.getState().battleState;
            const defeatedMemberIds = (bs?.party || [])
                .filter((m: any) => (m.durability ?? m.hp ?? 1) <= 0)
                .map((m: any) => String(m.id));

            // クエスト終了時にゲストが残っている場合、通常雇用変換のためにAPIへ送信
            const remainingGuest = useQuestState.getState().guest;

            const res = await fetch('/api/quest/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({
                    quest_id: scenario?.id,
                    result: isSuccess ? 'success' : 'failure',
                    history: history || [],
                    loot_pool: [],
                    consumed_items: [],
                    defeated_member_ids: defeatedMemberIds,
                    node_rewards: nodeRewards || null,
                    remaining_guest: remainingGuest ? {
                        slug: (remainingGuest as any).slug,
                        name: remainingGuest.name,
                        npc_id: remainingGuest.id,
                    } : null,
                    battle_completion_token: bs?.battle_completion_token || null,
                    battle_session_id: bs?.battle_session_id || null
                })
            });

            if (!res.ok) {
                const err = await res.json();
                console.error('Complete Error:', err);
                alert(`結果の保存に失敗しました: ${err.error || res.statusText}`);
                prefetchStartedRef.current = false; // 再試行できるようにする
            } else {
                const data = await res.json();
                useQuestState.getState().resetQuest();
                useGameStore.setState({ lastInitPageFetchTime: 0 });
                await fetchUserProfile();

                setPrefetchedResult({
                    result,
                    data: data
                });
            }
        } catch (e: any) {
            console.error(e);
            alert(`通信エラーが発生しました: ${e.message}\n結果の保存に失敗した可能性があります。`);
            useQuestState.getState().resetQuest();
            useGameStore.setState({ lastInitPageFetchTime: 0 });
            setPrefetchedResult({
                result,
                data: {
                    quest_title: scenario?.title,
                    rewards: isSuccess ? (scenario?.rewards || {}) : {},
                    days_passed: scenario?.time_cost || 0,
                    earned_exp: 0,
                    changes: { gold_gained: 0, old_age: userProfile?.age, new_age: userProfile?.age, aged_up: false, vit_penalty: 0, atk_decay: 0, def_decay: 0 },
                    rep_change: null, party_changes: null, loot_saved: [], guest_conversion: null, new_location_name: null,
                }
            });
        } finally {
            setIsPrefetching(false);
        }
    };

    const handleComplete = (result: 'success' | 'failure' | 'abort') => {
        if (result === 'abort') {
            router.push('/inn');
            return;
        }

        if (prefetchedResult) {
            setResultOverlay({
                result: prefetchedResult.result,
                data: prefetchedResult.data
            });
        } else {
            alert("結果の処理がまだ完了していません。しばらくお待ちください。");
        }
    };

    useEffect(() => {
        if (!id) {
            console.error("QuestPage: No ID provided");
            setLoading(false);
            return;
        }
        async function loadScenario() {
            try {
                // 最新のユーザー情報を読み込む
                let currentProfile = userProfile;
                if (!currentProfile) {
                    await fetchUserProfile();
                    currentProfile = useGameStore.getState().userProfile;
                }

                // すでに別のクエストを受注している場合のフロントエンド先行ブロック (isTestPlayでない場合)
                if (!isTestPlay && currentProfile?.current_quest_id && currentProfile.current_quest_id !== id) {
                    alert(`既に別の依頼（${currentProfile.current_quest_id}）を受注しています。ギルドから再開するか放棄してください。`);
                    router.push('/inn');
                    return;
                }

                const token = await getAuthToken();
                const headers: HeadersInit = { 'Cache-Control': 'no-store' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const debugBypass = searchParams.get('debug_bypass') === 'true' ? '&debug_bypass=true' : '';

                const res = await fetch(`/api/scenarios?id=${id}${debugBypass}`, {
                    cache: 'no-store',
                    headers
                });

                let loadedScenario: Scenario | null = null;

                if (res.ok) {
                    const data = await res.json();
                    if (data.scenarios && data.scenarios.length > 0) {
                        loadedScenario = data.scenarios[0];
                        setErrorMsg(null);
                    } else {
                        // UGC v2: 公式シナリオに見つからない場合、ugc_scenarios を検索
                        console.log('[QuestPage] Scenario not found in official DB, trying UGC v2...');
                        const { data: ugcData, error: ugcErr } = await supabase
                            .from('ugc_scenarios')
                            .select('*')
                            .eq('id', id)
                            .single();

                        if (ugcData && !ugcErr) {
                            loadedScenario = {
                                ...ugcData,
                                description: ugcData.short_description || '',
                                is_ugc: true,
                                is_ugc_v2: true,
                                flow_nodes: typeof ugcData.flow_nodes === 'string'
                                    ? JSON.parse(ugcData.flow_nodes)
                                    : ugcData.flow_nodes || [],
                            } as any;
                            setErrorMsg(null);
                        } else {
                            setErrorMsg("Quest Not Found");
                        }
                    }
                } else {
                    const errData = await res.json().catch(() => ({}));
                    setErrorMsg(errData.error || `HTTP Error ${res.status}`);
                }

                if (loadedScenario) {
                    setScenario(loadedScenario);

                    // startQuest 用のパラメータをビルド
                    const questType = (loadedScenario.quest_type === 'special' ? 'special' : 'normal') as 'normal' | 'special';
                    const playerHp = currentProfile?.hp || currentProfile?.max_hp || 100;
                    const playerMaxHp = currentProfile?.max_hp || 100;
                    const currentLocationId = currentProfile?.current_location_id || undefined;
                    
                    const store = useGameStore.getState();
                    const partyHp: Record<string, number> = {};
                    if (Array.isArray(store.partyMembers)) {
                        store.partyMembers.forEach((pm: any) => {
                            partyHp[String(pm.id)] = pm.hp || pm.max_hp || 100;
                        });
                    }

                    const startParams = {
                        questId: id,
                        questType,
                        playerHp,
                        playerMaxHp,
                        partyHp,
                        currentLocationId
                    };

                    // クエスト開始APIの呼び出しとZustandストアの同期
                    if (isTestPlay) {
                        // デバッグ/テストプレイ時はローカル状態の初期化のみ（すでに開始済みならスキップ）
                        const qs = useQuestState.getState();
                        if (qs.questId !== id || !qs.isInQuest) {
                            useQuestState.getState().startQuest(startParams);
                        }
                    } else {
                        // 実プレイ時: すでに自分がこのクエストに入っていない場合は /api/quest/start を呼び出す
                        if (currentProfile?.current_quest_id !== id) {
                            const authHeaders = await getAuthHeaders();
                            const startRes = await fetch('/api/quest/start', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...authHeaders
                                },
                                body: JSON.stringify({ quest_id: id })
                            });

                            if (startRes.ok) {
                                useQuestState.getState().startQuest(startParams);
                                await fetchUserProfile();
                            } else if (startRes.status === 409) {
                                const startData = await startRes.json().catch(() => ({}));
                                alert(`既に別の依頼（${startData.current_quest_id || '他クエスト'}）を受注しています。ギルドから再開するか放棄してください。`);
                                router.push('/inn');
                                return;
                            } else {
                                console.error("Failed to start quest on server:", startRes.status);
                            }
                        } else {
                            // すでに開始済みの場合: ローカル状態のみ初期化 (再開)（すでに開始済みならスキップ）
                            const qs = useQuestState.getState();
                            if (qs.questId !== id || !qs.isInQuest) {
                                useQuestState.getState().startQuest(startParams);
                            }
                        }
                    }
                } else {
                    console.error("Scenario not found for id:", id);
                }
            } catch (e) {
                console.error("Failed to load scenario", e);
            } finally {
                setLoading(false);
            }
        }
        loadScenario();
    }, [id]);

    const handleGiveUp = async (skipConfirm = false) => {
        if (isGivingUp) return;
        if (!skipConfirm) {
            if (!confirm("クエストを放棄して撤退しますか？\n※ 進行状況は失われ、安全な場所まで戻ります。")) return;
        }

        setIsGivingUp(true);
        useQuestState.getState().resetQuest();
        setIsSettingsOpen(false);

        // テストプレイ/デバッグモード: APIを呼ばずモック結果を表示
        if (isTestPlay) {
            setResultOverlay({
                result: 'failure',
                data: {
                    quest_title: scenario?.title,
                    rewards: {},
                    days_passed: 0,
                    earned_exp: 0,
                    changes: { gold_gained: 0, old_age: 0, new_age: 0, aged_up: false, vit_penalty: 0, atk_decay: 0, def_decay: 0 },
                    rep_change: null, party_changes: null, loot_saved: [], guest_conversion: null, new_location_name: null,
                }
            });
            setIsGivingUp(false);
            return;
        }

        try {
            const authHeaders = await getAuthHeaders();

            const res = await fetch('/api/quest/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    quest_id: scenario?.id,
                    result: 'failure',
                    history: [],
                    loot_pool: [],
                    consumed_items: [],
                    defeated_member_ids: [],
                    remaining_guest: null,
                    battle_defeat: false,
                })
            });

            if (res.ok) {
                const data = await res.json();
                await fetchUserProfile();
                setResultOverlay({ result: 'failure', data });
            } else {
                console.error('[QuestPage] Give up complete API error');
                await fetchUserProfile();
                router.push('/inn');
            }
        } catch (e) {
            console.error("Give up failed", e);
            router.push('/inn');
        } finally {
            setIsGivingUp(false);
        }
    };

    const resultOverlayRef = useRef(resultOverlay);
    useEffect(() => {
        resultOverlayRef.current = resultOverlay;
    }, [resultOverlay]);

    const handleGiveUpRef = useRef(handleGiveUp);
    useEffect(() => {
        handleGiveUpRef.current = handleGiveUp;
    }, [handleGiveUp]);

    useEffect(() => {
        window.history.pushState(null, '', window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            if (resultOverlayRef.current) {
                return;
            }

            window.history.pushState(null, '', window.location.href);

            const confirmed = window.confirm("クエストを放棄して撤退しますか？\n※ 進行状況は失われ、安全な場所まで戻ります。");
            if (confirmed) {
                handleGiveUpRef.current(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 font-serif">
                クエストを読み込み中...
            </div>
        );
    }

    if (!scenario) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-4 px-6 text-center">
                <h1 className="text-2xl font-serif text-red-500">{!id ? "Invalid Quest ID" : (errorMsg || "Quest Not Found")}</h1>
                <button
                    onClick={() => router.push('/inn')}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> 拠点に戻る
                </button>
            </div>
        );
    }

    // script_data が null またはノードが空のクエストは「準備中」表示
    // UGCクエストは flow_nodes にノードを保存するため、そちらもチェック
    const hasScriptNodes = scenario.script_data?.nodes && Object.keys(scenario.script_data.nodes).length > 0;
    const hasFlowNodes = Array.isArray(scenario.flow_nodes) && scenario.flow_nodes.length > 0;
    const hasScenarioNodes = hasScriptNodes || hasFlowNodes;
    if (!hasScenarioNodes) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-6 px-6">
                <div className="w-16 h-16 rounded-full bg-amber-900/30 border-2 border-amber-700 flex items-center justify-center">
                    <ScrollText className="w-8 h-8 text-amber-500" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-serif font-bold text-amber-400">{scenario.title}</h1>
                    <p className="text-sm text-slate-500 italic max-w-xs">{scenario.description || scenario.script_data?.short_description || ''}</p>
                </div>
                <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-6 py-4 text-center max-w-sm">
                    <p className="text-sm text-amber-400/80 font-serif">このクエストのシナリオは現在準備中です。</p>
                    <p className="text-xs text-amber-600/60 mt-1">今後のアップデートで追加予定</p>
                </div>
                <button
                    onClick={() => router.push('/inn')}
                    className="flex items-center gap-2 px-6 py-2.5 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-sm font-serif"
                >
                    <ArrowLeft className="w-4 h-4" /> 拠点に戻る
                </button>
            </div>
        );
    }

    const startBattle = async (enemyId: string, successNodeId: string, bgKey?: string, bgm?: string) => {
        // 連打防止: 既にバトル開始処理中なら無視
        if (isStartingBattleRef.current) {
            console.warn('[QuestPage] startBattle already in progress, ignoring duplicate call');
            return;
        }
        isStartingBattleRef.current = true;

        try {
        let enemies: Enemy[] = [{ id: 'slime', name: 'スライム', hp: 50, maxHp: 50, level: 1 }];

        // UGC v2: enemyId が JSON オブジェクト（インラインenemyData）の場合
        let inlineEnemyData: any = null;
        try {
            if (enemyId.startsWith('{')) {
                inlineEnemyData = JSON.parse(enemyId);
            }
        } catch { /* not JSON, continue with normal flow */ }

        if (inlineEnemyData) {
            // UGCインラインエネミー: DB参照なしで直接構築
            const resolveImg = (url?: string) => {
                if (!url) return '/images/enemies/custom_enemy.png';
                if (url.startsWith('http')) return url;
                return '/images/enemies/custom_enemy.png';
            };
            enemies = [{
                id: `ugc_enemy_${Date.now()}`,
                name: inlineEnemyData.name || 'カスタムモンスター',
                hp: inlineEnemyData.hp || 50,
                maxHp: inlineEnemyData.hp || 50,
                atk: inlineEnemyData.atk || 0,
                def: inlineEnemyData.def || 0,
                level: inlineEnemyData.level || 1,
                image_url: resolveImg(inlineEnemyData.image_url),
                status_effects: [],
                action_pattern: inlineEnemyData.action_pattern || [],
                vit_damage: inlineEnemyData.vit_damage,
            }];
        } else if (enemyId && enemyId !== 'slime') {
            try {
                // Determine if enemyId is numeric (ID) or string (Slug)
                const isNumeric = /^\d+$/.test(String(enemyId));
                let groupQuery = supabase.from('enemy_groups').select('*');

                if (isNumeric) {
                    groupQuery = groupQuery.eq('id', enemyId);
                } else {
                    groupQuery = groupQuery.eq('slug', enemyId);
                }

                const { data: groupData } = await groupQuery.maybeSingle();

                let targetSlugs = [enemyId];
                if (groupData) {
                    if (groupData.members && groupData.members.length > 0) {
                        targetSlugs = groupData.members;
                    }
                    // Fallback for single enemy referenced by ID/Slug directly if not a group
                    else if (!isNumeric) {
                        targetSlugs = [enemyId];
                    }
                } else {
                    // enemy_groups テーブルにレコードが存在しない
                    console.error(`[QuestPage] enemy_group not found: id/slug=${enemyId} (isNumeric=${isNumeric}). DB同期が必要な可能性があります。`);
                    if (isNumeric) {
                        // 数値IDの場合、スラッグとして使えないためフォールバック敵を直接使用
                        console.warn(`[QuestPage] Numeric enemy_group_id=${enemyId} not found in DB. Falling back to placeholder enemy.`);
                        targetSlugs = [];
                    }
                }

                const { data: enemiesData } = await supabase
                    .from('enemies')
                    .select('*')
                    .in('slug', targetSlugs);

                if (enemiesData && enemiesData.length > 0) {
                    // Map enemies based on group members order to preserve count (e.g. 2 wolves)
                    // The 'in' query dedups, so we need to reconstruct the list from group members
                    const enemyMap = new Map(enemiesData.map(e => [e.slug, e]));

                    enemies = targetSlugs.map((slug, index) => {
                        const e = enemyMap.get(slug);
                        if (!e) return null;
                        return {
                            id: `${e.slug}_${index}_${Date.now()}`, // Unique ID for battle instance
                            enemy_id: e.id, // DBの数値IDを保持 (v4.4)
                            slug: e.slug, // 元のslugを保持（target_slug照合用）
                            name: e.name,
                            hp: e.hp,
                            maxHp: e.hp, // Use max_hp from DB if valid, else hp
                            atk: e.atk || 0,  // v2.9.3g: CSVのATK値を渡す
                            def: e.def || 0, // Map defense
                            level: e.level || Math.floor(e.hp / 10) || 1, // v2.9.3g: DB level優先
                            // UGC image_url を優先、なければデフォルトパス
                            image_url: e.image_url || `/images/enemies/${e.slug}.png`,
                            status_effects: [],
                            vit_damage: e.vit_damage,
                            drop_item_slug: e.drop_item_slug,
                            action_pattern: e.action_pattern,
                            spawn_type: e.spawn_type
                        };
                    }).filter(Boolean) as Enemy[];
                } else {
                    console.error(`[QuestPage] Enemies data not found for slugs: ${targetSlugs.join(',')}`);
                    // フォールバック敵で戦闘続行を許可（進行不能防止）
                    console.warn('[QuestPage] Using fallback enemy data to prevent soft-lock');
                    enemies = [{
                        id: `fallback_${Date.now()}`,
                        name: '正体不明の敵',
                        hp: 80,
                        maxHp: 80,
                        def: 3,
                        level: Math.max(1, userProfile?.level || 1),
                        status_effects: [],
                    }];
                }
            } catch (e) {
                console.error("Failed to fetch enemy data:", e);
                alert(`敵データの取得に失敗しました: ${(e as Error).message}`);
                return; // Prevent fallback to Slime
            }
        }


        console.log("[QuestPage] Starting Battle with Enemies:", enemies);

        await useGameStore.getState().startBattle(enemies);

        // Save state for resume
        localStorage.setItem('pending_quest_resume', JSON.stringify({
            questId: id,
            nextNodeId: successNodeId
        }));

        setInitialNodeId(successNodeId); // Win時に進むノードをセットしておく
        setBattleBgUrl(getAssetUrl(bgKey || 'bg_wasteland'));
        const targetBgm = bgm || 'bgm_battle';
        setBattleBgm(targetBgm); // CSVのバトルBGMを保存（指定なしの場合はデフォルト）
        setViewMode('battle');
        if (soundManager) soundManager.playBgm(targetBgm);
        } finally {
            // バトル画面から戻った後に次のバトルを開始できるようにリセット
            // 少し遅延させてビュー切り替え後にリセット
            setTimeout(() => { isStartingBattleRef.current = false; }, 500);
        }
    };

    const handleBattleEnd = async (result: 'win' | 'lose' | 'escape') => {
        if (result === 'win') {
            // バトル後のHP/VITをストアから取得（battleSliceが更新済み）
            const storeState = useGameStore.getState();
            const battleHp = storeState.userProfile?.hp;
            const battleVit = storeState.userProfile?.vitality;
            const battleParty = storeState.battleState?.party || [];

            // 1. プレイヤーHP/VITをDBに永続化（Service Role APIで確実に書き込み）
            const authToken = await getAuthToken();
            if (battleHp != null && userProfile?.id) {
                try {
                    const updateBody: any = { hp: Math.max(0, battleHp) };
                    if (battleVit != null) updateBody.vitality = battleVit;
                    await fetch('/api/profile/update-status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                        },
                        body: JSON.stringify(updateBody)
                    });
                } catch (e) {
                    console.warn('[QuestPage] Failed to persist post-battle HP/VIT:', e);
                }
            }

            // 2. パーティメンバーのHPをDBに永続化（連戦時のHP引き継ぎ用）
            const partyUpdates = battleParty
                .filter((pm: any) => pm.id && pm.durability != null)
                .map((pm: any) => ({ id: pm.id, durability: Math.max(0, pm.durability) }));
            if (partyUpdates.length > 0) {
                try {
                    await fetch('/api/party/update-hp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                        },
                        body: JSON.stringify({ members: partyUpdates })
                    });
                } catch (e) {
                    console.warn('[QuestPage] Failed to persist party HP:', e);
                }
            }

            // 3. ストアを最新DB値で同期（ヘッダー/次バトルの正確なHP表示のため）
            await fetchUserProfile();
            // 4. バトル表示フラグをクリア（パーティHP情報は連戦引き継ぎ用に保持）
            useGameStore.setState((state: any) => ({
                battleState: { ...state.battleState, enemy: null, enemies: [] }
            }));

            // 5. 護衛対象HP0チェック: ゲストがバトル中に倒れた場合は敗北扱い
            const questState = useQuestState.getState();
            if (questState.isEscortMission && questState.guest) {
                const guestId = String(questState.guest.id);
                const guestSlug = (questState.guest as any).slug;
                const guestInBattle = battleParty.find((pm: any) => String(pm.id) === guestId || (guestSlug && pm.slug === guestSlug));
                const guestHp = (guestInBattle as any)?.durability ?? (guestInBattle as any)?.hp ?? -1;
                if (guestHp <= 0) {
                    // 護衛対象が死亡 → 敗北として end_failure に遷移
                    questState.removeGuest();
                    handleBattleEnd('lose');
                    return;
                }
            }

            setViewMode('scenario');
        } else {
            // バトル敗北/撤退: end_failure ノードに遷移してシナリオテキストを表示
            // バトルステートをクリア（ゲストNPCのparty残留防止）
            useGameStore.setState((state: any) => ({
                battleState: { ...state.battleState, enemy: null, enemies: [], party: [] }
            }));

            // シナリオ内の end_failure ノードを検索
            let scriptNodes = scenario?.script_data?.nodes || {};
            if (Object.keys(scriptNodes).length === 0 && scenario?.flow_nodes && Array.isArray(scenario.flow_nodes)) {
                const nodesObj: Record<string, any> = {};
                scenario.flow_nodes.forEach((node: any) => { nodesObj[node.id] = node; });
                scriptNodes = nodesObj;
            }
            const failNodeId = Object.entries(scriptNodes)
                .find(([, n]: [string, any]) =>
                    (n.type === 'end' && (n.result === 'failure' || n.params?.result === 'failure')) || n.type === 'end_failure'
                )?.[0];

            if (failNodeId) {
                // end_failure ノードに遷移 → シナリオエンジンが失敗テキストを表示
                // → ユーザーが「結果を確認する」を押した時に onComplete(failure) が発火
                setInitialNodeId(failNodeId);
                setViewMode('scenario');
            } else {
                // フォールバック: end_failure ノードが存在しない場合は従来通り直接ポップアップ
                useQuestState.getState().resetQuest();

                // テストプレイ/デバッグモード: APIを呼ばずモック結果を表示
                if (isTestPlay) {
                    setViewMode('scenario');
                    setResultOverlay({
                        result: 'failure',
                        data: {
                            quest_title: scenario?.title,
                            rewards: {},
                            days_passed: 0,
                            earned_exp: 0,
                            changes: { gold_gained: 0, old_age: 0, new_age: 0, aged_up: false, vit_penalty: 0, atk_decay: 0, def_decay: 0 },
                            rep_change: null, party_changes: null, loot_saved: [], guest_conversion: null, new_location_name: null,
                        }
                    });
                    return;
                }

                try {
                    const authToken = await getAuthToken();

                    const bs = useGameStore.getState().battleState;
                    const defeatedMemberIds = (bs?.party || [])
                        .filter((m: any) => (m.durability ?? m.hp ?? 1) <= 0)
                        .map((m: any) => String(m.id));

                    // 撤退時: バトル中に受けたダメージをDBに永続化（HP保持のため）
                    const escapeState = useGameStore.getState().userProfile;
                    const escapeHp = escapeState?.hp;
                    const escapeVit = escapeState?.vitality;
                    if (escapeHp != null && userProfile?.id) {
                        const updateBody: any = { hp: Math.max(0, escapeHp) };
                        if (escapeVit != null) updateBody.vitality = escapeVit;
                        await fetch('/api/profile/update-status', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                            },
                            body: JSON.stringify(updateBody)
                        });
                    }

                    const res = await fetch('/api/quest/complete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                        },
                        body: JSON.stringify({
                            quest_id: scenario?.id,
                            result: 'failure',
                            history: [],
                            loot_pool: [],
                            consumed_items: [],
                            defeated_member_ids: defeatedMemberIds,
                            remaining_guest: null,
                            battle_defeat: result === 'lose',
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        await fetchUserProfile();
                        setViewMode('scenario');
                        setResultOverlay({ result: 'failure', data });
                    } else {
                        console.error('[QuestPage] Battle failure complete API error');
                        router.push('/inn');
                    }
                } catch (e) {
                    console.error('[QuestPage] Battle failure handling error:', e);
                    router.push('/inn');
                }
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-slate-900 font-sans select-none overflow-hidden text-slate-200">
            <div className="relative w-full h-[100dvh] md:max-w-[430px] md:h-[min(844px,92vh)] md:border-[6px] md:border-slate-800 md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-slate-950">

                {isSettingsOpen && (
                    <QuestSettingsModal
                        onClose={() => setIsSettingsOpen(false)}
                        onGiveUp={handleGiveUp}
                        title={scenario.title}
                        description={scenario.full_description || scenario.description}
                    />
                )}

                {/* バトル中はヘッダーを非表示（画面下部のUI切れ防止） */}
                {viewMode === 'scenario' && (
                    <QuestHeader
                        isSettingsOpen={isSettingsOpen}
                        setIsSettingsOpen={setIsSettingsOpen}
                        isPartyOpen={isPartyOpen}
                        setIsPartyOpen={setIsPartyOpen}
                        vitalityPulse={vitalityPulse}
                    />
                )}

                <main className="flex-1 overflow-hidden relative flex flex-col">
                    {viewMode === 'scenario' ? (
                        <div className="flex-1 flex flex-col relative">

                            <ScenarioEngine
                                scenario={scenario}
                                initialNodeId={initialNodeId}
                                onBattleStart={startBattle}
                                onPrepareResult={handlePrepareResult}
                                isResultReady={!!prefetchedResult}
                                isPreparingResult={isPrefetching}
                                onComplete={handleComplete}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 relative w-full h-full">
                            <BattleView onBattleEnd={handleBattleEnd} bgImageUrl={battleBgUrl} />
                        </div>
                    )}
                </main>
                {/* ギブアップ（放棄）処理中ローディングオーバーレイ */}
                {isGivingUp && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-amber-500/70 font-serif tracking-widest animate-pulse">読み込み中…</p>
                    </div>
                )}

                {/* Quest Result Overlay */}
                {resultOverlay && (
                    <div className="absolute inset-0 z-[110]">
                        <QuestResultModal
                            result={resultOverlay.result}
                            questTitle={resultOverlay.data?.quest_title}
                            rewards={resultOverlay.data?.rewards}
                            changes={resultOverlay.data?.changes}
                            daysPassed={resultOverlay.data?.days_passed || 0}
                            shareText={isTestPlay ? undefined : resultOverlay.data?.share_text}
                            shareDataList={isTestPlay ? undefined : resultOverlay.data?.share_data_list}
                            repChange={resultOverlay.data?.rep_change}
                            partyChanges={resultOverlay.data?.party_changes}
                            newLocationName={resultOverlay.data?.new_location_name}
                            earnedExp={resultOverlay.data?.earned_exp}
                            lootSaved={resultOverlay.data?.loot_saved}
                            guestConversion={resultOverlay.data?.guest_conversion}
                            isTestPlay={isTestPlay}
                            onClose={async () => {
                                if (!isTestPlay) {
                                    // クエストボードのキャッシュクリア
                                    useGameStore.setState({ locationQuests: null, lastInitPageFetchTime: 0 });
                                    if (typeof window !== 'undefined' && userProfile?.current_location_id) {
                                        sessionStorage.removeItem(`location_quests_cache_${userProfile.current_location_id}`);
                                    }
                                    await fetchUserProfile();
                                }
                                router.push(isTestPlay ? '/workshop' : '/inn');
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
