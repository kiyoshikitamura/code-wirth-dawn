import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Zap, X, Layers, AlertCircle, Users, Check, Sparkles, Wand2, Sword } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getItemImageUrl, getEffectList } from '@/lib/itemUtils';
import { getAuthHeaders } from '@/lib/authToken';

interface SkillDeckModalProps {
    onClose: () => void;
    questLocked?: boolean;
    isCampMode?: boolean;
}

export default function SkillDeckModal({ onClose, questLocked, isCampMode }: SkillDeckModalProps) {
    const { userProfile, inventory, fetchInventory, toggleEquip, fetchUserProfile } = useGameStore();
    const [partyCards, setPartyCards] = useState<any[]>([]);
    const [partyLoading, setPartyLoading] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showStock, setShowStock] = useState(true);
    const [showNPC, setShowNPC] = useState(true);
    const [costFilter, setCostFilter] = useState<'all' | '0' | '1' | '2' | '3+'>('all');

    useEffect(() => {
        fetchInventory();
        fetchUserProfile();
        fetchPartyCards();
    }, []);

    const fetchPartyCards = async () => {
        if (!userProfile?.id) return;
        setPartyLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`, { headers: authHeaders });
            if (res.ok) {
                const data = await res.json();
                const party = data.party || [];
                const cardIdsSet = new Set<number>();
                party.forEach((member: any) => {
                    if (member.inject_cards && Array.isArray(member.inject_cards)) {
                        member.inject_cards.forEach((id: any) => {
                            const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                            if (!isNaN(numId)) cardIdsSet.add(numId);
                        });
                    }
                });

                const uniqueIds = Array.from(cardIdsSet);
                if (uniqueIds.length > 0) {
                    const cardsRes = await fetch(`/api/cards?ids=${uniqueIds.join(',')}`);
                    if (cardsRes.ok) {
                        const cardsData = await cardsRes.json();
                        setPartyCards(cardsData.cards || []);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch party cards', e);
        } finally {
            setPartyLoading(false);
        }
    };

    const skills = inventory.filter(i => i.is_skill || i.item_type === 'skill_card');
    const equippedSkills = skills.filter(i => i.is_equipped);
    const stockSkills = skills.filter(i => !i.is_equipped);
    
    const currentDeckCost = equippedSkills.reduce((sum, i) => sum + (i.cost || 0), 0);
    const maxDeckCost = userProfile?.max_deck_cost || 10;

    const handleToggle = async (item: any) => {
        if (questLocked) {
            alert("クエスト進行中はスキルの装備変更ができません。");
            return;
        }
        const isQuestActive = !!userProfile?.current_quest_id && !isCampMode;
        if (!item.is_equipped) {
            if (currentDeckCost + (item.cost || 0) > maxDeckCost) {
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
        setTogglingId(item.id);
        try {
            await toggleEquip(item.id, item.is_equipped, isCampMode);
            await fetchInventory(); // リフレッシュ
        } finally {
            setTogglingId(null);
            if (selectedDetail && selectedDetail.id === item.id) {
                setSelectedDetail({ ...selectedDetail, is_equipped: !item.is_equipped });
            }
        }
    };

    // 詳細表示用ポップアップの描画
    const renderDetailPopup = () => {
        if (!selectedDetail) return null;
        
        const isSkillCard = selectedDetail.item_type === 'skill_card' || selectedDetail.is_skill;
        const effectList = getEffectList(selectedDetail.effect_data);
        const isMagic = selectedDetail.effect_data?.card_type === 'Magic' || selectedDetail.effect_data?.type === 'Magic';
        const apCost = selectedDetail.effect_data?.ap_cost ?? selectedDetail.ap_cost ?? 1;
        const power = selectedDetail.effect_data?.effect_val ?? selectedDetail.effect_val ?? selectedDetail.power_value ?? 0;

        return createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setSelectedDetail(null)}>
                <div className="bg-[#0f172a] border border-blue-900/50 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-950/80 to-slate-900 p-4 flex items-center gap-3 border-b border-blue-900/30">
                        <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                            {selectedDetail.image_url ? (
                                <img src={selectedDetail.image_url} alt={selectedDetail.name} className="w-full h-full object-cover" />
                            ) : (
                                <Zap className="w-5 h-5 text-amber-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{selectedDetail.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-700/50 text-blue-300 bg-blue-950/40">
                                    {isSkillCard ? 'スキル' : 'NPCサポート'}
                                </span>
                                {selectedDetail.cost != null && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-800 text-cyan-400 bg-cyan-950/30 font-mono">
                                        コスト:{selectedDetail.cost}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-col items-center">
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[9px] text-gray-500 mt-1">AP消費</span>
                                <span className="text-xs font-bold text-cyan-400 font-mono">{apCost}</span>
                            </div>
                            <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-col items-center">
                                {isMagic ? <Wand2 className="w-3.5 h-3.5 text-purple-400" /> : <Sword className="w-3.5 h-3.5 text-orange-400" />}
                                <span className="text-[9px] text-gray-500 mt-1">威力</span>
                                <span className={`text-xs font-bold font-mono ${isMagic ? 'text-purple-400' : 'text-orange-400'}`}>{power}</span>
                            </div>
                        </div>

                        {/* Effects */}
                        {effectList.length > 0 && (
                            <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-800/80">
                                <div className="text-[10px] text-gray-500 mb-1">詳細効果</div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {effectList.map((eff, i) => (
                                        <div key={i} className="flex items-center justify-between bg-black/20 rounded px-2 py-0.5 border border-slate-900">
                                            <span className="text-[9px] text-gray-400">{eff.label}</span>
                                            <span className={`text-xs font-bold ${eff.color}`}>{eff.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {selectedDetail.description && (
                            <div className="bg-amber-950/20 rounded-lg p-2.5 border border-amber-900/30">
                                <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                    「{selectedDetail.description}」
                                </p>
                            </div>
                        )}

                        {/* Action Button (only for player owned skills) */}
                        {selectedDetail.id != null && (
                            <button
                                onClick={() => handleToggle(selectedDetail)}
                                disabled={togglingId === selectedDetail.id}
                                className={`w-full py-2 rounded text-xs font-bold transition-all ${
                                    selectedDetail.is_equipped
                                        ? 'bg-red-950/80 text-red-200 border border-red-800/60 hover:bg-red-900/70'
                                        : 'bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700'
                                }`}
                            >
                                {togglingId === selectedDetail.id ? '処理中...' : selectedDetail.is_equipped ? 'デッキから外す' : 'デッキに装備する'}
                            </button>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-[90dvh] bg-[#0c1222] border-2 border-blue-950/70 rounded-lg shadow-2xl overflow-hidden flex flex-col relative text-slate-100">
                
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-blue-950 bg-[#090d1a] shrink-0">
                    <h2 className="text-sm font-bold tracking-widest text-blue-400 flex items-center gap-1.5 font-serif">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" /> スキルデッキ管理
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-full transition-colors active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    
                    {/* Deck Cost capacity */}
                    <div className="bg-gradient-to-r from-blue-950/40 to-slate-900/60 p-3 rounded-lg border border-blue-900/30 flex justify-between items-center shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">デッキキャパシティ</span>
                            <span className="text-[9px] text-slate-500 mt-0.5">※レベルアップにより上限が増加します</span>
                        </div>
                        <div className={`text-base font-bold font-mono px-3 py-1 rounded bg-black/40 border ${currentDeckCost > maxDeckCost ? 'text-red-400 border-red-900' : 'text-cyan-400 border-blue-950'}`}>
                            {currentDeckCost} / {maxDeckCost}
                        </div>
                    </div>

                    {/* Section 1: Equipped Skills */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold text-blue-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 装備中スキル ({equippedSkills.length})
                        </h3>
                        {equippedSkills.length === 0 ? (
                            <div className="text-center text-xs text-slate-500 py-4 bg-slate-950/20 rounded border border-slate-900 border-dashed">
                                装備しているスキルがありません
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1.5">
                                {equippedSkills.map(item => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setSelectedDetail(item)}
                                        className="flex items-center justify-between p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 hover:border-blue-700/50 transition-all cursor-pointer group active:bg-blue-950/40"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center shrink-0 border border-blue-900/30 overflow-hidden shadow-inner">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate">{item.name}</div>
                                                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">コスト: {item.cost || 0}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await handleToggle(item);
                                            }}
                                            disabled={togglingId === item.id}
                                            className="px-2.5 py-1 text-[10px] font-bold rounded bg-red-950/70 border border-red-900/60 hover:bg-red-900/80 text-red-200 transition-colors active:scale-95"
                                        >
                                            {togglingId === item.id ? '...' : '外す'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section 2: Stock Skills */}
                    <section className="space-y-2">
                        <button
                            onClick={() => setShowStock(!showStock)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors py-1 select-none"
                        >
                            <div className="flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                <span>所持スキルストック ({stockSkills.length})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {showStock ? '▲ 閉じる' : '▼ 開く'}
                            </span>
                        </button>
                        
                        {showStock && (
                            <>
                                {/* コストフィルタ */}
                                <div className="flex flex-wrap gap-1 items-center bg-slate-950/40 p-2 rounded border border-slate-900/60 mb-2">
                                    <span className="text-[10px] text-slate-500 mr-1">コストフィルタ:</span>
                                    {(['all', '0', '1', '2', '3+'] as const).map(f => {
                                        const count = stockSkills.filter(item => {
                                            if (f === 'all') return true;
                                            const cost = item.cost || 0;
                                            if (f === '3+') return cost >= 3;
                                            return cost === parseInt(f, 10);
                                        }).length;
                                        return (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setCostFilter(f); }}
                                                className={`px-2 py-0.5 text-[9px] rounded font-bold border transition-colors ${
                                                    costFilter === f
                                                        ? 'bg-blue-900 border-blue-700 text-blue-200'
                                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                                }`}
                                            >
                                                {f === 'all' ? `すべて (${stockSkills.length})` : f === '3+' ? `3+ (${count})` : `C${f} (${count})`}
                                            </button>
                                        );
                                    })}
                                </div>

                                {stockSkills.filter(item => {
                                    if (costFilter === 'all') return true;
                                    const cost = item.cost || 0;
                                    if (costFilter === '3+') return cost >= 3;
                                    return cost === parseInt(costFilter, 10);
                                }).length === 0 ? (
                                    <div className="text-center text-xs text-slate-500 py-4 bg-slate-950/20 rounded border border-slate-900 border-dashed">
                                        {costFilter === 'all' ? '未装備の所持スキルはありません' : 'フィルタ条件に合うスキルはありません'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {stockSkills
                                            .filter(item => {
                                                if (costFilter === 'all') return true;
                                                const cost = item.cost || 0;
                                                if (costFilter === '3+') return cost >= 3;
                                                return cost === parseInt(costFilter, 10);
                                            })
                                            .map(item => {
                                                const isQuestActive = !!userProfile?.current_quest_id && !isCampMode;
                                                const isLocked = isQuestActive && item.acquired_at && userProfile?.quest_started_at && new Date(item.acquired_at).getTime() < new Date(userProfile.quest_started_at).getTime();
                                                const isOverCost = currentDeckCost + (item.cost || 0) > maxDeckCost;
                                                const isDisabled = isLocked || isOverCost;

                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => setSelectedDetail(item)}
                                                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group active:bg-slate-900/50"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800/60 overflow-hidden shadow-inner">
                                                                {item.image_url ? (
                                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Zap className="w-3.5 h-3.5 text-slate-500" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-slate-300 group-hover:text-slate-100 transition-colors truncate">{item.name}</div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-cyan-500 font-mono">コスト: {item.cost || 0}</span>
                                                                    {isLocked && <span className="text-[9px] text-red-500 font-semibold font-serif">※クエスト中装備不可</span>}
                                                                    {isOverCost && <span className="text-[9px] text-orange-500 font-semibold">※コスト超過</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                await handleToggle(item);
                                                            }}
                                                            disabled={togglingId === item.id || isDisabled}
                                                            className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all active:scale-95 ${
                                                                isDisabled
                                                                    ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                                                                    : 'bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700'
                                                            }`}
                                                        >
                                                            {togglingId === item.id ? '...' : '装備'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {/* Section 3: Hired NPC Cards */}
                    <section className="space-y-2">
                        <button
                            onClick={() => setShowNPC(!showNPC)}
                            className="w-full flex items-center justify-between text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors py-1 select-none"
                        >
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-amber-500" />
                                <span>同行NPC支援カード ({partyCards.length})</span>
                            </div>
                            <span className="text-[10px] text-amber-600/70 font-mono">
                                {showNPC ? '▲ 閉じる' : '▼ 開く'}
                            </span>
                        </button>
                        
                        {showNPC && (
                            <>
                                {partyLoading ? (
                                    <div className="text-center text-xs text-slate-500 py-4 bg-slate-950/20 rounded border border-slate-900 border-dashed animate-pulse">
                                        カード情報を読み込み中...
                                    </div>
                                ) : partyCards.length === 0 ? (
                                    <div className="text-center text-xs text-slate-500 py-4 bg-slate-950/20 rounded border border-slate-900 border-dashed">
                                        同行NPCによる支援カードはありません
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {partyCards.map(card => (
                                            <div 
                                                key={card.id}
                                                onClick={() => setSelectedDetail(card)}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/5 border border-amber-900/20 hover:border-amber-700/40 cursor-pointer active:bg-amber-950/10 transition-all min-w-0"
                                            >
                                                <div className="w-8 h-8 rounded bg-slate-950 border border-amber-900/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                                    {card.image_url ? (
                                                        <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[11px] font-bold text-amber-300 truncate">{card.name}</div>
                                                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{card.type || 'Support'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                </div>

                {/* Footer */}
                <footer className="p-2 border-t border-blue-950 bg-[#090d1a] text-center text-[10px] text-slate-500 font-serif shrink-0">
                    ※ 習得したスキルを装備することで戦闘用デッキが構成されます。
                </footer>
            </div>
            {renderDetailPopup()}
        </div>,
        document.body
    );
}
