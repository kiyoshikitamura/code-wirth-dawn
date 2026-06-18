import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { Swords, Trophy, X } from 'lucide-react';
import ColosseumRankingModal from './ColosseumRankingModal';

interface ColosseumModalProps {
    onClose: () => void;
}

export default function ColosseumModal({ onClose }: ColosseumModalProps) {
    const router = useRouter();
    const { userProfile, gold, fetchUserProfile } = useGameStore();
    const [selectedDiff, setSelectedDiff] = useState<'easy' | 'normal' | 'hard' | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showRankings, setShowRankings] = useState(false);

    const userLevel = userProfile?.level || 1;
    const goldCosts = {
        easy: userLevel * 10,
        normal: userLevel * 30,
        hard: userLevel * 50
    };

    const handleChallenge = async (difficulty: 'easy' | 'normal' | 'hard') => {
        const cost = goldCosts[difficulty];
        if (gold < cost) {
            setErrorMsg('ゴールドが不足しています。');
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        soundManager?.playSE('se_enter_location');

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/colosseum/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ difficulty })
            });

            if (res.ok) {
                const data = await res.json();
                // Refresh local profile store so quest lock is registered
                await fetchUserProfile();
                // Route to quest execution page
                router.push(`/quest/colosseum_${difficulty}`);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '挑戦の開始に失敗しました。');
            }
        } catch (err) {
            console.error('[ColosseumModal] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    if (showRankings) {
        return <ColosseumRankingModal onClose={() => setShowRankings(false)} />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#0c1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,52,91,0.5)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Swords size={20} className="animate-pulse" />
                        <h2 className="font-black tracking-widest text-lg text-slate-100">闘技場 (コロシアム)</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Vargas Receptionist area */}
                    <div className="flex gap-4 p-4 bg-[#11203b]/40 border border-[#1a2d4e] rounded-xl items-start">
                        <img
                            src="/images/npcs/npc_roland_knight_veteran.png"
                            alt="バルガス"
                            className="w-20 h-20 object-cover rounded-lg border border-[#233f6a] bg-[#0c1628]"
                            onError={(e) => {
                                // Fallback
                                (e.target as HTMLImageElement).src = '/images/enemies/default.png';
                            }}
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black">支配人</span>
                                <span className="text-sm font-bold text-slate-200">バルガス</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                「ようこそ、ここは腕に覚えのある冒険者たちが集う闘技場だ。連続勝ち抜き戦に挑戦するか？それとも他の猛者たちのランキングを見るか？」
                            </p>
                        </div>
                    </div>

                    {/* Gold display */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#12223f]/50 border border-[#213a65]/50 rounded-lg">
                        <span className="text-xs text-blue-200/70 font-bold">所持ゴールド</span>
                        <span className="text-sm font-black text-amber-400">{gold.toLocaleString()} G</span>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-blue-200/50 uppercase tracking-wider">挑戦クラス選択</h3>
                        
                        {/* Easy */}
                        <button
                            disabled={loading || gold < goldCosts.easy}
                            onClick={() => setSelectedDiff('easy')}
                            className={`w-full p-4 border rounded-xl flex items-center justify-between text-left transition-all ${
                                selectedDiff === 'easy'
                                    ? 'bg-[#19325a]/80 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                    : 'bg-[#0f1d35]/60 border-[#20365b] hover:bg-[#152747] hover:border-amber-500/30'
                            } ${gold < goldCosts.easy ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-emerald-400">Easy クラス</span>
                                    <span className="text-[10px] text-slate-400">(全5戦)</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    報酬: 800G / 200EXP / +5名声 / ランダム報酬2点
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block font-bold">必要経費</span>
                                <span className="text-sm font-black text-amber-400">{goldCosts.easy} G</span>
                            </div>
                        </button>

                        {/* Normal */}
                        <button
                            disabled={loading || gold < goldCosts.normal}
                            onClick={() => setSelectedDiff('normal')}
                            className={`w-full p-4 border rounded-xl flex items-center justify-between text-left transition-all ${
                                selectedDiff === 'normal'
                                    ? 'bg-[#19325a]/80 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                    : 'bg-[#0f1d35]/60 border-[#20365b] hover:bg-[#152747] hover:border-amber-500/30'
                            } ${gold < goldCosts.normal ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-amber-400">Normal クラス</span>
                                    <span className="text-[10px] text-slate-400">(全10戦)</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    報酬: 2,000G / 400EXP / +10名声 / ランダム報酬2点
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block font-bold">必要経費</span>
                                <span className="text-sm font-black text-amber-400">{goldCosts.normal} G</span>
                            </div>
                        </button>

                        {/* Hard */}
                        <button
                            disabled={loading || gold < goldCosts.hard}
                            onClick={() => setSelectedDiff('hard')}
                            className={`w-full p-4 border rounded-xl flex items-center justify-between text-left transition-all ${
                                selectedDiff === 'hard'
                                    ? 'bg-[#19325a]/80 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                    : 'bg-[#0f1d35]/60 border-[#20365b] hover:bg-[#152747] hover:border-amber-500/30'
                            } ${gold < goldCosts.hard ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-rose-400">Hard クラス</span>
                                    <span className="text-[10px] text-slate-400">(全20戦)</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    報酬: 4,000G / 800EXP / +20名声 / ランダム報酬2点 (高難度)
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block font-bold">必要経費</span>
                                <span className="text-sm font-black text-amber-400">{goldCosts.hard} G</span>
                            </div>
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 text-center">
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-[#0b1220] border-t border-[#1e345b] grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setShowRankings(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#11203b] border border-[#233f6d] rounded-xl hover:bg-[#1a2e52] hover:text-amber-400 transition-all text-xs font-bold text-slate-300"
                    >
                        <Trophy size={16} />
                        ランキング
                    </button>
                    <button
                        disabled={loading || !selectedDiff}
                        onClick={() => selectedDiff && handleChallenge(selectedDiff)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${
                            selectedDiff
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#070e1e] active:scale-95 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                        }`}
                    >
                        {loading ? '手配中...' : '挑戦開始'}
                    </button>
                </div>
            </div>
        </div>
    );
}
