'use client';

import React, { useState, useEffect } from 'react';
import { User, Coins, Heart, Star, AlertTriangle, Trophy, Settings } from 'lucide-react';
import { WorldState, UserProfile } from '@/types/game';
import HegemonyModal from '@/components/world/HegemonyModal';

interface InnHeaderProps {
    worldState: WorldState | null;
    userProfile: UserProfile | null;
    reputation?: { rank: string; score: number } | null;
    onOpenSettings?: () => void;
    onOpenStatus?: () => void;
    equipBonus?: { atk: number; def: number; hp: number };
}

export default function InnHeader({ worldState, userProfile, reputation, onOpenSettings, onOpenStatus, equipBonus }: InnHeaderProps) {
    const [vitalityPulse, setVitalityPulse] = useState(true);
    const [showHegemony, setShowHegemony] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setVitalityPulse(prev => !prev);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const totalDays = userProfile?.accumulated_days || 0;
    const year = 742 + Math.floor(totalDays / 365);
    const month = 1 + Math.floor((totalDays % 365) / 30);
    const day = 1 + (totalDays % 30);

    const isLowVit = (userProfile?.vitality ?? 100) <= 20;

    const effectiveMaxHp = (userProfile?.max_hp || 1) + (equipBonus?.hp || 0);
    const hpPercent = Math.max(0, Math.min(100, ((userProfile?.hp || 0) / effectiveMaxHp) * 100));
    const vitalityPercent = Math.max(0, Math.min(100, ((userProfile?.vitality ?? 0) / (userProfile?.max_vitality || 100)) * 100));
    const isLowVitBar = isLowVit;

    const getExpiringPasses = () => {
        if (!userProfile?.pass_expires_at) return [];
        const expiring: string[] = [];
        const currentDays = userProfile.accumulated_days || 0;
        
        for (const [locSlug, expiryDay] of Object.entries(userProfile.pass_expires_at)) {
            const daysLeft = expiryDay - currentDays;
            if (daysLeft > 0 && daysLeft <= 30) {
                let name = locSlug;
                if (locSlug === 'Roland') name = 'ローランド';
                if (locSlug === 'Karyu') name = '華龍神朝';
                if (locSlug === 'Yato') name = '夜刀神国';
                if (locSlug === 'Markand') name = 'マーカンド';
                expiring.push(name);
            }
        }
        return expiring;
    };

    const expiringPasses = getExpiringPasses();

    return (
        <>
        <header className="sticky top-0 z-50 w-full bg-[#0d1b3e]/95 backdrop-blur-md border-b border-amber-400/20 shadow-[0_4px_20px_rgba(13,27,62,0.8)] select-none">
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

            {/* 暦 + 世界の覇権 + 設定ボタン */}
            <div className="flex items-center gap-2 px-1 mb-3">
                <div className="flex items-center gap-2 bg-[#0a1628]/60 px-3 py-1.5 rounded border border-[#2a4080]/30 shrink-0">
                    <span className="text-[10px] text-amber-400 font-bold tracking-wider">世界暦</span>
                    <span className="text-[11px] font-serif tracking-wider text-blue-100/80">
                        {year}年 {month}月 {day}日
                    </span>
                </div>
                <button
                    onClick={() => setShowHegemony(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0a1628]/60 px-3 py-1.5 rounded border border-[#2a4080]/30 text-[10px] text-amber-400 font-bold hover:text-amber-300 transition-colors active:scale-95"
                >
                    <Trophy size={12} className="text-amber-400" />
                    世界の覇権
                </button>
                {onOpenSettings && (
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 bg-[#0a1628]/60 rounded border border-[#2a4080]/30 text-blue-200/50 hover:text-amber-400 transition-colors active:scale-90 shrink-0"
                        aria-label="設定"
                    >
                        <Settings size={14} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 mb-2">
                <button onClick={onOpenStatus} className="relative flex-shrink-0 active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-full border-2 border-amber-400 overflow-hidden bg-[#0a1628] shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                        {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-400"><User size={32} /></div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-[#0a1628] text-[8px] font-black px-1 rounded-sm border border-[#0a1628]">
                        Lv.{userProfile?.level || 1}
                    </div>
                </button>

                <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-amber-400 font-bold tracking-widest uppercase truncate">
                        {userProfile?.title_name || '駆け出しの傭兵'}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-sm font-black text-slate-50 truncate">
                            {userProfile?.name || '名もなき旅人'}
                        </h1>
                        <span className="text-[10px] text-blue-200/60 font-mono italic">
                            Age: {Math.floor((userProfile?.age || 15) + ((userProfile?.accumulated_days || 0) / 365))}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                    <div className="w-full space-y-1">
                        {/* HPバー */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] text-emerald-400 font-bold w-5">HP</span>
                            <div className="flex-1 h-1.5 bg-[#0a1628] rounded-full overflow-hidden border border-[#2a4080]/40">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
                            </div>
                        </div>
                        {/* Vitalityバー（≤20で赤点滅） */}
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-bold w-5 transition-colors duration-300 ${isLowVitBar ? (vitalityPulse ? 'text-red-400' : 'text-red-900') : 'text-pink-300'}`}>VIT</span>
                            <div className="flex-1 h-1.5 bg-[#0a1628] rounded-full overflow-hidden border border-[#2a4080]/40">
                                <div
                                    className={`h-full transition-all duration-300 ${isLowVitBar ? (vitalityPulse ? 'bg-red-500' : 'bg-red-900') : 'bg-pink-400'}`}
                                    style={{ width: `${vitalityPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ゴールド + 名声 横並び */}
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                            <Coins size={10} className="text-amber-400" />
                            <span className="text-[10px] font-bold font-mono text-amber-100">{userProfile?.gold || 0} G</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-[9px] font-black text-amber-400 tracking-widest">
                                名声: {reputation?.score || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            </div>
        </header>

        {/* HegemonyModal */}
        {showHegemony && (
            <HegemonyModal worldState={worldState} onClose={() => setShowHegemony(false)} />
        )}
        </>
    );
}
