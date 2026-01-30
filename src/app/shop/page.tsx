'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, ShoppingBag, Coins, Sword, Shield, FlaskConical, Box, Package } from 'lucide-react';
import MobileNav from '@/components/layout/MobileNav';

export default function ShopPage() {
    const router = useRouter();
    const { gold, spendGold, fetchInventory, userProfile, worldState } = useGameStore();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterDialogue, setMasterDialogue] = useState("「いらっしゃい。珍しいものが揃ってるよ。」");
    const [selectedItem, setSelectedItem] = useState<any>(null);

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

    const handleSelect = (item: any) => {
        setSelectedItem(item);
        // Dynamic dialogue based on item type or random
        const dialogues = [
            `「${item.name}かい？ 目が高いね。」`,
            `「${item.name}は人気商品だよ。」`,
            `「旅の役に立つはずさ。」`,
            `「おっと、それは慎重に扱ってくれよ。」`
        ];
        setMasterDialogue(dialogues[Math.floor(Math.random() * dialogues.length)]);
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans p-4 relative pb-24 md:pb-0">
            <div className="absolute inset-0 bg-[url('/backgrounds/shop-interior.jpg')] bg-cover bg-center opacity-30 pointer-events-none"></div>

            <header className="relative z-10 max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-gray-800 mb-6 bg-black/60 p-4 rounded">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/inn')} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="text-amber-500 bg-amber-950/30 p-1.5 rounded-full border border-amber-900">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-serif text-amber-500 font-bold tracking-wider whitespace-nowrap">商店『水晶の番人』</h1>
                            <p className="text-[10px] md:text-xs text-gray-500">@{worldState?.location_name}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto space-y-6">
                {/* Master Section */}
                <section className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 shadow-xl backdrop-blur-sm flex items-center gap-6 relative overflow-hidden">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-amber-700/50 overflow-hidden shrink-0 bg-black">
                        <img src="/avatars/shop_keeper.png" alt="Shop Keeper" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 z-10">
                        <div className="text-xs text-amber-600 font-bold mb-1">商店の店主</div>
                        <p className="text-amber-100 font-serif italic text-lg leading-relaxed">{masterDialogue}</p>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-amber-900/50">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span className="text-sm font-bold text-white">{gold}</span>
                        <span className="text-[10px] text-gray-400">G</span>
                    </div>
                </section>

                <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">
                            商品を並べています...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map((item) => (
                                <div key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={`flex justify-between items-center p-4 border rounded transition-all group relative cursor-pointer
                                    ${selectedItem?.id === item.id ? 'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500' : 'bg-black/40 border-gray-800 hover:border-amber-600/50 hover:bg-amber-900/10'}`}
                                >
                                    <div className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded border border-gray-700 mr-4 shrink-0 text-gray-500">
                                        {((type) => {
                                            switch (type) {
                                                case 'weapon': return <Sword className="w-6 h-6" />;
                                                case 'armor': return <Shield className="w-6 h-6" />;
                                                case 'potion': return <FlaskConical className="w-6 h-6" />;
                                                case 'material': return <Box className="w-6 h-6" />;
                                                default: return <Package className="w-6 h-6" />;
                                            }
                                        })(item.item_type)}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="font-bold text-gray-200 group-hover:text-amber-200 whitespace-nowrap truncate">{item.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 whitespace-nowrap truncate">{item.description}</div>
                                        <div className="flex gap-2 mt-2 text-[10px] tracking-wider">
                                            <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                                                {((type) => {
                                                    switch (type) {
                                                        case 'weapon': return '武器';
                                                        case 'armor': return '防具';
                                                        case 'potion': return '道具';
                                                        case 'material': return '素材';
                                                        default: return 'その他';
                                                    }
                                                })(item.item_type)}
                                            </span>
                                            {item.stock_limit !== null && (
                                                <span className={`${item.stock_limit === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                                    在庫: {item.stock_limit}
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
