import React, { useEffect, useState } from 'react';
import { ShoppingBag, Coins, Lock, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';

interface ShopItem {
    id: string;
    name: string;
    type: string;
    base_price: number;
    current_price: number;
    effect_data: any;
}

interface ShopMeta {
    prosperity: number;
    inflation: number;
    ruling_nation: string;
}

interface Props {
    onClose: () => void;
}

export default function ShopModal({ onClose }: Props) {
    const { gold, fetchInventory, userProfile, inventory } = useGameStore();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [meta, setMeta] = useState<ShopMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null); // itemId being bought/sold
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');

    useEffect(() => {
        fetchShop();
    }, []);


    // Helper to get token
    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token;
    }

    const fetchShop = async () => {
        try {
            const token = await getToken();
            const res = await fetch('/api/shop', {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setMeta(data.meta);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (item: ShopItem) => {
        if (gold < item.current_price) {
            alert("金貨が足りません！");
            return;
        }
        if (purchasing) return;

        setPurchasing(item.id);
        try {
            const token = await getToken();
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ item_id: item.id })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`${item.name} を購入しました！`);
                useGameStore.getState().fetchUserProfile(); // Refresh gold
                fetchInventory(); // Refresh inventory
            } else {
                if (res.status === 401) {
                    alert("認証エラー: 再ログインしてください。");
                } else {
                    alert(data.error || '購入に失敗しました。');
                }
            }
        } catch (e) {
            console.error(e);
            alert("通信エラーが発生しました。");
        } finally {
            setPurchasing(null);
        }
    };

    const handleSell = async (itemId: number, itemName: string) => {
        if (!confirm(`「${itemName}」を売却しますか？`)) return;
        if (purchasing) return;

        setPurchasing(String(itemId));
        try {
            const token = await getToken();
            const res = await fetch('/api/shop/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ item_id: itemId, quantity: 1 })
            });
            const data = await res.json();

            if (res.ok) {
                // success
                alert(`売却しました！ (+${data.sold_price} G)`);
                useGameStore.getState().fetchUserProfile(); // Refresh gold
                fetchInventory(); // Refresh inventory
            } else {
                alert(data.error || '売却に失敗しました。');
            }
        } catch (e) {
            console.error(e);
            alert("通信エラーが発生しました。");
        } finally {
            setPurchasing(null);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[80vh] flex flex-col rounded-lg shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-6 h-6 text-yellow-500" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-100">Marketplace</h2>
                            {meta && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-400">Ruling: {meta.ruling_nation}</span>
                                    {meta.inflation > 1.0 && (
                                        <span className="text-red-400 flex items-center gap-1 font-bold animate-pulse">
                                            <AlertTriangle className="w-3 h-3" />
                                            Inflation x{meta.inflation.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-yellow-900/20 px-3 py-1 rounded border border-yellow-900/50">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-100 font-mono">{gold} G</span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                </div>

                {/* Content */}
                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-black/20">
                    <button
                        onClick={() => setMode('buy')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${mode === 'buy' ? 'bg-yellow-900/20 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setMode('sell')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${mode === 'sell' ? 'bg-blue-900/20 text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Sell
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    {mode === 'buy' ? (
                        loading ? (
                            <div className="text-center text-gray-500 col-span-2 py-8">Loading wares...</div>
                        ) : items.length === 0 ? (
                            <div className="text-center text-gray-500 col-span-2 py-8">商品は売り切れのようです...</div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-800 transition-colors">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-200">{item.name}</span>
                                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${item.type === 'skill' ? 'border-blue-900 text-blue-400 bg-blue-900/20' :
                                                item.type === 'consumable' ? 'border-green-900 text-green-400 bg-green-900/20' :
                                                    'border-gray-600 text-gray-400'
                                                }`}>{item.type}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 truncate">
                                            {JSON.stringify(item.effect_data)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(item)}
                                        disabled={purchasing === item.id || gold < item.current_price}
                                        className={`px-4 py-2 rounded flex items-center gap-2 min-w-[100px] justify-center transition-all ${gold < item.current_price
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                                            : 'bg-yellow-700 hover:bg-yellow-600 text-white border border-yellow-600 shadow-lg hover:translate-y-[-2px]'
                                            }`}
                                    >
                                        {purchasing === item.id ? (
                                            <span className="animate-spin text-xl">⟳</span>
                                        ) : (
                                            <>
                                                <span className="font-mono">{item.current_price}</span>
                                                <span className="text-xs">G</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))
                        )
                    ) : (
                        // SELL MODE
                        inventory && inventory.length > 0 ? (
                            inventory.map((invItem) => {
                                const sellPrice = Math.floor(((invItem as any).base_price || 0) / 2);
                                return (
                                    <div key={invItem.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-800 transition-colors">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-200">{(invItem as any).name || '不明'}</span>
                                                <span className="bg-gray-700 text-gray-300 text-[10px] px-1 rounded">x{invItem.quantity}</span>
                                                {invItem.is_equipped && <span className="bg-yellow-900 text-yellow-500 text-[10px] px-1 rounded border border-yellow-700">E</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                                Base: {(invItem as any).base_price || 0} G
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSell(invItem.item_id, (invItem as any).name || '不明')}
                                            disabled={purchasing === String(invItem.item_id) || invItem.is_equipped}
                                            className={`px-4 py-2 rounded flex items-center gap-2 min-w-[100px] justify-center transition-all ${invItem.is_equipped
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                                                : 'bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700 shadow-lg hover:translate-y-[-2px]'
                                                }`}
                                        >
                                            {purchasing === String(invItem.item_id) ? (
                                                <span className="animate-spin text-xl">⟳</span>
                                            ) : (
                                                <>
                                                    <span className="text-xs">Sell</span>
                                                    <span className="font-mono">{sellPrice}</span>
                                                    <span className="text-xs">G</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-gray-500 col-span-2 py-8">売却できるアイテムがありません</div>
                        )
                    )}
                </div>

                <div className="p-2 border-t border-gray-800 bg-black/40 text-center text-xs text-gray-600">
                    ※ 商品ラインナップは世界情勢によって変化します。
                </div>
            </div>
        </div>
    );
}
