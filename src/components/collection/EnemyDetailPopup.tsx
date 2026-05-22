'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Skull, Heart, Swords, Shield, Star, Coins } from 'lucide-react';
import type { CollectionEnemyEntry } from '@/types/collection';

interface Props {
    enemy: CollectionEnemyEntry;
    onClose: () => void;
}

export default function EnemyDetailPopup({ enemy, onClose }: Props) {
    const [imgError, setImgError] = useState(false);
    const imgSrc = `/images/enemies/${enemy.slug}.png`;

    const stats = [
        { icon: Heart, label: 'HP', value: enemy.hp, color: 'text-red-400' },
        { icon: Swords, label: 'ATK', value: enemy.atk, color: 'text-orange-400' },
        { icon: Shield, label: 'DEF', value: enemy.def, color: 'text-blue-400' },
        { icon: Star, label: 'EXP', value: enemy.exp_reward, color: 'text-emerald-400' },
        { icon: Coins, label: 'Gold', value: enemy.gold_reward, color: 'text-yellow-400' },
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
                {/* Enemy Image */}
                <div className="relative bg-gradient-to-b from-[#1a2d5a] to-[#0d1a2e] flex items-center justify-center p-4 h-48 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent" />

                    {!imgError ? (
                        <img
                            src={imgSrc}
                            alt={enemy.name || ''}
                            className="relative z-10 max-h-40 object-contain drop-shadow-[0_4px_24px_rgba(200,0,0,0.3)]"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                            <div className="w-20 h-20 rounded-full bg-red-950/50 border-2 border-red-900/50 flex items-center justify-center">
                                <span className="text-3xl">👹</span>
                            </div>
                            <span className="text-xs text-gray-500 italic">画像未登録</span>
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Name + Level */}
                <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white font-serif tracking-wide">{enemy.name}</h3>
                        {enemy.level != null && (
                            <span className="text-xs text-gray-400 font-mono bg-[#1a2d5a] px-2 py-0.5 rounded border border-[#2a4080]/50">
                                Lv.{enemy.level}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                        No.{String(enemy.id).padStart(4, '0')} — {enemy.slug}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="px-5 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                        {stats.filter(s => s.value != null).map(stat => (
                            <div
                                key={stat.label}
                                className="bg-[#122042]/60 rounded-lg p-2 border border-[#2a4080]/30 flex flex-col items-center"
                            >
                                <stat.icon size={14} className={stat.color} />
                                <span className="text-[9px] text-gray-500 mt-0.5">{stat.label}</span>
                                <span className={`text-sm font-bold font-mono ${stat.color}`}>
                                    {stat.value?.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Drop Item */}
                    {enemy.drop_item_name && (
                        <div className="mt-3 bg-amber-950/20 rounded-lg p-2.5 border border-amber-900/30 flex items-center gap-2">
                            <span className="text-amber-500 text-sm">📦</span>
                            <div>
                                <p className="text-[9px] text-amber-600">ドロップアイテム</p>
                                <p className="text-xs text-amber-400 font-bold">{enemy.drop_item_name}</p>
                            </div>
                        </div>
                    )}
                </div>

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
