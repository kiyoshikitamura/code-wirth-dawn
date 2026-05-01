'use client';

import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';

interface DebugPartyPanelProps {
    userId?: string;
}

export default function DebugPartyPanel({ userId }: DebugPartyPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [npcs, setNpcs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        if (npcs.length > 0) return;
        setLoading(true);
        try {
            const res = await fetch('/api/debug/party');
            if (res.ok) {
                const data = await res.json();
                setNpcs(data.npcs || []);
            }
        } catch (e) {
            console.error('[DebugParty] fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) fetchData();
    };

    const handleAdd = async (id: number, name: string) => {
        if (!userId) return alert('User ID is missing');
        if (!window.confirm(`[${name}] をパーティに加入させますか？`)) return;

        try {
            const res = await fetch('/api/debug/party', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, npcId: id })
            });
            if (res.ok) {
                alert('加入しました');
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    const filteredNpcs = npcs.filter(d => {
        if (!filter) return true;
        const lf = filter.toLowerCase();
        return (d.name && d.name.toLowerCase().includes(lf)) || 
               (d.slug && d.slug.toLowerCase().includes(lf)) || 
               String(d.id).includes(lf);
    });

    return (
        <div className="w-[90%] max-w-xs mt-2">
            <button
                onClick={handleToggle}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-950 to-cyan-900 border-2 border-cyan-600 rounded-xl text-sm font-bold text-cyan-200 hover:from-cyan-900 hover:to-cyan-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
            >
                <Users size={16} />
                NPC加入 (Debug)
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="mt-2 bg-[#0d1b3e]/90 border border-cyan-800/60 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-cyan-800/40">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-cyan-400/50" />
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="ID / 名前 / slug で検索..."
                                className="w-full pl-7 pr-2 py-1.5 bg-[#070e1e] border border-cyan-800/40 rounded-lg text-[11px] text-cyan-200 placeholder-cyan-500/50 outline-none focus:border-cyan-500/60"
                            />
                        </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2">
                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[11px] text-cyan-400/70">読み込み中...</span>
                            </div>
                        ) : filteredNpcs.length === 0 ? (
                            <div className="py-6 text-center text-[11px] text-cyan-400/50">該当なし</div>
                        ) : (
                            filteredNpcs.map(npc => (
                                <button
                                    key={`npc-${npc.id}`}
                                    onClick={() => handleAdd(npc.id, npc.name)}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-cyan-900/30 transition-colors border-b border-cyan-800/20 group text-left"
                                >
                                    <span className="text-[10px] font-mono text-cyan-500 w-8 shrink-0">{npc.id}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] text-cyan-100 truncate group-hover:text-white transition-colors">{npc.name}</div>
                                        <div className="text-[9px] text-cyan-500/70 truncate">{npc.slug} | {npc.job_class}</div>
                                    </div>
                                    <Plus size={14} className="text-cyan-400/40 group-hover:text-cyan-300 transition-colors shrink-0" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
