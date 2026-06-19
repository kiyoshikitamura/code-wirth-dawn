import React from 'react';
import { Bed, Activity, ShoppingBag, Church, Shield, BookOpen, ClipboardList, Trophy, Swords, Sparkles } from 'lucide-react';

export type FacilityType = 'inn' | 'map' | 'status' | 'settings' | 'shop' | 'temple' | 'guild' | 'gossip' | 'collection' | 'questLog' | 'ranking' | 'ugcGuild' | 'colosseum' | 'magicAcademy';

interface FacilityGridProps {
    onSelectFacility: (facility: FacilityType) => void;
    isHub?: boolean;
    recommendedFacility?: string | null;
}

export default function FacilityGrid({ onSelectFacility, isHub = false, recommendedFacility = null }: FacilityGridProps) {
    // 通常拠点: 宿屋/酒場 → ギルド → 道具屋 → 神殿 → ステータス → コロシアム
    const locationFacilities: { id: FacilityType; label: string; sub: string; icon: any }[] = [
        { id: 'inn', label: '宿屋/酒場', sub: 'Inn', icon: Bed },
        { id: 'guild', label: 'ギルド', sub: 'Guild', icon: Shield },
        { id: 'shop', label: '道具屋', sub: 'Shop', icon: ShoppingBag },
        { id: 'temple', label: '神殿', sub: 'Temple', icon: Church },
        { id: 'magicAcademy', label: '魔術学院', sub: 'Magic Academy', icon: Sparkles },
        { id: 'status', label: 'ステータス', sub: 'Status', icon: Activity },
        { id: 'colosseum', label: 'コロシアム', sub: 'Colosseum', icon: Swords },
    ];

    // ハブ: 宿屋/ステータスのみ
    const hubFacilities: { id: FacilityType; label: string; sub: string; icon: any }[] = [
        { id: 'inn', label: '宿屋', sub: 'Rest', icon: Bed },
        { id: 'ugcGuild', label: 'ギルド', sub: 'UGC Quest Board', icon: Shield },
        { id: 'status', label: 'ステータス', sub: 'Status', icon: Activity },
        { id: 'collection', label: 'コレクション', sub: 'Collection', icon: BookOpen },
        { id: 'questLog', label: 'クエスト記録', sub: 'Quest Log', icon: ClipboardList },
        { id: 'ranking', label: 'ランキング', sub: 'Ranking', icon: Trophy },
    ];

    const facilities = isHub ? hubFacilities : locationFacilities;

    const handleSelect = (id: FacilityType) => {
        onSelectFacility(id);
    };

    return (
        <div className="px-4 pt-6 pb-2 grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
            {facilities.map((item) => {
                const isRecommended = (item.id === 'guild' && recommendedFacility === 'guild') ||
                                       (item.id === 'ugcGuild' && recommendedFacility === 'guild') ||
                                       (item.id === 'inn' && recommendedFacility === 'inn') ||
                                       (item.id === 'shop' && recommendedFacility === 'shop');

                return (
                    <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`flex items-center gap-3 p-3 md:p-4 bg-[#122042]/80 border rounded-xl hover:bg-[#1a2d5a] transition-all active:scale-95 text-left group shadow-lg shadow-[#0a1628]/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50 ${
                            isRecommended
                                ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                                : 'border-[#2a4080]/50 hover:border-amber-500/30'
                        }`}
                    >
                        <div className="relative p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-500/20 transition-colors">
                            <item.icon size={20} />
                            {isRecommended && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full flex items-center justify-center text-[7px] text-white font-black px-1 py-0.5 shadow-lg border border-[#122042] scale-95 leading-none">推奨</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] text-blue-200/50 font-bold uppercase tracking-widest truncate">{item.sub}</p>
                            <p className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors whitespace-nowrap">{item.label}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
