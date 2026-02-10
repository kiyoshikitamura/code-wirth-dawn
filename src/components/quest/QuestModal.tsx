'use client';

import React from 'react';
import { ScenarioDB } from '@/types/game';
import ScenarioEngine from './ScenarioEngine';

interface QuestModalProps {
    scenario: ScenarioDB;
    onClose: () => void;
    onComplete: (result: any, history?: any[]) => void;
    onBattleStart?: (scenario: ScenarioDB, enemyId: string, successNodeId?: string) => void;
    initialNodeId?: string;
}

export default function QuestModal({ scenario, onClose, onComplete, onBattleStart, initialNodeId }: QuestModalProps) {
    const handleBattleWrapper = (enemyId: string, successNodeId?: string) => {
        if (onBattleStart) {
            onBattleStart(scenario, enemyId, successNodeId);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl relative">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-gray-400 hover:text-white px-4 py-2 bg-black/50 rounded border border-white/10"
                >
                    CLOSE [X]
                </button>

                <ScenarioEngine
                    scenario={scenario}
                    onComplete={onComplete}
                    onBattleStart={handleBattleWrapper}
                    initialNodeId={initialNodeId}
                />
            </div>
        </div>
    );
}
