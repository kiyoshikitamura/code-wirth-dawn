import React, { useState, useEffect } from 'react';
import { BookOpen, X, Scroll, Globe, Skull, Calendar, MapPin, Award, Heart, Zap, Shield } from 'lucide-react';

interface HistoryArchiveModalProps {
    userId: string;
    onClose: () => void;
}

type TabType = 'personal' | 'world' | 'lineage';

export default function HistoryArchiveModal({ userId, onClose }: HistoryArchiveModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        chronicle: any[];
        world_history: any[];
        lineage: any[];
    }>({ chronicle: [], world_history: [], lineage: [] });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/user/history-archive?user_id=${userId}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Failed to fetch history archive", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2 
                ${activeTab === id
                    ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
        >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-[#0f0a07] border border-amber-900/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[700px]">

                {/* Header Backdrop */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-red-900/40 text-gray-400 hover:text-white rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Title Section */}
                <header className="px-5 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                        <div className="h-px w-6 sm:w-8 bg-amber-800" />
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                        <h2 className="text-base sm:text-xl font-serif font-black text-amber-100 tracking-[0.1em] sm:tracking-[0.2em] uppercase whitespace-nowrap">歴史を紐解く</h2>
                        <div className="h-px w-6 sm:w-8 bg-amber-800" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-amber-700 font-bold tracking-widest uppercase">Chronicles of the Witness</p>
                </header>

                {/* Tab Navigation */}
                <nav className="flex border-b border-amber-900/20 relative z-10 px-4">
                    <TabButton id="personal" icon={Scroll} label="私の歩み" />
                    <TabButton id="world" icon={Globe} label="世界の記憶" />
                    <TabButton id="lineage" icon={Skull} label="英霊の系譜" />
                </nav>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-amber-900 animate-pulse">
                            <BookOpen className="w-12 h-12" />
                            <span className="font-serif italic">記述を読み取っています...</span>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-500">

                            {/* TAB 1: PERSONAL CHRONICLE */}
                            {activeTab === 'personal' && (
                                <div className="space-y-6">
                                    {data.chronicle.length === 0 ? (
                                        <EmptyState icon={Scroll} text="あなたの物語はまだ白紙です。" />
                                    ) : (
                                        <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-amber-900/30">
                                            {data.chronicle.map((item, idx) => (
                                                <div key={item.id} className="relative group">
                                                    <div className="absolute -left-7 top-1 w-5 h-5 rounded-full bg-[#0f0a07] border-2 border-amber-600 z-10 group-hover:scale-125 transition-transform" />
                                                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg hover:border-amber-500/50 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-amber-500 text-xs font-bold tracking-tighter flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(item.completed_at).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 px-2 py-0.5 bg-black/50 rounded border border-white/5">
                                                                QUEST COMPLETED
                                                            </div>
                                                        </div>
                                                        <h4 className="text-amber-100 font-serif font-bold text-lg mb-2">{item.scenarios.title}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-red-900" />
                                                                <span>{item.scenarios.locations?.name || 'Unknown'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: WORLD HISTORY */}
                            {activeTab === 'world' && (
                                <div className="space-y-4">
                                    {data.world_history.length === 0 ? (
                                        <EmptyState icon={Globe} text="世界の時間は止まったままです。" />
                                    ) : (
                                        data.world_history.map(event => (
                                            <div key={event.id} className="bg-black/40 border-l-4 border-amber-600/50 p-4 rounded-r-lg space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-amber-900 bg-amber-500/10 px-2 py-0.5 rounded">
                                                        {event.event_type === 'alignment_change' ? 'HEGEMONY SHIFT' : 'PROSPERITY CHANGE'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{new Date(event.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm italic font-serif leading-relaxed text-gray-300">
                                                    {event.message}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{event.location?.name}</span>
                                                    <span className="mx-1">•</span>
                                                    <span>{event.old_value} → {event.new_value}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* TAB 3: LINEAGE OF HEROES */}
                            {activeTab === 'lineage' && (
                                <div className="grid grid-cols-1 gap-4">
                                    {data.lineage.length === 0 ? (
                                        <EmptyState icon={Skull} text="まだ系譜を受け継ぐ英霊はいません。" />
                                    ) : (
                                        data.lineage.map(hero => (
                                            <div key={hero.id} className="bg-gradient-to-r from-red-900/10 to-transparent border border-red-900/30 p-5 rounded-xl flex items-center gap-6 group hover:border-red-500/50 transition-all">
                                                <div className="flex-shrink-0 relative">
                                                    <div className="w-16 h-16 rounded-full bg-black border-2 border-red-900/50 flex items-center justify-center overflow-hidden">
                                                        {hero.snapshot?.avatar_url ? (
                                                            <img src={hero.snapshot.avatar_url} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                                        ) : (
                                                            <Skull className="w-8 h-8 text-gray-700" />
                                                        )}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 bg-red-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                        Lv.{hero.snapshot?.final_level || 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg font-serif font-black text-gray-200 truncate">{hero.name}</h4>
                                                    <p className="text-xs text-red-400 font-bold mb-3">{hero.cause_of_death}</p>
                                                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 uppercase font-black">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {hero.age_days} DAYS
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Award className="w-3 h-3" />
                                                            {hero.completed_quests_count} QUESTS
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {hero.location?.name || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 items-center text-gray-600">
                                                    <div className="text-[10px] font-bold">FINAL STATS</div>
                                                    <div className="flex gap-2">
                                                        <Heart className="w-3 h-3" />
                                                        <Zap className="w-3 h-3" />
                                                        <Shield className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Footer Deco */}
                <footer className="p-4 border-t border-amber-900/10 text-center bg-black/40">
                    <p className="text-[10px] text-amber-900 tracking-tighter">
                        「記された言葉はやがて真実となり、歴史は旅人の歩みに寄り添う。」
                    </p>
                </footer>
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="h-40 flex flex-col items-center justify-center text-gray-600 gap-3 border-2 border-dashed border-white/5 rounded-2xl">
            <Icon className="w-8 h-8 opacity-20" />
            <p className="text-sm font-serif italic">{text}</p>
        </div>
    );
}
