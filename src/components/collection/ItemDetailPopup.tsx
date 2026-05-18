'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatEffectData, getItemTypeLabel, getItemTypeBorderColor, getItemImageUrl, getEffectList } from '@/lib/itemUtils';

interface ItemData {
    id: number;
    slug: string;
    name: string;
    type: string;
    sub_type?: string;
    base_price?: number;
    effect_data?: any;
    deck_cost?: number;
    image_url?: string;
}

interface Props {
    item: ItemData;
    onClose: () => void;
}

export default function ItemDetailPopup({ item, onClose }: Props) {
    const isSkill = item.type === 'skill' || item.type === 'skill_card';
    const typeLabel = getItemTypeLabel(item.type || (isSkill ? 'skill' : 'equipment'));
    const typeBorder = getItemTypeBorderColor(item.type || 'equipment');
    const imgSrc = item.image_url || (item.slug ? getItemImageUrl(item.slug) : null);
    const effectList = item.effect_data ? getEffectList(item.effect_data) : [];
    const description = item.effect_data?.description || item.effect_data?.flavor_text || null;

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
                        {imgSrc ? (
                            <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">{isSkill ? '⚡' : item.type === 'consumable' ? '✨' : '⚔️'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">{item.name}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeBorder} text-gray-300 bg-[#122042] flex-shrink-0`}>
                                {typeLabel}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono">
                            No.{String(item.id).padStart(4, '0')}
                        </p>
                        {item.base_price != null && item.base_price > 0 && (
                            <div className="text-yellow-400 font-mono font-bold text-sm mt-0.5">
                                {item.base_price.toLocaleString()} G
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

                {/* Effects */}
                <div className="p-4 space-y-3">
                    {effectList.length > 0 && (
                        <div className="bg-[#122042]/60 rounded-lg p-3 border border-[#2a4080]/30">
                            <div className="text-[10px] text-gray-500 mb-1.5">効果</div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {effectList.map((eff: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-black/30 rounded px-2 py-1 border border-[#2a4080]/20">
                                        <span className="text-[10px] text-gray-400">{eff.label}</span>
                                        <span className={`text-xs font-bold ${eff.color}`}>{eff.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isSkill && item.deck_cost != null && (
                        <div className="bg-blue-950/30 rounded-lg p-2.5 border border-blue-900/30 flex items-center gap-2">
                            <span className="text-blue-400 text-sm">🃏</span>
                            <div>
                                <p className="text-[9px] text-blue-500">デッキコスト</p>
                                <p className="text-xs text-blue-300 font-bold font-mono">{item.deck_cost}</p>
                            </div>
                        </div>
                    )}

                    {description && (
                        <div className="bg-amber-950/20 rounded-lg p-3 border border-amber-900/30">
                            <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                「{description}」
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
