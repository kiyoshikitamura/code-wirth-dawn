'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Swords, Package, Sparkles, Users, X } from 'lucide-react';
import { getAuthToken } from '@/lib/authToken';
import { getSessionCache, setSessionCache } from '@/lib/sessionCache';
import EnemyDetailPopup from './EnemyDetailPopup';
import ItemDetailPopup from './ItemDetailPopup';
import SkillDetailPopup from './SkillDetailPopup';
import NpcDetailPopup from './NpcDetailPopup';
import XShareButton from '../shared/XShareButton';
import type {
    CollectionData,
    CollectionEnemyEntry,
    CollectionItemEntry,
    CollectionSkillEntry,
    CollectionNpcEntry,
    ShareDataItem,
} from '@/types/collection';

type TabKey = 'enemies' | 'items' | 'skills' | 'npcs';

interface Props {
    onClose: () => void;
}

const CACHE_KEY = 'collection_data';

export default function CollectionModal({ onClose }: Props) {
    const [data, setData] = useState<CollectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('enemies');
    const [selectedEnemy, setSelectedEnemy] = useState<CollectionEnemyEntry | null>(null);
    const [selectedItem, setSelectedItem] = useState<CollectionItemEntry | null>(null);
    const [selectedSkill, setSelectedSkill] = useState<CollectionSkillEntry | null>(null);
    const [selectedNpc, setSelectedNpc] = useState<CollectionNpcEntry | null>(null);
    const [shareDataList, setShareDataList] = useState<ShareDataItem[]>([]);

    useEffect(() => {
        fetchCollection();
    }, []);

    const fetchCollection = async () => {
        // C3: セッションキャッシュから取得を試みる
        const cached = getSessionCache<CollectionData>(CACHE_KEY);
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        try {
            const token = await getAuthToken();
            if (!token) return;

            const res = await fetch('/api/collection', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setSessionCache(CACHE_KEY, json); // C3: キャッシュに保存
                if (json.share_data_list && json.share_data_list.length > 0) {
                    setShareDataList(json.share_data_list);
                }
            }
        } catch (e) {
            console.error('[Collection] Fetch failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'enemies', label: 'エネミー', icon: Swords },
        { key: 'items', label: 'アイテム', icon: Package },
        { key: 'skills', label: 'スキル', icon: Sparkles },
        { key: 'npcs', label: 'NPC', icon: Users },
    ];

    const currentSection = data?.[activeTab];
    const progressPct = currentSection
        ? Math.round((currentSection.unlocked / Math.max(currentSection.total, 1)) * 100)
        : 0;

    const handleEntryClick = (entry: any) => {
        if (!entry.unlocked) return;
        switch (activeTab) {
            case 'enemies':
                setSelectedEnemy(entry as CollectionEnemyEntry);
                break;
            case 'items':
                setSelectedItem(entry as CollectionItemEntry);
                break;
            case 'skills':
                setSelectedSkill(entry as CollectionSkillEntry);
                break;
            case 'npcs':
                setSelectedNpc(entry as CollectionNpcEntry);
                break;
        }
    };

    const content = createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2">
            <div className="bg-[#0d1a2e] border-2 border-[#2a4080]/70 w-full max-w-lg h-[90dvh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#1a2d5a] to-[#0d1a2e] p-4 flex items-center justify-between border-b border-[#2a4080]/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-wider font-serif">コレクション</h2>
                            <p className="text-[9px] text-blue-300/50 tracking-widest uppercase">Collection</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#0a1226] border-b border-[#2a4080]/30">
                    {tabs.map(tab => {
                        const section = data?.[tab.key];
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all relative ${
                                    isActive
                                        ? 'text-amber-400 bg-[#122042]/80'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#122042]/40'
                                }`}
                            >
                                <tab.icon size={16} />
                                <span className="text-[10px] font-bold tracking-wider">{tab.label}</span>
                                {section && (
                                    <span className={`text-[9px] font-mono ${isActive ? 'text-amber-400/70' : 'text-slate-400'}`}>
                                        {section.unlocked}/{section.total}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-amber-400 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                {currentSection && (
                    <div className="px-4 py-2 bg-[#0a1226]/80 border-b border-[#2a4080]/20">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400">
                                達成率: <span className="text-amber-400 font-bold">{currentSection.unlocked}</span> / {currentSection.total}
                            </span>
                            <span className={`text-[10px] font-bold font-mono ${
                                progressPct >= 100 ? 'text-emerald-400' : progressPct >= 50 ? 'text-amber-400' : 'text-gray-400'
                            }`}>
                                {progressPct}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1a2d5a] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    progressPct >= 100
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-amber-600 to-amber-400'
                                }`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !data ? (
                        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                            データの取得に失敗しました
                        </div>
                    ) : (
                        <div className="divide-y divide-[#2a4080]/20">
                            {currentSection?.list.map((entry: any) => (
                                <button
                                    key={entry.id ?? entry.slug}
                                    onClick={() => handleEntryClick(entry)}
                                    disabled={!entry.unlocked}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                        entry.unlocked
                                            ? 'hover:bg-[#122042]/60 active:bg-[#1a2d5a]/60 cursor-pointer'
                                            : 'cursor-default opacity-40'
                                    }`}
                                >
                                    {/* ID */}
                                    <span className="text-[10px] font-mono text-slate-400 w-12 flex-shrink-0">
                                        No.{String(entry.id).padStart(4, '0')}
                                    </span>

                                    {/* Name or placeholder */}
                                    {entry.unlocked ? (
                                        <span className="text-sm text-slate-200 font-medium truncate flex-1">
                                            {entry.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-500 flex-1 tracking-widest">
                                            ─────
                                        </span>
                                    )}

                                    {/* Unlock indicator */}
                                    {entry.unlocked && (
                                        <span className="text-[9px] text-emerald-500/70 flex-shrink-0">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer + コレクションマイルストーンシェア */}
                <div className="p-2 border-t border-[#2a4080]/30 bg-[#0a1226]">
                    {shareDataList.length > 0 && (
                        <div className="mb-2 space-y-1.5">
                            {shareDataList.map((sd: ShareDataItem, idx: number) => {
                                const shareUrl = typeof window !== 'undefined'
                                    ? `${window.location.origin}/share?t=${sd.slug}&${new URLSearchParams(sd.vars).toString()}`
                                    : undefined;
                                return (
                                    <XShareButton
                                        key={idx}
                                        text={sd.text}
                                        shareUrl={shareUrl}
                                        variant="outline"
                                        className="w-full !text-emerald-400 !border-emerald-400/30 hover:!bg-emerald-400/10 !text-xs"
                                    />
                                );
                            })}
                        </div>
                    )}
                    <p className="text-[9px] text-slate-400 font-serif italic text-center">
                        ※ エネミーは遭遇時、アイテムは入手時、NPCは雇用時に記録されます
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            {content}
            {selectedEnemy && (
                <EnemyDetailPopup
                    enemy={selectedEnemy}
                    onClose={() => setSelectedEnemy(null)}
                />
            )}
            {selectedItem && (
                <ItemDetailPopup
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
            {selectedSkill && (
                <SkillDetailPopup
                    skill={selectedSkill}
                    onClose={() => setSelectedSkill(null)}
                />
            )}
            {selectedNpc && (
                <NpcDetailPopup
                    npc={selectedNpc}
                    onClose={() => setSelectedNpc(null)}
                />
            )}
        </>
    );
}
