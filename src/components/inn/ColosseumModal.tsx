import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { Swords, Trophy, X, BookOpen } from 'lucide-react';
import ColosseumRankingModal from './ColosseumRankingModal';

interface ColosseumModalProps {
    onClose: () => void;
}

export default function ColosseumModal({ onClose }: ColosseumModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const router = useRouter();
    const { userProfile, gold, fetchUserProfile } = useGameStore();
    const [selectedDiff, setSelectedDiff] = useState<'easy' | 'normal' | 'hard' | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showRankings, setShowRankings] = useState(false);
    const [showRules, setShowRules] = useState(false);

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

    if (showRules) {
        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-lg bg-[#0c1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,52,91,0.5)] flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                        <div className="flex items-center gap-2 text-amber-400">
                            <BookOpen size={20} className="animate-pulse" />
                            <h2 className="font-black tracking-widest text-lg text-slate-100">闘技場ルール説明</h2>
                        </div>
                        <button
                            onClick={() => setShowRules(false)}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed custom-scrollbar">
                        <section className="space-y-2">
                            <h3 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ コロシアムとは</h3>
                            <p className="text-xs">
                                腕に覚えのある冒険者たちが集う連続戦闘施設です。デッキがロックされた状態で、難易度ごとに設定された連戦に挑みます。
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ 挑戦クラスと報酬ルール</h3>
                            <div className="space-y-1.5 text-xs font-medium">
                                <p><strong className="text-emerald-400 font-bold">Easy クラス (全5戦):</strong> 挑戦費 [Lv × 10 G]</p>
                                <p className="pl-4 text-slate-400">報酬: 400 G / 200 EXP / +5 名声 / ランダムアイテムまたはスキル1点</p>
                                <p><strong className="text-amber-400 font-bold">Normal クラス (全10戦):</strong> 挑戦費 [Lv × 30 G]</p>
                                <p className="pl-4 text-slate-400">報酬: 1,000 G / 400 EXP / +10 名声 / ランダムアイテムまたはスキル1点</p>
                                <p><strong className="text-rose-400 font-bold">Hard クラス (全10戦):</strong> 挑戦費 [Lv × 50 G]</p>
                                <p className="pl-4 text-slate-400">報酬: 2,000 G / 800 EXP / +20 名声 / アイテム2点 ＆ スキル2点</p>
                                <p className="text-[10px] text-amber-300 font-bold mt-1">※すべてのクラスにおいて、挑戦後は成功・失敗（ギブアップ含む）を問わず一律で3日間が経過します。</p>
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ 重複スキル変換ルール</h3>
                            <p className="text-xs">
                                既に習得済みのスキルがクリア報酬として抽選された場合、データベースへの重複登録はスキップされ、代わりに<span className="text-amber-300 font-black">「交易品（換金アイテム）」がランダムで1点</span>付与されます。
                                リザルト画面には「[交易品名] (スキル重複変換)」として表示されます。
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ 報酬出現確率 (レアリティ)</h3>
                            <p className="text-xs mb-1">獲得するランダム報酬は、クラスごとに以下の確率で抽選されます。</p>
                            <table className="w-full text-xs text-left border-collapse border border-[#1e345b] bg-[#11203b]/20">
                                <thead>
                                    <tr className="bg-[#11203b]/60 border-b border-[#1e345b] text-blue-200">
                                        <th className="p-2 border-r border-[#1e345b]">クラス</th>
                                        <th className="p-2 border-r border-[#1e345b]">Common</th>
                                        <th className="p-2 border-r border-[#1e345b]">Rare</th>
                                        <th className="p-2">Super Rare</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[#1e345b]">
                                        <td className="p-2 border-r border-[#1e345b] text-emerald-400 font-bold">Easy</td>
                                        <td className="p-2 border-r border-[#1e345b]">70%</td>
                                        <td className="p-2 border-r border-[#1e345b]">25%</td>
                                        <td className="p-2">5%</td>
                                    </tr>
                                    <tr className="border-b border-[#1e345b]">
                                        <td className="p-2 border-r border-[#1e345b] text-amber-400 font-bold">Normal</td>
                                        <td className="p-2 border-r border-[#1e345b]">40%</td>
                                        <td className="p-2 border-r border-[#1e345b]">50%</td>
                                        <td className="p-2">10%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 border-r border-[#1e345b] text-rose-400 font-bold">Hard</td>
                                        <td className="p-2 border-r border-[#1e345b]">30%</td>
                                        <td className="p-2 border-r border-[#1e345b]/40">40%</td>
                                        <td className="p-2">30%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ ギブアップペナルティ</h3>
                            <p className="text-xs">
                                挑戦中に撤退（ギブアップ）または敗北した場合、挑戦費は戻りません。さらに、<span className="text-rose-400 font-black">滞在地域の名声値が減少（-3〜-10のランダム）し、プレイヤーのVIT（生命力寿命）が1減少</span>します。
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ ランキング報酬と戦績リセット</h3>
                            <p className="text-xs">
                                コロシアムの「勝利数（総合）」および「難易度別（Easy/Normal/Hard）の連勝数」のランキング上位者には、6時間ごと（JST 6時/12時/18時/24時）の集計時に以下の報酬（オプションA）がシステム通知を通じて送られます。複数部門で入賞した場合は、報酬が合算されます（該当順位にプレイヤーが不在の場合は「空席」となり配布されません）。
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2">
                                <div className="p-2 bg-[#0a1526] rounded border border-[#1b3152]/30">
                                    <div className="text-amber-400 font-bold border-b border-[#1b3152]/40 pb-0.5 mb-1">勝利数（総合）</div>
                                    <ul className="space-y-0.5 font-mono">
                                        <li>1位: <span className="text-amber-400 font-bold">10,000G</span></li>
                                        <li>2位: <span className="text-slate-200 font-bold">5,000G</span></li>
                                        <li>3位: <span className="text-slate-400">1,000G</span></li>
                                    </ul>
                                </div>
                                <div className="p-2 bg-[#0a1526] rounded border border-[#1b3152]/30">
                                    <div className="text-amber-400 font-bold border-b border-[#1b3152]/40 pb-0.5 mb-1">Easy連勝</div>
                                    <ul className="space-y-0.5 font-mono">
                                        <li>1位: <span className="text-amber-400 font-bold">5,000G</span></li>
                                        <li>2位: <span className="text-slate-200 font-bold">2,000G</span></li>
                                        <li>3位: <span className="text-slate-400">500G</span></li>
                                    </ul>
                                </div>
                                <div className="p-2 bg-[#0a1526] rounded border border-[#1b3152]/30">
                                    <div className="text-amber-400 font-bold border-b border-[#1b3152]/40 pb-0.5 mb-1">Normal連勝</div>
                                    <ul className="space-y-0.5 font-mono">
                                        <li>1位: <span className="text-amber-400 font-bold">10,000G</span></li>
                                        <li>2位: <span className="text-slate-200 font-bold">5,000G</span></li>
                                        <li>3位: <span className="text-slate-400">1,000G</span></li>
                                    </ul>
                                </div>
                                <div className="p-2 bg-[#0a1526] rounded border border-[#1b3152]/30">
                                    <div className="text-amber-400 font-bold border-b border-[#1b3152]/40 pb-0.5 mb-1">Hard連勝</div>
                                    <ul className="space-y-0.5 font-mono">
                                        <li>1位: <span className="text-amber-400 font-bold">20,000G</span></li>
                                        <li>2位: <span className="text-slate-200 font-bold">10,000G</span></li>
                                        <li>3位: <span className="text-slate-400">2,000G</span></li>
                                    </ul>
                                </div>
                            </div>
                            <p className="text-xs text-rose-300 font-medium mt-2">
                                ⚠️ 集計期間（6時間）の終了時に、全プレイヤーのコロシアム戦績（勝利数・各難易度の連勝数）はすべて 0 にリセットされます。
                            </p>
                        </section>
                    </div>

                    <div className="px-6 py-4 bg-[#0b1220] border-t border-[#1e345b] flex justify-end">
                        <button
                            onClick={() => setShowRules(false)}
                            className="px-6 py-2.5 bg-[#11203b] border border-[#233f6d] rounded-xl hover:bg-[#1a2e52] hover:text-amber-400 transition-all text-xs font-bold text-slate-300 active:scale-95"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (!mounted) return null;

    return createPortal(
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                                「ここは腕に覚えのある冒険者たちが集う闘技場だ。連続勝ち抜き戦に挑戦するか？それとも他の猛者たちのランキングを見るか？」
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
                                    報酬: 400 G / 200 EXP / +5 名声 / ランダムアイテムまたはスキル1点
                                </p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                                <span className="text-xs text-slate-400 block font-bold">必要経費</span>
                                <span className="text-sm font-black text-amber-400 whitespace-nowrap">{goldCosts.easy} G</span>
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
                                    報酬: 1,000 G / 400 EXP / +10 名声 / ランダムアイテムまたはスキル1点
                                </p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                                <span className="text-xs text-slate-400 block font-bold">必要経費</span>
                                <span className="text-sm font-black text-amber-400 whitespace-nowrap">{goldCosts.normal} G</span>
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
                                    <span className="text-[10px] text-slate-400">(全10戦)</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    報酬: 2,000 G / 800 EXP / +20 名声 / アイテム2点 ＆ スキル2点
                                </p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                                <span className="text-xs text-slate-400 block font-bold">必要経費</span>
                                <span className="text-sm font-black text-amber-400 whitespace-nowrap">{goldCosts.hard} G</span>
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
                <div className="px-4 sm:px-6 py-4 bg-[#0b1220] border-t border-[#1e345b] grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                        onClick={() => setShowRules(true)}
                        className="flex items-center justify-center gap-1 px-1 sm:px-3 py-2.5 sm:py-3 bg-[#11203b] border border-[#233f6d] rounded-xl hover:bg-[#1a2e52] hover:text-amber-400 transition-all text-[11px] sm:text-xs font-bold text-slate-300 active:scale-95"
                    >
                        ルール
                    </button>
                    <button
                        onClick={() => setShowRankings(true)}
                        className="flex items-center justify-center gap-1 px-1 sm:px-3 py-2.5 sm:py-3 bg-[#11203b] border border-[#233f6d] rounded-xl hover:bg-[#1a2e52] hover:text-amber-400 transition-all text-[11px] sm:text-xs font-bold text-slate-300 active:scale-95"
                    >
                        ランキング
                    </button>
                    <button
                        disabled={loading || !selectedDiff}
                        onClick={() => selectedDiff && handleChallenge(selectedDiff)}
                        className={`flex items-center justify-center gap-1 px-1 sm:px-3 py-2.5 sm:py-3 rounded-xl font-black text-[11px] sm:text-xs tracking-wider transition-all ${
                            selectedDiff
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#070e1e] active:scale-95 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                        }`}
                    >
                        {loading ? '手配中...' : '挑戦開始'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
