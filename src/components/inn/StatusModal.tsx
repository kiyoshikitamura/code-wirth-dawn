
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Shield, Backpack, Zap, Heart, Sword, Star, Users, Flame, X } from 'lucide-react';
import { getVitalityStatus } from '@/lib/character';
import { GROWTH_RULES } from '@/constants/game_rules';

const JOB_CLASS_JP: Record<string, string> = {
    Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Paladin: '聖騎士',
    Ranger: '狩人', Scout: '斥候', Archer: '弓使い', Thief: '盗賊', Rogue: '遊撃士',
    Mage: '魔法使い', Wizard: '魔術師', Sorcerer: '術師', Warlock: '呪術師',
    Cleric: '僧侶', Priest: '神官', Druid: 'ドルイド', Shaman: '呪術師',
    Bard: '吟遊詩人', Merchant: '商人', Alchemist: '錬金術師', Scholar: '学者',
    Adventurer: '冒険者', Assassin: '暗殺者', Monk: '修道士', Necromancer: '死霊術師',
};
const toJpJobClass = (jc: string) => JOB_CLASS_JP[jc] || jc;

interface StatusModalProps {
    onClose: () => void;
    isCampMode?: boolean;
}

type TabKey = 'deck' | 'items' | 'party';

type DetailType = 'skill' | 'item' | 'npc';
interface DetailTarget { type: DetailType; data: any; }

