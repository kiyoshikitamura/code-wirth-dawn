import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Coins, BookOpen, RotateCcw, X, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';
import { getAuthHeaders } from '@/lib/authToken';

interface AcademyCard {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    description: string;
    rarity: 'SR' | 'R' | 'U' | 'C';
    isDuplicate: boolean;
}

interface ListCard {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    description: string;
    ap_cost: number;
    card_type: string;
    rarity: 'SR' | 'R' | 'U' | 'C';
}

interface Props {
    onClose: () => void;
}

// パック別の定数設定
const SERIES_CONFIG = {
    chaos_and_rebellion: {
        id: 'chaos_and_rebellion' as const,
        name: '混沌の魔導と反逆の鉄壁',
        sub: 'Chaos Spell & Rebel Aegis Booster Pack',
        wrapperImage: '/images/booster_pack_wrapper.png',
        cardBackImage: '/images/booster_pack_wrapper.png',
        price: 5000,
        refund: 500,
        keyId: 77,
        keySlug: 'item_academy_key',
        keyName: '魔術学院キー',
        themeBg: 'via-[#0d0f1f]/50',
        cardBackBg: 'bg-indigo-950/45',
        themeGlow: 'shadow-[0_0_30px_rgba(99,102,241,0.45)]',
        colorClass: 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 border-amber-400 shadow-amber-500/10',
        textColor: 'text-amber-400'
    },
    basic: {
        id: 'basic' as const,
        name: '黎明の知識と古の契約',
        sub: 'Ancient Knowledge & Covenant of Dawn',
        wrapperImage: '/images/card_back_basic.png',
        cardBackImage: '/images/card_back_basic.png',
        price: 3000,
        refund: 300,
        keyId: 76,
        keySlug: 'item_basic_key',
        keyName: 'ベーシックキー',
        themeBg: 'via-[#09152b]/50',
        cardBackBg: 'bg-slate-900/40',
        themeGlow: 'shadow-[0_0_30px_rgba(14,165,233,0.45)]',
        colorClass: 'from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 border-cyan-400 shadow-cyan-500/10',
        textColor: 'text-cyan-400'
    }
};

