import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/authToken';

interface HeroicRecordsModalProps {
    userId: string;
    onClose: () => void;
}

interface ShadowSummary {
    profile_id: string;
    name: string;
    epithet: string;
    level: number;
    job_class: string;
    contract_fee: number;
    stats: {
        hp: number;
        atk: number;
        def: number;
    };
    signature_deck_preview: string[];
    icon_url?: string;
    image_url?: string;
    npc_image_url?: string;
    equipped_items?: { slot: string; name: string }[];
}

export default function HeroicRecordsModal({ userId, onClose }: HeroicRecordsModalProps) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [heroics, setHeroics] = useState<ShadowSummary[]>([]);
    const [selectedHeroic, setSelectedHeroic] = useState<ShadowSummary | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchHeroics = async () => {
        setLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/tavern/my-heroic?user_id=${userId}`, {
                headers: authHeaders
            });
            const data = await res.json();
            if (data.heroics) {
                setHeroics(data.heroics);
            }
        } catch (e) {
            console.error("Failed to fetch my heroics", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchHeroics();
        }
    }, [userId]);

    const toJpJobClass = (cls: string) => {
        const map: Record<string, string> = {
            'Warrior': '戦士',
            'Mage': '魔術師',
            'Priest': '僧侶',
            'Thief': '盗賊',
            'Hero': '勇者',
            'Adventurer': '冒険者'
        };
        return map[cls] || cls;
    };

    const toJpSlotName = (slot: string) => {
        const map: Record<string, string> = {
            weapon: '武器',
            armor: '防具',
            accessory_1: '装飾品1',
            accessory_2: '装飾品2'
        };
        return map[slot] || slot;
    };

    if (!mounted) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[#1e1512] border border-[#8b5a2b]/40 w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[85vh] text-[#e3d5b8] font-serif">
                    {/* Header */}
                    <header className="flex items-center justify-between px-4 py-3 border-b border-[#8b5a2b]/30 bg-[#2d1b15]">
                        <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                            <Star size={14} className="text-amber-400 fill-amber-400/20" /> 英霊の記録
                        </h3>
                        <button onClick={onClose} className="p-1 text-[#8b6f4e] hover:text-[#e3d5b8] bg-black/20 rounded-full hover:bg-black/40 transition-colors">
                            <X size={16} />
                        </button>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="h-40 flex flex-col items-center justify-center gap-2 text-[#8b5a2b] font-serif">
                                <Loader2 className="w-6 h-6 animate-spin text-[#8b5a2b]" />
                                <span className="animate-pulse text-xs">英霊の記録を紐解いています...</span>
                            </div>
                        ) : heroics.length === 0 ? (
                            <div className="text-center text-[#8b6f4e] text-xs py-10 font-serif italic space-y-1">
                                <p>英霊の記録はまだありません。</p>
                                <p className="text-[10px] opacity-70">キャラクターが旅を終える（引退する）と、ここに刻まれます。</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {heroics.map((h, idx) => {
                                    const displayName = h.epithet ? `${h.epithet} ${h.name}` : h.name;
                                    return (
                                        <div
                                            key={h.profile_id || idx}
                                            onClick={() => setSelectedHeroic(h)}
                                            className="flex items-center justify-between p-3 border border-[#8b5a2b]/30 rounded bg-gradient-to-r from-[#2c1d18] to-[#1e1512] hover:from-[#3a2720] hover:to-[#2c1d18] transition-all cursor-pointer active:scale-[0.99]"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-full bg-amber-950/40 border border-[#8b5a2b]/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    {h.image_url ? (
                                                        <img src={h.image_url} alt={h.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Star size={14} className="text-amber-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-amber-100 truncate">{displayName}</div>
                                                    <div className="text-[10px] text-[#8b6f4e] mt-0.5">Lv.{h.level} {toJpJobClass(h.job_class)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pl-2">
                                                <div className="text-[10px] text-[#8b6f4e]">詳細はこちら</div>
                                                <span className="text-[11px] font-mono text-amber-500 font-bold">{h.contract_fee.toLocaleString()} G</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Heroic Detail Dialog */}
            {selectedHeroic && (
                <div className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4" onClick={() => setSelectedHeroic(null)}>
                    <div className="bg-[#0f172a] border border-purple-900/50 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100 font-sans" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 p-4 flex items-center gap-3 border-b border-purple-900/30">
                            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                                {selectedHeroic.image_url ? (
                                    <img src={selectedHeroic.image_url} alt={selectedHeroic.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Star size={20} className="text-purple-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">{selectedHeroic.epithet || '歴史に刻まれし英雄'}</div>
                                <h3 className="text-sm font-bold truncate text-slate-100">{selectedHeroic.name}</h3>
                                <div className="text-[10px] text-slate-400 mt-0.5">Lv.{selectedHeroic.level} | {toJpJobClass(selectedHeroic.job_class)}</div>
                            </div>
                        </div>

                        {/* Details body */}
                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Stats */}
                            <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                                <div className="text-[10px] text-purple-400 mb-1.5 font-bold">基本ステータス</div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/30 p-1.5 rounded"><div className="text-[9px] text-slate-500">HP</div><div className="text-xs font-bold text-green-400 font-mono">{selectedHeroic.stats.hp}</div></div>
                                    <div className="bg-black/30 p-1.5 rounded"><div className="text-[9px] text-slate-500">ATK</div><div className="text-xs font-bold text-red-400 font-mono">{selectedHeroic.stats.atk}</div></div>
                                    <div className="bg-black/30 p-1.5 rounded"><div className="text-[9px] text-slate-500">DEF</div><div className="text-xs font-bold text-slate-300 font-mono">{selectedHeroic.stats.def}</div></div>
                                </div>
                            </div>

                            {/* Equipment */}
                            {selectedHeroic.equipped_items && selectedHeroic.equipped_items.length > 0 && (
                                <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                                    <div className="text-[10px] text-purple-400 mb-2 font-bold font-sans">引退時の装備</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                                        {selectedHeroic.equipped_items.map((eq, i) => (
                                            <div key={i} className="flex justify-between items-center bg-[#131d31] p-1.5 rounded border border-slate-800">
                                                <span className="font-bold text-[9px] uppercase tracking-wide text-purple-400 bg-purple-950/40 px-1 rounded flex-shrink-0">
                                                    {toJpSlotName(eq.slot)}
                                                </span>
                                                <span className="truncate ml-2 text-[10px] font-medium flex-1 text-right text-slate-200">{eq.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {selectedHeroic.signature_deck_preview && selectedHeroic.signature_deck_preview.length > 0 && (
                                <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                                    <div className="text-[10px] text-purple-400 mb-1.5 font-bold">所持スキル</div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedHeroic.signature_deck_preview.map((card, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-950 text-slate-300 text-[10px] rounded border border-slate-800 font-sans">{card}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer button */}
                        <div className="bg-slate-950/40 p-3 border-t border-slate-900 flex justify-end">
                            <button
                                onClick={() => setSelectedHeroic(null)}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded text-slate-300 transition-colors"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
