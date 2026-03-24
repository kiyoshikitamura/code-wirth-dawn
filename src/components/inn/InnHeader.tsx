'use client';

import React, { useState, useEffect } from 'react';
import { User, Calendar, Coins, Heart, Star, MapPin, AlertTriangle } from 'lucide-react';
import { WorldState, UserProfile } from '@/types/game';

interface InnHeaderProps {
    worldState: WorldState | null;
    userProfile: UserProfile | null;
}

export default function InnHeader({ worldState, userProfile }: InnHeaderProps) {
    const [vitalityPulse, setVitalityPulse] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVitalityPulse(prev => !prev);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const totalDays = userProfile?.accumulated_days || 0;
    const year = 742 + Math.floor(totalDays / 365); // Base year + elapsed
    const month = 1 + Math.floor((totalDays % 365) / 30);
    const day = 1 + (totalDays % 30);

    const isLowVit = (userProfile?.vitality ?? 100) <= 20;
    const currentLocName = worldState?.location_name || "未知の土地";
    const controllingNation = worldState?.controlling_nation || "Neutral";
    const prosperity = worldState?.prosperity_level || 3;

    // HP Bar calculation
    const hpPercent = Math.max(0, Math.min(100, ((userProfile?.hp || 0) / (userProfile?.max_hp || 1)) * 100));

    // Experience/AP Bar proxy (Using a static example or if AP exists)
    // Here we just use a static blue bar for now, as we only have HP in userProfile
    const apPercent = 40;

    const getStatusText = () => {
        if (prosperity === 5) return '繁栄';
        if (prosperity >= 4) return '発展';
        if (prosperity === 3) return '通常';
        if (prosperity <= 1) return '崩壊';
        return '衰退';
    };

    const getFlavorText = () => {
        if (!worldState) return '';
        if (currentLocName === '未知の土地') return '';

        const nation = worldState.controlling_nation;
        if (nation === 'Neutral') return 'この地は誰の支配も受けていない。';

        let score = 0;
        if (nation === 'Roland') score = worldState.order_score || 0;
        else if (nation === 'Markand') score = worldState.chaos_score || 0;
        else if (nation === 'Yato') score = worldState.justice_score || 0;
        else if (nation === 'Karyu') score = worldState.evil_score || 0;

        if (score >= 60) return `「住民は${nation}の統治を歓迎しているようだ。活気がある。」`;
        if (score <= 40) return `「住民は${nation}の支配に怯えている... 緊張感が漂っている。」`;
        return `「街はこの国の支配にまだ馴染んでいないようだ。」`;
    };

    // Check expiring passes (less than 30 days left)
    const getExpiringPasses = () => {
        if (!userProfile?.pass_expires_at) return [];
        const expiring: string[] = [];
        const currentDays = userProfile.accumulated_days || 0;
        
        for (const [locSlug, expiryDay] of Object.entries(userProfile.pass_expires_at)) {
            const daysLeft = expiryDay - currentDays;
            if (daysLeft > 0 && daysLeft <= 30) {
                let name = locSlug;
                if (locSlug === 'loc_roland') name = '聖帝国ローラン';
                if (locSlug === 'loc_karyu') name = '華龍神朝';
                if (locSlug === 'loc_yato') name = '夜刀神国';
                if (locSlug === 'loc_markand') name = '砂塵王国マルカンド';
                expiring.push(name);
            }
        }
        return expiring;
    };

    const expiringPasses = getExpiringPasses();

    return (
        <header className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-md border-b border-amber-900/50 shadow-2xl select-none">
            {expiringPasses.length > 0 && (
                <div className="mx-4 my-2 px-4 py-3 bg-orange-950/40 border border-orange-500/50 rounded-lg shadow-lg flex items-center justify-between animate-[pulse_3s_ease-in-out_infinite]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-900/50 rounded-full">
                            <AlertTriangle className="text-orange-400" size={20} />
                        </div>
                        <div>
                            <div className="text-orange-100 font-bold text-sm">通行許可証の期限が迫っています</div>
                            <div className="text-orange-400 text-xs mt-0.5">
                                {expiringPasses.join('、')} の許可証が残り30日未満です。
                            </div>
                        </div>
                    </div>
                    <button className="text-xs bg-orange-900 hover:bg-orange-800 text-orange-200 px-3 py-1.5 rounded transition-colors whitespace-nowrap border border-orange-700">
                        更新する
                    </button>
                </div>
            )}
            
            <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full border-2 border-amber-500 overflow-hidden bg-slate-800 shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                        {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500"><User size={32} /></div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-600 text-slate-950 text-[8px] font-black px-1 rounded-sm border border-slate-900">
                        Lv.{userProfile?.level || 1}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-amber-500 font-bold tracking-widest uppercase truncate">
                        {userProfile?.title_name || '駆け出しの傭兵'}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-sm font-black text-slate-100 truncate">
                            {userProfile?.name || '名もなき旅人'}
                        </h1>
                        <span className="text-[10px] text-slate-500 font-mono italic">
                            Age: {Math.floor((userProfile?.age || 15) + ((userProfile?.accumulated_days || 0) / 365))}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                    <div className="w-full space-y-0.5">
                        {/* HP Bar */}
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div className="h-full bg-green-600 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
                        </div>
                        {/* AP/MP Bar */}
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${apPercent}%` }} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                            <Coins size={10} className="text-amber-500" />
                            <span className="text-[10px] font-bold font-mono text-amber-100">{userProfile?.gold || 0} G</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Heart size={10} className={`${(!isLowVit || vitalityPulse) ? 'text-red-500' : 'text-red-900'} transition-colors duration-300`} />
                            <span className={`text-[10px] font-bold font-mono ${(!isLowVit || vitalityPulse) ? 'text-red-100' : 'text-red-900'} transition-colors duration-300`}>
                                {userProfile?.vitality ?? (userProfile?.max_hp || 100)}/{userProfile?.max_vitality ?? (userProfile?.max_hp || 100)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-amber-500 fill-amber-500" />
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                            名声: 0
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-slate-800">
                    <Calendar size={12} className="text-amber-500" />
                    <span className="text-[9px] font-serif tracking-wider text-amber-100/70">
                        {year}年 {month}月 {day}日
                    </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[8px] uppercase text-slate-500 font-bold w-full text-right">世界の覇権</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-serif font-bold text-amber-100">{currentLocName}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border ${prosperity <= 2 ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'}`}>
                            {getStatusText()}
                        </span>
                    </div>
                </div>
            </div>

            {getFlavorText() && (
                <p className="px-1 text-[9px] text-slate-500 italic leading-relaxed">
                    {getFlavorText()}
                </p>
            )}
            </div>
        </header>
    );
}
