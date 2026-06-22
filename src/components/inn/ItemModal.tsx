import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Backpack, Heart, X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getItemImageUrl, getEffectList } from '@/lib/itemUtils';
import { getAuthHeaders } from '@/lib/authToken';

interface ItemModalProps {
    onClose: () => void;
}

export default function ItemModal({ onClose }: ItemModalProps) {
    const { inventory, fetchInventory, fetchUserProfile } = useGameStore();
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await fetchInventory();
            } catch (e) {
                console.error('Failed to load Item data', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 装備品・スキルを除外した消耗品等
    const consumables = inventory.filter(i => 
        !i.is_skill && 
        i.item_type !== 'skill_card' && 
        (i.quantity || 0) > 0 && 
        i.item_type !== 'equipment' && 
        (i as any).type !== 'equipment'
    );

    const handleUseFieldItem = async (item: any) => {
        const useTiming = item.effect_data?.use_timing || item.use_timing || 'field';

        if (useTiming === 'battle') {
            alert(`「${item.name}」はバトル中のみ使用できます。`);
            return;
        }
        if (useTiming === 'passive') {
            alert(`「${item.name}」は所持するだけで効果を発揮します。`);
            return;
        }

        if (!confirm(`「${item.name}」を使用しますか？`)) return;
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/item/use', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ inventory_id: item.id, use_context: 'field' })
            });
            const data = await res.json();
            if (res.ok) {
                let msg = data.message || `「${item.name}」を使用しました。`;
                alert(msg);
                await Promise.all([fetchInventory(), fetchUserProfile()]);
            } else {
                alert('使用に失敗しました: ' + (data.error || 'Unknown'));
            }
        } catch (e) {
            console.error(e);
            alert('通信エラーが発生しました。');
        }
        setSelectedDetail(null);
    };

    const renderDetailPopup = () => {
        if (!selectedDetail) return null;

        const effectList = getEffectList(selectedDetail.effect_data);
        const ed = selectedDetail.effect_data || {};
        const timing = ed.use_timing || selectedDetail.use_timing || 'field';

        return createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setSelectedDetail(null)}>
                <div className="bg-[#0f172a] border border-emerald-900/50 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 p-4 flex items-center gap-3 border-b border-emerald-900/30">
                        <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                            {selectedDetail.image_url ? (
                                <img src={selectedDetail.image_url} alt={selectedDetail.name} className="w-full h-full object-cover" />
                            ) : (
                                <Heart className="w-5 h-5 text-emerald-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{selectedDetail.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-800/40 text-emerald-300 bg-emerald-950/20">
                                    所持数: {selectedDetail.quantity}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
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
                        {selectedDetail.effect_data?.description && (
                            <div className="bg-amber-950/20 rounded-lg p-2.5 border border-amber-900/30">
                                <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                    「{selectedDetail.effect_data.description}」
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="flex gap-2">
                            {timing === 'battle' ? (
                                <div className="w-full py-2 text-xs text-center text-amber-600/70 border border-amber-900/30 rounded-lg font-bold bg-amber-950/5">
                                    🗡 バトル中のみ使用可
                                </div>
                            ) : timing === 'passive' ? (
                                <div className="w-full py-2 text-xs text-center text-slate-500 border border-slate-800 rounded-lg font-bold bg-slate-950/20">
                                    ○ 所持効果
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleUseFieldItem(selectedDetail)}
                                    className="w-full py-2 rounded text-xs font-bold bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 transition-all active:scale-95"
                                >
                                    使用する
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-[90dvh] bg-[#0c1222] border-2 border-emerald-950/40 rounded-lg shadow-2xl overflow-hidden flex flex-col relative text-slate-100">
                
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-emerald-950/30 bg-[#090d1a] shrink-0">
                    <h2 className="text-sm font-bold tracking-widest text-emerald-400 flex items-center gap-1.5 font-serif">
                        <Backpack className="w-4 h-4 text-emerald-400" /> 所持品管理
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-full transition-colors active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <span className="text-xs text-emerald-400 font-medium">情報を読み込み中...</span>
                        </div>
                    ) : consumables.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/10">
                            所持している消耗品等はありません。
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {consumables.map(item => {
                                const imgUrl = item.image_url || ((item as any).slug ? getItemImageUrl((item as any).slug) : null);
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => setSelectedDetail(item)} 
                                        className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 cursor-pointer active:bg-slate-900/50 transition-all rounded-lg group"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden border border-slate-800/60">
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt={item.name} className="w-full h-full object-cover animate-in fade-in" />
                                                ) : (
                                                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors truncate">
                                                    {item.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    数量: {item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 shrink-0 ml-1">▶ 詳細</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-2 border-t border-emerald-950/20 bg-[#090d1a] text-center text-[10px] text-slate-500 font-serif shrink-0">
                    ※ フィールドで使用可能なアイテムは宿屋等の安全な場所で選択して使用できます。
                </footer>
            </div>
            {renderDetailPopup()}
        </div>,
        document.body
    );
}
