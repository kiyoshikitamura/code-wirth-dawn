'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Coins, Layers, Zap, Sword, Wand2 } from 'lucide-react';
import type { CollectionSkillEntry } from '@/types/collection';

interface Props {
    skill: CollectionSkillEntry;
    onClose: () => void;
}

export default function SkillDetailPopup({ skill, onClose }: Props) {
    const [imgError, setImgError] = useState(false);
    const imgSrc = skill.image_url || `/images/items/${skill.slug}.png`;
    const isPhysical = skill.card_type === 'Skill';
    const isMagic = skill.card_type === 'Magic';

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
                <div className="bg-gradient-to-r from-[#1a2d5a] to-[#0d1a2e] p-4 flex items-center gap-4 border-b border-[#2a4080]/50">
                    <div className="w-16 h-16 rounded-xl bg-[#122042] border border-[#2a4080]/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {!imgError && imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={skill.name || ''}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <Sparkles size={28} className="text-purple-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">{skill.name}</h3>
                            {skill.card_type && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 flex items-center gap-0.5 ${
                                    isMagic
                                        ? 'border-purple-500/50 text-purple-300 bg-purple-950/30'
                                        : 'border-orange-500/50 text-orange-300 bg-orange-950/30'
                                }`}>
                                    {isMagic ? <Wand2 size={9} /> : <Sword size={9} />}
                                    {isMagic ? '魔法' : '物理'}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono">
                            No.{String(skill.id).padStart(4, '0')}
                        </p>
                        {skill.base_price != null && skill.base_price > 0 && (
                            <div className="text-yellow-400 font-mono font-bold text-sm mt-0.5">
                                {skill.base_price.toLocaleString()} G
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white flex-shrink-0 p-1 self-start"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Stats */}
                <div className="p-4 space-y-3">
                    {/* AP Cost + Deck Cost + Power */}
                    <div className="grid grid-cols-3 gap-2">
                        {skill.card_ap_cost != null && (
                            <div className="bg-[#122042]/60 rounded-lg p-2 border border-[#2a4080]/30 flex flex-col items-center">
                                <Zap size={14} className="text-cyan-400" />
                                <span className="text-[9px] text-gray-500 mt-0.5">AP</span>
                                <span className="text-sm font-bold font-mono text-cyan-400">
                                    {skill.card_ap_cost}
                                </span>
                            </div>
                        )}
                        {skill.deck_cost != null && (
                            <div className="bg-[#122042]/60 rounded-lg p-2 border border-[#2a4080]/30 flex flex-col items-center">
                                <Layers size={14} className="text-blue-400" />
                                <span className="text-[9px] text-gray-500 mt-0.5">デッキ</span>
                                <span className="text-sm font-bold font-mono text-blue-400">
                                    {skill.deck_cost}
                                </span>
                            </div>
                        )}
                        {skill.card_effect_val != null && (
                            <div className="bg-[#122042]/60 rounded-lg p-2 border border-[#2a4080]/30 flex flex-col items-center">
                                {isMagic ? <Wand2 size={14} className="text-purple-400" /> : <Sword size={14} className="text-orange-400" />}
                                <span className="text-[9px] text-gray-500 mt-0.5">威力</span>
                                <span className={`text-sm font-bold font-mono ${isMagic ? 'text-purple-400' : 'text-orange-400'}`}>
                                    {skill.card_effect_val}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {skill.card_description && (
                        <div className="bg-amber-950/20 rounded-lg p-3 border border-amber-900/30">
                            <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                「{skill.card_description}」
                            </p>
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
