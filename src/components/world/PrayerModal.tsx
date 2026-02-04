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
        { id: 'Order', label: '秩序', color: 'text-blue-400', border: 'border-blue-500', icon: <ShieldCheckIcon className="w-5 h-5" /> }, // ShieldCheck is not defined, using generic logic below
        { id: 'Chaos', label: '混沌', color: 'text-purple-400', border: 'border-purple-500', icon: <Zap className="w-5 h-5" /> },
        { id: 'Justice', label: '正義', color: 'text-yellow-400', border: 'border-yellow-500', icon: <Scale className="w-5 h-5" /> },
        { id: 'Evil', label: '悪意', color: 'text-red-400', border: 'border-red-500', icon: <Skull className="w-5 h-5" /> },
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

            // Read text first to debug JSON errors
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
                // Refresh data
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
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur animate-in fade-in duration-500">
                <div className="bg-[#1a1510] border-2 border-gold-500 p-8 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(255,215,0,0.2)]">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 -mt-16">
                        <Sparkles className="w-24 h-24 text-gold-400 animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-serif text-gold-100 mb-4 mt-4">祈りが届きました</h2>
                    <p className="text-gold-300 mb-6 text-lg italic font-serif">
                        "{result.message}"
                    </p>

                    <div className="text-gray-400 text-sm mb-6">
                        消費: {TIERS.find(t => t.tier === selectedTier)?.cost} G<br />
                        影響力: {result.impact_value}
                    </div>

                    <button
                        onClick={onClose}
                        className="bg-gold-600/20 border border-gold-500 text-gold-200 px-8 py-2 hover:bg-gold-600/40 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1a1510] border border-[#a38b6b] p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>

                <h2 className="text-2xl font-serif text-[#e3d5b8] mb-1 text-center">祈りを捧げる</h2>
                <div className="text-center text-xs text-[#8b7355] mb-6 font-mono uppercase tracking-widest">
                    Devotion to {locationName}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Attribute Selection */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-3 border-b border-gray-800 pb-1">1. 属性を選択</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {ATTRIBUTES.map(attr => (
                                <button
                                    key={attr.id}
                                    onClick={() => setSelectedAttribute(attr.id as any)}
                                    className={`
                                        p-4 border flex flex-col items-center gap-2 transition-all
                                        ${selectedAttribute === attr.id
                                            ? `bg-white/5 ${attr.border} ${attr.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`
                                            : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300 bg-black/20'}
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
                        <h3 className="text-sm font-bold text-gray-400 mb-3 border-b border-gray-800 pb-1">2. 捧げる金額</h3>
                        <div className="space-y-3">
                            {TIERS.map(t => (
                                <button
                                    key={t.tier}
                                    onClick={() => setSelectedTier(t.tier as any)}
                                    className={`
                                        w-full p-3 border flex justify-between items-center transition-all px-4
                                        ${selectedTier === t.tier
                                            ? 'border-gold-500 bg-gold-900/20 text-gold-200'
                                            : 'border-gray-800 text-gray-500 hover:border-gray-600 bg-black/20'}
                                    `}
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-sm">{t.desc}</div>
                                        <div className="text-[10px] opacity-70">Tier {t.tier}</div>
                                    </div>
                                    <div className="font-mono font-bold text-lg">
                                        {t.cost.toLocaleString()} G
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 p-3 bg-black/40 border border-gray-800 rounded text-center">
                            <div className="text-xs text-gray-500">現在の所持金</div>
                            <div className={`font-mono text-lg ${userProfile && selectedTier && userProfile.gold < TIERS.find(t => t.tier === selectedTier)!.cost ? 'text-red-500' : 'text-gold-400'}`}>
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
                            px-8 py-3 min-w-[200px] font-bold tracking-widest transition-all
                            ${!selectedAttribute || !selectedTier || isPraying
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                : 'bg-[#a38b6b] text-black hover:bg-[#e3d5b8] hover:shadow-[0_0_15px_#a38b6b] border border-[#e3d5b8]'}
                        `}
                    >
                        {isPraying ? '祈っています...' : '祈りを捧げる'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Simple Icon Fallback for illustration
function ShieldCheckIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
