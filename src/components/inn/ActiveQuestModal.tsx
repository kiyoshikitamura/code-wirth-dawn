'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Scroll, LogOut, RefreshCw } from 'lucide-react';
import { Scenario, UserProfile } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { getAuthHeaders } from '@/lib/authToken';

interface ActiveQuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    quests: Scenario[];
    onSelect: (scenario: Scenario) => void;
    isLoading?: boolean;
}

export default function ActiveQuestModal({ isOpen, onClose, userProfile, quests, onSelect, isLoading }: ActiveQuestModalProps) {
    const [loading, setLoading] = useState(false);
    const [penaltyResult, setPenaltyResult] = useState<{
        vit: number;
        reputation: number;
        location: string | null;
    } | null>(null);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-sm rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] p-6 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#8b5a2b] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-serif text-[#3e2723] tracking-widest animate-pulse">読み込み中…</p>
                </div>
            </div>
        );
    }

    const currentQuestId = userProfile.current_quest_id;
    const activeQuest = quests.find(q => String(q.id) === currentQuestId);
    const isUgcId = currentQuestId && (currentQuestId.includes('-') || isNaN(Number(currentQuestId)));
    const questTitle = activeQuest?.title || 
        (isUgcId ? `進行中の依頼 (UGCクエスト)` : 
        (!isLoading && currentQuestId ? '進行中の依頼があります' : '進行中の依頼情報を取得中...'));

    const handleGiveUp = async () => {
        if (!confirm("本当にこの依頼を放棄（ギブアップ）しますか？\n\n【放棄ペナルティ】\n・最大体力（VIT）が1減少します。\n・この拠点での名声値が低下します。\n・進行状況や一時獲得アイテムは失われます。")) {
            return;
        }

        setLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/quest/give-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                }
            });

            if (res.ok) {
                const data = await res.json();
                
                // クライアントのクエスト状態をリセット（ゲストNPC離脱や進行中フラグのクリア）
                useQuestState.getState().resetQuest();

                // ペナルティ結果をローカル状態に格納して表示
                setPenaltyResult({
                    vit: data.penalty?.vit ?? -1,
                    reputation: data.penalty?.reputation ?? -5,
                    location: data.penalty?.location || null
                });

                // 最新のユーザープロフィールをフェッチ（ロックの解除を反映）
                await useGameStore.getState().fetchUserProfile();
            } else {
                alert("依頼の放棄処理に失敗しました。時間をおいて再度お試しください。");
            }
        } catch (e) {
            console.error("Failed to give up quest:", e);
            alert("通信エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleClosePenalty = () => {
        setPenaltyResult(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-md rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] relative overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b-2 border-[#8b5a2b] bg-[#3e2723] text-[#e3d5b8]">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                        <h2 className="text-base font-serif font-bold tracking-widest text-amber-400">進行中の依頼あり</h2>
                    </div>
                    {!penaltyResult && (
                        <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 bg-[url('/textures/aged-paper.png')] bg-repeat min-h-[220px] flex flex-col justify-between">
                    {penaltyResult ? (
                        /* Penalty Result Visual Screen */
                        <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 rounded-full bg-red-900/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-600 font-bold text-xl animate-bounce">
                                💀
                            </div>
                            <h3 className="font-serif font-bold text-red-800 text-sm">依頼を放棄し、撤退しました</h3>
                            <div className="bg-[#f5deb3]/60 border border-[#c2b280] rounded p-3 text-xs text-left space-y-2 text-[#3e2723] font-serif">
                                <p className="font-bold border-b border-[#c2b280] pb-1 tracking-wider text-center">適用されたペナルティ</p>
                                <div className="flex justify-between">
                                    <span>最大体力（VIT）:</span>
                                    <span className="font-mono text-red-600 font-bold">{penaltyResult.vit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>拠点名声値 ({penaltyResult.location || '現在地'}):</span>
                                    <span className="font-mono text-red-600 font-bold">{penaltyResult.reputation}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleClosePenalty}
                                className="w-full text-xs py-2 bg-[#8b5a2b] text-white font-bold rounded hover:bg-[#6b4522] transition-colors"
                            >
                                確認して閉じる
                            </button>
                        </div>
                    ) : (
                        /* Regular Confirmation Screen */
                        <>
                            <div className="space-y-3 font-serif">
                                <p className="text-xs text-[#5c4033] leading-relaxed">
                                    あなたは現在、以下の依頼を受注して進行中の状態です。<br />
                                    新しい依頼を受けるには、この依頼を再開して完了させるか、諦めて放棄（ギブアップ）する必要があります。
                                </p>
                                <div className="bg-[#fdfbf7] border border-[#c2b280] p-3 rounded shadow-inner flex items-start gap-2.5">
                                    <Scroll className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[10px] text-amber-800 font-bold tracking-widest">現在受注中の依頼</div>
                                        <div className="text-xs font-bold text-[#3e2723] mt-0.5 line-clamp-2">{questTitle}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5 pt-4">
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        onSelect(activeQuest || ({ id: currentQuestId || '' } as any));
                                    }}
                                    className="w-full py-3 bg-[#8b5a2b] text-white hover:bg-[#6b4522] active:scale-95 transition-all text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 tracking-widest"
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    この依頼を再開する
                                </button>
                                <button
                                    onClick={handleGiveUp}
                                    className="w-full py-3 bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900/80 active:scale-95 transition-all text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 tracking-widest"
                                    disabled={loading}
                                >
                                    <LogOut className="w-4 h-4" />
                                    依頼を諦める（放棄・ペナルティ発生）
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
