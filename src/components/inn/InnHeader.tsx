
import React from 'react';
import { useRouter } from 'next/navigation';
import { Map, ShieldCheck } from 'lucide-react';
import { WorldState, UserProfile } from '@/types/game';

interface InnHeaderProps {
    worldState: WorldState | null;
    userProfile: UserProfile | null;
    reputation: { rank: string; score: number } | null;
}

export default function InnHeader({ worldState, userProfile, reputation }: InnHeaderProps) {
    const router = useRouter();

    // Helper for Theme
    const getThemeColors = () => {
        const nation = worldState?.controlling_nation || 'Neutral';
        switch (nation) {
            case 'Roland': return { border: 'border-blue-700/50', text: 'text-blue-100', accent: 'text-blue-500', bg: 'bg-blue-950/40' };
            case 'Markand': return { border: 'border-yellow-700/50', text: 'text-yellow-100', accent: 'text-yellow-500', bg: 'bg-yellow-950/40' };
            case 'Karyu': return { border: 'border-emerald-700/50', text: 'text-emerald-100', accent: 'text-emerald-500', bg: 'bg-emerald-950/40' };
            case 'Yato': return { border: 'border-purple-700/50', text: 'text-purple-100', accent: 'text-purple-500', bg: 'bg-purple-950/40' };
            default: return { border: 'border-gold-700/50', text: 'text-gold-100', accent: 'text-gold-500', bg: 'bg-black/40' };
        }
    };
    const theme = getThemeColors();

    const getGovernanceText = () => {
        if (!worldState) return '';
        if (worldState.location_name === '名もなき旅人の拠所') return '';

        const nation = worldState.controlling_nation;
        if (nation === 'Neutral') return 'この地は誰の支配も受けていない。';

        let score = 0;
        if (nation === 'Roland') score = worldState.order_score;
        else if (nation === 'Markand') score = worldState.chaos_score;
        else if (nation === 'Yato') score = worldState.justice_score;
        else if (nation === 'Karyu') score = worldState.evil_score;

        if (score >= 60) return `住民は${nation}の統治を歓迎しているようだ。活気がある。`;
        if (score <= 40) return `住民は${nation}の支配に怯えている... 緊張感が漂っている。`;
        return `街はこの国の支配にまだ馴染んでいないようだ。`;
    };

    return (
        <header className={`max-w-4xl mx-auto py-4 md:py-6 border-b ${theme.border} mb-4 md:mb-8`}>
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className={`text-2xl font-serif ${theme.accent} font-bold tracking-wider flex items-center gap-2`}>
                        <Map className="w-8 h-8" />
                        {worldState?.location_name || '冒険者の宿屋'}
                    </h1>
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Rest & Supply @ {worldState?.controlling_nation || 'Neutral'} Territory</span>
                        {getGovernanceText() && (
                            <span className="text-xs text-orange-300/80 mt-1 italic font-serif">
                                {getGovernanceText()}
                            </span>
                        )}
                        <span className="text-xs text-[#a38b6b] mt-0.5 font-sans">
                            世界暦 {100 + Math.floor((worldState?.total_days_passed || 0) / 365)}年 {1 + Math.floor(((worldState?.total_days_passed || 0) % 365) / 30)}月 {1 + ((worldState?.total_days_passed || 0) % 365) % 30}日
                        </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => router.push('/world-map')}
                            className={`text-xs bg-[#4a3b2b] border ${theme.border} ${theme.text} px-3 py-1.5 rounded hover:bg-white/10 hover:text-white flex items-center gap-2 w-fit transition-all uppercase tracking-wider font-bold`}
                        >
                            <Map className="w-3 h-3" /> World Map
                        </button>
                    </div>
                </div>

                <div className="bg-black/50 px-4 py-2 rounded border border-gold-600/50 text-gold-400 font-mono text-right flex flex-col gap-2">
                    <div className="flex items-center justify-end gap-2">
                        {userProfile?.avatar_url && (
                            <img src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-gold-500/50 object-cover" />
                        )}
                        <div className="text-right">
                            <div className="font-bold text-gray-200 text-sm">
                                {userProfile?.name || userProfile?.title_name || '名もなき旅人'}
                            </div>
                            <div className={`text-[10px] ${reputation?.rank === 'Hero' ? 'text-amber-400' : 'text-gray-400'}`}>
                                &lt;{userProfile?.title_name}&gt; / 名声: {reputation?.rank || 'Stranger'}
                            </div>
                            <div className="text-[10px] text-gray-300 font-sans mt-0.5 flex gap-2 justify-end">
                                <span>Age:{userProfile?.age}</span>
                                <span className="text-blue-300">Lv.{userProfile?.level ?? 1}</span>
                                <span className="text-green-300">HP:{userProfile?.hp}/{userProfile?.max_hp}</span>
                                <span className={userProfile?.vitality && userProfile.vitality < 40 ? 'text-red-400' : 'text-gray-300'}>Vit:{userProfile?.vitality ?? 100}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Header (Compact) */}
            <div className="flex md:hidden items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    {userProfile?.avatar_url && (
                        <img src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-gold-500/50 object-cover" />
                    )}
                    <div>
                        <h1 className={`text-lg font-serif ${theme.accent} font-bold tracking-wider leading-tight`}>
                            {worldState?.location_name || '宿屋'}
                        </h1>
                        <div className="text-[10px] text-gray-400 mt-1">
                            <div className="text-xs text-amber-200/80 italic mt-0.5 leading-snug">
                                <span className="font-bold not-italic text-amber-500 mr-1">[{worldState?.controlling_nation || '中立'}]</span>
                                {worldState?.flavor_text || '...'}
                            </div>
                            <div>
                                世界暦 {100 + Math.floor((worldState?.total_days_passed || 0) / 365)}年...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
