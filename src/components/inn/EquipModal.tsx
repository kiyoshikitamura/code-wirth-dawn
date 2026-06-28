import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Sword, Star, Heart, X, Zap } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getItemImageUrl, getEffectList, getSlotLabel, getEquipmentBonus } from '@/lib/itemUtils';
import { getAuthHeaders } from '@/lib/authToken';

interface EquipModalProps {
    onClose: () => void;
    questLocked?: boolean;
    isCampMode?: boolean;
}

export default function EquipModal({ onClose, questLocked, isCampMode }: EquipModalProps) {
    const { userProfile, inventory, fetchInventory, fetchUserProfile, fetchEquipment, equippedItems: equipped, equipBonus } = useGameStore();
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
    const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWeapons, setShowWeapons] = useState(false);
    const [showArmors, setShowArmors] = useState(false);
    const [showAccessories, setShowAccessories] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchInventory(),
                    fetchUserProfile(),
                    fetchEquipment()
                ]);
            } catch (e) {
                console.error('Failed to load Equip data', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 全てのストック装備品（装備中の個体は除外）
    const equipmentItems = inventory.filter(i =>
        !i.is_skill &&
        i.item_type !== 'skill_card' &&
        (i.item_type === 'equipment' || (i as any).type === 'equipment') &&
        !i.is_equipped
    );

    const getOwnedCount = (itemId: number) => {
        return inventory.filter(i => i.item_id === itemId).length;
    };

    const getSubType = (item: any) => {
        return item.sub_type || item.effect_data?.sub_type || 'weapon';
    };

    const getUniqueItems = (items: any[]) => {
        const seen = new Set<number>();
        return items.filter(item => {
            if (seen.has(item.item_id)) {
                return false;
            }
            seen.add(item.item_id);
            return true;
        });
    };

    const weapons = getUniqueItems(equipmentItems.filter(i => getSubType(i) === 'weapon'));
    const armors = getUniqueItems(equipmentItems.filter(i => getSubType(i) === 'armor'));
    const accessories = getUniqueItems(equipmentItems.filter(i => getSubType(i) === 'accessory'));

    const handleEquipItem = async (invItem: any, slot: string) => {
        if (questLocked) {
            alert("クエスト進行中は装備の変更ができません。");
            return;
        }
        setLoadingSlot(slot);
        try {
            const authHeaders = await getAuthHeaders();
            if (!Object.keys(authHeaders).length) { alert('認証エラー'); return; }
            const res = await fetch('/api/equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ inventory_id: invItem.id, slot })
            });
            const resData = await res.json();
            if (res.ok) {
                await Promise.all([fetchEquipment(), fetchInventory(), fetchUserProfile()]);
                if (resData.updated_hp !== undefined && userProfile) {
                    useGameStore.setState({
                        userProfile: { ...useGameStore.getState().userProfile!, hp: resData.updated_hp }
                    });
                }
            } else {
                alert(resData.error || '装備に失敗しました。');
            }
        } catch (e) {
            console.error(e);
            alert('通信エラー');
        } finally {
            setLoadingSlot(null);
        }
    };

    const handleUnequip = async (slot: string) => {
        if (questLocked) {
            alert("クエスト進行中は装備の変更ができません。");
            return;
        }
        setLoadingSlot(slot);
        try {
            const authHeaders = await getAuthHeaders();
            if (!Object.keys(authHeaders).length) { alert('認証エラー'); return; }
            const res = await fetch(`/api/equipment?slot=${slot}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            if (res.ok) {
                const resData = await res.json();
                await Promise.all([fetchEquipment(), fetchInventory(), fetchUserProfile()]);
                if (resData.updated_hp !== undefined && userProfile) {
                    useGameStore.setState({
                        userProfile: { ...useGameStore.getState().userProfile!, hp: resData.updated_hp }
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSlot(null);
        }
    };

    const renderDetailPopup = () => {
        if (!selectedDetail) return null;

        const bonus = getEquipmentBonus(selectedDetail.effect_data);
        const effectList = getEffectList(selectedDetail.effect_data);
        const hasBonuses = bonus.atk > 0 || bonus.def > 0 || bonus.hp > 0;

        return createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setSelectedDetail(null)}>
                <div className="bg-[#0f172a] border border-orange-900/40 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 p-4 flex items-center gap-3 border-b border-orange-900/30">
                        <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                            {selectedDetail.image_url ? (
                                <img src={selectedDetail.image_url} alt={selectedDetail.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-5 h-5 text-orange-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{selectedDetail.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-700/40 text-orange-300 bg-orange-950/20">
                                    {getSlotLabel(selectedDetail._slot)}
                                </span>
                                {selectedDetail._isEquipped && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-800 text-amber-400 bg-amber-950/30 font-bold">
                                        装備中
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Stats Grid */}
                        {hasBonuses && (
                            <div className="bg-orange-900/10 rounded-lg p-2.5 border border-orange-805/20">
                                <div className="text-[10px] text-orange-400 mb-1 font-bold">装備ボーナス</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {bonus.hp !== 0 && (
                                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-col items-center">
                                            <Heart className="w-3.5 h-3.5 text-green-400" />
                                            <span className="text-[9px] text-gray-500 mt-1">HP</span>
                                            <span className="text-xs font-bold text-green-400 font-mono">+{bonus.hp}</span>
                                        </div>
                                    )}
                                    {bonus.atk !== 0 && (
                                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-col items-center">
                                            <Sword className="w-3.5 h-3.5 text-red-400" />
                                            <span className="text-[9px] text-gray-500 mt-1">ATK</span>
                                            <span className="text-xs font-bold text-red-400 font-mono">+{bonus.atk}</span>
                                        </div>
                                    )}
                                    {bonus.def !== 0 && (
                                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-col items-center">
                                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-[9px] text-gray-500 mt-1">DEF</span>
                                            <span className="text-xs font-bold text-blue-400 font-mono">+{bonus.def}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                        {(selectedDetail.description || selectedDetail.effect_data?.flavor_text || selectedDetail.effect_data?.description) && (
                            <div className="bg-amber-950/20 rounded-lg p-2.5 border border-amber-900/30">
                                <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                    「{selectedDetail.description || selectedDetail.effect_data?.flavor_text || selectedDetail.effect_data?.description}」
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        {selectedDetail._slot.startsWith('accessory') ? (
                            <div className="flex flex-col gap-2">
                                {(['accessory_1', 'accessory_2', 'accessory_3'] as const).map((accSlot, idx) => {
                                    const isCurrentSlot = selectedDetail._slot === accSlot;
                                    const currentEquip = equipped.find((e: any) => e.slot === accSlot);
                                    
                                    if (isCurrentSlot && selectedDetail._isEquipped) {
                                        return (
                                            <button
                                                key={accSlot}
                                                onClick={async () => {
                                                    await handleUnequip(accSlot);
                                                    setSelectedDetail(null);
                                                }}
                                                disabled={loadingSlot !== null}
                                                className="w-full py-2 rounded text-xs font-bold transition-all bg-red-955/80 text-red-200 border border-red-800/60 hover:bg-red-900/70"
                                            >
                                                {loadingSlot === accSlot ? '処理中...' : `${idx + 1}: 装備を外す`}
                                            </button>
                                        );
                                    } else {
                                        const label = currentEquip 
                                            ? `${idx + 1}: ${currentEquip.item.name} と入れ替え` 
                                            : `${idx + 1}: スロットに装備${selectedDetail._isEquipped ? '移動' : ''}`;
                                        return (
                                            <button
                                                key={accSlot}
                                                onClick={async () => {
                                                    await handleEquipItem(selectedDetail, accSlot);
                                                    setSelectedDetail(null);
                                                }}
                                                disabled={loadingSlot !== null}
                                                className="w-full py-2 rounded text-xs font-bold transition-all bg-orange-900 hover:bg-orange-800 text-orange-100 border border-orange-700 disabled:opacity-50"
                                            >
                                                {loadingSlot === accSlot ? '処理中...' : label}
                                            </button>
                                        );
                                    }
                                })}
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (selectedDetail._isEquipped) {
                                        await handleUnequip(selectedDetail._slot);
                                    } else {
                                        await handleEquipItem(selectedDetail, selectedDetail._slot);
                                    }
                                    setSelectedDetail(null);
                                }}
                                disabled={loadingSlot === selectedDetail._slot}
                                className={`w-full py-2 rounded text-xs font-bold transition-all ${
                                    selectedDetail._isEquipped
                                        ? 'bg-red-955/80 text-red-200 border border-red-800/60 hover:bg-red-900/70'
                                        : 'bg-orange-900 hover:bg-orange-800 text-orange-100 border border-orange-700'
                                } ${loadingSlot === selectedDetail._slot ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {loadingSlot === selectedDetail._slot ? '処理中...' : selectedDetail._isEquipped ? '装備を外す' : '装備する'}
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
            <div className="w-full max-w-lg h-[90dvh] bg-[#0c1222] border-2 border-orange-950/40 rounded-lg shadow-2xl overflow-hidden flex flex-col relative text-slate-100">
                
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-orange-950/30 bg-[#090d1a] shrink-0">
                    <h2 className="text-sm font-bold tracking-widest text-orange-400 flex items-center gap-1.5 font-serif">
                        <Shield className="w-4 h-4 text-orange-400" /> 装備品管理
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-full transition-colors active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                            <span className="text-xs text-orange-400 font-medium">情報を読み込み中...</span>
                        </div>
                    ) : (
                        <>
                            {/* Equipment Bonuses */}
                    <div className="bg-gradient-to-r from-orange-950/35 to-slate-900/60 p-3 rounded-lg border border-orange-900/25 flex justify-between items-center shadow-inner">
                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">合計装備ボーナス</span>
                        <div className="flex gap-3">
                            <span className="text-xs text-green-400 font-mono font-bold">HP +{equipBonus.hp || 0}</span>
                            <span className="text-xs text-red-400 font-mono font-bold">ATK +{equipBonus.atk || 0}</span>
                            <span className="text-xs text-blue-400 font-mono font-bold">DEF +{equipBonus.def || 0}</span>
                        </div>
                    </div>

                    {/* Section 1: Equipped Items */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold text-orange-300 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> 装備中スロット
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {(['weapon', 'armor', 'accessory_1', 'accessory_2', 'accessory_3'] as const).map(slot => {
                                const eq = equipped.find((e: any) => e.slot === slot);
                                const slotLabel = getSlotLabel(slot);
                                const slotIcon = slot === 'weapon' ? <Sword className="w-3.5 h-3.5 text-red-400" /> : slot === 'armor' ? <Shield className="w-3.5 h-3.5 text-blue-400" /> : <Star className="w-3.5 h-3.5 text-amber-400" />;
                                
                                return (
                                    <div key={slot} className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800/60 overflow-hidden shadow-inner">
                                                {eq?.item?.image_url ? (
                                                    <img src={eq.item.image_url} alt={eq.item.name} className="w-full h-full object-cover" />
                                                ) : slotIcon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{slotLabel}</div>
                                                {eq?.item ? (
                                                    <div 
                                                        onClick={() => setSelectedDetail({ ...eq.item, _slot: slot, _isEquipped: true })}
                                                        className="text-xs font-bold text-slate-100 hover:text-orange-300 transition-colors truncate cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        {eq.item.name}
                                                        <span className="text-[9px] text-gray-500 font-normal">▶</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-600 italic">未装備</div>
                                                )}
                                            </div>
                                        </div>
                                        {eq?.item && (
                                            <button
                                                onClick={async () => {
                                                    await handleUnequip(slot);
                                                }}
                                                disabled={loadingSlot === slot}
                                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-red-955/70 border border-red-900/60 hover:bg-red-900/80 text-red-200 transition-colors active:scale-95"
                                            >
                                                {loadingSlot === slot ? '...' : '外す'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Section 2: Weapons Stock */}
                    <section className="space-y-2">
                        <button
                            onClick={() => setShowWeapons(!showWeapons)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors py-1 select-none"
                        >
                            <div className="flex items-center gap-1">
                                <Sword className="w-3.5 h-3.5 text-red-400" />
                                <span>武器ストック ({weapons.length})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {showWeapons ? '▲ 閉じる' : '▼ 開く'}
                            </span>
                        </button>
                        
                        {showWeapons && (
                            <div className="grid grid-cols-1 gap-1.5">
                                {weapons.length === 0 ? (
                                    <div className="text-center text-xs text-slate-500 py-3 bg-slate-950/20 rounded border border-slate-900 border-dashed">
                                        所持している武器はありません
                                    </div>
                                ) : (
                                    weapons.map(item => {
                                        const bonus = getEquipmentBonus(item.effect_data);
                                        return (
                                            <div 
                                                key={item.id}
                                                onClick={() => setSelectedDetail({ ...item, _slot: 'weapon', _isEquipped: false })}
                                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group active:bg-slate-900/50"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-slate-955 flex items-center justify-center shrink-0 border border-slate-800/60 overflow-hidden shadow-inner">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Sword className="w-3.5 h-3.5 text-red-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-300 group-hover:text-orange-300 transition-colors truncate">
                                                            {item.name}
                                                            {getOwnedCount(item.item_id) > 1 && (
                                                                <span className="text-[10px] text-orange-400/80 font-normal ml-1.5 font-mono">(所持: {getOwnedCount(item.item_id)})</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 flex flex-wrap gap-x-1.5 mt-0.5 font-mono">
                                                            {bonus.atk > 0 && <span className="text-red-400">ATK+{bonus.atk}</span>}
                                                            {bonus.def > 0 && <span className="text-blue-400">DEF+{bonus.def}</span>}
                                                            {bonus.hp > 0 && <span className="text-green-400">HP+{bonus.hp}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await handleEquipItem(item, 'weapon');
                                                    }}
                                                    disabled={loadingSlot === 'weapon'}
                                                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-orange-950/40 border border-orange-900/40 hover:bg-orange-900/60 text-orange-200 transition-colors active:scale-95"
                                                >
                                                    {loadingSlot === 'weapon' ? '...' : '装備'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </section>

                    {/* Section 3: Armors Stock */}
                    <section className="space-y-2">
                        <button
                            onClick={() => setShowArmors(!showArmors)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors py-1 select-none"
                        >
                            <div className="flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-blue-400" />
                                <span>防具ストック ({armors.length})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {showArmors ? '▲ 閉じる' : '▼ 開く'}
                            </span>
                        </button>
                        
                        {showArmors && (
                            <div className="grid grid-cols-1 gap-1.5">
                                {armors.length === 0 ? (
                                    <div className="text-center text-xs text-slate-500 py-3 bg-slate-950/20 rounded border border-slate-900 border-dashed">
                                        所持している防具はありません
                                    </div>
                                ) : (
                                    armors.map(item => {
                                        const bonus = getEquipmentBonus(item.effect_data);
                                        return (
                                            <div 
                                                key={item.id}
                                                onClick={() => setSelectedDetail({ ...item, _slot: 'armor', _isEquipped: false })}
                                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group active:bg-slate-900/50"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-slate-955 flex items-center justify-center shrink-0 border border-slate-800/60 overflow-hidden shadow-inner">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-300 group-hover:text-orange-300 transition-colors truncate">
                                                            {item.name}
                                                            {getOwnedCount(item.item_id) > 1 && (
                                                                <span className="text-[10px] text-orange-400/80 font-normal ml-1.5 font-mono">(所持: {getOwnedCount(item.item_id)})</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 flex flex-wrap gap-x-1.5 mt-0.5 font-mono">
                                                            {bonus.atk > 0 && <span className="text-red-400">ATK+{bonus.atk}</span>}
                                                            {bonus.def > 0 && <span className="text-blue-400">DEF+{bonus.def}</span>}
                                                            {bonus.hp > 0 && <span className="text-green-400">HP+{bonus.hp}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await handleEquipItem(item, 'armor');
                                                    }}
                                                    disabled={loadingSlot === 'armor'}
                                                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-orange-950/40 border border-orange-900/40 hover:bg-orange-900/60 text-orange-200 transition-colors active:scale-95"
                                                >
                                                    {loadingSlot === 'armor' ? '...' : '装備'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </section>

                    {/* Section 4: Accessories Stock */}
                    <section className="space-y-2">
                        <button
                            onClick={() => setShowAccessories(!showAccessories)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors py-1 select-none"
                        >
                            <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400" />
                                <span>アクセサリーストック ({accessories.length})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {showAccessories ? '▲ 閉じる' : '▼ 開く'}
                            </span>
                        </button>
                        
                        {showAccessories && (
                            <div className="grid grid-cols-1 gap-1.5">
                                {accessories.length === 0 ? (
                                    <div className="text-center text-xs text-slate-500 py-3 bg-slate-950/20 rounded border border-slate-900 border-dashed">
                                        所持しているアクセサリーはありません
                                    </div>
                                ) : (
                                    accessories.map(item => {
                                        const bonus = getEquipmentBonus(item.effect_data);
                                        return (
                                            <div 
                                                key={item.id}
                                                onClick={() => setSelectedDetail({ ...item, _slot: 'accessory', _isEquipped: false })}
                                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group active:bg-slate-900/50"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-slate-955 flex items-center justify-center shrink-0 border border-slate-800/60 overflow-hidden shadow-inner">
                                                        {item.image_url ? (
                                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Star className="w-3.5 h-3.5 text-amber-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-300 group-hover:text-orange-300 transition-colors truncate">
                                                            {item.name}
                                                            {getOwnedCount(item.item_id) > 1 && (
                                                                <span className="text-[10px] text-orange-400/80 font-normal ml-1.5 font-mono">(所持: {getOwnedCount(item.item_id)})</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 flex flex-wrap gap-x-1.5 mt-0.5 font-mono">
                                                            {bonus.atk > 0 && <span className="text-red-400">ATK+{bonus.atk}</span>}
                                                            {bonus.def > 0 && <span className="text-blue-400">DEF+{bonus.def}</span>}
                                                            {bonus.hp > 0 && <span className="text-green-400">HP+{bonus.hp}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // 直接装備せず、詳細ポップアップを開いてスロットを選択させる
                                                        setSelectedDetail({ ...item, _slot: 'accessory', _isEquipped: false });
                                                    }}
                                                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-orange-950/40 border border-orange-900/40 hover:bg-orange-900/60 text-orange-200 transition-colors active:scale-95"
                                                >
                                                    装備
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-2 border-t border-orange-950/20 bg-[#090d1a] text-center text-[10px] text-slate-500 font-serif shrink-0">
                    ※ 武器・防具は各1つ、アクセサリーは最大3つまで装備できます。
                </footer>
            </div>
            {renderDetailPopup()}
        </div>,
        document.body
    );
}
