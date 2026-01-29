'use client';

import React from 'react';
import { WorldHistory } from '@/types/game';
import { Share, X as CloseIcon } from 'lucide-react';

interface WorldNewsProps {
    history: WorldHistory;
    onClose: () => void;
    isModal?: boolean;
}

export default function WorldNews({ history, onClose, isModal = true }: WorldNewsProps) {
    // 4-axis Graph Calculations
    const maxScore = 50; // Visual max

    // NOTE: History from DB might not have scores depending on schema version.
    // If missing, we default to 0 or we could try to show "N/A".
    // Cast to any because type definition might be strict but runtime object might lack them.
    const h = history as any;

    const orderP = Math.min(100, ((h.order_score || 0) / maxScore) * 100);
    const chaosP = Math.min(100, ((h.chaos_score || 0) / maxScore) * 100);
    const justiceP = Math.min(100, ((h.justice_score || 0) / maxScore) * 100);
    const evilP = Math.min(100, ((h.evil_score || 0) / maxScore) * 100);

    const dateStr = h.occured_at ? new Date(h.occured_at).toLocaleDateString() : 'Unknown Date';

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `【号外】${history.headline}\n世界の情勢: ${history.new_status || '不明'} - ${history.new_attribute}\n\n#WirthDawn #世界の観測`
    )}`;

    const content = (
        <div className="bg-[#e3d5b8] text-[#2c241b] font-serif p-8 max-w-2xl w-full relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border-8 border-double border-[#2c241b] overflow-hidden">
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 pointer-events-none"></div>
            <div className="absolute inset-0 bg-sepia-0 pointer-events-none mix-blend-multiply"></div>

            {/* Header / Title */}
            <div className="border-b-4 border-black pb-4 mb-6 text-center relative z-10">
                <div className="flex justify-between items-end border-b border-black pb-1 mb-1">
                    <span className="text-xs font-bold tracking-widest">THE CODE: WIRTH-DAWN TIMES</span>
                    <span className="text-xs font-mono">{dateStr}</span>
                </div>
                <h1 className="text-5xl font-bold tracking-tighter mt-4 mb-2 leading-none uppercase">
                    号 外
                </h1>
                <p className="text-3xl font-bold mt-4 leading-tight">
                    {history.headline}
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                    <div className="bg-[#2c241b] text-[#e3d5b8] p-4">
                        <h3 className="text-lg font-bold border-b border-[#e3d5b8]/30 pb-2 mb-2 text-center">
                            情勢変動
                        </h3>
                        <div className="text-center space-y-2">
                            <div className="text-sm opacity-70">STATUS</div>
                            <div className="text-xl font-bold flex items-center justify-center gap-2">
                                <span className="line-through opacity-50 text-base">{history.old_status}</span>
                                <span>→</span>
                                <span className="text-2xl text-gold-500">{history.new_status}</span>
                            </div>
                            <div className="text-sm opacity-70 mt-4">ATTRIBUTE</div>
                            <div className="text-lg font-bold leading-tight">
                                {history.old_attribute && (
                                    <div className="line-through opacity-50 text-sm mb-1">{history.old_attribute}</div>
                                )}
                                <div className="text-gold-200">{history.new_attribute}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graph */}
                <div className="border border-black/30 p-4 bg-white/5">
                    <h3 className="text-center font-bold mb-4 text-sm border-b border-black pb-1">CURRENT VARIANCE (Snapshot)</h3>
                    {h.order_score !== undefined ? (
                        <div className="space-y-3 font-mono text-xs">
                            <div>
                                <div className="flex justify-between mb-1"><span>ORDER</span><span>{h.order_score}</span></div>
                                <div className="h-2 bg-black/10"><div className="h-full bg-[#1e3a8a]" style={{ width: `${orderP}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span>CHAOS</span><span>{h.chaos_score}</span></div>
                                <div className="h-2 bg-black/10"><div className="h-full bg-[#581c87]" style={{ width: `${chaosP}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span>JUSTICE</span><span>{h.justice_score}</span></div>
                                <div className="h-2 bg-black/10"><div className="h-full bg-[#854d0e]" style={{ width: `${justiceP}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span>EVIL</span><span>{h.evil_score}</span></div>
                                <div className="h-2 bg-black/10"><div className="h-full bg-[#7f1d1d]" style={{ width: `${evilP}%` }}></div></div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-center opacity-70 py-4">
                            ※ 歴史記録に詳細スコアが含まれていません
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="mt-8 pt-4 border-t-4 border-black flex justify-between items-center relative z-10">
                <div className="text-xs font-bold opacity-70">
                    世界観測局 発行
                </div>
                <div className="flex gap-4">
                    <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-black text-[#e3d5b8] px-4 py-2 hover:bg-[#2c241b] transition-colors text-sm font-bold"
                    >
                        <Share className="w-4 h-4" />
                        Xで共有
                    </a>
                    {isModal && (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 border-2 border-black px-4 py-2 hover:bg-black hover:text-[#e3d5b8] transition-colors text-sm font-bold"
                        >
                            <CloseIcon className="w-4 h-4" />
                            閉じる
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (!isModal) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="animate-in zoom-in-50 duration-500 w-full max-w-2xl">
                {content}
            </div>
        </div>
    );
}
