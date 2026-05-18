'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface QuestData {
    id: number;
    title: string | null;
    quest_type: string;
    category: string;
    rec_level: number;
    difficulty: number;
    client_name: string | null;
    long_flavor: string | null;
    reward_gold: number | null;
    reward_exp: number | null;
    reward_reputation: number | null;
    reward_items: any[] | null;
    reward_alignment: any | null;
    reward_vitality: number | null;
    reward_npc: any | null;
    impacts: any | null;
}

interface Props {
    quest: QuestData;
    onClose: () => void;
}

export default function QuestDetailPopup({ quest, onClose }: Props) {
    const categoryLabel = quest.category === 'main' ? 'Main Story'
        : quest.category === 'special' ? 'Special' : 'Normal';

    const categoryColor = quest.category === 'main' ? 'bg-amber-600 text-amber-100'
        : quest.category === 'special' ? 'bg-purple-600 text-purple-100'
        : 'bg-slate-600 text-slate-100';

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-[#0d1a2e] border-2 border-[#2a4080]/70 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1a2d5a] to-[#0d1a2e] p-4 border-b border-[#2a4080]/50">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white font-serif truncate">{quest.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-mono text-gray-500">
                                    No.{String(quest.id).padStart(4, '0')}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${categoryColor}`}>
                                    {categoryLabel}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a2d5a] border border-[#2a4080]/50 text-gray-300 font-mono">
                                    Lv.{quest.rec_level}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white p-1 flex-shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 max-h-[50dvh] overflow-y-auto no-scrollbar">
                    {/* Flavor Text */}
                    {quest.long_flavor && (
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
                            {quest.long_flavor}
                        </p>
                    )}

                    {/* Client */}
                    {quest.client_name && (
                        <div className="text-[11px] text-gray-500">
                            <span className="font-bold text-gray-400">依頼主:</span> {quest.client_name}
                        </div>
                    )}

                    {/* Rewards */}
                    <div className="bg-[#122042]/60 rounded-lg p-3 border border-[#2a4080]/30">
                        <div className="text-[10px] text-gray-500 mb-2 font-bold">報酬</div>
                        <div className="flex flex-wrap gap-1.5">
                            {(quest.reward_gold ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 font-bold border border-yellow-800/40">
                                    💰 {quest.reward_gold}G
                                </span>
                            )}
                            {(quest.reward_exp ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-blue-900/30 text-blue-400 font-bold border border-blue-800/40">
                                    ✨ {quest.reward_exp} Exp
                                </span>
                            )}
                            {(quest.reward_reputation ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-sky-900/30 text-sky-400 font-bold border border-sky-800/40">
                                    ⭐ 名声 +{quest.reward_reputation}
                                </span>
                            )}
                            {(quest.reward_reputation ?? 0) < 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-red-900/30 text-red-400 font-bold border border-red-800/40">
                                    💀 名声 {quest.reward_reputation}
                                </span>
                            )}
                            {quest.reward_alignment?.order > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-blue-900/30 text-blue-300 font-bold border border-blue-800/40">
                                    ⚖️ 秩序 +{quest.reward_alignment.order}
                                </span>
                            )}
                            {quest.reward_alignment?.chaos > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 font-bold border border-purple-800/40">
                                    🌀 混沌 +{quest.reward_alignment.chaos}
                                </span>
                            )}
                            {quest.reward_alignment?.justice > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-amber-900/30 text-amber-300 font-bold border border-amber-800/40">
                                    ✨ 正義 +{quest.reward_alignment.justice}
                                </span>
                            )}
                            {quest.reward_alignment?.evil > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-red-900/30 text-red-300 font-bold border border-red-800/40">
                                    🔥 悪 +{quest.reward_alignment.evil}
                                </span>
                            )}
                            {(quest.reward_items?.length ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-300 font-bold border border-emerald-800/40">
                                    🎁 アイテム ×{quest.reward_items!.length}
                                </span>
                            )}
                            {(quest.reward_vitality ?? 0) !== 0 && (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full font-bold border ${
                                    (quest.reward_vitality ?? 0) < 0
                                        ? 'bg-orange-900/30 text-orange-300 border-orange-800/40'
                                        : 'bg-green-900/30 text-green-300 border-green-800/40'
                                }`}>
                                    💪 VIT {(quest.reward_vitality ?? 0) > 0 ? '+' : ''}{quest.reward_vitality}
                                </span>
                            )}
                            {quest.reward_npc && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-full bg-indigo-900/30 text-indigo-300 font-bold border border-indigo-800/40">
                                    👤 仲間加入
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Impact */}
                    {quest.impacts && (
                        <div className="bg-[#122042]/40 rounded-lg p-2.5 border border-[#2a4080]/20">
                            <div className="text-[10px] text-gray-500 mb-1 font-bold">世界への影響</div>
                            <div className="flex gap-2 text-[10px]">
                                {quest.impacts.order > 0 && <span className="text-blue-400">秩序↑</span>}
                                {quest.impacts.chaos > 0 && <span className="text-purple-400">混沌↑</span>}
                                {quest.impacts.justice > 0 && <span className="text-amber-400">正義↑</span>}
                                {quest.impacts.evil > 0 && <span className="text-red-400">悪↑</span>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="px-4 pb-4">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-[#122042] border border-[#2a4080]/50 text-gray-300 hover:text-white hover:bg-[#1a2d5a] text-sm font-bold rounded-lg transition-all active:scale-[0.98]"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
