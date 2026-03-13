import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { WorldState } from '@/types/game';

interface RumorsModalProps {
    onClose: () => void;
    worldState: WorldState | null;
    reputationScore: number;
}

export default function RumorsModal({ onClose, worldState, reputationScore }: RumorsModalProps) {
    // 噂話生成ロジック
    const getRumors = () => {
        const prosp = worldState?.prosperity_level || 3;
        const nation = worldState?.controlling_nation || 'Neutral';
        const rumors: string[] = [];

        // 情勢に基づく噂
        if (prosp >= 4) {
            rumors.push("「最近、商人の出入りが多くて宿も一杯らしいぞ。」");
            rumors.push("「この街は豊かだ。だが、その富を狙う輩も増えているらしい。」");
        } else if (prosp <= 2) {
            rumors.push("「昨晩も西区で略奪があったそうだ...気をつけろよ。」");
            rumors.push(`「${nation}の統治も長くは続かないんじゃないか？」`);
        } else {
            rumors.push("「北の森で大きな影を見たというハンターがいるらしい。」");
            rumors.push("「王都の地下には、忘れられた遺跡があるという噂だ。」");
        }

        // 名声に基づく噂
        if (reputationScore >= 300) {
            rumors.push("「あんたのこと、皆噂してるぜ。街の危機を救った英雄だってな。」");
        } else if (reputationScore < 0) {
            rumors.push("「...おい、あの顔、手配書で見たことあるぞ...目を合わせるな。」");
        }

        // ランダムに追加の1つ
        const randoms = [
            "「ギルドのマスターが、腕の立つ傭兵を探しているらしい。」",
            "「あの魔導具屋、最近妙な薬を仕入れたらしいぜ。」",
            "「最近、赤い流れ星を見たんだ。不吉な予感がする...」"
        ];
        rumors.push(randoms[Math.floor(Math.random() * randoms.length)]);

        return rumors.slice(0, 3); // 最大3つに制限
    };

    const rumors = getRumors();

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-start pt-28 justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top duration-300">

                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                    <h2 className="text-slate-300 text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                        <MessageSquare size={14} className="text-amber-500" /> 街の噂話
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors focus:outline-none">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {rumors.map((rumor, idx) => (
                        <div key={idx} className="bg-black/40 p-4 rounded-lg border border-slate-800 shadow-inner group transition-all hover:bg-black/60 hover:border-slate-600">
                            <p className="text-sm text-slate-300 leading-relaxed font-serif italic">
                                {rumor}
                            </p>
                        </div>
                    ))}

                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition-colors uppercase tracking-widest active:scale-95"
                    >
                        閉じる
                    </button>
                </div>

            </div>
        </div>
    );
}
