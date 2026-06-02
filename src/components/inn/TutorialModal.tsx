import React, { useState } from 'react';
import { Compass, Globe, Trophy, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface TutorialModalProps {
    onComplete: () => Promise<void>;
}

export default function TutorialModal({ onComplete }: TutorialModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);

    const slides = [
        {
            title: '1. ワールドマップと拠点',
            icon: <Compass className="w-12 h-12 text-[#8b4513] animate-pulse" />,
            content: (
                <div className="space-y-4 text-[#2c1810] text-sm leading-relaxed">
                    <p>
                        本ゲームは、安全な<strong>「拠点（宿屋）」</strong>を基点として世界を冒険するカードバトルRPGです。
                    </p>
                    <div className="bg-[#2c1810]/5 p-3 rounded-lg border border-[#2c1810]/10 space-y-1 font-serif text-xs">
                        <p>✦ <strong>酒場</strong>：信頼できる傭兵や英霊を仲間にします。</p>
                        <p>✦ <strong>道具屋</strong>：装備を整え、旅の必需品を購入します。</p>
                        <p>✦ <strong>ギルド</strong>：報酬となるゴールドや名声、経験値を得るための依頼（クエスト）を受託します。</p>
                    </div>
                    <p>
                        ワールドマップを介して各地を移動できますが、旅路には数々の強敵や予期せぬイベントが待ち受けています。十分な準備をしてから出発しましょう。
                    </p>
                </div>
            )
        },
        {
            title: '2. 勢力の均衡',
            icon: <Globe className="w-12 h-12 text-[#8b4513] animate-spin-slow" />,
            content: (
                <div className="space-y-4 text-[#2c1810] text-sm leading-relaxed">
                    <p>
                        この世界は4つの大国によって分割支配されており、旅人たちの行動や祈りによって、<strong>6時間ごとに勢力図が変化</strong>します。
                    </p>
                    <p>
                        各都市の治安や繁栄度（崩壊 Lv1 〜 絶頂 Lv5）が移り変わることで、<strong>宿屋の宿泊費やショップの品揃え、購入価格</strong>がリアルタイムに変動します。
                    </p>
                    <p>
                        あなたがどこの国を支持し、どこで依頼を遂行するかが、この世界の未来に影響を及ぼします。
                    </p>
                </div>
            )
        },
        {
            title: '3. コレクションやランキング、ユーザー投稿',
            icon: <Trophy className="w-12 h-12 text-[#8b4513]" />,
            content: (
                <div className="space-y-4 text-[#2c1810] text-sm leading-relaxed">
                    <p>
                        安全な中立地帯である<strong>「名もなき旅人の拠所（ハブ）」</strong>では、世界中を旅して集めたモンスターなどの記録を<strong>図鑑（コレクション）</strong>として閲覧できます。
                    </p>
                    <p>
                        他の旅人と競い合う<strong>ランキング</strong>に挑戦して、自らの限界に挑みましょう。
                    </p>
                    <p>
                        また、他のユーザーが作成したオリジナルの依頼（ユーザー投稿クエスト）を受託して遊ぶこともできます。あなた自身が新たな歴史を紡ぎ、他者に挑むことも可能です。
                    </p>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            soundManager?.playSE('se_click');
            setCurrentSlide(currentSlide + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            soundManager?.playSE('se_click');
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleStart = async () => {
        if (isCompleting) return;
        setIsCompleting(true);
        soundManager?.playSE('se_quest_accept');
        try {
            await onComplete();
        } catch (e) {
            console.error(e);
            setIsCompleting(false);
        }
    };

    const slide = slides[currentSlide];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-sm bg-[#f4e4bc] text-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[12px] border-[#2c1810] rounded-sm overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#2c1810] p-4 text-[#f4e4bc] text-center border-b-4 border-double border-[#f4e4bc]/30 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-5 h-5 text-amber-400" />
                        <span className="font-serif font-black text-lg tracking-[0.2em] text-amber-200">冒険の手引き</span>
                    </div>
                    <div className="text-[10px] opacity-70 font-mono tracking-widest">GUIDE FOR THE UNNAMED TRAVELER</div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 font-serif flex flex-col items-center justify-start min-h-[300px]">
                    <div className="mb-4 p-3 bg-[#2c1810]/5 rounded-full border border-[#2c1810]/10 animate-fade-in">
                        {slide.icon}
                    </div>

                    <h3 className="text-xl font-black text-[#2c1810] mb-4 text-center border-b-2 border-[#2c1810]/20 pb-2 w-full">
                        {slide.title}
                    </h3>

                    <div className="flex-1 w-full animate-fade-in">
                        {slide.content}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 bg-[#2c1810]/5 border-t border-[#2c1810]/10 flex flex-col items-center gap-4">
                    {/* Slide Dots Indicator */}
                    <div className="flex justify-center gap-2">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                    currentSlide === idx ? 'bg-amber-600 scale-125 shadow-sm shadow-amber-900/50' : 'bg-[#2c1810]/20'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex w-full gap-3">
                        {currentSlide > 0 ? (
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="flex-1 py-3 text-sm font-bold border border-[#2c1810]/30 text-[#2c1810] hover:bg-[#2c1810]/5 rounded transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                前へ
                            </button>
                        ) : (
                            <div className="flex-1" />
                        )}

                        {currentSlide < slides.length - 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-1 py-3 bg-[#2c1810] text-[#f4e4bc] text-sm font-bold hover:bg-[#4a2c1e] rounded transition-all flex items-center justify-center gap-1 active:scale-95 shadow-md"
                            >
                                次へ
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStart}
                                disabled={isCompleting}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-[#f4e4bc] text-sm font-black hover:from-amber-500 hover:to-amber-600 rounded transition-all active:scale-95 disabled:opacity-50 border-2 border-amber-500 shadow-lg shadow-amber-900/40 animate-pulse"
                            >
                                {isCompleting ? '旅の準備中...' : '冒険を始める'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Decorative Gradients */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-black/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-black/10 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
