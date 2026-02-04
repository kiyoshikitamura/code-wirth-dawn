'use client';

import React, { useState, useEffect } from 'react';
import { ScenarioDB, ScenarioFlowNode } from '@/types/database';
import { Scroll, Skull, Shield, ArrowRight } from 'lucide-react';

interface QuestModalProps {
    scenario: ScenarioDB;
    onClose: () => void;
    onComplete: (result: any) => void;
    onBattleStart?: (scenario: ScenarioDB) => void;
}

export default function QuestModal({ scenario, onClose, onComplete, onBattleStart }: QuestModalProps) {
    const [currentNodeId, setCurrentNodeId] = useState<string>('start');
    const [currentNode, setCurrentNode] = useState<ScenarioFlowNode | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        // Find node by ID
        let node = scenario.flow_nodes?.find(n => n.id === currentNodeId);

        // Fallback to first node if 'start' not found
        if (!node && scenario.flow_nodes?.length > 0) {
            node = scenario.flow_nodes[0];
        }

        setCurrentNode(node || null);
    }, [currentNodeId, scenario]);

    const handleChoice = (nextId: string, label: string) => {
        setHistory([...history, label]);

        // Check if nextId implies completion or battle
        if (nextId === 'battle') {
            if (onBattleStart) {
                onBattleStart(scenario);
                return;
            }
        }

        if (nextId === 'COMPLETED' || nextId === 'win') {
            // For prototype, treat 'win' as complete
        }

        setCurrentNodeId(nextId);
    };

    const isEndNode = !currentNode?.choices || currentNode.choices.length === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1510] border-2 border-[#8b5a2b] w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#2b1d12] border-b border-[#8b5a2b] p-4 flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold text-[#e3d5b8] flex items-center gap-2">
                        <Scroll className="w-5 h-5" />
                        {scenario.title}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto font-serif text-lg leading-relaxed text-[#d4c5a5]">
                    <div className="min-h-[120px]">
                        {currentNode ? currentNode.text : "読み込み中..."}
                    </div>

                    {/* History Log (Optional, purely visual) */}
                    {history.length > 0 && (
                        <div className="mt-8 border-t border-[#4a3b2b] pt-4 text-xs text-gray-500 space-y-1 font-sans">
                            {history.map((h, i) => (
                                <div key={i} className="opacity-50">Checking: {h}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Choices / Actions */}
                <div className="bg-[#0f0c0a] p-4 border-t border-[#4a3b2b]">
                    {isEndNode ? (
                        <button
                            onClick={() => onComplete({ success: true })} // Simple success pass-through
                            className="w-full py-3 bg-gradient-to-r from-gold-700 to-gold-500 text-black font-bold text-lg rounded hover:scale-[1.01] transition-transform"
                        >
                            依頼完了
                        </button>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {currentNode?.choices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleChoice(choice.next_node, choice.label)}
                                    className="bg-[#2b1d12] border border-[#5d4037] p-3 text-left hover:bg-[#3e2b1b] hover:border-[#8b5a2b] hover:text-[#e3d5b8] transition-all flex justify-between items-center group"
                                >
                                    <span className="font-bold text-gray-300 group-hover:text-white">
                                        {idx + 1}. {choice.label}
                                    </span>

                                    {/* Cost/Requirement Hints */}
                                    <div className="flex gap-2 text-xs">
                                        {choice.cost_vitality && (
                                            <span className="text-red-400 flex items-center gap-1">
                                                <Skull className="w-3 h-3" /> Cost: {choice.cost_vitality} Vit
                                            </span>
                                        )}
                                        {choice.req_tag && (
                                            <span className="text-blue-400 flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> Req: {choice.req_tag}
                                            </span>
                                        )}
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
