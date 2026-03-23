import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Coins, Lock, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';


const playCreepyAudio = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(45, audioCtx.currentTime); // very low freq drone
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 5);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 1); // fade in
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 5); // fade out
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 5);
    } catch (e) {
        console.warn("AudioContext init failed", e);
    }
};

interface ShopItem {
    id: string;
    name: string;
    type: string;
    base_price: number;
    current_price: number | string;
    effect_data: any;
    is_rumored?: boolean;
    nation_tags?: string[];
    image_url?: string;
    description?: string;
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
    const [rumoredItems, setRumoredItems] = useState<ShopItem[]>([]);
    const [meta, setMeta] = useState<ShopMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null); // itemId being bought/sold
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null); // 詳細ポップアップ用

    useEffect(() => {
        fetchShop();
    }, []);

    /**
     * effect_data (JSONB) から人間が読める効果テキストを生成する。
     * 例: { heal: 50 } -> "HP +50回復"
     *      { power: 20, type: "attack" } -> "攻撃力 +20"
     *      { description: "テキスト" } -> "テキスト"
     */
    const formatEffectData = (effectData: any): string => {
        if (!effectData || typeof effectData !== 'object' || Object.keys(effectData).length === 0) {
            return '';
        }
        // descriptionフィールドが最優先
        if (effectData.description) return String(effectData.description);

        const parts: string[] = [];
        if (effectData.heal != null)  parts.push(`HP +${effectData.heal}回復`);
        if (effectData.mp_heal != null) parts.push(`MP +${effectData.mp_heal}回復`);
        if (effectData.power != null && effectData.power > 0) parts.push(`威力 ${effectData.power}`);
        if (effectData.atk_bonus != null) parts.push(`ATK +${effectData.atk_bonus}`);
        if (effectData.def_bonus != null) parts.push(`DEF +${effectData.def_bonus}`);
        if (effectData.duration != null) parts.push(`${effectData.duration}ターン持続`);
        if (effectData.effect != null) parts.push(String(effectData.effect));
        if (effectData.status != null) parts.push(`状態: ${effectData.status}`);
        if (effectData.effect_id != null) parts.push(`付与: ${effectData.effect_id}`);
        if (effectData.max_hp_bonus != null) parts.push(`最大HP +${effectData.max_hp_bonus}`);

        return parts.length > 0 ? parts.join(' / ') : '';
    };


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
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userProfile?.id ? { 'x-user-id': userProfile.id } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setRumoredItems(data.rumored_items || []);
                setMeta(data.meta);
                if (data.meta.prosperity === 1) {
                    playCreepyAudio();
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (item: ShopItem) => {
        if (item.is_rumored) return;
        if (gold < (item.current_price as number)) {
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
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userProfile?.id ? { 'x-user-id': userProfile.id } : {})
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

    const handleLaunder = async () => {
        if (gold < 100000) {
            alert("金貨が足りません！");
            return;
        }
        if (purchasing) return;
        if (!confirm("100,000Gを支払い、帳簿を改竄して名声をロンダリングしますか？\n(全ての拠点との関係値が0にリセットされます)")) return;

        setPurchasing('launder');
        try {
            const token = await getToken();
            const res = await fetch('/api/shop/launder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userProfile?.id ? { 'x-user-id': userProfile.id } : {})
                }
            });
            const data = await res.json();

            if (res.ok) {
                alert(`帳簿の改竄が完了しました。過去の悪名は闇に消えました。`);
                useGameStore.getState().fetchUserProfile(); // Refresh gold
            } else {
                if (res.status === 401) {
                    alert("認証エラー: 再ログインしてください。");
                } else {
                    alert(data.error || '改竄に失敗しました。');
                }
            }
        } catch (e) {
            console.error(e);
            alert("通信エラーが発生しました。");
        } finally {
            setPurchasing(null);
        }
    };

    const handleSell = async (itemId: number, itemName: string, itemType: string) => {
        const isQuestActive = !!userProfile?.current_quest_id;
        const isKeyItem = itemType === 'key_item' || itemType === 'trade_good' || itemType === 'consumable';

        if (isQuestActive && isKeyItem) {
            if (!confirm(`警告：この品を売却すると現在の依頼は失敗し、依頼主からの信用を失います。それでも売却しますか？`)) return;
        } else {
            if (!confirm(`「${itemName}」を売却しますか？`)) return;
        }

        if (purchasing) return;

        setPurchasing(String(itemId));
        try {
            const token = await getToken();
            const res = await fetch('/api/shop/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userProfile?.id ? { 'x-user-id': userProfile.id } : {})
                },
                body: JSON.stringify({ item_id: itemId, quantity: 1 })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.trigger_fail) {
                    alert('【裏切り発覚】\n依頼の品を売りさばいた罪により、クエストは強制失敗となり名声を失いました。');
                    useGameStore.getState().fetchUserProfile();
                    fetchInventory();
                    onClose();
                    window.location.href = '/inn?betrayal=true';
                } else {
                    alert(`売却しました！ (+${data.sold_price} G)`);
                    useGameStore.getState().fetchUserProfile();
                    fetchInventory();
                }
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


    // [UIUX-Expert] createPortalでdocument.body直下にレンダリング。
    // innのmax-w-[390px]+overflow-y-autoコンテナがCSSスタッキングコンテキストを
    // 形成してfixed positionを閉じ込めていた問題を根本解決する。

    // アイテム詳細ポップアップ
    const renderItemDetail = () => {
        if (!selectedItem) return null;
        const canBuy = gold >= (selectedItem.current_price as number);
        const typeLabel = selectedItem.type === 'skill' ? 'スキル' : selectedItem.type === 'consumable' ? '消耗品' : selectedItem.type === 'weapon' ? '武器' : selectedItem.type === 'armor' ? '防具' : selectedItem.type;
        const typeBorder = selectedItem.type === 'skill' ? 'border-blue-600' : selectedItem.type === 'consumable' ? 'border-green-600' : 'border-gray-600';
        return createPortal(
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setSelectedItem(null)}>
                <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200" onClick={e => e.stopPropagation()}>
                    {/* アイテムヘッダー */}
                    <div className="bg-gray-800/80 p-5 flex items-center gap-4 border-b border-gray-700">
                        <div className="w-16 h-16 rounded-lg bg-gray-700/60 border border-gray-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {selectedItem.image_url
                                ? <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                                : <span className="text-3xl">{selectedItem.type === 'skill' ? '⚡' : selectedItem.type === 'consumable' ? '✨' : '⚔️'}</span>
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white truncate">{selectedItem.name}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeBorder} text-gray-300 bg-gray-800 flex-shrink-0`}>{typeLabel}</span>
                            </div>
                            <div className="text-yellow-400 font-mono font-bold text-lg">{(selectedItem.current_price as number).toLocaleString()} G</div>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white flex-shrink-0 p-1">✕</button>
                    </div>
                    {/* 効果・詳細 */}
                    <div className="p-5 space-y-4">
                        {formatEffectData(selectedItem.effect_data) && (
                            <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                                <div className="text-xs text-gray-500 mb-1">効果</div>
                                <div className="text-sm text-gray-200">{formatEffectData(selectedItem.effect_data)}</div>
                            </div>
                        )}
                        {(selectedItem.description || selectedItem.effect_data?.flavor_text) && (
                            <div className="bg-amber-950/20 rounded-lg p-3 border border-amber-900/30">
                                <p className="text-xs text-amber-400/80 italic leading-relaxed">
                                    「{selectedItem.description || selectedItem.effect_data?.flavor_text}」
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                            >
                                閉じる
                            </button>
                            <button
                                onClick={async () => { await handleBuy(selectedItem); setSelectedItem(null); }}
                                disabled={!canBuy || !!purchasing}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    !canBuy
                                        ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
                                        : 'bg-yellow-600 hover:bg-yellow-500 text-black border border-yellow-500 shadow-lg'
                                }`}
                            >
                                {purchasing ? '購入中...' : !canBuy ? '資金不足' : `購入する (${(selectedItem.current_price as number).toLocaleString()} G)`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const mainContent = createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[85dvh] flex flex-col rounded-lg shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-center ${meta?.prosperity === 1 ? 'bg-red-950/40 border-red-900' : 'bg-black/40 border-gray-800'}`}>
                    <div className="flex items-center gap-3">
                        <ShoppingBag className={`w-6 h-6 ${meta?.prosperity === 1 ? 'text-red-500' : 'text-yellow-500'}`} />
                        <div>
                            <h2 className={`text-xl font-bold ${meta?.prosperity === 1 ? 'text-red-400 font-serif tracking-widest' : 'text-gray-100'}`}>
                                {meta?.prosperity === 1 ? '闇市' : '道具屋'}
                            </h2>
                            {meta && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-400">統治: {meta.ruling_nation}</span>
                                    {meta.inflation > 1.0 && (
                                        <span className="text-red-400 flex items-center gap-1 font-bold animate-pulse">
                                            <AlertTriangle className="w-3 h-3" />
                                            物価高 x{meta.inflation.toFixed(1)}
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
                        className={`flex-1 py-3 text-sm font-bold tracking-wider transition-colors ${mode === 'buy' ? 'bg-yellow-900/20 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        購入
                    </button>
                    <button
                        onClick={() => setMode('sell')}
                        className={`flex-1 py-3 text-sm font-bold tracking-wider transition-colors ${mode === 'sell' ? 'bg-blue-900/20 text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        売却
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                    {mode === 'buy' ? (
                        <>
                            {meta?.prosperity === 1 ? (
                                // BLACK MARKET LAYOUT
                                <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center border-2 border-red-900/50 bg-red-950/20 rounded shadow-[inset_0_0_50px_rgba(100,0,0,0.5)]">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-900 mb-4 opacity-80">
                                        <img src="/avatars/thief.png" alt="Black Market Dealer" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-red-400 font-serif italic mb-6">「...足元は見てねえよ。命が惜しけりゃ、買えるうちに買っておきな。」</p>
                                    <div className="bg-black/80 border border-red-900 p-4 rounded-lg w-full max-w-md flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('/effects/dirt.png')] opacity-20 mix-blend-overlay"></div>
                                        <div className="relative z-10 text-left">
                                            <div className="text-red-500 font-bold text-lg mb-1 animate-glitch">禁術の秘薬</div>
                                            <div className="text-xs text-red-500/70">HP・MP全回復、全状態異常解除、さらには最大HPを恒久的に劇的に高めるという伝説の...</div>
                                        </div>
                                        <button
                                            onClick={() => handleBuy({ id: 'item_black_market_elixir', name: '禁術の秘薬', type: 'consumable', base_price: 50000, current_price: 50000, effect_data: {} })}
                                            disabled={purchasing === 'item_black_market_elixir' || gold < 50000}
                                            className={`ml-4 px-4 py-3 rounded font-bold min-w-[120px] shadow-lg flex items-center justify-center relative z-10 ${gold < 50000 ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed' : 'bg-red-900 hover:bg-red-800 text-white border border-red-500 hover:border-red-400 animate-pulse'}`}
                                        >
                                            {purchasing === 'item_black_market_elixir' ? '⟳' : '50,000 G'}
                                        </button>
                                    </div>

                                    <div className="bg-black/80 border border-gray-600 p-4 rounded-lg w-full max-w-md flex justify-between items-center relative overflow-hidden mt-4">
                                        <div className="absolute inset-0 bg-[url('/effects/dirt.png')] opacity-10 mix-blend-overlay"></div>
                                        <div className="relative z-10 text-left">
                                            <div className="text-gray-300 font-bold text-lg mb-1 animate-glitch" style={{ animationDelay: '0.5s' }}>帳簿の改竄</div>
                                            <div className="text-xs text-gray-500">過去の悪名をすべて揉み消してやろうか？ 綺麗さっぱり、な。</div>
                                        </div>
                                        <button
                                            onClick={handleLaunder}
                                            disabled={purchasing === 'launder' || gold < 100000}
                                            className={`ml-4 px-4 py-3 rounded font-bold min-w-[120px] shadow-lg flex items-center justify-center relative z-10 ${gold < 100000 ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-500 hover:border-gray-400 transition-all active:scale-95'}`}
                                        >
                                            {purchasing === 'launder' ? '⟳' : '100,000 G'}
                                        </button>
                                    </div>
                                </div>
                                ) : (
                                // NORMAL BUY LAYOUT
                                loading ? (
                                    <div className="text-center text-gray-500 col-span-2 py-8">商品を読み込み中...</div>
                                ) : items.length === 0 ? (
                                    <div className="text-center text-gray-500 col-span-2 py-8">商品は売り切れのようです...</div>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-800 transition-colors">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-200">{item.name}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                        item.type === 'skill' ? 'border-blue-900 text-blue-400 bg-blue-900/20' :
                                                        item.type === 'consumable' ? 'border-green-900 text-green-400 bg-green-900/20' :
                                                            'border-gray-600 text-gray-400'
                                                        }`}>{
                                                        item.type === 'skill' ? 'スキル' :
                                                        item.type === 'consumable' ? '消耗品' :
                                                        item.type === 'weapon' ? '武器' :
                                                        item.type === 'armor' ? '防具' : item.type
                                                    }</span>
                                                </div>
                                                {formatEffectData(item.effect_data) && (
                                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                                        {formatEffectData(item.effect_data)}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="px-3 py-2 rounded flex-shrink-0 whitespace-nowrap text-sm font-bold border border-yellow-700/60 text-yellow-400 hover:bg-yellow-700/20 transition-all"
                                            >
                                                詳細
                                            </button>
                                        </div>
                                    ))
                                )
                            )}


                        {/* [UIUX-Expert] rumoredItemsセクションは初回リリースでは非表示。
                            国家別アイテムの「透過ぼかし表示」が通常アイテムと混在し
                            UX上の混乱を招いていたため除去。国家遷移後に再検討する。 */}

                        </>
                    ) : (
                        // SELL MODE
                        inventory && inventory.length > 0 ? (
                            inventory.map((invItem) => {
                                const isUgc = !!(invItem as any).is_ugc;
                                const sellPrice = isUgc ? 1 : Math.floor(((invItem as any).base_price || 0) / 2);
                                return (
                                    <div key={invItem.id} className="bg-gray-800/50 border border-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-800 transition-colors">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-200">{(invItem as any).name || '不明'}</span>
                                                <span className="bg-gray-700 text-gray-300 text-[10px] px-1 rounded">x{invItem.quantity}</span>
                                                {invItem.is_equipped && <span className="bg-yellow-900 text-yellow-500 text-[10px] px-1 rounded border border-yellow-700">E</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                                下値: {(invItem as any).base_price || 0} G
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSell(invItem.item_id, (invItem as any).name || '不明', (invItem as any).type)}
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
                                                    <span className="text-xs">売却</span>
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
        </div>,
        document.body
    );

    return (
        <>
            {renderItemDetail()}
            {mainContent}
        </>
    );
}
