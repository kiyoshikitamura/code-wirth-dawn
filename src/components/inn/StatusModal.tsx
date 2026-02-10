
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Shield, Backpack, Zap, Heart, Sword, Star, Users, Flame, Database, X } from 'lucide-react';
import { getVitalityStatus } from '@/lib/character';
import { GROWTH_RULES } from '@/constants/game_rules';

interface StatusModalProps {
    onClose: () => void;
}

export default function StatusModal({ onClose }: StatusModalProps) {
    const { userProfile, inventory, fetchInventory, toggleEquip, fetchUserProfile } = useGameStore();

    React.useEffect(() => {
        fetchInventory();
        fetchUserProfile();
    }, []);

    // Helper to get item counts or details
    const consumables = inventory.filter(i => !i.is_skill);
    const skills = inventory.filter(i => i.is_skill);
    const currentDeckCost = skills.filter(i => i.is_equipped).reduce((sum, i) => sum + (i.cost || 0), 0);

    const handleToggleSkill = async (item: any) => {
        if (!item.is_equipped && currentDeckCost + (item.cost || 0) > (userProfile?.max_deck_cost || 10)) {
            alert("デッキコスト上限を超えています。レベルを上げてキャパシティを増やしてください。");
            return;
        }
        await toggleEquip(item.id, item.is_equipped);
    };

    const vitalityStatus = userProfile?.vitality ? getVitalityStatus(userProfile.vitality) : 'Prime';
    const flameColor = vitalityStatus === 'Prime' ? 'text-orange-500' : vitalityStatus === 'Twilight' ? 'text-orange-800' : 'text-gray-700';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl h-[90vh] bg-gray-900 border border-t-amber-900/50 border-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col relative">

                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/50">
                    <h2 className="text-xl font-serif text-gray-100 font-bold tracking-wider flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" /> ステータス・所持品
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 scrollbar-thin scrollbar-thumb-gray-700">

                    {/* Left Column: Profile */}
                    <div className="space-y-6">
                        <section className="bg-black/40 border border-gray-700 p-6 rounded-lg shadow-lg flex flex-col gap-6">
                            {/* Identity */}
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-full border-2 border-gray-600 overflow-hidden bg-black shrink-0 relative">
                                    <img src={userProfile?.avatar_url || '/avatars/default.png'} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">{userProfile?.title_name || '名もなき旅人'}</div>
                                    <div className="text-xl font-bold text-white truncate">{userProfile?.name || 'あなた'}</div>
                                    <div className="text-sm text-gray-500 flex flex-col gap-1 mt-1 w-full">
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="text-blue-300 font-bold shrink-0">Lv.{userProfile?.level ?? 1}</span>
                                            {/* Exp Bar */}
                                            <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative border border-gray-700 group">
                                                <div
                                                    className="h-full bg-blue-600 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(0, ((Number(userProfile?.exp ?? 0)) / GROWTH_RULES.EXP_FORMULA(userProfile?.level || 1)) * 100))}%` }}
                                                ></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {userProfile?.exp ?? 0} / {GROWTH_RULES.EXP_FORMULA(userProfile?.level || 1)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span>年齢: {userProfile?.age ?? 20}</span>
                                            <span className="w-px h-3 bg-gray-700"></span>
                                            <span>{userProfile?.gender === 'Male' ? '男性' : userProfile?.gender === 'Female' ? '女性' : '不明'}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-amber-500 font-bold mt-1">
                                        所持金: {userProfile?.gold ?? 0} G
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        冒険日数: {userProfile?.accumulated_days ?? 0} 日目
                                    </div>
                                </div>
                            </div>

                            {/* VITALITY */}
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex items-center gap-4">
                                <div className={`p-2 rounded-full bg-gray-900 border border-gray-700 ${flameColor} animate-pulse`}>
                                    <Flame className="w-6 h-6" fill="currentColor" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400 font-bold tracking-wider">VITALITY</span>
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
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div className="bg-gray-900/50 p-2 rounded border border-gray-800">
                                    <div className="text-xs text-center text-gray-500 mb-1">HP</div>
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                                        <Heart className="w-4 h-4" /> {userProfile?.hp ?? 100}/{userProfile?.max_hp ?? 100}
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded border border-gray-800">
                                    <div className="text-xs text-center text-gray-500 mb-1">攻撃力</div>
                                    <div className="flex items-center justify-center gap-2 text-red-400 font-bold">
                                        <Sword className="w-4 h-4" /> {userProfile?.attack ?? 10}
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded border border-gray-800">
                                    <div className="text-xs text-center text-gray-500 mb-1">防御力</div>
                                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold">
                                        <Shield className="w-4 h-4" /> {userProfile?.def ?? 0}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Inventory & Skills */}
                    <div className="space-y-6">
                        {/* Skills (Deck) */}
                        <section className="bg-black/40 border border-gray-700 p-6 rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> 習得スキル (Deck)
                                </h2>
                                <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-gray-600">
                                    <Database className="w-4 h-4 text-cyan-400" />
                                    <span className={`font-mono font-bold ${currentDeckCost > (userProfile?.max_deck_cost || 10) ? 'text-red-500' : 'text-cyan-100'}`}>
                                        Cost: {currentDeckCost} / {userProfile?.max_deck_cost || 10}
                                    </span>
                                </div>
                            </div>
                            {skills.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 text-sm">習得したスキルはありません。</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                                    {skills.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-2 bg-black/40 rounded border border-gray-800 relative group hover:border-purple-500/30 transition-colors">
                                            <div className="absolute top-1 right-14 opacity-50 text-[10px] text-cyan-500 border border-cyan-800 px-1 rounded">
                                                Cost {item.cost || 0}
                                            </div>
                                            <div>
                                                <div className="text-sm text-purple-300 font-bold">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.effect_data?.description || ''}</div>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSkill(item)}
                                                disabled={!item.is_equipped && currentDeckCost + (item.cost || 0) > (userProfile?.max_deck_cost || 10)}
                                                className={`text-xs px-3 py-1 rounded border transition-colors ${item.is_equipped
                                                    ? 'bg-purple-900/30 border-purple-500 text-purple-400 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                    }`}
                                            >
                                                {item.is_equipped ? '外す' : '装備'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Consumables */}
                        <section className="bg-black/40 border border-gray-700 p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-bold text-amber-500 mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                                <Backpack className="w-4 h-4" /> 所持品
                            </h2>
                            {consumables.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 text-sm">所持品はありません。</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                                    {consumables.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-2 bg-black/40 rounded border border-gray-800">
                                            <div>
                                                <div className="text-sm text-gray-300 font-bold">{item.name} <span className="text-gray-500 text-xs">x{item.quantity}</span></div>
                                                <div className="text-xs text-gray-500">{item.effect_data?.description || ''}</div>
                                            </div>
                                            {/* Consumables equip not implemented fully, but keeping button for consistency if needed */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
}
