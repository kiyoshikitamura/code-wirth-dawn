import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { X, Sparkles, Zap, Scale, Skull } from 'lucide-react';

interface PrayerModalProps {
    onClose: () => void;
    locationId: string;
    locationName: string;
}

export default function PrayerModal({ onClose, locationId, locationName }: PrayerModalProps) {
    const { userProfile, fetchUserProfile, fetchWorldState } = useGameStore();
    const [selectedAttribute, setSelectedAttribute] = useState<'Order' | 'Chaos' | 'Justice' | 'Evil' | null>(null);
    const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null);
    const [isPraying, setIsPraying] = useState(false);
    const [result, setResult] = useState<any | null>(null);

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
            alert('ゴールドが不足しています。');
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Attribute Selection */}
                        <div>
                            <h3 className="text-sm font-bold text-[#3e2723] mb-3 border-b border-[#8b5a2b]/30 pb-1 font-serif">1. 属性を選択</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {ATTRIBUTES.map(attr => (
                                    <button
                                        key={attr.id}
                                        onClick={() => setSelectedAttribute(attr.id as any)}
                                        className={`
                                        p-4 border rounded flex flex-col items-center gap-2 transition-all
                                        ${selectedAttribute === attr.id
                                                ? `${attr.bg} ${attr.border} ${attr.color} shadow-md`
                                                : 'border-[#c2b280] text-[#8b6f4e] hover:border-[#a38b6b] hover:text-[#3e2723] bg-[#fdfbf7]'}
                                    `}
                                    >
                                        {attr.icon}
                                        <span className="font-serif font-bold">{attr.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Tier Selection */}
                        <div>
                            <h3 className="text-sm font-bold text-[#3e2723] mb-3 border-b border-[#8b5a2b]/30 pb-1 font-serif">2. 捧げる金額</h3>
                            <div className="space-y-3">
                                {TIERS.map(t => (
                                    <button
                                        key={t.tier}
                                        onClick={() => setSelectedTier(t.tier as any)}
                                        className={`
                                        w-full p-3 border rounded flex justify-between items-center transition-all px-4
                                        ${selectedTier === t.tier
                                                ? 'border-[#8b5a2b] bg-amber-50 text-[#3e2723] shadow-md'
                                                : 'border-[#c2b280] text-[#8b6f4e] hover:border-[#a38b6b] bg-[#fdfbf7]'}
                                    `}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{t.desc}</div>
                                            <div className="text-[10px] opacity-70">段階 {t.tier}</div>
                                        </div>
                                        <div className="font-mono font-bold text-lg">
                                            {t.cost.toLocaleString()} G
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 p-3 bg-[#fdfbf7] border border-[#a38b6b]/30 rounded text-center">
                                <div className="text-xs text-[#8b6f4e]">現在の所持金</div>
                                <div className={`font-mono text-lg ${userProfile && selectedTier && userProfile.gold < TIERS.find(t => t.tier === selectedTier)!.cost ? 'text-red-700' : 'text-amber-700'}`}>
                                    {userProfile?.gold.toLocaleString()} G
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            disabled={!selectedAttribute || !selectedTier || isPraying || (!!selectedTier && !!userProfile && userProfile.gold < TIERS.find(t => t.tier === selectedTier)!.cost)}
                            onClick={handlePray}
                            className={`
                            px-8 py-3 min-w-[200px] font-bold tracking-widest transition-all rounded
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
