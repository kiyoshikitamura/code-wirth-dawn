import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Shield, Backpack, Zap, Heart, Sword, Users, Flame, X } from 'lucide-react';
import { getVitalityStatus } from '@/lib/character';
import { GROWTH_RULES } from '@/constants/game_rules';
import SkillDeckModal from './SkillDeckModal';
import EquipModal from './EquipModal';
import ItemModal from './ItemModal';
import PartyModal from './PartyModal';

interface StatusModalProps {
    onClose: () => void;
    isCampMode?: boolean;
    questLocked?: boolean;
}

export default function StatusModal({ onClose, isCampMode, questLocked }: StatusModalProps) {
    const { userProfile, fetchUserProfile, equipBonus } = useGameStore();
    const [showSkillDeck, setShowSkillDeck] = React.useState(false);
    const [showEquip, setShowEquip] = React.useState(false);
    const [showItems, setShowItems] = React.useState(false);
    const [showParty, setShowParty] = React.useState(false);

    React.useEffect(() => {
        fetchUserProfile();
    }, []);

    const vitalityStatus = userProfile?.vitality ? getVitalityStatus(userProfile.vitality) : 'Prime';
    const flameColor = vitalityStatus === 'Prime' ? 'text-orange-500' : vitalityStatus === 'Twilight' ? 'text-orange-800' : 'text-gray-700';

    return (
        <>
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-auto max-h-[92dvh] bg-gray-900 border border-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">

                {/* ── ヘッダー ── */}
                <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-950/60 shrink-0">
                    <h2 className="text-base font-serif text-gray-100 font-bold tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500" /> ステータス
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 rounded-full hover:bg-gray-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* ── 基礎ステータス（常時表示） ── */}
                <div className="px-4 py-4 bg-black/30 shrink-0 space-y-4 overflow-y-auto">
                    {/* プロフィール行 */}
                    <div className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-full border-2 border-gray-700 overflow-hidden bg-black shrink-0">
                            <img src={userProfile?.avatar_url || '/avatars/default.png'} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">{userProfile?.title_name || '名もなき旅人'}</div>
                            <div className="text-base font-bold text-white truncate leading-tight">{userProfile?.name || 'あなた'}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-blue-300 font-bold text-xs">Lv.{userProfile?.level ?? 1}</span>
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, ((Number(userProfile?.exp ?? 0)) / GROWTH_RULES.EXP_FORMULA(userProfile?.level || 1)) * 100))}%` }} />
                                </div>
                                <span className="text-[9px] text-gray-600 shrink-0">{userProfile?.exp ?? 0}/{GROWTH_RULES.EXP_FORMULA(userProfile?.level || 1)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                <span>年齢:{userProfile?.age ?? 20}</span>
                                <span className="text-gray-700">|</span>
                                <span>{userProfile?.gender === 'Male' ? '男性' : userProfile?.gender === 'Female' ? '女性' : '不明'}</span>
                                <span className="text-gray-700">|</span>
                                <span className="text-amber-500 font-bold">{(userProfile?.gold ?? 0).toLocaleString()} G</span>
                                <span className="text-gray-700">|</span>
                                <span>{userProfile?.accumulated_days ?? 0}日目</span>
                            </div>
                        </div>
                    </div>

                    {/* 戦闘ステータス + 生命力 */}
                    <div className="flex gap-2">
                        <div className="flex-1 grid grid-cols-3 gap-1.5">
                            <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-center">
                                <div className="text-[9px] text-gray-600">HP</div>
                                <div className="text-xs text-green-400 font-bold flex items-center justify-center gap-1">
                                    <Heart className="w-3.5 h-3.5" />
                                    {userProfile?.hp ?? 0}/{(userProfile?.max_hp ?? 100) + (equipBonus?.hp || 0)}
                                    {(equipBonus?.hp || 0) > 0 && <span className="text-[10px] ml-0.5 text-emerald-500 font-medium">+{equipBonus.hp}</span>}
                                </div>
                            </div>
                            <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-center">
                                <div className="text-[9px] text-gray-600">ATK</div>
                                <div className="text-xs text-red-400 font-bold flex items-center justify-center gap-1">
                                    <Sword className="w-3.5 h-3.5" />
                                    {(userProfile?.atk ?? 10) + (equipBonus?.atk || 0)}
                                    {(equipBonus?.atk || 0) > 0 && <span className="text-[10px] ml-0.5 text-orange-400 font-medium">+{equipBonus.atk}</span>}
                                </div>
                            </div>
                            <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-center">
                                <div className="text-[9px] text-gray-600">DEF</div>
                                <div className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1">
                                    <Shield className="w-3.5 h-3.5" />
                                    {(userProfile?.def ?? 0) + (equipBonus?.def || 0)}
                                    {(equipBonus?.def || 0) > 0 && <span className="text-[10px] ml-0.5 text-cyan-400 font-medium">+{equipBonus.def}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 生命力バー */}
                    <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full bg-gray-900 border border-gray-700 ${flameColor} shrink-0`}>
                            <Flame className="w-3.5 h-3.5" fill="currentColor" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-gray-500">生命力</span>
                                <span className={`${userProfile?.vitality && userProfile.vitality < 40 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                    {userProfile?.vitality ?? 100}/{userProfile?.max_vitality ?? 100}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${userProfile?.vitality && userProfile.vitality < 40 ? 'bg-red-900' : 'bg-orange-700'}`}
                                    style={{ width: `${Math.round(((userProfile?.vitality ?? 100) / (userProfile?.max_vitality ?? 100)) * 100)}%` }} />
                            </div>
                        </div>
                        <span className="text-[9px] text-gray-600 shrink-0">
                            {vitalityStatus === 'Prime' ? '全盛期' : vitalityStatus === 'Twilight' ? '黄昏' : '引退'}
                        </span>
                    </div>

                    {/* 2x2 ナビゲーションボタン */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => setShowSkillDeck(true)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-xs font-bold text-indigo-200 rounded-lg transition-all active:scale-95 shadow-md shadow-black/40 hover:from-indigo-900/80"
                        >
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                            スキルデッキ
                        </button>
                        <button
                            onClick={() => setShowEquip(true)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-600/40 hover:border-amber-500 text-xs font-bold text-amber-200 rounded-lg transition-all active:scale-95 shadow-md shadow-black/40 hover:from-amber-900/70"
                        >
                            <Shield className="w-4 h-4 text-orange-400" />
                            装備品
                        </button>
                        <button
                            onClick={() => setShowItems(true)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-600/40 hover:border-emerald-500 text-xs font-bold text-emerald-200 rounded-lg transition-all active:scale-95 shadow-md shadow-black/40 hover:from-emerald-900/70"
                        >
                            <Backpack className="w-4 h-4 text-emerald-400" />
                            所持品
                        </button>
                        <button
                            onClick={() => setShowParty(true)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-600/40 hover:border-purple-500 text-xs font-bold text-purple-200 rounded-lg transition-all active:scale-95 shadow-md shadow-black/40 hover:from-purple-900/70"
                        >
                            <Users className="w-4 h-4 text-purple-400" />
                            パーティ
                        </button>
                    </div>

                    {/* 通行許可証の有効期限表示 */}
                    {userProfile?.pass_expires_at && Object.keys(userProfile.pass_expires_at).length > 0 && (() => {
                        const activePasses: { name: string; daysLeft: number }[] = [];
                        const currentDays = userProfile.accumulated_days || 0;
                        const nationMap: Record<string, string> = {
                            Roland: 'ローランド',
                            Karyu: '華龍神朝',
                            Yato: '夜刀神国',
                            Markand: 'マルカンド'
                        };
                        for (const [locSlug, expiryDay] of Object.entries(userProfile.pass_expires_at)) {
                            const daysLeft = expiryDay - currentDays;
                            if (daysLeft > 0) {
                                activePasses.push({
                                    name: nationMap[locSlug] || locSlug,
                                    daysLeft
                                });
                            }
                        }
                        if (activePasses.length === 0) return null;
                        return (
                            <div className="bg-gray-950/40 p-2.5 rounded border border-gray-800/80 text-[10px] space-y-1 mt-2">
                                <div className="text-gray-500 font-bold uppercase tracking-wider">有効な通行許可:</div>
                                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                                    {activePasses.map((pass, i) => (
                                        <div key={i} className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/30 font-bold truncate text-center">
                                            {pass.name} (残り {pass.daysLeft} 日)
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>

        {/* ── サブモーダル ── */}
        {showSkillDeck && (
            <SkillDeckModal
                onClose={() => setShowSkillDeck(false)}
                questLocked={questLocked}
                isCampMode={isCampMode}
            />
        )}
        {showEquip && (
            <EquipModal
                onClose={() => setShowEquip(false)}
                questLocked={questLocked}
                isCampMode={isCampMode}
            />
        )}
        {showItems && (
            <ItemModal
                onClose={() => setShowItems(false)}
            />
        )}
        {showParty && (
            <PartyModal
                onClose={() => setShowParty(false)}
                userProfile={userProfile}
            />
        )}
        </>
    );
}
