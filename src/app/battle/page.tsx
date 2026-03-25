'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import BattleView from '@/components/battle/BattleView';
import { Swords } from 'lucide-react';

export default function BattlePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none text-slate-200">
                <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-slate-950">
                    <Swords className="w-12 h-12 text-red-500 animate-pulse" />
                    <p className="text-sm text-red-400 font-serif tracking-widest">戦闘準備中...</p>
                </div>
            </div>
        }>
            <BattlePageInner />
        </Suspense>
    );
}

function BattlePageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasHydrated = useGameStore(state => state._hasHydrated);
    const {
        battleState,
        hand,
        initializeBattle,
        fetchUserProfile,
        selectedScenario
    } = useGameStore();

    const [battleReady, setBattleReady] = useState(false);

    const bType = searchParams.get('type') || '';
    const targetLoc = searchParams.get('target') || '';

    // バトルタイトル生成
    const getBattleTitle = () => {
        if (selectedScenario) return `依頼: ${selectedScenario.title}`;
        if (bType === 'bounty_hunter') return 'VS 賞金稼ぎ';
        if (bType === 'bounty_hunter_ambush') return '賞金稼ぎの襲撃';
        if (bType === 'bandit_ambush') return '無法者の襲撃';
        const enemies = battleState.enemies || (battleState.enemy ? [battleState.enemy] : []);
        if (enemies.length > 0) return `VS ${enemies[0]?.name || '敵'}`;
        return 'BATTLE';
    };

    useEffect(() => {
        fetchUserProfile();

        const hydrated = useGameStore.persist.hasHydrated();
        if (hydrated && !battleState.enemy) {
            console.warn('[BattlePage] No enemy found. Initializing fallback battle.');
            initializeBattle();
        }

        setBattleReady(true);
    }, []);

    const handleBattleEnd = (result: 'win' | 'lose' | 'escape') => {
        fetchUserProfile();
        // BattleView内のhandleResultActionでURL paramsベースのルーティングが処理されるため、
        // ここはフォールバック（selectedScenario経由時のみ到達）
        if (selectedScenario) {
            router.push(`/quest/${selectedScenario.id}`);
        } else {
            router.push(`/inn?battle_result=${result}${bType ? `&type=${bType}` : ''}`);
        }
    };

    if (!hasHydrated || !battleReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none text-slate-200">
                <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-slate-950">
                    <Swords className="w-12 h-12 text-red-500 animate-pulse" />
                    <p className="text-sm text-red-400 font-serif tracking-widest">戦闘準備中...</p>
                </div>
            </div>
        );
    }

    if (!battleState.enemy && !battleState.isVictory && !battleState.isDefeat) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none text-slate-200">
                <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-slate-950">
                    <Swords className="w-12 h-12 text-red-500 animate-pulse" />
                    <p className="text-sm text-red-400 font-serif tracking-widest">戦闘準備中...</p>
                    <button onClick={() => router.push('/inn')} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm hover:bg-slate-700 mt-4">
                        宿屋に戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none overflow-hidden text-slate-200">
            <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-slate-950">
                <main className="flex-1 relative w-full h-full overflow-hidden">
                    <BattleView onBattleEnd={handleBattleEnd} battleTitle={getBattleTitle()} />
                </main>
                <div className="w-32 h-1 bg-slate-800 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2" />
            </div>
        </div>
    );
}
