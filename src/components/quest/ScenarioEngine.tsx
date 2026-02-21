
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScenarioDB } from '@/types/game';
import { getAssetUrl } from '@/config/assets';
import { Scroll, Sword, Skull, ArrowRight, MapPin, Shield, Star } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { useRouter } from 'next/navigation';
import WorldMap from '@/components/world/WorldMap';

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

    // v3.6 UI States
    const [showingGuestJoin, setShowingGuestJoin] = useState<any>(null);
    const [showingTravel, setShowingTravel] = useState<{ dest: string, days: number, next: string, status: 'confirm' | 'animating' } | null>(null);

    // Global State Access
    const { userProfile, worldState, battleState } = useGameStore();
    const questState = useQuestState();
    const router = useRouter();

    // Scroll to bottom of feed
    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [feed]);

    // Parse Script Data (BYORK JSON)
    const script = scenario.script_data || {
        nodes: {
            start: {
                text: scenario.description || "...",
                choices: [{ label: "進む", next: "end_success" }]
            },
            end_success: {
                type: 'end',
                result: 'success',
                text: "依頼を達成した。"
            }
        }
    };

    const currentNode = script.nodes?.[currentNodeId];

    // --- NODE PROCESSOR ---
    useEffect(() => {
        if (!currentNode) return;
        let timeoutId: NodeJS.Timeout;

        const processNode = async () => {
            // 1. Special Logic Nodes
            if (currentNode.type === 'check_world') {
                // ... (unchanged logic if any)
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
            // ...
            // 2. Action Nodes
            else if (currentNode.type === 'battle') {
                // Manual Start (handled by parent or specialized component)
            }
            // v3.4 Expansion
            else if (currentNode.type === 'travel') {
                const dest = currentNode.params?.dest;
                const days = currentNode.params?.days || 1; // Default 1 day
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;

                if (dest && nextId) {
                    setShowingTravel({ dest, days, next: nextId, status: 'confirm' });
                } else if (nextId) {
                    // Fallback if no dest
                    setCurrentNodeId(nextId);
                }
            }
            else if (currentNode.type === 'guest_join') {
                const guestId = currentNode.params?.guest_id;
                const nextId = currentNode.next || currentNode.choices?.[0]?.next;

                if (guestId) {
                    // Fetch Guest Data
                    try {
                        const res = await fetch(`/api/party/member?id=${guestId}&context=guest`);
                        if (res.ok) {
                            const guestData = await res.json();
                            setShowingGuestJoin({ data: guestData, next: nextId });
                            // Logic moved to confirmation
                        } else {
                            // Fallback
                            if (nextId) setCurrentNodeId(nextId);
                        }
                    } catch (e) {
                        console.error("Failed to load guest", e);
                        if (nextId) setCurrentNodeId(nextId);
                    }
                } else if (nextId) {
                    setCurrentNodeId(nextId);
                }
            }
            // ...
            else if (currentNode.type === 'shop_access') {
                // Redirect to context shop? or just log
                // Implementation: Navigate to Shop Page with query param
                const questId = questState.questId;
                router.push(`/shop?quest_id=${questId}&return_to=quest`);
                // Note: The resume logic will bring user back here if they leave?
                // Actually, if we leave the page, ScenarioEngine unmounts.
                // We need Resume Logic to work for this to match spec.
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


    // Safety check
    if (!currentNode) {
        return <div className="p-8 text-red-500">Error: Node '{currentNodeId}' not found.</div>;
    }

    const handleChoice = (choice: any) => {
        // Validate Requirements
        if (choice.req) {
            const { type, val } = choice.req;
            if (type === 'has_item') {
                // Check inventory
                // const has = ... 
                // For MVP skipping strict client-side validation if not critical, or assume always enabled for choices
            }
        }

        // Cost Check
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

    // Visuals
    const bgUrl = getAssetUrl(currentNode.bg_key || 'default');

    return (
        <div className="relative w-full h-[70vh] bg-black border-4 border-[#8b5a2b] overflow-hidden flex flex-col shadow-2xl rounded-lg">
            {/* Debug Overlay */}
            <div className="absolute top-0 left-0 bg-red-900/80 text-white text-xs p-1 z-50 font-mono">
                Nodes: {Object.keys(script.nodes || {}).length} | ID: {currentNodeId} | Type: {currentNode?.type || 'none'}
                {currentNode?.type === 'battle' && ` | EnemyGroup: ${currentNode.enemy_group_id}`}
            </div>

            {/* Background Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
                style={{ backgroundImage: `url(${bgUrl})`, filter: 'brightness(0.5) sepia(0.3)' }}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Content Container */}
            <div className="relative z-10 flex-1 flex flex-col p-6 md:p-10 justify-between h-full">

                {/* Header / Title */}
                <div className="text-center border-b border-white/10 pb-4 mb-4">
                    <h2 className="text-2xl font-serif text-[#e3d5b8] tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {scenario.title}
                    </h2>
                    <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400 uppercase tracking-widest">
                        <span>{scenario.slug}</span>
                        <span>•</span>
                        <span>Level {scenario.rec_level}</span>
                    </div>
                </div>

                {/* Main Text Area (BYORK) */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar fade-mask">
                    <div className="bg-black/60 p-6 rounded-lg border border-[#a38b6b]/30 backdrop-blur-md min-h-[150px] animate-in fade-in slide-in-from-bottom-5 duration-500 shadow-inner">
                        <p className="text-lg text-gray-200 font-serif leading-loose whitespace-pre-wrap">
                            {currentNode.text || (
                                currentNode.type === 'travel' ? "移動中... (数日が経過した)" :
                                    currentNode.type === 'guest_join' ? "新たな仲間が合流したようだ。" :
                                        "..."
                            )}
                        </p>
                    </div>
                </div>

                {/* Input / Choices Area */}
                <div className="grid gap-3 mt-6">
                    {currentNode.type === 'battle' ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="text-red-500 font-bold text-xl animate-pulse">
                                敵の気配を感じる...
                            </div>
                            <button
                                onClick={() => {
                                    if (onBattleStart) {
                                        const successChoice = currentNode.choices?.find((c: any) => c.label === 'win') || currentNode.choices?.[0];
                                        const successId = successChoice?.next || 'end_success';
                                        const enemyId = currentNode.enemy_group_id || 'slime';
                                        onBattleStart(enemyId, successId);
                                    }
                                }}
                                className="bg-red-900/80 border border-red-500 text-red-100 px-8 py-3 rounded text-lg font-bold hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                            >
                                戦闘開始 (FIGHT)
                            </button>
                        </div>
                    ) : currentNode.choices && currentNode.choices.length > 0 ? (
                        currentNode.choices.map((choice: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => handleChoice(choice)}
                                className="group relative bg-gradient-to-r from-[#3e2723]/90 to-[#2c1b18]/90 hover:from-[#5d4037] hover:to-[#4e342e] border border-[#a38b6b] text-[#e3d5b8] py-4 px-6 rounded text-left transition-all flex items-center justify-between active:scale-[0.99] hover:shadow-[0_0_15px_rgba(163,139,107,0.3)]"
                            >
                                {/* Button Content */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#a38b6b] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="font-bold flex items-center gap-3 text-lg">
                                    <span className="w-2 h-2 bg-[#a38b6b] rounded-full group-hover:bg-white transition-colors shadow-glow" />
                                    {choice.label}
                                </span>

                                <div className="flex flex-col items-end gap-1">
                                    {choice.cost_vitality && (
                                        <div className="flex items-center gap-1 text-xs text-red-400 font-mono">
                                            <Sword size={12} />
                                            <span>Vitality -{choice.cost_vitality}</span>
                                        </div>
                                    )}
                                    {choice.req_tag && (
                                        <div className="flex items-center gap-1 text-xs text-blue-400 font-mono border border-blue-900/50 bg-blue-900/20 px-2 py-0.5 rounded">
                                            <Shield size={12} />
                                            <span>Req: {choice.req_tag}</span>
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
                            className="w-full bg-[#3e2723] text-[#e3d5b8] border border-[#a38b6b] py-3 px-6 rounded hover:bg-[#5d4037] transition-colors flex items-center justify-center gap-2 animate-in fade-in duration-500"
                        >
                            <span>次へ</span>
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        currentNode.type === 'end' || currentNode.result ? (
                            <div className="text-center font-bold text-2xl py-6 animate-pulse tracking-widest">
                                {currentNode.result === 'success' ? (
                                    <span className="text-yellow-400 drop-shadow-lg">QUEST COMPLETED</span>
                                ) : (
                                    <span className="text-red-500 drop-shadow-lg">QUEST FAILED</span>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 italic pb-4">
                                ...
                            </div>
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

                    {/* Map Display */}
                    <div className="w-full h-full max-h-[60%] mb-6 relative">
                        <WorldMap
                            currentLocationName={userProfile?.current_location_name || '名もなき旅人の拠所'}
                            destinationName={showingTravel.dest}
                            className="w-full h-full shadow-2xl border-4 border-[#8b5a2b]"
                        />
                        {showingTravel.status === 'animating' && (
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#a38b6b] animate-[loading_3s_ease-in-out_infinite]" />
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
                    </div>

                    {showingTravel.status === 'confirm' ? (
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowingTravel({ ...showingTravel, status: 'animating' });
                                    // Auto-advance after animation duration (e.g. 3s)
                                    setTimeout(() => {
                                        questState.travelTo(showingTravel.dest, showingTravel.days);
                                        setHistory(prev => [...prev, `[Travel] ${showingTravel.days}日かけて移動した... (残り寿命 -${showingTravel.days})`]);
                                        setShowingTravel(null);
                                        if (showingTravel.next) setCurrentNodeId(showingTravel.next);
                                    }, 3000);
                                }}
                                className="bg-[#3e2723] text-[#e3d5b8] border border-[#a38b6b] px-12 py-3 hover:bg-[#5d4037] transition-all tracking-widest text-lg font-bold shadow-[0_0_15px_rgba(139,90,43,0.3)] hover:scale-105"
                            >
                                DEPART
                            </button>
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
