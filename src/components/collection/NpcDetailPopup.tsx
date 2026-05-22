'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Swords, Shield, ShieldCheck, Coins, User } from 'lucide-react';
import { toJpJobClass } from '@/lib/jobClass';
import type { CollectionNpcEntry } from '@/types/collection';

interface Props {
    npc: CollectionNpcEntry;
    onClose: () => void;
}

export default function NpcDetailPopup({ npc, onClose }: Props) {
    const [imgError, setImgError] = useState(false);
    const imgSrc = `/images/npcs/${npc.slug}.png`;

    const stats = [
        { icon: Heart, label: 'HP', value: npc.max_hp, color: 'text-red-400' },
        { icon: Swords, label: 'ATK', value: npc.attack, color: 'text-orange-400' },
        { icon: Shield, label: 'DEF', value: npc.defense, color: 'text-blue-400' },
        { icon: ShieldCheck, label: '庇い率', value: npc.cover_rate != null ? `${npc.cover_rate}%` : null, color: 'text-emerald-400' },
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-[#0d1a2e] border-2 border-[#2a4080]/70 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* NPC Image */}
                <div className="relative bg-gradient-to-b from-[#1a2d5a] to-[#0d1a2e] flex items-center justify-center p-4 h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent" />

                    {!imgError ? (
                        <img
                            src={imgSrc}
                            alt={npc.name || ''}
                            className="relative z-10 max-h-40 object-contain drop-shadow-[0_4px_24px_rgba(200,160,0,0.25)]"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                            <div className="w-20 h-20 rounded-full bg-amber-950/50 border-2 border-amber-900/50 flex items-center justify-center">
                                <User size={32} className="text-amber-400/60" />
                            </div>
                            <span className="text-xs text-gray-500 italic">画像未登録</span>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Name + Job */}
                <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            {npc.epithet && (
                                <p className="text-[10px] text-amber-400/70 font-bold tracking-wider">{npc.epithet}</p>
                            )}
                            <h3 className="text-lg font-bold text-white font-serif tracking-wide">{npc.name}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            {npc.level != null && (
                                <span className="text-xs text-gray-400 font-mono bg-[#1a2d5a] px-2 py-0.5 rounded border border-[#2a4080]/50">
                                    Lv.{npc.level}
                                </span>
                            )}
                            {npc.job_class && (
                                <span className="text-[9px] text-gray-500">
                                    {toJpJobClass(npc.job_class)}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                        No.{String(npc.id).padStart(4, '0')} — {npc.slug}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="px-5 pb-3">
                    <div className="grid grid-cols-4 gap-2">
                        {stats.filter(s => s.value != null).map(stat => (
                            <div
                                key={stat.label}
                                className="bg-[#122042]/60 rounded-lg p-2 border border-[#2a4080]/30 flex flex-col items-center"
                            >
                                <stat.icon size={14} className={stat.color} />
                                <span className="text-[9px] text-gray-500 mt-0.5">{stat.label}</span>
                                <span className={`text-sm font-bold font-mono ${stat.color}`}>
                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Hire Cost */}
                    {npc.hire_cost != null && npc.hire_cost > 0 && (
                        <div className="mt-2 bg-yellow-950/20 rounded-lg p-2 border border-yellow-900/30 flex items-center gap-2">
                            <Coins size={14} className="text-yellow-400" />
                            <div>
                                <p className="text-[9px] text-yellow-600">雇用費</p>
                                <p className="text-xs text-yellow-400 font-bold font-mono">{npc.hire_cost.toLocaleString()} G</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Introduction / Flavor */}
                {npc.introduction && (
                    <div className="px-5 pb-3">
                        <div className="bg-amber-950/20 rounded-lg p-3 border border-amber-900/30">
                            <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                {npc.introduction}
                            </p>
                        </div>
                    </div>
                )}

                {/* Close button */}
                <div className="px-5 pb-4">
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
