import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/game';
import { X, UserPlus, Shield, Sword, Heart, Coins } from 'lucide-react';
import { ShadowSummary } from '@/services/shadowService';

interface TavernModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    locationId: string;
}

export default function TavernModal({ isOpen, onClose, userProfile, locationId }: TavernModalProps) {
    const [activeTab, setActiveTab] = useState<'hire' | 'register'>('hire');
    const [shadows, setShadows] = useState<ShadowSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [hireStatus, setHireStatus] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && activeTab === 'hire') {
            fetchShadows();
        }
    }, [isOpen, activeTab, locationId]);

    const fetchShadows = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tavern/list?location_id=${locationId}&user_id=${userProfile.id}`);
            const data = await res.json();
            if (data.shadows) {
                setShadows(data.shadows);
            }
        } catch (e) {
            console.error("Failed to fetch shadows", e);
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (shadow: ShadowSummary) => {
        if (userProfile.gold < shadow.contract_fee) {
            alert('ゴールドが足りません！');
            return;
        }

        if (!confirm(`${shadow.name} を ${shadow.contract_fee}G で雇用しますか？`)) return;

        setHireStatus('雇用処理中...');
        try {
            const res = await fetch('/api/tavern/hire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userProfile.id, shadow })
            });
            const data = await res.json();

            if (data.success) {
                alert('雇用契約が成立しました！');
                onClose();
            } else {
                alert(`エラー: ${data.error}`);
            }
        } catch (e) {
            alert('通信エラーが発生しました');
        } finally {
            setHireStatus(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1a202c] border-2 border-[#a38b6b] max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl relative">
                {/* Header */}
                <div className="p-4 border-b border-[#a38b6b]/30 flex justify-between items-center bg-[#0d1117]">
                    <h2 className="text-2xl font-serif text-[#e3d5b8] flex items-center gap-2">
                        <Coins className="text-yellow-500" /> 冒険者の酒場
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#a38b6b]/20">
                    <button
                        onClick={() => setActiveTab('hire')}
                        className={`flex-1 p-3 text-center transition-colors font-bold tracking-wider ${activeTab === 'hire' ? 'bg-[#a38b6b]/20 text-[#e3d5b8] border-b-2 border-[#a38b6b]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        傭兵を雇う
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 p-3 text-center transition-colors font-bold tracking-wider ${activeTab === 'register' ? 'bg-[#a38b6b]/20 text-[#e3d5b8] border-b-2 border-[#a38b6b]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        影の登録（準備中）
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[url('/textures/parchment-dark.jpg')] bg-cover">
                    {activeTab === 'hire' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading && <div className="text-center text-gray-400 col-span-2">酒場を見回しています...</div>}

                            {!loading && shadows.length === 0 && (
                                <div className="text-center text-gray-500 col-span-2 py-10">
                                    <p>ここには誰もいないようだ...</p>
                                    <p className="text-sm mt-2">他のプレイヤーがこの地を訪れるのを待ちましょう。</p>
                                </div>
                            )}

                            {shadows.map((shadow, idx) => (
                                <div key={idx} className={`relative p-4 border transition-all hover:bg-black/40 group ${shadow.is_subscriber ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700 bg-black/20'}`}>
                                    {/* Badges */}
                                    {shadow.is_subscriber && (
                                        <div className="absolute top-0 right-0 bg-yellow-600 text-black text-[10px] px-2 py-0.5 font-bold">LEGEND</div>
                                    )}
                                    {shadow.origin_type === 'system_mercenary' && (
                                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 font-bold">OFFICIAL</div>
                                    )}

                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-lg font-bold text-[#e3d5b8]">{shadow.name}</div>
                                            <div className="text-xs text-gray-400">Lv.{shadow.level} {shadow.job_class}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-yellow-400 font-mono font-bold">{shadow.contract_fee} G</div>
                                            <div className="text-[10px] text-gray-500">契約金</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mb-4 text-xs font-mono text-gray-300">
                                        <div className="flex items-center gap-1"><Sword size={12} /> {shadow.stats.atk}</div>
                                        <div className="flex items-center gap-1"><Shield size={12} /> {shadow.stats.def}</div>
                                        <div className="flex items-center gap-1"><Heart size={12} /> {shadow.stats.hp}</div>
                                    </div>

                                    {/* Deck Preview */}
                                    {shadow.signature_deck_preview.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-[10px] text-gray-500 mb-1">SIGNATURE CARDS</div>
                                            <div className="flex gap-1 flex-wrap">
                                                {shadow.signature_deck_preview.map((card, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-600">
                                                        {card}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleHire(shadow)}
                                        disabled={!!hireStatus || userProfile.gold < shadow.contract_fee}
                                        className={`w-full py-2 flex items-center justify-center gap-2 border transition-colors
                                            ${userProfile.gold < shadow.contract_fee
                                                ? 'border-red-900/50 text-red-700 cursor-not-allowed'
                                                : 'border-[#a38b6b] text-[#a38b6b] hover:bg-[#a38b6b] hover:text-black'}`}
                                    >
                                        <UserPlus size={16} />
                                        {userProfile.gold < shadow.contract_fee ? '資金不足' : '契約を結ぶ'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'register' && (
                        <div className="text-center text-gray-400 py-20">
                            <h3 className="text-xl mb-4">影の登録</h3>
                            <p>自分の写し身を酒場に登録し、不労所得を得ることができます。</p>
                            <p className="text-sm mt-4 text-yellow-600">※ この機能は開発中です。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
