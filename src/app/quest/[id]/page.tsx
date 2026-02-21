'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import ScenarioEngine from '@/components/quest/ScenarioEngine';
import { Scenario, Enemy } from '@/types/game';
import { supabase } from '@/lib/supabase'; // Added supabase
import { ArrowLeft, Skull } from 'lucide-react';
import { getAssetUrl } from '@/config/assets'; // If needed for backgrounds

export default function QuestPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const { userProfile, fetchUserProfile } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [initialNodeId, setInitialNodeId] = useState<string | undefined>(undefined);

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
        if (!id) return;
        async function loadScenario() {
            try {
                // Fetch specific scenario
                // Using the existing scenarios API which returns an array
                const res = await fetch(`/api/scenarios?id=${id}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.scenarios && data.scenarios.length > 0) {
                        setScenario(data.scenarios[0]);
                    } else {
                        console.error("Scenario not found");
                        // Fallback or error UI
                    }
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
            await fetch('/api/quest/give-up', {
                method: 'POST',
                body: JSON.stringify({ userId: userProfile?.id })
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
            <div className="min-h-screen bg-[#1a120b] flex items-center justify-center text-[#e3d5b8] font-serif">
                Loading Quest...
            </div>
        );
    }

    if (!scenario) {
        return (
            <div className="min-h-screen bg-[#1a120b] flex flex-col items-center justify-center text-[#e3d5b8] gap-4">
                <h1 className="text-2xl font-serif text-red-500">Quest Not Found</h1>
                <button
                    onClick={() => router.push('/inn')}
                    className="flex items-center gap-2 px-4 py-2 border border-[#8b5a2b] rounded hover:bg-[#3e2723]"
                >
                    <ArrowLeft className="w-4 h-4" /> Return to Inn
                </button>
            </div>
        );
    }

    const startBattle = async (enemyId: string, successNodeId: string) => {
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
                            level: Math.floor(e.hp / 10) || 1,
                            image: `/enemies/${e.slug}.png`,
                            status_effects: [],
                            vit_damage: e.vit_damage,
                            traits: e.traits
                        };
                    }).filter(Boolean) as Enemy[];
                } else {
                    console.error(`[QuestPage] Enemies data not found for slugs: ${targetSlugs.join(',')}`);
                    alert(`敵データが見つかりませんでした: ${targetSlugs.join(',')}\n管理者に連絡してください。`);
                    return; // Prevent fallback to Slime
                }
            } catch (e) {
                console.error("Failed to fetch enemy data:", e);
                alert(`敵データの取得に失敗しました: ${(e as Error).message}`);
                return; // Prevent fallback to Slime
            }
        }

        console.log("[QuestPage] Starting Battle with Enemies:", enemies);

        useGameStore.getState().startBattle(enemies);

        // Save state for resume
        localStorage.setItem('pending_quest_resume', JSON.stringify({
            questId: id,
            nextNodeId: successNodeId
        }));

        router.push(`/battle?return_url=/quest/${id}`);
    };

    return (
        <div className="min-h-screen bg-[#1a120b] text-[#e3d5b8] relative">
            {/* Header / Give Up Controls */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 items-end">
                <button
                    onClick={handleGiveUp}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 rounded hover:bg-red-900/40 transition-colors font-serif text-sm"
                >
                    <Skull className="w-4 h-4" /> 撤退する (Give Up)
                </button>

                {/* DEBUG OVERLAY */}
                <div className="bg-black/80 text-green-400 text-xs p-2 rounded border border-green-800 max-w-xs break-all">
                    <div className="font-bold border-b border-green-800 mb-1">DEBUG INFO</div>
                    <div>QuestID: {id}</div>
                    <div>NodeID: {scenario?.script_data?.nodes ? Object.keys(scenario.script_data.nodes).length + ' nodes' : 'No Script'}</div>
                    <div className="mt-1 border-t border-green-900 pt-1">
                        Guest (Store): {useQuestState.getState().guest?.name || 'None'}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto min-h-screen border-x border-[#3e2723] bg-[#2c1e1a]">
                {/* Temporary Debug: Show raw script_data properties */}
                <div className="bg-black text-xs text-green-500 p-2 overflow-auto max-h-32">
                    DEBUG: ID={scenario.id} | ScriptKeys={Object.keys(scenario.script_data || {}).join(',')} | Data={JSON.stringify(scenario.script_data).slice(0, 100)}...
                </div>

                <ScenarioEngine
                    scenario={scenario}
                    initialNodeId={initialNodeId}
                    onBattleStart={startBattle}
                    onComplete={async (result, history) => {
                        if (result === 'abort') {
                            router.push('/inn');
                            return;
                        }

                        // Call Complete API
                        try {
                            const res = await fetch('/api/quest/complete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    quest_id: scenario.id,
                                    user_id: userProfile?.id,
                                    result: result === 'success' ? 'success' : 'failure',
                                    history: history || [],
                                    loot_pool: [],
                                    consumed_items: []
                                })
                            });

                            if (!res.ok) {
                                const err = await res.json();
                                console.error('Complete Error:', err);
                                alert(`結果の保存に失敗しました: ${err.error || res.statusText}\n${err.stack || ''}`);
                                // Don't redirect immediately on error so user can see it
                            } else {
                                const data = await res.json();
                                alert(result === 'success' ? `クエスト達成！\n獲得金貨: ${data.changes?.gold_gained || 0}G` : 'クエスト失敗...');
                                router.push('/inn');
                            }
                        } catch (e: any) {
                            console.error(e);
                            alert(`通信エラーが発生しました: ${e.message}`);
                            router.push('/inn');
                        }
                    }}
                />
            </div>
        </div>
    );
}
