'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, ShoppingBag, Coins } from 'lucide-react';
import MobileNav from '@/components/layout/MobileNav';

export default function ShopPage() {
    const router = useRouter();
    const { gold, spendGold, fetchInventory, userProfile } = useGameStore();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchShop() {
            try {
                const res = await fetch('/api/shop', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchShop();
    }, []);

    const handleBuy = async (item: any) => {
        if (confirm(`${item.name} を ${item.price}G で購入しますか？`)) {
            if (gold < item.price) {
                alert("金貨が足りないようだ。");
                return;
            }
            try {
                const res = await fetch('/api/shop/purchase', {
                    method: 'POST',
                    body: JSON.stringify({ item_id: item.id, price: item.price })
                });

                if (res.ok) {
                    spendGold(item.price);
                    if (item.stock_limit !== null) {
                        setItems(prev => prev.map(i =>
                            i.id === item.id ? { ...i, stock_limit: i.stock_limit - 1 } : i
                        ));
                    }
                    await fetchInventory();
                    alert("購入しました！所持品に追加されました。");
                } else {
                    const err = await res.json();
                    alert(`購入失敗: ${err.error || 'Unknown error'}`);
                }
            } catch (e) {
                console.error(e);
                alert("購入処理中にエラーが発生しました。");
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans p-4 relative pb-24 md:pb-0">
            <div className="absolute inset-0 bg-[url('/backgrounds/shop-interior.jpg')] bg-cover bg-center opacity-30 pointer-events-none"></div>

            <header className="relative z-10 max-w-4xl mx-auto flex items-center justify-between py-6 border-b border-gray-800 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/inn')} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-serif text-amber-500 font-bold tracking-wider flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6" /> 雑貨屋
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-gray-900/80 px-4 py-2 rounded-full border border-amber-900/50">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xl font-bold text-white">{gold}</span>
                    <span className="text-xs text-gray-400">G</span>
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto">
                <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">
                            商品を並べています...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 bg-black/40 border border-gray-800 rounded hover:border-amber-600/50 hover:bg-amber-900/10 transition-all group relative">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="font-bold text-gray-200 group-hover:text-amber-200 whitespace-nowrap truncate">{item.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 whitespace-nowrap truncate">{item.description}</div>
                                        <div className="flex gap-2 mt-2 text-[10px] uppercase tracking-wider">
                                            <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{item.item_type}</span>
                                            {item.stock_limit !== null && (
                                                <span className={`${item.stock_limit === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                                    Stock: {item.stock_limit}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="text-amber-400 font-bold font-mono text-lg">{item.price} G</div>
                                        <button
                                            onClick={() => handleBuy(item)}
                                            disabled={gold < item.price || (item.stock_limit !== null && item.stock_limit <= 0)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded shadow-lg transition-all
                                                ${gold < item.price || (item.stock_limit !== null && item.stock_limit <= 0)
                                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                    : 'bg-amber-700 hover:bg-amber-600 text-white hover:scale-105 active:scale-95'
                                                }
                                            `}
                                        >
                                            {item.stock_limit === 0 ? 'SOLD OUT' : '購入'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
