'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, Shield, Backpack, Zap } from 'lucide-react';

export default function StatusPage() {
    const router = useRouter();
    const { userProfile, inventory, fetchInventory, toggleEquip, fetchUserProfile } = useGameStore();

    useEffect(() => {
        fetchInventory();
        fetchUserProfile();
    }, []);

    // Helper to get item counts or details
    const consumables = inventory.filter(i => !i.is_skill);
    const skills = inventory.filter(i => i.is_skill);

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans p-4 relative">
            <div className="absolute inset-0 bg-[url('/backgrounds/status_bg.jpg')] bg-cover bg-center opacity-20 pointer-events-none"></div>

            <header className="relative z-10 max-w-4xl mx-auto py-6 mb-6 flex items-center gap-4 border-b border-gray-800">
                <button onClick={() => router.push('/inn')} className="text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-serif text-gray-100 font-bold tracking-wider flex items-center gap-2">
                    <Shield className="w-6 h-6 text-gray-500" /> ステータス・所持品
                </h1>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Profile Section */}
                <section className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">冒険者情報</h2>
                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-600 overflow-hidden bg-black">
                            <img src={userProfile?.avatar_url || '/avatars/default.png'} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">{userProfile?.title_name || '名もなき旅人'}</div>
                            <div className="text-sm text-gray-500">Age: {userProfile?.age || 20}</div>
                            <div className="text-sm text-amber-500 mt-1">Gold: {userProfile?.gold} G</div>
                        </div>
                    </div>
                </section>

                {/* Right Column: Inventory & Skills */}
                <div className="space-y-6">
                    {/* Inventory */}
                    <section className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-bold text-amber-500 mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                            <Backpack className="w-4 h-4" /> 所持品 (消費アイテム)
                        </h2>
                        {consumables.length === 0 ? (
                            <div className="text-center text-gray-500 py-4 text-sm">所持品はありません。</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                                {consumables.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-black/40 rounded border border-gray-800">
                                        <div>
                                            <div className="text-sm text-gray-300 font-bold">{item.name} <span className="text-gray-500 text-xs">x{item.quantity}</span></div>
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleEquip(item.id, item.is_equipped)}
                                            className={`text-xs px-3 py-1 rounded border transition-colors ${item.is_equipped
                                                    ? 'bg-amber-900/30 border-amber-600 text-amber-500 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {item.is_equipped ? '装備中' : '装備'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Skills */}
                    <section className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-bold text-purple-400 mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> 習得スキル
                        </h2>
                        {skills.length === 0 ? (
                            <div className="text-center text-gray-500 py-4 text-sm">習得したスキルはありません。</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                                {skills.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-black/40 rounded border border-gray-800">
                                        <div>
                                            <div className="text-sm text-purple-300 font-bold">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleEquip(item.id, item.is_equipped)}
                                            className={`text-xs px-3 py-1 rounded border transition-colors ${item.is_equipped
                                                    ? 'bg-purple-900/30 border-purple-500 text-purple-400 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {item.is_equipped ? 'セット中' : 'セット'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
