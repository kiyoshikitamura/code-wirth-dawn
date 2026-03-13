'use client';

import React from 'react';
import { User, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { PartyMember } from '@/types/game';

interface QuestHeaderProps {
    isSettingsOpen: boolean;
    setIsSettingsOpen: (v: boolean) => void;
    isPartyOpen: boolean;
    setIsPartyOpen: (v: boolean) => void;
    vitalityPulse: boolean;
}

export default function QuestHeader({
    isSettingsOpen,
    setIsSettingsOpen,
    isPartyOpen,
    setIsPartyOpen,
    vitalityPulse
}: QuestHeaderProps) {
    const { userProfile, battleState } = useGameStore();
    const party_members = battleState?.party || [];

    const maxHp = userProfile?.max_hp || 100;
    const hp = userProfile?.hp || 100;
    const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

    const maxMp = userProfile?.max_mp || 50;
    const mp = userProfile?.mp || 50;
    const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100));

    const maxVitality = userProfile?.max_vitality || 100;
    const vitality = userProfile?.vitality ?? maxVitality;
    const vitPercent = Math.max(0, Math.min(100, (vitality / maxVitality) * 100));

    // Party separation
    // Party separation
    const mainMembers = party_members.filter((m: PartyMember) => m.origin_type !== 'quest_guest');
    const guestMembers = party_members.filter((m: PartyMember) => m.origin_type === 'quest_guest');

    return (
        <div className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-md border-b border-amber-900/50 text-slate-200 p-3 shadow-2xl shrink-0">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-full border-2 border-amber-500 overflow-hidden bg-slate-800 flex-shrink-0 relative">
                    {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="You" className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-500">
                            <User size={32} />
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 space-y-1 pr-4">
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div className="h-full bg-green-600 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${mpPercent}%` }} />
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 border border-slate-700 active:scale-95 transition-all"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${vitalityPulse && vitality <= 20 ? 'text-red-500' : 'text-slate-400'}`}>
                            Vitality: {vitality} / {maxVitality}
                        </span>
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-red-600 transition-all duration-300 ${vitalityPulse && vitality <= 20 ? 'opacity-100' : 'opacity-70'}`} style={{ width: `${vitPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800 pt-1">
                <button onClick={() => setIsPartyOpen(!isPartyOpen)} className="w-full flex justify-between items-center py-1 px-1 text-[10px] text-slate-400 uppercase tracking-widest outline-none">
                    <span>Party Composition</span>
                    {isPartyOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {isPartyOpen && (
                    <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar scrollbar-hide">
                        {/* Main Party */}
                        {mainMembers.length > 0 && (
                            <div className="flex-shrink-0 flex items-center gap-2 p-1.5 border border-slate-800 rounded-lg bg-slate-900/50">
                                <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[7px] text-slate-500 uppercase tracking-tighter">Main</span>
                                    <div className="flex gap-2">
                                        {mainMembers.map((m: PartyMember) => {
                                            const mhp = Math.max(0, Math.min(100, (m.durability / Math.max(1, m.max_durability)) * 100));
                                            return (
                                                <div key={m.id} className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden relative">
                                                        {/* Wait, party member image if any, otherwise icon */}
                                                        <User size={16} />
                                                    </div>
                                                    <div className="w-8 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-600" style={{ width: `${mhp}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Guest Party */}
                        {guestMembers.length > 0 && (
                            <div className="flex-shrink-0 flex flex-col gap-1 p-1.5 border border-amber-900/40 rounded-lg bg-amber-950/20">
                                <span className="text-[7px] text-amber-500 uppercase tracking-tighter self-center">Guest</span>
                                <div className="flex gap-2 px-2">
                                    {guestMembers.map((m: PartyMember) => {
                                        const mhp = Math.max(0, Math.min(100, (m.durability / Math.max(1, m.max_durability)) * 100));
                                        return (
                                            <div key={m.id} className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 rounded-full border border-amber-500 bg-amber-900/40 flex items-center justify-center text-amber-200 overflow-hidden">
                                                    <User size={16} />
                                                </div>
                                                <div className="w-8 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${mhp}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
