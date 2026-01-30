'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, Shield, Backpack, Zap, Heart, Sword, Star, Users, Flame } from 'lucide-react';
import { getVitalityStatus } from '@/lib/character';

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

    const vitalityStatus = userProfile?.vitality ? getVitalityStatus(userProfile.vitality) : 'Prime';
    const flameColor = vitalityStatus === 'Prime' ? 'text-orange-500' : vitalityStatus === 'Twilight' ? 'text-orange-800' : 'text-gray-700';

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
                <button
                    onClick={() => useGameStore.getState().clearStorage()}
                    className="ml-auto text-[10px] bg-red-900/20 text-red-500 border border-red-900 px-2 py-1 rounded hover:bg-red-900/50 transition-colors"
                    title="表示がおかしい場合に押してください"
                >
                    データ修復
                </button>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Profile Section */}
                <section className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg shadow-lg flex flex-col gap-6">
                    {/* Header: Identity */}
                    <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-600 overflow-hidden bg-black shrink-0 relative">
                            <img src={userProfile?.avatar_url || '/avatars/default.png'} alt="Avatar" className="w-full h-full object-cover" />
                            {/* Level Badge */}
                            <div className="absolute bottom-0 right-0 bg-blue-900 text-blue-100 text-xs px-1.5 py-0.5 rounded border border-blue-700">
                                Lv.{userProfile?.level ?? 1}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">{userProfile?.title_name || '名もなき旅人'}</div>
                            <div className="text-xl font-bold text-white truncate">あなた</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <span>Age: {userProfile?.age || 20}</span>
                                <span className="w-px h-3 bg-gray-700"></span>
                                <span className="text-amber-500">{userProfile?.gold ?? 0} G</span>
                            </div>
                        </div>
                    </div>

                    {/* VITALITY: Life Candle */}
                    <div className="bg-black/40 p-3 rounded border border-gray-800 flex items-center gap-4">
                        <div className={`p-2 rounded-full bg-gray-900 border border-gray-700 ${flameColor} animate-pulse`}>
                            <Flame className="w-6 h-6" fill="currentColor" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400 font-bold tracking-wider">VITALITY (命の灯火)</span>
                                <span className={`${userProfile?.vitality && userProfile.vitality < 40 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    {userProfile?.vitality ?? 100}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${userProfile?.vitality && userProfile.vitality < 40 ? 'bg-red-900' : 'bg-orange-700'}`}
                                    style={{ width: `${userProfile?.vitality ?? 100}%` }}
                                />
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1">
                                {vitalityStatus === 'Prime' ? '全盛期: 心身ともに充実している。' :
                                    vitalityStatus === 'Twilight' ? '黄昏: 身体の衰えを感じる...' : '引退: 冒険の終わり。'}
                            </div>
                        </div>
                    </div>

                    {/* COMBAT STATS */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* HP */}
                        <div className="bg-black/40 p-2 rounded border border-gray-800">
                            <div className="text-xs text-center text-gray-500 mb-1">HP</div>
                            <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                                <Heart className="w-4 h-4" /> {userProfile?.hp ?? 100}/{userProfile?.max_hp ?? 100}
                            </div>
                        </div>
                        {/* MP */}
                        <div className="bg-black/40 p-2 rounded border border-gray-800">
                            <div className="text-xs text-center text-gray-500 mb-1">MP</div>
                            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold">
                                <Zap className="w-4 h-4" /> {userProfile?.mp ?? 20}/{userProfile?.max_mp ?? 20}
                            </div>
                        </div>
                        {/* ATK */}
                        <div className="bg-black/40 p-2 rounded border border-gray-800">
                            <div className="text-xs text-center text-gray-500 mb-1">攻撃力</div>
                            <div className="flex items-center justify-center gap-2 text-red-400 font-bold">
                                <Sword className="w-4 h-4" /> {userProfile?.attack ?? 10}
                            </div>
                        </div>
                        {/* DEF */}
                        <div className="bg-black/40 p-2 rounded border border-gray-800">
                            <div className="text-xs text-center text-gray-500 mb-1">防御力</div>
                            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold">
                                <Shield className="w-4 h-4" /> {userProfile?.defense ?? 5}
                            </div>
                        </div>
                    </div>

                    {/* SOCIAL STATS */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                        <div className="flex flex-col items-center p-2">
                            <div className="text-xs text-gray-500">称賛 (Given)</div>
                            <div className="text-amber-500 font-bold flex items-center gap-1">
                                <Star className="w-3 h-3" /> {userProfile?.praise_count ?? 0}
                            </div>
                        </div>
                        <div className="flex flex-col items-center p-2">
                            <div className="text-xs text-gray-500">祈り (Prayed)</div>
                            <div className="text-blue-500 font-bold flex items-center gap-1">
                                <Users className="w-3 h-3" /> {userProfile?.prayer_count ?? 0}
                            </div>
                        </div>
                    </div>

                    {/* REPUTATIONS LIST */}
                    <div className="pt-4 border-t border-gray-800">
                        <div className="text-xs text-gray-500 mb-2">地域別名声 (Reputations)</div>
                        {userProfile?.reputations && userProfile.reputations.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {userProfile.reputations.map(rep => (
                                    <div key={rep.location_name} className="bg-black/40 p-2 rounded border border-gray-800 flex justify-between items-center">
                                        <span className="text-xs text-gray-400">{rep.location_name}</span>
                                        <span className={`text-xs font-bold ${rep.rank === 'Hero' ? 'text-amber-400' : rep.rank === 'Criminal' ? 'text-red-500' : 'text-gray-300'}`}>
                                            {rep.rank}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-600 italic">まだ名声はありません。</div>
                        )}
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
