import React from 'react';
import { Bed, Activity, ShoppingBag, Church, Shield } from 'lucide-react';

export type FacilityType = 'inn' | 'map' | 'status' | 'settings' | 'shop' | 'temple' | 'guild';

interface FacilityGridProps {
    onSelectFacility: (facility: FacilityType) => void;
    isHub?: boolean;
}

export default function FacilityGrid({ onSelectFacility, isHub = false }: FacilityGridProps) {
    // 通常拠点: 宿屋/酒場 → ギルド/道具屋 → 神殿 → ステータス
    const locationFacilities: { id: FacilityType; label: string; sub: string; icon: any }[] = [
        { id: 'inn', label: '宿屋/酒場', sub: 'Inn', icon: Bed },
        { id: 'guild', label: 'ギルド', sub: 'Guild', icon: Shield },
        { id: 'shop', label: '道具屋', sub: 'Shop', icon: ShoppingBag },
        { id: 'temple', label: '神殿', sub: 'Temple', icon: Church },
        { id: 'status', label: 'ステータス', sub: 'Status', icon: Activity },
    ];

    // ハブ: 宿屋/ステータスのみ
    const hubFacilities: { id: FacilityType; label: string; sub: string; icon: any }[] = [
        { id: 'inn', label: '宿屋', sub: 'Rest', icon: Bed },
        { id: 'status', label: 'ステータス', sub: 'Status', icon: Activity },
    ];

    const facilities = isHub ? hubFacilities : locationFacilities;

    return (
        <div className="px-4 py-6 grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
            {facilities.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelectFacility(item.id)}
                    className="flex items-center gap-3 p-3 md:p-4 bg-[#122042]/80 border border-[#2a4080]/50 rounded-xl hover:bg-[#1a2d5a] hover:border-amber-500/30 transition-all active:scale-95 text-left group shadow-lg shadow-[#0a1628]/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                >
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-500/20 transition-colors">
                        <item.icon size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] text-blue-200/50 font-bold uppercase tracking-widest">{item.sub}</p>
                        <p className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">{item.label}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
