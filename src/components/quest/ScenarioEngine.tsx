
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScenarioDB } from '@/types/game';
import { getAssetUrl } from '@/config/assets';
import { Scroll, Sword, Skull, ArrowRight, MapPin, Shield, Star } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

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

    // Global State Access
    const { userProfile, worldState, battleState } = useGameStore();

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
            // 2. Action Nodes
            else if (currentNode.type === 'battle') {
                // Manual Start
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
                            {currentNode.text}
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
        </div >
    );
}