export default function StatusModal({ onClose, isCampMode }: StatusModalProps) {
    const { userProfile, inventory, fetchInventory, toggleEquip, fetchUserProfile } = useGameStore();
    const [activeTab, setActiveTab] = React.useState<TabKey>('deck');
    const [detail, setDetail] = React.useState<DetailTarget | null>(null);

    React.useEffect(() => {
        fetchInventory();
        fetchUserProfile();
    }, []);

    const consumables = inventory.filter(i => !i.is_skill);
    const skills = inventory.filter(i => i.is_skill);
    const currentDeckCost = skills.filter(i => i.is_equipped).reduce((sum, i) => sum + (i.cost || 0), 0);

    const handleToggleSkill = async (item: any) => {
        const isQuestActive = !!userProfile?.current_quest_id && !isCampMode;
        if (!item.is_equipped) {
            if (currentDeckCost + (item.cost || 0) > (userProfile?.max_deck_cost || 10)) {
                alert("デッキコスト上限を超えています。レベルを上げてキャパシティを増やしてください。");
                return;
            }
            if (isQuestActive && item.acquired_at && userProfile?.quest_started_at) {
                const acquiredTime = new Date(item.acquired_at).getTime();
                const startedTime = new Date(userProfile.quest_started_at).getTime();
                if (acquiredTime < startedTime) {
                    alert("クエスト進行中は、事前所持アイテムを新たに装備できません。");
                    return;
                }
            }
        }
        await toggleEquip(item.id, item.is_equipped, isCampMode);
    };

    const vitalityStatus = userProfile?.vitality ? getVitalityStatus(userProfile.vitality) : 'Prime';
    const flameColor = vitalityStatus === 'Prime' ? 'text-orange-500' : vitalityStatus === 'Twilight' ? 'text-orange-800' : 'text-gray-700';

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: 'deck', label: 'デッキ', icon: <Zap className="w-3.5 h-3.5" />, count: skills.length },
        { key: 'items', label: '所持品', icon: <Backpack className="w-3.5 h-3.5" />, count: consumables.filter(i => (i.quantity || 0) > 0).length },
        { key: 'party', label: 'パーティ', icon: <Users className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-[92dvh] bg-gray-900 border border-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">

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
                <div className="px-4 py-3 border-b border-gray-800 bg-black/30 shrink-0 space-y-2.5">
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
                                <div className="text-xs text-green-400 font-bold flex items-center justify-center gap-1"><Heart className="w-3 h-3" />{userProfile?.hp ?? 100}/{userProfile?.max_hp ?? 100}</div>
                            </div>
                            <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-center">
                                <div className="text-[9px] text-gray-600">ATK</div>
                                <div className="text-xs text-red-400 font-bold flex items-center justify-center gap-1"><Sword className="w-3 h-3" />{userProfile?.atk ?? 10}</div>
                            </div>
                            <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-800 text-center">
                                <div className="text-[9px] text-gray-600">DEF</div>
                                <div className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1"><Shield className="w-3 h-3" />{userProfile?.def ?? 0}</div>
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
                </div>

                {/* ── タブバー ── */}
                <div className="flex border-b border-gray-800 bg-black/20 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                                activeTab === tab.key
                                    ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-900/10'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count != null && <span className="text-[9px] bg-gray-800 text-gray-400 px-1 rounded">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* ── タブコンテンツ（スクロール領域） ── */}
                <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-700">

                    {/* タブ1: デッキ/スキル */}
                    {activeTab === 'deck' && (
                        <div className="space-y-3">
                            {/* デッキコスト表示 */}
                            <div className="flex items-center justify-between bg-gray-800/40 px-3 py-1.5 rounded border border-gray-700">
                                <span className="text-xs text-gray-400">デッキコスト</span>
                                <span className={`text-sm font-mono font-bold ${currentDeckCost > (userProfile?.max_deck_cost || 10) ? 'text-red-400' : 'text-cyan-400'}`}>
                                    {currentDeckCost} / {userProfile?.max_deck_cost || 10}
                                </span>
                            </div>

                            {/* 装備中スキル */}
                            <div>
                                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <Star className="w-3 h-3" /> 装備中 ({skills.filter(i => i.is_equipped).length})
                                </div>
                                {skills.filter(i => i.is_equipped).length === 0 ? (
                                    <div className="text-center text-gray-600 py-3 text-xs">装備中のスキルがありません。</div>
                                ) : (
                                    <div className="space-y-1">
                                        {skills.filter(i => i.is_equipped).map(item => (
                                            <div key={item.id} onClick={() => setDetail({ type: 'skill', data: item })} className="flex items-center justify-between p-1.5 bg-purple-900/10 rounded border border-purple-900/30 hover:border-purple-700/50 transition-colors cursor-pointer active:bg-purple-900/20">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Zap className="w-3 h-3 text-purple-400" />}
                                                    </div>
                                                    <span className="text-xs text-gray-200 font-bold truncate">{item.name}</span>
                                                    <span className="text-[9px] text-cyan-600 border border-cyan-900 px-1 rounded shrink-0">C:{item.cost || 0}</span>
                                                </div>
                                                <span className="text-[9px] text-gray-600 shrink-0 ml-1">▶</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 未装備スキル */}
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> 未装備ストック ({skills.filter(i => !i.is_equipped).length})
                                </div>
                                {skills.filter(i => !i.is_equipped).length === 0 ? (
                                    <div className="text-center text-gray-600 py-3 text-xs">
                                        未装備のスキルはありません。<br />
                                        <span className="text-amber-600 text-[10px]">道具屋でスキルを購入しよう！</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {skills.filter(i => !i.is_equipped).map(item => {
                                            const isQuestActive = !!userProfile?.current_quest_id && !isCampMode;
                                            const isLocked = isQuestActive && item.acquired_at && userProfile?.quest_started_at && new Date(item.acquired_at).getTime() < new Date(userProfile.quest_started_at).getTime();
                                            const isOverCost = currentDeckCost + (item.cost || 0) > (userProfile?.max_deck_cost || 10);
                                            const isDisabled = isLocked || isOverCost;

                                            return (
                                                <div key={item.id} onClick={() => setDetail({ type: 'skill', data: item })} className="flex items-center justify-between p-1.5 bg-black/30 rounded border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer active:bg-gray-800/60">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Zap className="w-3 h-3 text-gray-500" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs text-gray-400 font-bold truncate">{item.name}</div>
                                                            {isLocked && <div className="text-[9px] text-red-500">※クエスト中装備不可</div>}
                                                            {isOverCost && <div className="text-[9px] text-orange-500">※コスト超過</div>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                                        <span className="text-[9px] text-cyan-600 border border-cyan-900 px-1 rounded">C:{item.cost || 0}</span>
                                                        <span className="text-[9px] text-gray-600">▶</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* タブ2: 所持品 */}
                    {activeTab === 'items' && (
                        <div>
                            {consumables.filter(i => (i.quantity || 0) > 0).length === 0 ? (
                                <div className="text-center text-gray-500 py-8 text-xs">所持品はありません。</div>
                            ) : (
                                <div className="space-y-1">
                                    {consumables.filter(i => (i.quantity || 0) > 0).map(item => (
                                        <div key={item.id} onClick={() => setDetail({ type: 'item', data: item })} className="flex items-center justify-between p-1.5 bg-black/30 rounded border border-gray-800 hover:border-gray-600 cursor-pointer active:bg-gray-800/60 transition-colors">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Heart className="w-3 h-3 text-green-400" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-300 font-bold truncate">
                                                        {item.name} <span className="text-gray-500 font-normal">x{item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-gray-600 shrink-0 ml-1">▶</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* タブ3: パーティ */}
                    {activeTab === 'party' && (
                        <PartyList userProfile={userProfile} onSelect={(npc: any) => setDetail({ type: 'npc', data: npc })} />
                    )}
                </div>

                {/* ── 詳細ポップアップ ── */}
                {detail && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-100" onClick={() => setDetail(null)}>
                        <div className="bg-gray-900 border border-gray-700 w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200" onClick={e => e.stopPropagation()}>
                            {/* ポップアップヘッダー */}
                            <div className="bg-gray-800/80 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                                <div className="w-10 h-10 rounded-lg bg-gray-700/60 border border-gray-600 flex items-center justify-center shrink-0 overflow-hidden">
                                    {detail.type === 'npc' ? (
                                        detail.data.icon_url || detail.data.image_url
                                            ? <img src={detail.data.icon_url || detail.data.image_url} alt={detail.data.name} className="w-full h-full object-cover" />
                                            : <Users className="w-5 h-5 text-blue-400" />
                                    ) : detail.type === 'skill' ? (
                                        detail.data.image_url ? <img src={detail.data.image_url} alt={detail.data.name} className="w-full h-full object-cover" /> : <Zap className="w-5 h-5 text-purple-400" />
                                    ) : (
                                        detail.data.image_url ? <img src={detail.data.image_url} alt={detail.data.name} className="w-full h-full object-cover" /> : <Heart className="w-5 h-5 text-green-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white truncate">{detail.data.name}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        {detail.type === 'skill' && <><span className="text-purple-400">スキル</span><span className="text-cyan-500">Cost:{detail.data.cost || 0}</span>{detail.data.is_equipped && <span className="text-amber-400">装備中</span>}</>}
                                        {detail.type === 'item' && <><span className="text-green-400">所持品</span><span>x{detail.data.quantity}</span></>}
                                        {detail.type === 'npc' && <><span className="text-blue-400">Lv.{detail.data.level || '?'} {toJpJobClass(detail.data.job_class || 'Adventurer')}</span></>}
                                    </div>
                                </div>
                                <button onClick={() => setDetail(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                            </div>

                            {/* ポップアップ内容 */}
                            <div className="px-4 py-3 space-y-3">
                                {/* 説明テキスト */}
                                {detail.type !== 'npc' && detail.data.effect_data?.description && (
                                    <div className="bg-amber-950/20 rounded-lg p-2.5 border border-amber-900/30">
                                        <p className="text-xs text-amber-400/80 italic leading-relaxed">「{detail.data.effect_data.description}」</p>
                                    </div>
                                )}
                                {detail.type === 'npc' && detail.data.flavor_text && (
                                    <div className="bg-blue-950/20 rounded-lg p-2.5 border border-blue-900/30">
                                        <p className="text-xs text-blue-400/80 italic leading-relaxed">「{detail.data.flavor_text}」</p>
                                    </div>
                                )}

                                {/* 効果詳細 */}
                                {detail.type !== 'npc' && detail.data.effect_data && (() => {
                                    const ed = detail.data.effect_data;
                                    const effects: string[] = [];
                                    if (ed.heal != null) effects.push(`HP +${ed.heal} 回復`);
                                    if (ed.mp_heal != null) effects.push(`MP +${ed.mp_heal} 回復`);
                                    if (ed.power != null && ed.power > 0) effects.push(`威力 ${ed.power}`);
                                    if (ed.atk_bonus != null) effects.push(`ATK +${ed.atk_bonus}`);
                                    if (ed.def_bonus != null) effects.push(`DEF +${ed.def_bonus}`);
                                    if (ed.max_hp_bonus != null) effects.push(`最大HP +${ed.max_hp_bonus}`);
                                    if (ed.duration != null) effects.push(`${ed.duration}ターン持続`);
                                    if (ed.effect) effects.push(String(ed.effect));
                                    if (ed.status) effects.push(`状態: ${ed.status}`);
                                    if (effects.length === 0) return null;
                                    return (
                                        <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700">
                                            <div className="text-[10px] text-gray-500 mb-1">効果</div>
                                            <div className="text-xs text-gray-200">{effects.join(' / ')}</div>
                                        </div>
                                    );
                                })()}

                                {/* NPC詳細 */}
                                {detail.type === 'npc' && (
                                    <>
                                        {/* ステータスグリッド */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-black/40 rounded p-2 text-center border border-gray-800">
                                                <div className="text-[10px] text-gray-500 mb-0.5">攻撃</div>
                                                <div className="text-red-400 font-bold font-mono">{detail.data.atk ?? detail.data.stats?.atk ?? '?'}</div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 text-center border border-gray-800">
                                                <div className="text-[10px] text-gray-500 mb-0.5">防御</div>
                                                <div className="text-blue-400 font-bold font-mono">{detail.data.def ?? detail.data.stats?.def ?? '?'}</div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 text-center border border-gray-800">
                                                <div className="text-[10px] text-gray-500 mb-0.5">HP</div>
                                                <div className="text-green-400 font-bold font-mono">{detail.data.hp ?? detail.data.stats?.hp ?? '?'}</div>
                                            </div>
                                        </div>
                                        {/* 所持スキル */}
                                        {detail.data.signature_deck_preview && detail.data.signature_deck_preview.length > 0 && (
                                            <div className="bg-black/30 rounded-lg p-2.5 border border-gray-800">
                                                <div className="text-[10px] text-gray-500 mb-1.5">所持スキル</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {detail.data.signature_deck_preview.map((card: string, i: number) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-700">{card}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* アクションボタン */}
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => setDetail(null)} className="flex-1 py-2 border border-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-colors">
                                        閉じる
                                    </button>
                                    {detail.type === 'skill' && (
                                        <button
                                            onClick={async () => { await handleToggleSkill(detail.data); setDetail(null); }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                                detail.data.is_equipped
                                                    ? 'bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50'
                                                    : 'bg-purple-900/30 text-purple-400 border border-purple-800 hover:bg-purple-900/50'
                                            }`}
                                        >
                                            {detail.data.is_equipped ? '装備を外す' : '装備する'}
                                        </button>
                                    )}
                                    {detail.type === 'item' && detail.data.name === '禁術の秘薬' && (
                                        <button
                                            onClick={async () => {
                                                if (!confirm("禁術の秘薬を使用しますか？\n失われた寿命(VITALITY)が1回復します。")) return;
                                                const { supabase } = await import('@/lib/supabase');
                                                const session = await supabase.auth.getSession();
                                                const res = await fetch('/api/profile/consume-elixir', {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${session.data.session?.access_token || ''}`, 'x-user-id': userProfile?.id || '' }
                                                });
                                                const data = await res.json();
                                                if (res.ok) { alert("禁術の秘薬を使用し、寿命が回復した！"); fetchInventory(); fetchUserProfile(); }
                                                else { alert("使用に失敗しました: " + (data.error || "Unknown")); }
                                                setDetail(null);
                                            }}
                                            className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50 transition-all"
                                        >
                                            使用する
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PartyList({ userProfile, onSelect }: { userProfile: any; onSelect: (npc: any) => void }) {
    const [party, setParty] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!userProfile?.id) return;
        import('@/lib/supabase').then(async ({ supabase }) => {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: HeadersInit = {};
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
            return fetch(`/api/party/list?owner_id=${userProfile.id}`, { headers });
        })
            .then(res => res.json())
            .then(data => { setParty(data.party || []); setLoading(false); })
            .catch(err => { console.error('Failed to fetch party:', err); setLoading(false); });
    }, [userProfile?.id]);

    const handleDismiss = async (memberId: string, name: string) => {
        if (!confirm(`${name}と別れますか？`)) return;
        try {
            const res = await fetch(`/api/party/member?id=${memberId}`, { method: 'DELETE' });
            if (res.ok) { setParty(prev => prev.filter(p => p.id !== memberId)); }
            else { alert('別れに失敗しました。'); }
        } catch (e) { console.error(e); alert('エラーが発生しました。'); }
    };

    if (loading) return <div className="text-xs text-gray-500 py-4 text-center">読み込み中...</div>;
    if (party.length === 0) return <div className="text-xs text-gray-500 py-8 text-center">同行者はいません。<br /><span className="text-[10px] text-amber-600">酒場で仲間を雇おう！</span></div>;

    return (
        <div className="space-y-1">
            {party.map(member => (
                <div key={member.id} onClick={() => onSelect(member)} className="flex items-center justify-between p-1.5 bg-black/30 rounded border border-gray-800 hover:border-gray-600 cursor-pointer active:bg-gray-800/60 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {member.icon_url || member.image_url ? <img src={member.icon_url || member.image_url} alt={member.name} className="w-full h-full object-cover" /> : <div className="text-gray-400 text-[10px]">{member.name[0]}</div>}
                        </div>
                        <div>
                            <div className="text-xs text-blue-300 font-bold">{member.name}</div>
                            <div className="text-[10px] text-gray-500">{toJpJobClass(member.job_class || 'Adventurer')} / HP:{member.hp ?? member.durability}</div>
                        </div>
                    </div>
                    <span className="text-[9px] text-gray-600 shrink-0">▶</span>
                </div>
            ))}
        </div>
    );
}

