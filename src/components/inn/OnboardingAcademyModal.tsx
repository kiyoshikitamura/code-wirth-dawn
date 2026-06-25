import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';
import { getAuthHeaders } from '@/lib/authToken';
import { useRouter } from 'next/navigation';

interface Props {
    // チュートリアルモーダルなので閉じられませんが、インターフェース整合性のために用意
    onClose?: () => void;
}

interface Card {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    description: string;
    rarity: 'SR' | 'R' | 'U' | 'C';
}

export default function OnboardingAcademyModal({ onClose }: Props) {
    const router = useRouter();
    const fetchUserProfile = useGameStore((state) => state.fetchUserProfile);
    
    // ステップ管理: 'welcome' | 'pack' | 'ripping' | 'flip' | 'completed'
    const [step, setStep] = useState<'welcome' | 'pack' | 'ripping' | 'flip' | 'completed'>('welcome');
    const [rolledCards, setRolledCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false, false, false]);
    
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // BGMの制御 (必要に応じて)
    useEffect(() => {
        soundManager?.playBgm('bgm_inn');
        // Preload card back image
        const img = new Image();
        img.src = '/images/card_back_basic.png';
    }, []);

    // 5枚すべてめくられたかを判定
    const allFlipped = flippedCards.length === 5 && flippedCards.every(Boolean);

    // カードをタップしてめくる
    const handleFlipCard = (idx: number) => {
        if (flippedCards[idx]) return;
        soundManager?.playSE('se_click');
        const updated = [...flippedCards];
        updated[idx] = true;
        setFlippedCards(updated);
    };

    // 一括でめくる
    const handleFlipAll = () => {
        soundManager?.playSE('se_click');
        setFlippedCards([true, true, true, true, true]);
    };

    // パックを引く
    const handleBuyPack = async () => {
        setIsPurchasing(true);
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
                    pack_series: 'basic', // チュートリアル用の基本パック
                    use_key: true
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                const cards: Card[] = data.cards || [];
                // Preload card front images in parallel during ripping animation (800ms)
                cards.forEach((card) => {
                    if (card.image_url) {
                        const img = new Image();
                        img.src = card.image_url;
                    }
                });
                setRolledCards(cards);
                soundManager?.playSE('se_taunt');
                setStep('ripping');
                setTimeout(() => {
                    setStep('flip');
                }, 800);
            } else {
                setErrorMsg(data.error || 'パックの開封に失敗しました。');
            }
        } catch (err: any) {
            console.error('[OnboardingAcademyModal] Pack Buy Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setIsPurchasing(false);
        }
    };

    // おまかせ編成 ＆ 冒険を開始
    const handleAutoDeckAndStartQuest = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setErrorMsg(null);
        soundManager?.playSE('se_click');

        try {
            const authHeaders = await getAuthHeaders();

            // 1. おまかせデッキ編成APIを呼び出し
            const autoDeckRes = await fetch('/api/inventory/auto-deck', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                }
            });
            const autoDeckData = await autoDeckRes.json();
            if (!autoDeckRes.ok || !autoDeckData.success) {
                throw new Error(autoDeckData.error || 'おまかせデッキ編成に失敗しました。');
            }

            // 2. 第1話「始まりの轍」（ID: 6001）受注APIを呼び出し
            const questStartRes = await fetch('/api/quest/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    quest_id: '6001'
                })
            });
            const questStartData = await questStartRes.json();
            if (!questStartRes.ok || !questStartData.success) {
                throw new Error(questStartData.error || '第1話の受注に失敗しました。');
            }

            // 3. チュートリアル完了フラグ更新APIを呼び出し
            const completeTutorialRes = await fetch('/api/profile/complete-tutorial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                }
            });
            const completeTutorialData = await completeTutorialRes.json();
            if (!completeTutorialRes.ok || !completeTutorialData.success) {
                throw new Error(completeTutorialData.error || 'チュートリアル完了フラグの更新に失敗しました。');
            }

            // ストア情報のリフレッシュ
            await fetchUserProfile();

            // 4. クエスト画面へ遷移
            router.push('/quest/6001');

        } catch (err: any) {
            console.error('[OnboardingAcademyModal] Sequence Error:', err);
            setErrorMsg(err.message || '通信エラーが発生しました。再度お試しください。');
            setIsProcessing(false);
        }
    };

    // レア度に応じたカードの輝きスタイル
    const getCardGlowClass = (rarity: string, isFlipped: boolean) => {
        if (!isFlipped) return 'border-amber-600/30 hover:border-amber-500/50';
        switch (rarity) {
            case 'SR': return 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]';
            case 'R': return 'border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.4)]';
            case 'U': return 'border-slate-400';
            default: return 'border-slate-600';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md select-none overflow-y-auto p-4">
            
            {/* フェーズ 1: 世界観説明 */}
            {step === 'welcome' && (
                <div className="relative w-full max-w-md bg-[#0d0f1f]/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
                    <div className="absolute -top-10 bg-amber-500/10 border border-amber-500/30 p-4 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                    </div>
                    
                    <h2 className="mt-6 text-xl sm:text-2xl font-black text-amber-100 tracking-wider">
                        魔導の契約
                    </h2>
                    
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent my-4" />
                    
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium whitespace-pre-line tracking-wide my-4 min-h-[140px] flex items-center justify-center">
                        {`「目覚めよ、名もなき旅人よ。\n\n混沌と秩序が交錯するこの地を歩むには、運命を切り拓く力……すなわち『カード』の契約が必要となる。\n\n学舎の門を叩き、古の契約を結ぶのだ。」`}
                    </p>

                    <button
                        onClick={() => {
                            soundManager?.playSE('se_click');
                            setStep('pack');
                        }}
                        className="mt-6 w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 rounded-xl font-black tracking-widest text-sm shadow-[0_4px_20px_rgba(245,158,11,0.25)] border border-amber-400/30 active:scale-98 transition-all duration-200"
                    >
                        魔術学院へ進む
                    </button>
                </div>
            )}

            {/* フェーズ 2: チュートリアル用パック開封 */}
            {step === 'pack' && (
                <div className="relative w-full max-w-sm bg-[#0d0f1f]/90 border border-indigo-500/25 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
                    <h2 className="text-lg font-black text-slate-200 tracking-wider">
                        学舎の契約の書
                    </h2>
                    <p className="text-xs text-indigo-400/80 tracking-wide mt-1">
                        Booster Pack Contract
                    </p>

                    {/* パックビジュアル */}
                    <div 
                        onClick={() => !isPurchasing && handleBuyPack()}
                        className="my-8 relative w-48 aspect-[3/4] cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        {/* パック発光 */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-purple-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
                        
                        {/* パック本体 */}
                        <div 
                            className="relative w-full h-full border-2 border-amber-500/30 rounded-xl shadow-xl flex flex-col items-center justify-between p-4 overflow-hidden"
                            style={{
                                backgroundImage: "url('/images/card_back_basic.png')",
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />
                            
                            <span className="relative z-10 text-[10px] text-amber-400 font-bold tracking-widest uppercase">WIRTH-DAWN</span>
                            
                            <div className="relative z-10 w-12 h-12 rounded-full border border-amber-500/20 bg-black/40 flex items-center justify-center my-2">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center bg-black/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-xs font-black text-amber-100 tracking-widest">黎明の知識と古の契約</span>
                                <span className="text-[8px] text-slate-355 font-bold tracking-wide mt-0.5">BASIC STARTER PACK</span>
                            </div>

                            <div className="relative z-10 w-full py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-bold text-[10px] animate-bounce bg-black/40">
                                TAP TO OPEN
                            </div>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg w-full">
                            {errorMsg}
                        </div>
                    )}

                    {/* 鍵でのみ引けるように制限されたボタン */}
                    <button
                        onClick={handleBuyPack}
                        disabled={isPurchasing}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 rounded-xl font-black tracking-wider text-xs border border-amber-400/20 flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 disabled:opacity-50"
                    >
                        {isPurchasing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                                契約を結んでいます...
                            </>
                        ) : (
                            <>
                                魔導の契約を結ぶ
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* フェーズ 3 & 4: カード開封 & おまかせ編成 */}
            {step === 'flip' && (
                <div className="w-full max-w-4xl flex flex-col items-center min-h-[85vh] justify-between py-6">
                    
                    {/* 上部ヘッダー */}
                    <div className="flex flex-col items-center text-center z-10">
                        <h2 className="text-xl sm:text-2xl font-black text-amber-100 tracking-wider">
                            結ばれし魔導の記憶
                        </h2>
                        <p className="text-xs text-indigo-300/70 mt-1 tracking-wider">
                            カードをタップして契約の内容を確かめよ
                        </p>
                    </div>

                    {/* カード一覧 */}
                    <div className="flex-1 w-full flex items-center justify-center py-6 min-h-0 z-10">
                        <div className="flex flex-wrap gap-3 sm:gap-5 justify-center w-full max-w-sm sm:max-w-2xl md:max-w-none">
                            {rolledCards.map((card, idx) => {
                                const isFlipped = flippedCards[idx];

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleFlipCard(idx)}
                                        className={`relative aspect-[5/7] w-[28%] xs:w-[29%] sm:w-[130px] md:w-[155px] cursor-pointer rounded-xl sm:rounded-2xl border transition-all duration-300 active:scale-95 select-none
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
                                            {/* カード裏面 */}
                                            <div
                                                className="absolute inset-0 border border-amber-600/55 rounded-xl sm:rounded-2xl p-1.5 flex flex-col items-center justify-between shadow-lg overflow-hidden"
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    visibility: isFlipped ? 'hidden' : 'visible',
                                                    transition: 'visibility 0s ' + (isFlipped ? '0.25s' : '0s'),
                                                    backgroundImage: "url('/images/card_back_basic.png')",
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-slate-900/40 rounded-xl sm:rounded-2xl pointer-events-none" />
                                                <div className="relative z-10 w-full h-full border border-amber-500/20 rounded-lg sm:rounded-xl flex flex-col items-center justify-between py-3 sm:py-6 bg-black/45 backdrop-blur-[0.5px]">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400/80 font-black text-[8px] sm:text-[10px]">
                                                        契約
                                                    </div>
                                                    <div className="w-7 h-7 sm:w-10 sm:h-10 border border-amber-500/25 rotate-45 flex items-center justify-center">
                                                        <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400/40 -rotate-45" />
                                                    </div>
                                                    <div className="text-[6px] sm:text-[8px] text-amber-550/40 tracking-[0.15em] sm:tracking-[0.2em] font-bold">WIRTH-DAWN</div>
                                                </div>
                                            </div>

                                            {/* カード表面 */}
                                            <div
                                                className="absolute inset-0 bg-[#0c1020] border border-slate-700 rounded-xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden p-1.5 sm:p-2.5 justify-between"
                                                style={{
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                    visibility: isFlipped ? 'visible' : 'hidden',
                                                    transition: 'visibility 0s ' + (isFlipped ? '0s' : '0.25s'),
                                                }}
                                            >
                                                {/* カードヘッダー */}
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-200 truncate pr-1">
                                                        {card.name}
                                                    </span>
                                                    <span className={`text-[7px] sm:text-[9px] font-black tracking-wide ${
                                                        card.rarity === 'SR' ? 'text-amber-400' :
                                                        card.rarity === 'R' ? 'text-indigo-400' :
                                                        card.rarity === 'U' ? 'text-slate-300' : 'text-slate-500'
                                                    }`}>
                                                        {card.rarity}
                                                    </span>
                                                </div>

                                                {/* カード画像エリア (仮の装飾) */}
                                                <div className="relative my-1 sm:my-1.5 flex-1 bg-slate-950/80 rounded-lg sm:rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                                                    {card.image_url ? (
                                                        <img
                                                            src={card.image_url}
                                                            alt={card.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-slate-800" />
                                                    )}
                                                </div>

                                                {/* カードテキスト */}
                                                <div className="w-full text-left">
                                                    <p className="text-[6px] sm:text-[8px] text-slate-400 leading-tight line-clamp-2 h-[24px] sm:h-[32px] overflow-hidden">
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

                    {/* 下部操作エリア */}
                    <div className="w-full max-w-md flex flex-col items-center mt-4 z-10">
                        {errorMsg && (
                            <div className="mb-4 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg w-full text-center">
                                {errorMsg}
                            </div>
                        )}

                        {!allFlipped ? (
                            <button
                                onClick={handleFlipAll}
                                className="px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/50 rounded-xl font-bold text-xs tracking-wider transition-colors active:scale-95 shadow-lg"
                            >
                                全てのカードを開く
                            </button>
                        ) : (
                            <button
                                onClick={handleAutoDeckAndStartQuest}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-amber-700/50 disabled:to-amber-800/50 text-amber-50 rounded-xl font-black tracking-widest text-xs sm:text-sm border border-amber-400/30 shadow-[0_4px_25px_rgba(245,158,11,0.3)] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                                        デッキを編制し、旅路を拓いています...
                                    </>
                                ) : (
                                    <>
                                        おまかせデッキ編成 ＆ 冒険を開始
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            )}

            {/* フェーズ 2.5: 引き裂き演出 */}
            {step === 'ripping' && (
                <div className="relative w-64 h-80 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                    <div className="absolute inset-0 flex flex-col">
                        <div className="w-full h-1/2 bg-[#09152b] rounded-t-2xl border-x-4 border-t-4 border-amber-500/70 animate-[slideOutUp_0.8s_forwards] flex items-end justify-center pb-2 overflow-hidden"
                             style={{ backgroundImage: "url('/images/card_back_basic.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className="absolute inset-0 bg-slate-900/50 pointer-events-none" />
                            <span className="text-xl font-bold font-serif text-white z-10 select-none">撕</span>
                        </div>
                        <div className="w-full h-1/2 bg-[#09152b] rounded-b-2xl border-x-4 border-b-4 border-amber-500/70 animate-[slideOutDown_0.8s_forwards] flex items-start justify-center pt-2 overflow-hidden"
                             style={{ backgroundImage: "url('/images/card_back_basic.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className="absolute inset-0 bg-slate-900/50 pointer-events-none" />
                            <span className="text-xl font-bold font-serif text-white z-10 select-none">裂</span>
                        </div>
                    </div>
                    <div className="w-32 h-32 bg-white rounded-full blur-3xl opacity-80 animate-ping absolute" />
                </div>
            )}

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
}
