'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import ScenarioEngine from '@/components/quest/ScenarioEngine';
import { Scenario, Enemy } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Skull } from 'lucide-react';
import { getAssetUrl } from '@/config/assets';
import QuestResultModal from '@/components/quest/QuestResultModal';
import BattleView from '@/components/battle/BattleView';
import QuestHeader from '@/components/quest/QuestHeader';
import QuestSettingsModal from '@/components/quest/QuestSettingsModal';
import { Swords, ScrollText } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useBgm } from '@/hooks/useBgm';
import { soundManager } from '@/lib/soundManager';

export default function QuestPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const { userProfile, fetchUserProfile } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [initialNodeId, setInitialNodeId] = useState<string | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'scenario' | 'battle'>('scenario');
    const [battleBgUrl, setBattleBgUrl] = useState<string>('/images/quests/bg_wasteland.png');

    useAuthGuard(); // タイトル画面経由チェック

    // BGM管理: シナリオ中はクエストBGM、バトル中はバトルBGM
    // ScenarioEngineのノードプロセッサーが個別ノードのbgmを処理するが、
    // ページマウント時にタイトルBGMを停止するための初期BGMが必要
    useBgm(viewMode === 'battle' ? 'bgm_battle' : 'bgm_quest_calm');

    const resultOverlayState = useState<{ // Renamed variable to avoid conflict
        result: 'success' | 'failure';
        data?: any;
    } | null>(null);
    const resultOverlay = resultOverlayState[0];
    const setResultOverlay = resultOverlayState[1];

    const searchParams = useSearchParams();
    const isTestPlay = searchParams.get('test_play') === 'true';

    // UI States for SPA
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPartyOpen, setIsPartyOpen] = useState(true);
    const [vitalityPulse, setVitalityPulse] = useState(true);

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

    useEffect(() => {
        if (!id) {
            console.error("QuestPage: No ID provided");
            setLoading(false);
            return;
        }
        async function loadScenario() {
            try {
                // [Logic-Expert] Quest Not Found 修正:
                // scenarios API は認証必須。トークンなしでは 401 → scenarios:[] になるため、
                // Supabase セッションから JWT を取得してリクエストヘッダーに付与する。
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const headers: HeadersInit = { 'Cache-Control': 'no-store' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`/api/scenarios?id=${id}`, {
                    cache: 'no-store',
                    headers
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.scenarios && data.scenarios.length > 0) {
                        setScenario(data.scenarios[0]);
                    } else {
                        console.error("Scenario not found for id:", id, "Response:", data);
                        // Fallback or error UI
                    }
                } else {
                    const errData = await res.json().catch(() => ({}));
                    console.error("Scenario API error:", res.status, errData);
                }
            } catch (e) {
                console.error("Failed to load scenario", e);
            } finally {
                setLoading(false);
            }
        }
        loadScenario();
    }, [id]);

    const handleGiveUp = async () => {
        if (!confirm("クエストを放棄して撤退しますか？\n※ 進行状況は失われ、安全な場所まで戻ります。")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            await fetch('/api/quest/give-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({})
            });
            useQuestState.getState().resetQuest();
            await fetchUserProfile(); // Refresh profile to clear current_quest_id
            router.push('/inn');
        } catch (e) {
            console.error("Give up failed", e);
            alert("撤退に失敗しました。");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 font-serif">
                クエストを読み込み中...
            </div>
        );
    }

    if (!scenario) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-4">
                <h1 className="text-2xl font-serif text-red-500">{!id ? "Invalid Quest ID" : "Quest Not Found"}</h1>
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

    const startBattle = async (enemyId: string, successNodeId: string, bgKey?: string) => {
        let enemies: Enemy[] = [{ id: 'slime', name: 'スライム', hp: 50, maxHp: 50, level: 1 }];

        if (enemyId && enemyId !== 'slime') {
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
        setViewMode('battle');
    };

    const handleBattleEnd = async (result: 'win' | 'lose' | 'escape') => {
        if (result === 'win') {
            // バトル後のHPをDBに永続化（クエスト完了API が正しい値を参照できるように）
            const currentHp = useGameStore.getState().userProfile?.hp;
            if (currentHp != null && userProfile?.id) {
                try {
                    await supabase.from('user_profiles').update({ hp: Math.max(0, currentHp) }).eq('id', userProfile.id);
                    // ストアも同期
                    await fetchUserProfile();
                } catch (e) {
                    console.warn('[QuestPage] Failed to persist post-battle HP:', e);
                }
            }
            setViewMode('scenario');
        } else {
            router.push('/inn');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[100dvh] bg-slate-900 font-sans select-none overflow-hidden text-slate-200">
            <div className="relative w-full h-[100dvh] lg:max-w-[430px] lg:h-[844px] lg:border-[6px] lg:border-slate-800 lg:rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-slate-950">

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
                                onComplete={async (result, history) => {
                                    if (result === 'abort') {
                                        router.push(isTestPlay ? '/editor' : '/inn');
                                        return;
                                    }

                                    if (isTestPlay) {
                                        if (result === 'success') {
                                            localStorage.setItem(`ugc_tested_${scenario.id}`, 'true');
                                            alert("【テストプレイ完了】\nクエストのクリア条件を満たしました。公開申請が可能です。");
                                        } else {
                                            alert("【テストプレイ失敗】\nクエストをクリアできませんでした。構成を見直してください。");
                                        }
                                        router.push('/editor');
                                        return;
                                    }

                                    try {
                                        const { data: { session: sess } } = await supabase.auth.getSession();
                                        const authToken = sess?.access_token;

                                        // バトルでHP0になったパーティメンバーIDを収集
                                        const bs = useGameStore.getState().battleState;
                                        const defeatedMemberIds = (bs?.party || [])
                                            .filter((m: any) => (m.durability ?? m.hp ?? 1) <= 0)
                                            .map((m: any) => String(m.id));

                                        const res = await fetch('/api/quest/complete', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                                            },
                                            body: JSON.stringify({
                                                quest_id: scenario.id,
                                                result: result === 'success' ? 'success' : 'failure',
                                                history: history || [],
                                                loot_pool: [],
                                                consumed_items: [],
                                                defeated_member_ids: defeatedMemberIds
                                            })
                                        });

                                        if (!res.ok) {
                                            const err = await res.json();
                                            console.error('Complete Error:', err);
                                            alert(`結果の保存に失敗しました: ${err.error || res.statusText}`);
                                        } else {
                                            const data = await res.json();
                                            await fetchUserProfile();

                                            setResultOverlay({
                                                result: result === 'success' ? 'success' : 'failure',
                                                data: data
                                            });
                                        }
                                    } catch (e: any) {
                                        console.error(e);
                                        alert(`通信エラーが発生しました: ${e.message}`);
                                        router.push('/inn');
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 relative w-full h-full">
                            <BattleView onBattleEnd={handleBattleEnd} bgImageUrl={battleBgUrl} />
                        </div>
                    )}
                </main>

                {/* Quest Result Overlay */}
                {resultOverlay && (
                    <div className="absolute inset-0 z-[110]">
                        <QuestResultModal
                            result={resultOverlay.result}
                            questTitle={resultOverlay.data?.quest_title}
                            rewards={resultOverlay.data?.rewards}
                            changes={resultOverlay.data?.changes}
                            daysPassed={resultOverlay.data?.days_passed || 0}
                            shareText={resultOverlay.data?.share_text}
                            repChange={resultOverlay.data?.rep_change}
                            partyChanges={resultOverlay.data?.party_changes}
                            newLocationName={resultOverlay.data?.new_location_name}
                            earnedExp={resultOverlay.data?.earned_exp}
                            lootSaved={resultOverlay.data?.loot_saved}
                            onClose={() => router.push('/inn')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