export default function AcademyModal({ onClose }: Props) {
    const { gold, inventory, fetchInventory, fetchUserProfile } = useGameStore();
    const [currentSeries, setCurrentSeries] = useState<'basic' | 'chaos_and_rebellion'>('chaos_and_rebellion');
    const [phase, setPhase] = useState<'shop' | 'pack_sealed' | 'pack_ripped' | 'cards_reveal' | 'card_list'>('shop');
    const [purchasing, setPurchasing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [rolledCards, setRolledCards] = useState<AcademyCard[]>([]);
    const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false, false, false]);
    const [cashbackRefund, setCashbackRefund] = useState(0);
    const [newGold, setNewGold] = useState(gold);

    // カードリスト（確認画面用）
    const [listLoading, setListLoading] = useState(false);
    const [packCards, setPackCards] = useState<ListCard[]>([]);
    const [hoveredCard, setHoveredCard] = useState<ListCard | null>(null);

    useEffect(() => {
        soundManager?.init();
    }, []);

    // 鍵の所持数
    const config = SERIES_CONFIG[currentSeries];
    const keyCount = inventory.find(i => Number(i.item_id) === config.keyId || (i as any).slug === config.keySlug)?.quantity || 0;

    const handleBuyPack = async (buyWithKey = false) => {
        const activeConfig = SERIES_CONFIG[currentSeries];
        if (!buyWithKey && gold < activeConfig.price) {
            setErrorMsg('ゴールドが不足しています。');
            return;
        }
        if (purchasing) return;

        setPurchasing(true);
        setErrorMsg(null);
        soundManager?.playSE('se_click');

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/shop/buy-pack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    pack_series: currentSeries,
                    use_key: buyWithKey
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setRolledCards(data.cards);
                setCashbackRefund(data.refund);
                setNewGold(data.new_gold);
                setFlippedCards([false, false, false, false, false]);
                
                // 開封演出フェーズへ移行
                setPhase('pack_sealed');
                soundManager?.playSE('se_modal_open');
            } else {
                setErrorMsg(data.error || 'パックの購入に失敗しました。');
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setPurchasing(false);
        }
    };

    const handleRipPack = () => {
        if (phase !== 'pack_sealed') return;
        soundManager?.playSE('se_taunt'); // 引き裂きSE
        setPhase('pack_ripped');
        
        setTimeout(() => {
            setPhase('cards_reveal');
        }, 800);
    };

    const handleFlipCard = (index: number) => {
        if (phase !== 'cards_reveal' || flippedCards[index]) return;

        const newFlipped = [...flippedCards];
        newFlipped[index] = true;
        setFlippedCards(newFlipped);

        const card = rolledCards[index];
        if (card.rarity === 'SR' || card.rarity === 'R') {
            soundManager?.playSE('se_level_up');
        } else {
            soundManager?.playSE('se_item_get');
        }
    };

    const handleFlipAll = () => {
        if (phase !== 'cards_reveal') return;
        
        setFlippedCards([true, true, true, true, true]);
        
        const hasRare = rolledCards.some(card => card.rarity === 'SR' || card.rarity === 'R');
        if (hasRare) {
            soundManager?.playSE('se_level_up');
        } else {
            soundManager?.playSE('se_item_get');
        }
    };

    const handleBackToShop = async () => {
        await useGameStore.getState().fetchUserProfile();
        await fetchInventory();
        setPhase('shop');
    };

    // カルーセルのパック切り替え
    const toggleSeries = () => {
        soundManager?.playSE('se_click');
        setCurrentSeries(prev => prev === 'chaos_and_rebellion' ? 'basic' : 'chaos_and_rebellion');
        setErrorMsg(null);
    };

    // カードリスト取得
    const handleOpenCardList = async () => {
        soundManager?.playSE('se_click');
        setPhase('card_list');
        setListLoading(true);
        setHoveredCard(null);
        try {
            const res = await fetch(`/api/shop/buy-pack?pack_series=${currentSeries}`);
            const data = await res.json();
            if (res.ok && data.success) {
                setPackCards(data.cards);
            }
        } catch (e) {
            console.error('Failed to fetch pack card list:', e);
        } finally {
            setListLoading(false);
        }
    };

    const getRarityBadgeColor = (rarity: string) => {
        switch (rarity) {
            case 'SR': return 'bg-purple-900/80 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
            case 'R': return 'bg-amber-900/80 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
            case 'U': return 'bg-blue-900/80 border-blue-400 text-blue-300';
            default: return 'bg-slate-800/80 border-slate-600 text-slate-300';
        }
    };

    const getCardGlowClass = (rarity: string, isFlipped: boolean) => {
        if (!isFlipped) return 'border-amber-700/50 hover:border-amber-500/80';
        switch (rarity) {
            case 'SR': return 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse';
            case 'R': return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            case 'U': return 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
            default: return 'border-slate-700';
        }
    };

    // --- 各画面のレンダリング ---

    // 1. ショップ画面（カルーセル & スライドUI）
    const renderShop = () => {
        const activeConfig = SERIES_CONFIG[currentSeries];
        
        return (
            <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 text-center bg-[#0d0f1f] bg-radial-gradient text-slate-100 overflow-y-auto relative min-h-0">
                {/* 背景エフェクト */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none transition-all duration-700" 
                    style={{ backgroundImage: `url('/images/bg_magic_academy.png')` }}
                />
                <div className={`absolute inset-0 bg-gradient-to-b from-[#0d0f1f]/90 ${activeConfig.themeBg} to-[#0d0f1f]/95 pointer-events-none transition-all duration-700`} />
                <div className="absolute inset-0 bg-[url('/effects/magic_circle.png')] opacity-10 bg-center bg-no-repeat bg-contain pointer-events-none mix-blend-screen animate-[spin_60s_linear_infinite]" />
                
                <div className="relative z-10 max-w-md w-full flex flex-col items-center py-2 sm:py-0">
                    
                    {/* カルーセル パックタイトル */}
                    <div className="mb-4 sm:mb-6 min-h-[50px] flex flex-col items-center justify-center">
                        <h3 className="text-xl sm:text-2xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest transition-all duration-300">
                            {activeConfig.name}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] text-blue-200/60 mt-1 uppercase tracking-[0.2em] font-medium transition-all duration-300">
                            {activeConfig.sub}
                        </p>
                    </div>
                    
                    {/* カルーセル本体 (左右矢印 + パッケージ画像) */}
                    <div className="relative w-full flex items-center justify-between gap-2 mb-4 sm:mb-6">
                        {/* 左矢印 */}
                        <button 
                            onClick={toggleSeries}
                            className="p-1.5 sm:p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-500 text-slate-400 hover:text-white transition-all active:scale-90 shrink-0 backdrop-blur-sm z-20"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* パッケージ画像コンテナ */}
                        <div className="relative group cursor-pointer active:scale-95 transition-transform duration-300 flex-1 flex justify-center max-w-[200px] sm:max-w-[240px]">
                            {/* パック本体 */}
                            <div 
                                onClick={() => handleBuyPack(false)}
                                className={`relative w-40 h-56 sm:w-48 sm:h-68 rounded-2xl ${activeConfig.themeGlow} overflow-hidden flex flex-col items-center justify-between p-4 transform transition-all duration-500`}
                                style={{
                                    backgroundImage: `url(${activeConfig.wrapperImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
                                
                                <span className={`text-[8px] sm:text-[9px] ${activeConfig.textColor} font-bold uppercase tracking-[0.25em] border border-current/40 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs`}>
                                    {currentSeries === 'basic' ? 'BASIC EDITION' : 'EXTRA EDITION'}
                                </span>
                                
                                <div className="text-center bg-black/65 px-2 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm w-full">
                                    <span className="block text-xs sm:text-sm font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-100 leading-tight tracking-widest drop-shadow-md truncate">
                                        {currentSeries === 'basic' ? '黎明の知識' : '魔導と鉄壁'}
                                    </span>
                                    <span className="block text-[6px] sm:text-[7px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5">Booster Pack</span>
                                </div>
                                
                                <div className={`flex items-center gap-1 ${activeConfig.textColor} font-black text-[10px] sm:text-xs bg-black/80 px-2.5 py-1 rounded-full border border-current/30`}>
                                    <Sparkles className="w-3 h-3" />
                                    <span>5 CARDS</span>
                                </div>
                            </div>

                            {/* カードリスト確認用アイコンボタン (右下に配置) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCardList();
                                }}
                                className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-400 text-blue-400 hover:text-blue-300 transition-all active:scale-90 shadow-lg backdrop-blur-md z-30 group/btn"
                                title="カードリストを確認"
                            >
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* 右矢印 */}
                        <button 
                            onClick={toggleSeries}
                            className="p-1.5 sm:p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-500 text-slate-400 hover:text-white transition-all active:scale-90 shrink-0 backdrop-blur-sm z-20"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>

                    {/* 重複説明 */}
                    <p className="text-[9px] sm:text-[10px] text-amber-400/80 mb-3 sm:mb-4 max-w-xs leading-normal bg-amber-955/10 border border-amber-900/20 px-3 py-1.5 rounded-lg text-center backdrop-blur-xs">
                        ※重複カードまたは習得済みのスキルが出現した場合、<br />
                        1枚につき <span className="text-amber-300 font-bold">{activeConfig.refund} G</span> 返還されます。
                    </p>

                    {/* 購入・開封コントロール */}
                    <div className="w-full bg-[#161a33]/65 backdrop-blur-md rounded-2xl p-4 border border-blue-900/40 shadow-inner flex flex-col items-center gap-3">
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                            {/* ゴールドで購入ボタン */}
                            <div className="flex-1 w-full flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="font-mono font-bold text-amber-300 text-sm sm:text-base">{activeConfig.price.toLocaleString()} G</span>
                                </div>
                                <button
                                    onClick={() => handleBuyPack(false)}
                                    disabled={purchasing || gold < activeConfig.price}
                                    className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-xs tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border
                                        ${gold < activeConfig.price 
                                            ? 'bg-slate-800/50 text-slate-500 border-slate-700 cursor-not-allowed'
                                            : `bg-gradient-to-r ${activeConfig.colorClass}`
                                        }`}
                                >
                                    {purchasing && !keyCount ? (
                                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>G でパック購入</span>
                                    )}
                                </button>
                            </div>

                            {/* 鍵で開封ボタン (所持数にかかわらず枠は表示し、ない場合は非活性) */}
                            <div className="flex-1 w-full flex flex-col items-center gap-1.5">
                                <div className="text-[10px] text-slate-400 font-bold tracking-wider">
                                    {activeConfig.keyName} (所持: <span className={keyCount > 0 ? 'text-green-400 font-bold' : 'text-slate-500'}>{keyCount}</span>)
                                </div>
                                <button
                                    onClick={() => handleBuyPack(true)}
                                    disabled={purchasing || keyCount <= 0}
                                    className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-xs tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border
                                        ${keyCount <= 0 
                                            ? 'bg-slate-800/30 text-slate-650 border-slate-800 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-emerald-950 border-emerald-400 shadow-emerald-500/10'
                                        }`}
                                >
                                    {purchasing && keyCount > 0 ? (
                                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>鍵でパック開封</span>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {errorMsg && (
                            <p className="text-xs text-red-400 mt-1 font-semibold">{errorMsg}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // 2. 開封前の封止めパッケージ画面
    const renderSealedPack = () => {
        const activeConfig = SERIES_CONFIG[currentSeries];
        
        return (
            <div className="flex-1 flex flex-col items-center justify-start sm:justify-center bg-[#070914] text-slate-100 p-4 sm:p-6 relative overflow-y-auto animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-[url('/images/bg_magic_academy.png')] bg-cover bg-center opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-radial-gradient opacity-40 mix-blend-screen pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center py-4">
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-[0.3em] mb-2 sm:mb-4 animate-pulse">購入成功！</p>
                    <h4 className="text-sm sm:text-base font-bold font-serif mb-6 sm:mb-8 text-slate-200">パックをタップして開封してください</h4>

                    {/* タップで引き裂くパック */}
                    <div 
                        onClick={handleRipPack}
                        className="relative w-44 h-64 sm:w-52 sm:h-76 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        {/* パック発光 */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-purple-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
                        
                        {/* パックグラフィック */}
                        <div 
                            className="relative w-full h-full rounded-2xl flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden shadow-2xl"
                            style={{
                                backgroundImage: `url(${activeConfig.wrapperImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            {/* ギザギザフイルトリム */}
                            <div className="absolute top-0 inset-x-0 h-3 bg-amber-500 flex items-center justify-around opacity-90">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 bg-indigo-950 rotate-45 transform translate-y-1" />
                                ))}
                            </div>

                            <div className="pt-4">
                                <span className={`block text-[8px] sm:text-[9px] ${activeConfig.textColor} font-bold tracking-[0.2em] text-center bg-black/40 px-2 py-0.5 rounded`}>
                                    {currentSeries === 'basic' ? 'BASIC EDITION' : 'EXTRA EDITION'}
                                </span>
                            </div>

                            <div className="text-center flex-1 flex flex-col justify-center my-2 bg-black/60 px-3 py-2 rounded-xl border border-white/5">
                                <h3 className="text-base sm:text-lg font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-100 tracking-wider mb-1">
                                    {currentSeries === 'basic' ? '黎明の知識' : '混沌の魔導'}
                                </h3>
                                <p className="text-[7px] text-purple-300 font-bold tracking-[0.15em] uppercase">Pack Ripping Ready</p>
                            </div>

                            <div className="w-full py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-bold text-xs animate-bounce bg-black/40">
                                TAP TO OPEN
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // 3. 引き裂きアニメーション中画面
    const renderRippingPack = () => (
        <div className="flex-1 flex items-center justify-center bg-[#070914] text-slate-100">
            <div className="relative w-64 h-80 flex flex-col items-center justify-center">
                <div className="absolute inset-0 flex flex-col">
                    <div className="w-full h-1/2 bg-gradient-to-b from-indigo-950 to-purple-900 rounded-t-2xl border-x-4 border-t-4 border-amber-500 animate-[slideOutUp_0.8s_forwards] flex items-end justify-center pb-2 overflow-hidden">
                        <span className="text-xl font-bold font-serif text-white">撕</span>
                    </div>
                    <div className="w-full h-1/2 bg-gradient-to-t from-slate-955 to-purple-900 rounded-b-2xl border-x-4 border-b-4 border-amber-500 animate-[slideOutDown_0.8s_forwards] flex items-start justify-center pt-2 overflow-hidden">
                        <span className="text-xl font-bold font-serif text-white">裂</span>
                    </div>
                </div>
                <div className="w-32 h-32 bg-white rounded-full blur-3xl opacity-80 animate-ping absolute" />
            </div>
        </div>
    );

    // 4. カードめくり画面
    const renderCardsReveal = () => {
        const allFlipped = flippedCards.every(f => f);
        const activeConfig = SERIES_CONFIG[currentSeries];
        
        return (
            <div className="flex-1 flex flex-col bg-[#05060c] text-slate-100 p-3 sm:p-4 relative overflow-y-auto min-h-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15),transparent_70%)] pointer-events-none" />
                
                {/* 開封ヘッダー情報 */}
                <div className="w-full max-w-4xl mx-auto flex justify-between items-center mb-3 sm:mb-6 z-10 flex-shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] text-amber-500 font-black tracking-widest uppercase">PACK OPENING</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-300">カードをタッチしてめくってください</h4>
                    </div>
                    {!allFlipped && (
                        <button
                            onClick={handleFlipAll}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 rounded-lg font-bold text-[10px] sm:text-xs tracking-wider transition-colors active:scale-95"
                        >
                            一括オープン
                        </button>
                    )}
                </div>

                {/* 5枚カードの並び */}
                <div className="flex-1 max-w-4xl mx-auto w-full flex items-center justify-center py-2 sm:py-4 z-10 min-h-0">
                    <div className="flex flex-wrap gap-2.5 sm:gap-4 md:gap-5 w-full max-w-sm sm:max-w-xl md:max-w-none justify-center">
                        {rolledCards.map((card, idx) => {
                            const isFlipped = flippedCards[idx];
                            
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => handleFlipCard(idx)}
                                    className={`relative aspect-[5/7] w-[29%] xs:w-[30%] sm:w-[130px] md:w-[160px] cursor-pointer rounded-xl sm:rounded-2xl border transition-all duration-300 active:scale-95 select-none
                                        ${getCardGlowClass(card.rarity, isFlipped)}`}
                                    style={{ perspective: '1000px' }}
                                >
                                    <div 
                                        className="relative w-full h-full duration-500 rounded-xl sm:rounded-2xl"
                                        style={{
                                            transformStyle: 'preserve-3d',
                                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                            transition: 'transform 0.6s'
                                        }}
                                    >
                                        {/* カード裏面 (裏面画像アセット出し分け) */}
                                        <div 
                                            className="absolute inset-0 border border-amber-600/55 rounded-xl sm:rounded-2xl p-1.5 flex flex-col items-center justify-between shadow-lg overflow-hidden"
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                visibility: isFlipped ? 'hidden' : 'visible',
                                                transition: 'visibility 0s ' + (isFlipped ? '0.25s' : '0s'),
                                                backgroundImage: `url(${activeConfig.cardBackImage})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        >
                                            <div className={`absolute inset-0 ${activeConfig.cardBackBg} rounded-xl sm:rounded-2xl pointer-events-none`} />
                                            <div className="relative z-10 w-full h-full border border-amber-500/20 rounded-lg sm:rounded-xl flex flex-col items-center justify-between py-3 sm:py-6 bg-black/45 backdrop-blur-[0.5px]">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400/80 font-black text-[8px] sm:text-[10px]">
                                                    {currentSeries === 'basic' ? '契約' : '学院'}
                                                </div>
                                                <div className="w-7 h-7 sm:w-10 sm:h-10 border border-amber-500/25 rotate-45 flex items-center justify-center">
                                                    <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400/40 -rotate-45" />
                                                </div>
                                                <div className="text-[6px] sm:text-[8px] text-amber-550/40 tracking-[0.15em] sm:tracking-[0.2em] font-bold">WIRTH-DAWN</div>
                                            </div>
                                        </div>

                                        {/* カード表面 */}
                                        <div 
                                            className="absolute inset-0 bg-[#0c1020] border border-slate-700 rounded-xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)',
                                                visibility: isFlipped ? 'visible' : 'hidden',
                                                transition: 'visibility 0s ' + (isFlipped ? '0s' : '0.25s'),
                                            }}
                                        >
                                            {/* ヘッダー情報 */}
                                            <div className="px-1 py-0.5 sm:px-2 sm:py-1.5 flex justify-between items-center bg-black/40 border-b border-slate-800">
                                                <span className={`text-[6px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 rounded font-black border leading-none ${getRarityBadgeColor(card.rarity)}`}>
                                                    {card.rarity}
                                                </span>
                                                {card.isDuplicate && (
                                                    <span className="text-[6px] sm:text-[7px] bg-amber-500 text-slate-950 font-black px-0.5 sm:px-1 rounded leading-none border border-amber-400">
                                                        ダブり
                                                    </span>
                                                )}
                                            </div>

                                            {/* カード画像 */}
                                            <div className="flex-1 bg-slate-950/60 relative overflow-hidden flex items-center justify-center min-h-[45px] sm:min-h-[70px]">
                                                {card.image_url ? (
                                                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
                                                )}
                                                
                                                {/* 重複キャッシュバックの表示 */}
                                                {card.isDuplicate && (
                                                    <div className="absolute inset-0 bg-amber-955/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 text-center animate-in fade-in duration-300">
                                                        <Coins className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400 mb-0.5 animate-bounce" />
                                                        <span className="text-[7px] sm:text-[8px] text-amber-400 font-bold uppercase leading-none">+{activeConfig.refund}G</span>
                                                        <span className="text-[5px] sm:text-[6px] text-amber-300/60 mt-0.5 whitespace-nowrap hidden sm:inline">キャッシュバック</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 説明テキスト */}
                                            <div className="p-1 sm:p-2 bg-[#101426] border-t border-slate-800 flex flex-col gap-0.5 sm:gap-1 shrink-0">
                                                <span className="text-[9px] sm:text-xs font-bold text-slate-100 truncate">{card.name}</span>
                                                <p className="text-[6px] sm:text-[8px] text-slate-400 leading-normal h-6 sm:h-10 overflow-hidden line-clamp-2 sm:line-clamp-3">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* カード開封完了フッター */}
                {allFlipped && (
                    <div className="w-full max-w-md mx-auto bg-[#13162b]/80 border border-blue-900/40 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 z-10 flex-shrink-0 animate-in fade-in slide-in-from-bottom-5 duration-300 mt-2 sm:mt-4">
                        {cashbackRefund > 0 && (
                            <div className="flex items-center gap-1 sm:gap-1.5 text-amber-300 text-[10px] sm:text-xs font-bold bg-amber-955/40 border border-amber-800/40 px-2.5 py-1 rounded-lg text-center">
                                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span>重複分として {cashbackRefund.toLocaleString()} G が返還されました！</span>
                            </div>
                        )}
                        
                        <div className="flex gap-2 sm:gap-3 w-full">
                            <button
                                onClick={handleBackToShop}
                                className="flex-1 py-2 sm:py-3 bg-[#1e234a] hover:bg-[#282e5e] text-blue-200 border border-blue-800/40 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider transition-colors active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5"
                            >
                                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>もう一度引く</span>
                            </button>
                            <button
                                onClick={async () => {
                                    await useGameStore.getState().fetchUserProfile();
                                    await fetchInventory();
                                    onClose();
                                }}
                                className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 border border-amber-400 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider transition-all active:scale-95 shadow-md shadow-amber-500/10"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 5. カードリスト確認画面（ギャラリービュー）
    const renderCardList = () => {
        const activeConfig = SERIES_CONFIG[currentSeries];
        
        return (
            <div className="flex-1 flex flex-col bg-[#05060c] text-slate-100 p-4 relative overflow-hidden min-h-0">
                {/* コレクション風ヘッダー */}
                <div className="flex justify-between items-center mb-4 z-10 shrink-0">
                    <div className="flex flex-col">
                        <span className={`text-[9px] sm:text-[10px] ${activeConfig.textColor} font-black tracking-widest uppercase`}>
                            {activeConfig.name}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-300">パック収録カード一覧</h4>
                    </div>
                    <button
                        onClick={() => setPhase('shop')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg font-bold text-[10px] sm:text-xs transition-colors active:scale-95"
                    >
                        パック選択へ戻る
                    </button>
                </div>

                {/* 収録カードのグリッドリスト */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden z-10 min-h-0">
                    {/* カードグリッド */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        {listLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                <span className="text-xs text-blue-400 font-medium">カード情報を取得中...</span>
                            </div>
                        ) : packCards.length === 0 ? (
                            <div className="text-center text-slate-500 py-12 text-xs">カードがありません。</div>
                        ) : (
                            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                {packCards.map((card) => (
                                    <div
                                        key={card.id}
                                        onMouseEnter={() => setHoveredCard(card)}
                                        onClick={() => setHoveredCard(card)}
                                        className={`relative aspect-[5/7] cursor-pointer rounded-lg border bg-[#0b0e1b] overflow-hidden p-0.5 hover:scale-105 active:scale-95 transition-all
                                            ${hoveredCard?.id === card.id ? 'border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-slate-800 hover:border-slate-650'}`}
                                    >
                                        <div className="w-full h-full flex flex-col relative">
                                            {/* レアリティバッジ */}
                                            <div className="absolute top-0.5 left-0.5 z-10">
                                                <span className={`text-[5px] sm:text-[6px] px-1 py-0.5 rounded font-black border leading-none scale-90 ${getRarityBadgeColor(card.rarity)}`}>
                                                    {card.rarity}
                                                </span>
                                            </div>
                                            {/* イメージ */}
                                            <div className="flex-1 bg-slate-950/60 overflow-hidden flex items-center justify-center">
                                                {card.image_url ? (
                                                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <BookOpen className="w-4 h-4 text-slate-700" />
                                                )}
                                            </div>
                                            {/* 名前 */}
                                            <div className="bg-[#0f1326] p-1 border-t border-slate-900 shrink-0 text-center">
                                                <span className="text-[7px] sm:text-[8px] font-bold text-slate-200 block truncate">{card.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* カード詳細スペックプレビューパネル（右側） */}
                    <div className="w-full md:w-60 bg-[#0f1328]/80 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3 shrink-0 justify-center min-h-[140px] md:min-h-0 backdrop-blur-md">
                        {hoveredCard ? (
                            <div className="flex flex-col gap-2.5 text-left animate-in fade-in slide-in-from-right-3 duration-250">
                                <div className="flex justify-between items-start gap-1">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-serif leading-snug">{hoveredCard.name}</h4>
                                    <span className={`text-[6px] sm:text-[7px] px-1.5 py-0.5 rounded font-black border ${getRarityBadgeColor(hoveredCard.rarity)} shrink-0`}>
                                        {hoveredCard.rarity}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1.5 text-[8px] sm:text-[9px] text-slate-400">
                                    <div className="bg-black/30 px-2 py-0.5 rounded border border-slate-900 flex justify-between">
                                        <span>コスト</span>
                                        <span className="font-bold text-slate-200">{hoveredCard.ap_cost} AP</span>
                                    </div>
                                    <div className="bg-black/30 px-2 py-0.5 rounded border border-slate-900 flex justify-between">
                                        <span>タイプ</span>
                                        <span className="font-bold text-slate-200">{hoveredCard.card_type}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800/80 pt-2 text-[10px] sm:text-xs text-slate-300 leading-normal min-h-[50px]">
                                    {hoveredCard.description}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-6 text-[10px] sm:text-xs flex flex-col items-center justify-center gap-2">
                                <List className="w-5 h-5 text-slate-700" />
                                <span>カードをホバーまたはタップすると<br />詳細説明が表示されます。</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const mainContent = createPortal(
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
            <div className="bg-[#070914] text-slate-100 w-full max-w-4xl h-full md:h-[90dvh] flex flex-col md:rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border-0 md:border-2 border-blue-950 relative overflow-hidden">
                {/* 魔術学院ヘッダー */}
                <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-blue-950 flex justify-between items-center bg-[#0d1127] relative z-20 shrink-0">
                    <h2 className="font-bold flex items-center gap-1.5 sm:gap-2 text-amber-500">
                        <Sparkles size={14} className="text-amber-500 animate-pulse" />
                        <span className="text-[10px] sm:text-xs text-slate-200 uppercase tracking-widest">
                            魔術学院
                        </span>
                    </h2>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 bg-amber-955/40 border border-amber-800/40 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold text-amber-400">
                            <Coins size={12} className="text-amber-400" />
                            <span>{newGold.toLocaleString()} G</span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-slate-500 hover:text-white transition-colors focus:outline-none p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 状態に応じた画面遷移 */}
                {phase === 'shop' && renderShop()}
                {phase === 'pack_sealed' && renderSealedPack()}
                {phase === 'pack_ripped' && renderRippingPack()}
                {phase === 'cards_reveal' && renderCardsReveal()}
                {phase === 'card_list' && renderCardList()}

                {/* フッター */}
                <div className="py-2.5 px-4 bg-black/40 border-t border-blue-950 text-center text-[9px] text-slate-600 font-mono tracking-wider flex-shrink-0">
                    ACADEMY SPECIAL PACK EDITION V2.0 • NOITS-DRAGO
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes slideOutUp {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-120%); opacity: 0; }
                }
                @keyframes slideOutDown {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(120%); opacity: 0; }
                }
            `}</style>
        </div>,
        document.body
    );

    return mainContent;
}
