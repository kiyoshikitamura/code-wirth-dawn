import React, { useState, useEffect } from 'react';
import { 
    BookOpen, X, Scroll, Globe, Skull, Calendar, MapPin, 
    Award, Heart, Zap, Shield, Share2, Plus, Minus, ArrowUp, Compass
} from 'lucide-react';
import { getAuthToken } from '@/lib/authToken';

interface HistoryArchiveModalProps {
    userId: string;
    onClose: () => void;
}

type FilterType = 'all' | 'quest' | 'growth' | 'collection' | 'world' | 'hero';

export default function HistoryArchiveModal({ userId, onClose }: HistoryArchiveModalProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [loading, setLoading] = useState(true);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [bannedLocations, setBannedLocations] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = await getAuthToken();
                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const res = await fetch(`/api/user/history-archive?user_id=${userId}`, { headers });
                if (res.ok) {
                    const json = await res.json();
                    setTimelineData(json.timeline || []);
                    setBannedLocations(json.banned_locations || []);
                }
            } catch (e) {
                console.error("Failed to fetch history timeline", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // フィルタリング処理
    const filteredTimeline = timelineData.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'quest') return item.event_type.startsWith('quest_');
        if (filter === 'growth') return ['level_up', 'age_up', 'title_gained'].includes(item.event_type);
        if (filter === 'collection') return ['item_collected', 'monster_defeated', 'npc_encountered'].includes(item.event_type);
        if (filter === 'world') return item.event_type === 'world_event';
        if (filter === 'hero') return ['hero_death', 'hero_retire'].includes(item.event_type);
        return true;
    });

    // イベント種別ごとのスタイル・アイコン定義
    const getEventConfig = (eventType: string) => {
        switch (eventType) {
            case 'quest_success':
                return { icon: Scroll, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', label: 'QUEST SUCCESS' };
            case 'quest_failure':
            case 'quest_abandon':
                return { icon: Scroll, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', label: 'QUEST FAILED' };
            case 'quest_start':
                return { icon: Scroll, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', label: 'QUEST STARTED' };
            case 'level_up':
                return { icon: ArrowUp, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', label: 'LEVEL UP' };
            case 'age_up':
                return { icon: Calendar, color: 'text-teal-400 border-teal-500/30 bg-teal-500/10', label: 'AGE ADVANCED' };
            case 'title_gained':
                return { icon: Award, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', label: 'TITLE GAINED' };
            case 'item_collected':
                return { icon: Shield, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', label: 'NEW ITEM' };
            case 'monster_defeated':
                return { icon: SwordIcon, color: 'text-slate-400 border-slate-500/30 bg-slate-500/10', label: 'MONSTER SLAIN' };
            case 'npc_encountered':
                return { icon: Compass, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10', label: 'MEETING' };
            case 'world_event':
                return { icon: Globe, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', label: 'WORLD RECORD' };
            case 'hero_death':
            case 'hero_retire':
                return { icon: Skull, color: 'text-red-500 border-red-500/30 bg-red-500/10', label: 'HERO LEGACY' };
            default:
                return { icon: BookOpen, color: 'text-amber-200 border-amber-500/30 bg-amber-500/10', label: 'CHRONICLE' };
        }
    };

    // Xシェア実行
    const handleShare = (item: any) => {
        let text = item.share_text;
        if (!text) {
            // 自動フォールバックテキストの生成
            const dateStr = item.accumulated_days != null 
                ? `世界暦${742 + Math.floor(item.accumulated_days / 365)}年 `
                : '';
            text = `【Wirth Dawn - 私の歩み】${dateStr}${item.title}。${item.description} #Wirth_Dawn #旅の年代記`;
        }
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    // フィルタボタンコンポーネント
    const FilterButton = ({ id, label }: { id: FilterType; label: string }) => (
        <button
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                ${filter === id
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/5'
                    : 'bg-black/40 border-amber-900/20 text-gray-500 hover:text-gray-300 hover:border-amber-800/40'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-[#0a0604] border border-amber-900/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[720px]">
                
                {/* 背景グラデーション */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />

                {/* 閉じるボタン */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-red-950/40 text-gray-400 hover:text-white rounded-full transition-colors border border-white/5"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* ヘッダータイトル */}
                <header className="px-6 pt-6 pb-2 relative z-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <div className="h-px w-8 bg-amber-800/40" />
                        <BookOpen className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base sm:text-lg font-serif font-black text-amber-100 tracking-[0.15em] uppercase">旅人の年代記</h2>
                        <div className="h-px w-8 bg-amber-800/40" />
                    </div>
                    <p className="text-[9px] text-amber-700 font-bold tracking-widest uppercase">Chronicles of the Witness</p>
                </header>

                {/* フィルタナビゲーション */}
                <nav className="flex flex-wrap gap-2 px-6 py-2 border-b border-amber-950/30 relative z-10 justify-center">
                    <FilterButton id="all" label="すべての歴史" />
                    <FilterButton id="quest" label="クエスト" />
                    <FilterButton id="growth" label="成長・称号" />
                    <FilterButton id="collection" label="発見・遭遇" />
                    <FilterButton id="world" label="世界の記録" />
                    <FilterButton id="hero" label="英霊の系譜" />
                </nav>

                {/* メインコンテンツエリア */}
                <main className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-amber-800 animate-pulse">
                            <BookOpen className="w-10 h-10" />
                            <span className="font-serif italic text-xs tracking-widest">歴史を紐解いています...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {filteredTimeline.length === 0 ? (
                                <div className="h-48 flex flex-col items-center justify-center text-gray-600 gap-3 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                    <BookOpen className="w-8 h-8 opacity-20" />
                                    <p className="text-xs font-serif italic">まだこの分類の記録はありません。</p>
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-gradient-to-b before:from-amber-600/30 before:to-amber-950/10">
                                    {filteredTimeline.map((item) => {
                                        const config = getEventConfig(item.event_type);
                                        const EventIcon = config.icon;
                                        
                                        return (
                                            <div 
                                                key={item.id} 
                                                className={`relative group rounded-xl transition-all border
                                                    ${item.is_major_event 
                                                        ? 'bg-gradient-to-r from-amber-950/20 to-transparent border-amber-500/20 hover:border-amber-500/40 shadow-lg shadow-amber-900/5' 
                                                        : 'bg-white/[0.02] border-white/5 hover:border-amber-800/30'}`}
                                            >
                                                {/* タイムラインノードドット */}
                                                <div className={`absolute -left-6 top-5 w-3 h-3 rounded-full bg-[#0a0604] border-2 z-10 transition-transform group-hover:scale-125
                                                    ${item.is_major_event ? 'border-amber-500' : 'border-amber-800/40'}`} 
                                                />

                                                <div className="p-4">
                                                    {/* ヘッダ行 (日付とバッジ) */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="text-amber-600 text-[10px] font-bold flex items-center gap-1 font-serif">
                                                            <Calendar className="w-3 h-3 text-amber-700" />
                                                            {item.accumulated_days != null
                                                                ? (() => {
                                                                    const d = item.accumulated_days;
                                                                    const yr = 742 + Math.floor(d / 365);
                                                                    const mo = 1 + Math.floor((d % 365) / 30);
                                                                    const dy = 1 + (d % 30);
                                                                    return `世界暦${yr}年${mo}月${dy}日`;
                                                                })()
                                                                : new Date(item.created_at).toLocaleDateString()
                                                            }
                                                        </div>
                                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>

                                                    {/* イベントタイトルとシェアボタン */}
                                                    <div className="flex justify-between items-start gap-4 mb-2">
                                                        <h4 className={`font-serif font-bold text-sm tracking-wide 
                                                            ${item.is_major_event ? 'text-amber-100 text-base' : 'text-gray-200'}`}
                                                        >
                                                            {item.title}
                                                        </h4>
                                                        <button
                                                            onClick={() => handleShare(item)}
                                                            className="p-1.5 bg-white/5 hover:bg-amber-600/20 text-gray-500 hover:text-amber-400 rounded-md border border-white/5 hover:border-amber-500/20 transition-all"
                                                            title="Xへシェア"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* 詳細説明 */}
                                                    <p className="text-xs text-gray-400 leading-relaxed font-sans mb-3 whitespace-pre-line">
                                                        {item.description}
                                                    </p>

                                                    {/* パラメータ変化 (param_changes) */}
                                                    {item.param_changes && Object.keys(item.param_changes).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 text-[9px] font-bold">
                                                            {/* ゴールド */}
                                                            {item.param_changes.gold > 0 && (
                                                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-yellow-950/30 text-yellow-500 rounded border border-yellow-500/20">
                                                                    ゴールド +{item.param_changes.gold}
                                                                </span>
                                                            )}
                                                            {/* EXP */}
                                                            {item.param_changes.exp > 0 && (
                                                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-950/30 text-blue-400 rounded border border-blue-500/20">
                                                                    EXP +{item.param_changes.exp}
                                                                </span>
                                                            )}
                                                            {/* 名声 */}
                                                            {item.param_changes.reputation && (
                                                                <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded border
                                                                    ${item.param_changes.reputation.delta >= 0 
                                                                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' 
                                                                        : 'bg-red-950/30 text-red-400 border-red-500/20'}`}
                                                                >
                                                                    名声 {item.param_changes.reputation.delta >= 0 ? '+' : ''}{item.param_changes.reputation.delta} ({item.param_changes.reputation.location_name})
                                                                </span>
                                                            )}
                                                            {/* アライメント */}
                                                            {item.param_changes.alignment && Object.entries(item.param_changes.alignment).map(([key, val]: any) => {
                                                                if (val === 0) return null;
                                                                const alignLabelMap: Record<string, string> = {
                                                                    order: '秩序(O)', chaos: '混沌(C)', justice: '正義(J)', evil: '邪悪(E)'
                                                                };
                                                                return (
                                                                    <span key={key} className="flex items-center gap-0.5 px-2 py-0.5 bg-purple-950/30 text-purple-400 rounded border border-purple-500/20">
                                                                        {alignLabelMap[key] || key} {val >= 0 ? '+' : ''}{val}
                                                                    </span>
                                                                );
                                                            })}
                                                            {/* レベルアップ詳細 */}
                                                            {item.param_changes.level_to && (
                                                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-950/30 text-amber-400 rounded border border-amber-500/20">
                                                                    レベル {item.param_changes.level_from} → {item.param_changes.level_to}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* フッター行 (発生地名) */}
                                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-amber-700" />
                                                            <span>{item.location_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Banned Locations (出禁拠点) のフレーバー統計 */}
                            {filter === 'all' && bannedLocations.length > 0 && (
                                <div className="mt-8 border border-red-950/40 rounded-xl bg-red-950/5 p-5">
                                    <h4 className="text-xs font-bold text-red-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                                        <Skull className="w-3.5 h-3.5 text-red-500" />
                                        指名手配・出入り禁止の拠点
                                    </h4>
                                    <div className="space-y-2">
                                        {bannedLocations.map((loc, i) => (
                                            <div key={i} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-4 py-2.5">
                                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                                    <MapPin className="w-3 h-3 text-red-400" />
                                                    <span>{loc.location_name}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-red-400 font-black px-2 py-0.5 bg-red-500/10 rounded">
                                                    名声値: {loc.score}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* フッター装飾 */}
                <footer className="p-4 border-t border-amber-950/20 text-center bg-black/50">
                    <p className="text-[9px] text-amber-800/80 tracking-widest font-serif">
                        「紡がれし言葉はやがて真実の歩みとなり、年代記に旅人の魂が眠る。」
                    </p>
                </footer>
            </div>
        </div>
    );
}

// 簡易ソード（剣）アイコンコンポーネント (Lucideに無いためカスタム描画)
function SwordIcon({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
            <line x1="13" y1="19" x2="19" y2="13" />
            <line x1="16" y1="16" x2="20" y2="20" />
            <line x1="19" y1="21" x2="21" y2="19" />
        </svg>
    );
}
