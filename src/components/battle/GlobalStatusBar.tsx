import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Heart, Zap, ChevronDown, ChevronUp, Users, Flame } from 'lucide-react';
import { PartyMember } from '@/types/game';

interface GlobalStatusBarProps {
    viewMode: 'scenario' | 'battle';
}

export default function GlobalStatusBar({ viewMode }: GlobalStatusBarProps) {
    const { userProfile, battleState, selectedScenario } = useGameStore();
    const [party, setParty] = useState<PartyMember[]>([]);
    const [partyExpanded, setPartyExpanded] = useState(false);

    useEffect(() => {
        if (userProfile?.id) {
            fetch(`/api/party/list?owner_id=${userProfile.id}`)
                .then(res => res.json())
                .then(data => setParty(data.party || []))
                .catch(err => console.error("Party fetch error", err));
        }
    }, [userProfile?.id]);

    if (!userProfile) return null;

    const hpPercent = Math.min(100, Math.max(0, ((userProfile?.hp ?? 0) / Math.max(1, userProfile?.max_hp ?? 1)) * 100));
    const apPercent = Math.min(100, Math.max(0, ((battleState.current_ap ?? 0) / 10) * 100)); // Max AP 10
    const isVitalityCritical = (userProfile?.vitality ?? 100) <= 20;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 shadow-md">
            {/* Ticker / Current Quest */}
            {selectedScenario && (
                <div className="bg-amber-900/40 text-amber-200 text-xs py-1 px-4 text-center truncate border-b border-amber-900/50 flex items-center justify-center gap-2">
                    <span className="animate-pulse w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
                    {selectedScenario.script_data?.short_description || selectedScenario.short_description || selectedScenario.title}
                </div>
            )}

            <div className="flex items-center justify-between p-2 md:px-4">
                {/* User Info & Bars */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-900 overflow-hidden shrink-0 relative">
                        <img src={userProfile.avatar_url || '/avatars/default.png'} alt="Avatar" className="w-full h-full object-cover" />
                        {isVitalityCritical && (
                            <div className="absolute inset-0 bg-red-500/20 animate-pulse mix-blend-overlay"></div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-white truncate pr-2">{userProfile.name}</span>
                            <span className={`flex items-center gap-1 ${isVitalityCritical ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                <Flame className="w-3 h-3" />
                                {userProfile?.vitality ?? 100}
                            </span>
                        </div>
                        {/* HP Bar */}
                        <div className="relative h-2.5 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
                            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-mono drop-shadow-md">
                                {userProfile?.hp ?? 0}/{userProfile?.max_hp ?? 1}
                            </div>
                        </div>
                        {/* AP Bar (only relevant in battle, but good to show as resource) */}
                        {viewMode === 'battle' && (
                            <div className="relative h-2 bg-gray-900 rounded-full border border-gray-700 overflow-hidden mt-0.5">
                                <div className="absolute inset-y-0 left-0 bg-cyan-500 transition-all duration-300" style={{ width: `${apPercent}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-mono drop-shadow-md">
                                    AP: {battleState.current_ap}/10
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Party Accordion Widget */}
                {party.length > 0 && (
                    <div className="relative ml-2 shrink-0">
                        <button
                            onClick={() => setPartyExpanded(!partyExpanded)}
                            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full px-2 py-1 transition-colors"
                        >
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-gray-300 font-bold">{party.length}</span>
                            {partyExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                        </button>

                        {/* Dropdown / Expanded View */}
                        {partyExpanded && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[60] animate-in slide-in-from-top-2">
                                <div className="p-2 space-y-2">
                                    {party.map(member => (
                                        <div key={member.id} className="flex items-center gap-2 p-1 bg-black/40 rounded border border-gray-800">
                                            <img src={member.icon_url || member.image_url || '/avatars/default.png'} className="w-6 h-6 rounded-full object-cover shrink-0 bg-gray-800" />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] text-blue-300 font-bold truncate">{member.name}</div>
                                                <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                    <Heart className="w-2.5 h-2.5 text-green-500" />
                                                    {member.durability}/{member.max_durability}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
