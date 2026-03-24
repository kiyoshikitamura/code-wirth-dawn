import React from 'react';
import { Bed, Map as MapIcon, Settings, Activity } from 'lucide-react';

export type FacilityType = 'inn' | 'map' | 'status' | 'settings';

interface FacilityGridProps {
    onSelectFacility: (facility: FacilityType) => void;
}

export default function FacilityGrid({ onSelectFacility }: FacilityGridProps) {
    const facilities: { id: FacilityType; label: string; sub: string; icon: any }[] = [
        { id: 'inn', label: '宿屋', sub: 'Rest', icon: Bed },
        { id: 'map', label: 'ワールドマップ', sub: 'Map', icon: MapIcon },
        { id: 'status', label: 'ステータス', sub: 'Status', icon: Activity },
        { id: 'settings', label: '設定', sub: 'Settings', icon: Settings },
    ];

    return (
        <div className="px-4 py-6 grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
            {facilities.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelectFacility(item.id)}
                    className="flex items-center gap-3 p-3 md:p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all active:scale-95 text-left group shadow-lg focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                >
                    <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500 group-hover:text-amber-400 group-hover:bg-amber-900/40 transition-colors">
                        <item.icon size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.sub}</p>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
