'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import BattleView from '@/components/battle/BattleView';
import { Enemy } from '@/types/game';
import { Swords } from 'lucide-react';

export default function BattleTestPage() {
    const router = useRouter();
    const { userProfile, fetchUserProfile } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [battleStarted, setBattleStarted] = useState(false);
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        const initBattle = async () => {
            try {
                // ユーザープロフィールの取得
                await fetchUserProfile();
                if (!useGameStore.getState().userProfile) {
                    router.push('/title');
                    return;
                }

                // エネミーデータの取得
                const res = await fetch('/api/debug/battle-test');
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'エネミーデータの取得に失敗');
                }

                const data = await res.json();
                setGroupName(data.group_name || data.group_slug);

                if (!data.enemies || data.enemies.length === 0) {
                    throw new Error('エネミーが見つかりません');
                }

                // バトル開始
                await useGameStore.getState().startBattle(data.enemies as Enemy[]);
                setBattleStarted(true);
            } catch (e: any) {
                console.error('[バトルテスト] エラー:', e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        initBattle();
    }, []);

    const handleBattleEnd = (result: 'win' | 'lose' | 'escape') => {
        // バトルテストなので結果に関わらず宿屋に戻る
        fetchUserProfile();
        router.push('/inn');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none text-slate-200">
                <div className="relative w-full max-w-[390px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-slate-950">
                    <Swords className="w-12 h-12 text-red-500 animate-pulse" />
                    <p className="text-sm text-red-400 font-serif tracking-widest">バトルテスト準備中...</p>
                    {groupName && <p className="text-xs text-slate-500">対戦相手: {groupName}</p>}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none text-slate-200">
                <div className="relative w-full max-w-[390px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-slate-950">
                    <p className="text-red-500 font-bold">エラー</p>
                    <p className="text-sm text-slate-400">{error}</p>
                    <button onClick={() => router.push('/inn')} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm hover:bg-slate-700">
                        宿屋に戻る
                    </button>
                </div>
            </div>
        );
    }

    if (!battleStarted) return null;

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none overflow-hidden text-slate-200">
            <div className="relative w-full max-w-[390px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-slate-950">
                {/* バトルテストヘッダー */}
                <div className="bg-red-950/50 border-b border-red-800/50 px-4 py-2 flex items-center justify-between z-50">
                    <div className="flex items-center gap-2">
                        <Swords size={14} className="text-red-400" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Battle Test</span>
                    </div>
                    <span className="text-[10px] text-red-400/60">{groupName}</span>
                </div>

                <main className="flex-1 relative w-full h-full overflow-hidden">
                    <BattleView onBattleEnd={handleBattleEnd} battleTitle={`バトルテスト: ${groupName}`} />
                </main>

                <div className="w-32 h-1 bg-slate-800 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2" />
            </div>
        </div>
    );
}
