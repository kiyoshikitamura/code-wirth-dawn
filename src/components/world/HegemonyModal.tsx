'use client';

import React from 'react';
import { X, Trophy, ShieldAlert, AlertCircle, MapPin } from 'lucide-react';
import { WorldState } from '@/types/game';

interface Props {
    worldState: WorldState | null;
    onClose: () => void;
}

export default function HegemonyModal({ worldState, onClose }: Props) {
    if (!worldState) return null;

    const hegemony = worldState.hegemony || [
        { name: "ローランド", power: 25, locations: 0, color: "bg-blue-600" },
        { name: "マーカンド", power: 25, locations: 0, color: "bg-emerald-600" },
        { name: "華龍神朝", power: 25, locations: 0, color: "bg-red-600" },
        { name: "夜刀神国", power: 25, locations: 0, color: "bg-purple-700" }
    ];

    const controllingNation = worldState.controlling_nation === 'Neutral' ? '中立 (支配国なし)' : worldState.controlling_nation;

    const nationMap: Record<string, string> = {
        'Roland': '蒼なるローランド聖王国',
        'Markand': '翠なるマーカンド連邦',
        'Karyu': '紅なる華龍神朝',
        'Yato': '宵なる夜刀神国',
        'Neutral': '中立'
    };
    const cNationJp = worldState.controlling_nation ? (nationMap[worldState.controlling_nation] || controllingNation) : controllingNation;

    const totalLocations = hegemony.reduce((sum: number, n: any) => sum + (n.locations || 0), 0);

    return (
        <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a120b] border-2 border-[#a38b6b] w-full max-w-sm shadow-2xl relative p-5 pb-6 text-slate-200 slide-in-from-top-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-serif font-bold text-[#e3d5b8] mb-5 flex items-center gap-2 border-b border-[#a38b6b]/40 pb-2">
                    <Trophy className="text-amber-500 w-5 h-5" />
                    世界の覇権
                </h2>

                <div className="mb-6 space-y-3">
                    <div className="flex justify-between items-center text-sm border border-slate-700 bg-black/40 p-2 rounded">
                        <span className="text-slate-400 font-bold w-20">現在地</span>
                        <span className="font-bold text-amber-100 flex-1 text-right truncate pl-2">{worldState.location_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border border-slate-700 bg-black/40 p-2 rounded">
                        <span className="text-slate-400 font-bold w-20">統治国家</span>
                        <span className="font-bold text-slate-100 flex-1 text-right flex items-center justify-end gap-1 truncate pl-2">
                            {worldState.controlling_nation !== 'Neutral' && <ShieldAlert size={14} className="text-amber-500" />}
                            {cNationJp}
                        </span>
                    </div>
                </div>

                <div className="mb-2">
                    <h3 className="text-sm font-bold text-[#a38b6b] mb-3 border-b border-[#3e2723] pb-1">大国勢力分布</h3>
                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700 shadow-inner mb-4">
                        {hegemony.map((n: any, idx: number) => (
                            <div key={idx} className={`h-full ${n.color}`} style={{ width: `${n.power}%` }} title={`${n.name}: ${n.locations || 0}拠点`} />
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {hegemony.map((n: any, idx: number) => (
                            <div key={idx} className="bg-black/40 p-2 border border-slate-800 rounded flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${n.color} border border-slate-400`} />
                                    <span className="text-xs font-bold text-slate-300">{n.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={10} className="text-slate-500" />
                                    <span className="text-sm font-mono font-bold text-amber-500">{n.locations || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalLocations > 0 && (
                        <p className="text-[9px] text-slate-600 text-right mt-2">全 {totalLocations} 拠点</p>
                    )}
                </div>

                <div className="mt-5 p-3 bg-blue-900/10 border border-blue-900/30 rounded text-xs text-blue-200/80 leading-relaxed font-serif flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    <p>
                        各国の勢力は、プレイヤーのクエスト達成や支援活動によって日々変動します。覇権を握る国家は世界の情勢や物価に影響を与えます。
                    </p>
                </div>
            </div>
        </div>
    );
}
