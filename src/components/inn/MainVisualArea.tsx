import React from 'react';
import { BookOpen, MapPin, Compass } from 'lucide-react';
import { WorldState } from '@/types/game';

interface MainVisualAreaProps {
    worldState: WorldState | null;
    locationSlug?: string;
    onOpenHistory: () => void;
    onOpenMap?: () => void;
    showHistoryBadge?: boolean;
}

export default function MainVisualArea({ worldState, locationSlug, onOpenHistory, onOpenMap, showHistoryBadge }: MainVisualAreaProps) {
    const prosperity = worldState?.prosperity_level || 3;
    const locationName = worldState?.location_name || '未知の土地';
    const controllingNation = worldState?.controlling_nation || 'Neutral';

    let stateSuffix = "normal";
    let prosperityLabel = '停滞';
    let prosperityBadgeClass = 'bg-slate-800/70 text-slate-200 border-slate-600/50';
    let vignette = 'from-transparent via-transparent to-slate-950/80';
    let topGlow = '';

    if (prosperity >= 5) {
        stateSuffix = "prosperous";
        prosperityLabel = '絶頂';
        prosperityBadgeClass = 'bg-amber-500/20 text-amber-200 border-amber-400/40';
        vignette = 'from-amber-900/10 via-transparent to-slate-950/80';
        topGlow = 'shadow-[inset_0_0_60px_rgba(251,191,36,0.15)]';
    } else if (prosperity >= 4) {
        stateSuffix = "prosperous";
        prosperityLabel = '繁栄';
        prosperityBadgeClass = 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40';
        vignette = 'from-emerald-900/5 via-transparent to-slate-950/80';
    } else if (prosperity <= 1) {
        stateSuffix = "ruined";
        prosperityLabel = '崩壊';
        prosperityBadgeClass = 'bg-red-900/40 text-red-300 border-red-500/40';
        vignette = 'from-red-950/20 via-transparent to-slate-950/90';
        topGlow = 'shadow-[inset_0_0_60px_rgba(127,29,29,0.3)]';
    } else if (prosperity <= 2) {
        stateSuffix = "ruined";
        prosperityLabel = '衰退';
        prosperityBadgeClass = 'bg-orange-900/30 text-orange-300 border-orange-500/40';
        vignette = 'from-orange-950/10 via-transparent to-slate-950/85';
    }

    const bgImageUrl = locationSlug ? `/backgrounds/locations/${locationSlug}_${stateSuffix}.png` : null;

    const flavorText = (() => {
        if (!worldState || locationName === '未知の土地') return '';
        if (controllingNation === 'Neutral') return 'この地は誰の支配も受けていない。';

        const getNationName = (nation: string) => {
            switch (nation) {
                case 'Roland': return 'ローランド聖王国';
                case 'Karyu': return '華龍神朝';
                case 'Yato': return '夜刀神国';
                case 'Markand': return '商業都市マーカンド';
                case 'Neutral': return '中立地帯';
                default: return nation;
            }
        };
        const jpNation = getNationName(controllingNation);

        let score = 0;
        if (controllingNation === 'Roland') score = worldState.order_score || 0;
        else if (controllingNation === 'Markand') score = worldState.chaos_score || 0;
        else if (controllingNation === 'Yato') score = worldState.justice_score || 0;
        else if (controllingNation === 'Karyu') score = worldState.evil_score || 0;

        if (score >= 60) return `住民は${jpNation}の統治を歓迎している。活気がある。`;
        if (score <= 40) return `住民は${jpNation}の支配に怯えている…`;
        return `街はこの国の支配にまだ馴染んでいないようだ。`;
    })();

    return (
        <div className={`relative h-[40vh] min-h-[200px] max-h-[320px] bg-[#0a1628] overflow-hidden shrink-0 ${topGlow}`}>
            {/* Background Image */}
            {bgImageUrl ? (
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
                    style={{ backgroundImage: `url('${bgImageUrl}')` }}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-800 opacity-20 scale-[2.5]">
                    <MapPin size={180} />
                </div>
            )}

            {/* Vignette / Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b ${vignette} pointer-events-none`} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

            {/* Top-right action buttons */}
            <div className="absolute top-4 right-4 flex gap-2.5 z-10">
                <button
                    onClick={onOpenHistory}
                    className="relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-amber-600/40 shadow-lg flex items-center justify-center text-amber-500 hover:bg-amber-900/60 hover:text-amber-300 transition-colors active:scale-95 focus:outline-none"
                >
                    <BookOpen size={18} />
                    {showHistoryBadge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white font-black animate-bounce shadow-lg border-2 border-slate-950">
                            !
                        </span>
                    )}
                </button>
                {onOpenMap && (
                    <button
                        onClick={onOpenMap}
                        className="relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-emerald-600/40 shadow-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-200 transition-colors active:scale-95 focus:outline-none"
                    >
                        <Compass size={18} />
                    </button>
                )}
            </div>

            {/* Bottom overlay: Location name + prosperity + flavor */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-5">
                <div className="flex items-end justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide font-serif">
                            {locationName}
                        </h2>
                        {flavorText && (
                            <p className="mt-1 text-[10px] text-slate-300/80 italic drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] leading-relaxed line-clamp-2">
                                「{flavorText}」
                            </p>
                        )}
                    </div>
                    <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border backdrop-blur-sm text-xs font-black tracking-wider ${prosperityBadgeClass}`}>
                        {prosperityLabel}
                    </div>
                </div>
            </div>
        </div>
    );
}
