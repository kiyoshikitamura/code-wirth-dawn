'use client';

import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';

interface DebugInventoryPanelProps {
    userId?: string;
    onRefresh: () => void;
}

export default function DebugInventoryPanel({ userId, onRefresh }: DebugInventoryPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        if (items.length > 0 || skills.length > 0) return;
        setLoading(true);
        try {
            const res = await fetch('/api/debug/inventory');
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                setSkills(data.skills || []);
            }
        } catch (e) {
            console.error('[DebugInventory] fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) fetchData();
    };

    const handleGive = async (type: 'item' | 'skill', id: number, name: string) => {
        if (!userId) return alert('User ID is missing');
        if (!window.confirm(`[${name}] をインベントリに追加しますか？`)) return;

        try {
            const res = await fetch('/api/debug/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type, id })
            });
            if (res.ok) {
                alert('追加しました');
                onRefresh();
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    const filterData = (data: any[]) => {
        if (!filter) return data;
        const lf = filter.toLowerCase();
        return data.filter(d => 
            (d.name && d.name.toLowerCase().includes(lf)) || 
            (d.slug && d.slug.toLowerCase().includes(lf)) || 
            String(d.id).includes(lf)
        );
    };

    const filteredItems = filterData(items);
    const filteredSkills = filterData(skills);

    return (
        <div className="w-[90%] max-w-xs mt-2">
            <button
                onClick={handleToggle}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-950 to-emerald-900 border-2 border-emerald-600 rounded-xl text-sm font-bold text-emerald-200 hover:from-emerald-900 hover:to-emerald-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
                <Package size={16} />
                インベントリ追加 (Debug)
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="mt-2 bg-[#0d1b3e]/90 border border-emerald-800/60 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-emerald-800/40">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400/50" />
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="ID / 名前 / slug で検索..."
                                className="w-full pl-7 pr-2 py-1.5 bg-[#070e1e] border border-emerald-800/40 rounded-lg text-[11px] text-emerald-200 placeholder-emerald-500/50 outline-none focus:border-emerald-500/60"
                            />
                        </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2">
                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[11px] text-emerald-400/70">読み込み中...</span>
                            </div>
                        ) : (
                            <>
                                <div className="sticky top-0 px-3 py-1.5 bg-emerald-950/90 border-b border-emerald-800/30 text-[10px] font-bold text-emerald-300/80 tracking-wider backdrop-blur-sm z-10">
                                    ⚔️ アイテム ({filteredItems.length})
                                </div>
                                {filteredItems.map(item => (
                                    <button
                                        key={`item-${item.id}`}
                                        onClick={() => handleGive('item', item.id, item.name)}
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-emerald-900/30 transition-colors border-b border-emerald-800/20 group text-left"
                                    >
                                        <span className="text-[10px] font-mono text-emerald-500 w-8 shrink-0">{item.id}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] text-emerald-100 truncate group-hover:text-white transition-colors">{item.name}</div>
                                            <div className="text-[9px] text-emerald-500/70 truncate">{item.slug} | {item.type}</div>
                                        </div>
                                        <Plus size={14} className="text-emerald-400/40 group-hover:text-emerald-300 transition-colors shrink-0" />
                                    </button>
                                ))}

                                <div className="sticky top-0 px-3 py-1.5 bg-emerald-950/90 border-y border-emerald-800/30 text-[10px] font-bold text-emerald-300/80 tracking-wider backdrop-blur-sm z-10">
                                    ✨ スキル ({filteredSkills.length})
                                </div>
                                {filteredSkills.map(skill => (
                                    <button
                                        key={`skill-${skill.id}`}
                                        onClick={() => handleGive('skill', skill.id, skill.name)}
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-emerald-900/30 transition-colors border-b border-emerald-800/20 group text-left"
                                    >
                                        <span className="text-[10px] font-mono text-emerald-500 w-8 shrink-0">{skill.id}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] text-emerald-100 truncate group-hover:text-white transition-colors">{skill.name}</div>
                                            <div className="text-[9px] text-emerald-500/70 truncate">{skill.slug}</div>
                                        </div>
                                        <Plus size={14} className="text-emerald-400/40 group-hover:text-emerald-300 transition-colors shrink-0" />
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
