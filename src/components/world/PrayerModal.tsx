import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { X, Sparkles, Zap, Scale, Skull, AlertTriangle } from 'lucide-react';

interface PrayerModalProps {
    onClose: () => void;
    locationId: string;
    locationName: string;
}

export default function PrayerModal({ onClose, locationId, locationName }: PrayerModalProps) {
    const { userProfile, fetchUserProfile, fetchWorldState, worldState } = useGameStore();
    const [selectedAttribute, setSelectedAttribute] = useState<'Order' | 'Chaos' | 'Justice' | 'Evil' | null>(null);
    const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null);
    const [isPraying, setIsPraying] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    const getProsperityLabel = (level: number) => {
        if (level >= 5) return '絶頂';
        if (level >= 4) return '繁栄';
        if (level === 3) return '停滞';
        if (level === 2) return '衰退';
        if (level <= 1) return '崩壊';
        return '未知';
    };

    const getNationName = (nation: string) => {
        switch (nation) {
            case 'Roland': return 'ローランド聖王国';
            case 'Karyu': return '華龍神朝';
            case 'Yato': return '夜刀神国';
            case 'Markand': return '商業都市マーカンド';
            case 'Neutral': return '中立地帯';
            default: return nation;
        }
    };

    const TIERS = [
        { tier: 1, cost: 100, label: '小', desc: 'ささやかな祈り' },
        { tier: 2, cost: 1000, label: '中', desc: '熱心な祈り' },
        { tier: 3, cost: 10000, label: '大', desc: '奇跡を願う祈り' }
    ] as const;

    const ATTRIBUTES = [
        { id: 'Order', label: '秩序', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-600', icon: <Scale className="w-5 h-5" /> },
        { id: 'Chaos', label: '混沌', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-600', icon: <Zap className="w-5 h-5" /> },
        { id: 'Justice', label: '正義', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-600', icon: <Sparkles className="w-5 h-5" /> },
        { id: 'Evil', label: '悪意', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-600', icon: <Skull className="w-5 h-5" /> },
    ] as const;

    const handlePray = async () => {
        if (!selectedAttribute || !selectedTier || !userProfile) return;
        const tier = TIERS.find(t => t.tier === selectedTier);
        if (!tier) return;

        if (userProfile.gold < tier.cost) {
            setWarningMessage('ゴールドが不足しています。');
            return;
        }

        setIsPraying(true);
        try {
            const res = await fetch('/api/world/pray', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userProfile.id,
                    location_id: locationId,
                    attribute: selectedAttribute,
                    amount_tier: selectedTier
                })
            });

            const rawText = await res.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error("Failed to parse JSON:", rawText);
                throw new Error(`Server Error: ${rawText.slice(0, 100)}...`);
            }

            if (res.ok) {
                setResult(data);
                await fetchUserProfile();
                await fetchWorldState();
            } else {
                alert(data.error || `祈りは届きませんでした... (${data.message || 'Unknown'})`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`エラーが発生しました: ${e.message}`);
        } finally {
            setIsPraying(false);
        }
    };

    if (result) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="bg-[#fdfbf7] border-2 border-[#8b5a2b] p-8 max-w-md w-full text-center relative shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-sm">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 -mt-16">
                        <Sparkles className="w-20 h-20 text-amber-500 animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-serif text-[#3e2723] mb-4 mt-4 tracking-wide">祈りが届きました</h2>
                    <p className="text-[#8b5a2b] mb-6 text-lg italic font-serif">
                        "{result.message}"
                    </p>

                    <div className="text-[#8b6f4e] text-sm mb-6">
                        消費: {TIERS.find(t => t.tier === selectedTier)?.cost} G<br />
                        影響力: {result.impact_value}
                    </div>

                    <button
                        onClick={onClose}
                        className="bg-[#8b5a2b] border border-[#8b5a2b] text-white px-8 py-2 hover:bg-[#6b4522] transition-colors rounded"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        );
    }

    if (warningMessage) {
        return (
            <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-[#fdfbf7] border-2 border-red-800 p-6 max-w-sm w-full text-center relative shadow-2xl rounded-sm">
                    <h2 className="text-lg font-bold text-red-800 mb-3">所持金が足りません</h2>
                    <p className="text-[#8b5a2b] mb-6 text-sm flex items-center justify-center gap-2">
                        <AlertTriangle size={18} className="text-red-600" />
                        {warningMessage}
                    </p>
                    <button
                        onClick={() => setWarningMessage(null)}
                        className="bg-slate-200 border border-slate-300 text-slate-800 px-6 py-1.5 hover:bg-slate-300 transition-colors rounded text-sm font-bold"
                    >
                        戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className={`bg-[#e3d5b8] text-[#2c241b] border-4 border-[#8b5a2b] max-w-2xl w-full shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-sm relative flex flex-col max-h-[90vh] overflow-hidden ${isPraying ? 'animate-pulse' : ''}`}>

                {/* Header */}
                <div className="bg-[#3e2723] border-b-2 border-[#8b5a2b] p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-serif font-bold tracking-widest text-amber-400">
                                神殿
                            </h2>
                        </div>
                        <p className="text-[10px] text-[#a38b6b] mt-0.5 font-serif italic">― {locationName}の神殿にて祈りを捧げよ ―</p>
                    </div>
                    <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-[url('/textures/paper.png')] bg-repeat">
                    
                    {/* 拠点ステータス・属性バランス領域 */}
                    <div className="mb-6 border-2 border-[#8b5a2b]/40 rounded-lg bg-[#fdfbf7]/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                        {/* 左：拠点の基本情報 */}
                        <div className="w-full md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-[#a38b6b]/30 pb-3 md:pb-0 md:pr-4 shrink-0">
                            <h3 className="text-[10px] font-bold text-[#8b5a2b] mb-1 font-serif flex items-center gap-1 uppercase tracking-widest">
                                Location Status
                            </h3>
                            <div className="text-sm font-bold text-[#3e2723] mb-2">{locationName}</div>
                            <div className="text-[10px] text-[#8b6f4e] flex flex-col gap-1.5 font-bold">
                                <div className="flex items-center justify-between">
                                    <span className="opacity-80">支配国</span>
                                    <span className="text-[#3e2723]">{getNationName(worldState?.controlling_nation || 'Neutral')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="opacity-80">繁栄規模</span>
                                    <span className="text-[#3e2723]">{getProsperityLabel(worldState?.prosperity_level || 3)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 右：属性バランス (ゲージ) */}
                        <div className="w-full md:w-2/3 md:pl-2">
                             <div className="flex justify-between items-end mb-3 border-b border-[#a38b6b]/30 pb-1">
                                <h3 className="text-xs font-bold text-[#3e2723] font-serif">現在の属性バランス</h3>
                                <div className="text-[10px] font-bold bg-[#8b5a2b]/10 border border-[#8b5a2b]/20 text-[#8b5a2b] px-2 py-0.5 rounded shadow-inner">
                                    【{worldState?.attribute_name || '不明'}】
                                </div>
                             </div>
                             
                             {/* 秩序 vs 混沌 */}
                             <div className="mb-3">
                                 <div className="flex justify-between text-[10px] font-bold mb-1">
                                     <span className="text-blue-700 flex items-center gap-1 drop-shadow-sm"><Scale size={10}/> 秩序: {worldState?.order_score ?? 0}</span>
                                     <span className="text-purple-700 flex items-center gap-1 drop-shadow-sm">混沌: {worldState?.chaos_score ?? 0} <Zap size={10}/></span>
                                 </div>
                                 <div className="relative w-full h-2.5 bg-purple-200 border border-purple-300/50 rounded-full overflow-hidden shadow-inner">
                                     <div 
                                         className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-r-full transition-all duration-700 shadow-[2px_0_5px_rgba(0,0,0,0.2)]" 
                                         style={{ width: `${Math.max(5, Math.min(95, ((worldState?.order_score || 0.1) / ((worldState?.order_score || 0.1) + (worldState?.chaos_score || 0.1))) * 100))}%` }} 
                                     />
                                     <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 left-1/2 -translate-x-1/2 z-10" />
                                 </div>
                             </div>

                             {/* 正義 vs 悪意 */}
                             <div>
                                 <div className="flex justify-between text-[10px] font-bold mb-1">
                                     <span className="text-amber-700 flex items-center gap-1 drop-shadow-sm"><Sparkles size={10}/> 正義: {worldState?.justice_score ?? 0}</span>
                                     <span className="text-red-700 flex items-center gap-1 drop-shadow-sm">悪意: {worldState?.evil_score ?? 0} <Skull size={10}/></span>
                                 </div>
                                 <div className="relative w-full h-2.5 bg-red-200 border border-red-300/50 rounded-full overflow-hidden shadow-inner">
                                     <div 
                                         className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-r-full transition-all duration-700 shadow-[2px_0_5px_rgba(0,0,0,0.2)]" 
                                         style={{ width: `${Math.max(5, Math.min(95, ((worldState?.justice_score || 0.1) / ((worldState?.justice_score || 0.1) + (worldState?.evil_score || 0.1))) * 100))}%` }} 
                                     />
                                     <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 left-1/2 -translate-x-1/2 z-10" />
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Attribute Selection */}
                        <div>
                            <h3 className="text-xs font-bold text-[#3e2723] mb-3 border-b border-[#8b5a2b]/30 pb-1 font-serif">1. 属性を選択</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {ATTRIBUTES.map(attr => (
                                    <button
                                        key={attr.id}
                                        onClick={() => setSelectedAttribute(attr.id as any)}
                                        className={`
                                        p-3 border rounded flex flex-col items-center gap-1.5 transition-all
                                        ${selectedAttribute === attr.id
                                                ? `${attr.bg} ${attr.border} ${attr.color} shadow-md`
                                                : 'border-[#c2b280] text-[#8b6f4e] hover:border-[#a38b6b] hover:text-[#3e2723] bg-[#fdfbf7]'}
                                    `}
                                    >
                                        {attr.icon}
                                        <span className="font-serif font-bold text-xs">{attr.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Tier Selection */}
                        <div>
                            <h3 className="text-xs font-bold text-[#3e2723] mb-3 border-b border-[#8b5a2b]/30 pb-1 font-serif">2. 捧げる金額</h3>
                            <div className="space-y-2">
                                {TIERS.map(t => (
                                    <button
                                        key={t.tier}
                                        onClick={() => setSelectedTier(t.tier as any)}
                                        className={`
                                        w-full p-2.5 border rounded flex justify-between items-center transition-all px-3
                                        ${selectedTier === t.tier
                                                ? 'border-[#8b5a2b] bg-amber-50 text-[#3e2723] shadow-md'
                                                : 'border-[#c2b280] text-[#8b6f4e] hover:border-[#a38b6b] bg-[#fdfbf7]'}
                                    `}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-xs">{t.desc}</div>
                                            <div className="text-[9px] opacity-70">段階 {t.tier}</div>
                                        </div>
                                        <div className="font-mono font-bold text-base">
                                            {t.cost.toLocaleString()} G
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 p-2 bg-[#fdfbf7] border border-[#a38b6b]/30 rounded text-center">
                                <div className="text-[10px] text-[#8b6f4e]">現在の所持金</div>
                                <div className={`font-mono text-base font-bold ${userProfile && selectedTier && userProfile.gold < TIERS.find(t => t.tier === selectedTier)!.cost ? 'text-red-700' : 'text-amber-700'}`}>
                                    {userProfile?.gold.toLocaleString()} G
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            disabled={!selectedAttribute || !selectedTier || isPraying}
                            onClick={handlePray}
                            className={`
                            px-8 py-2.5 min-w-[180px] font-bold text-sm tracking-widest transition-all rounded
                            ${!selectedAttribute || !selectedTier || isPraying
                                    ? 'bg-[#c2b280] text-[#8b6f4e] cursor-not-allowed border border-[#a38b6b]'
                                    : 'bg-[#8b5a2b] text-white hover:bg-[#6b4522] shadow-lg border border-[#8b5a2b]'}
                        `}
                        >
                            {isPraying ? '祈っています...' : '祈りを捧げる'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
