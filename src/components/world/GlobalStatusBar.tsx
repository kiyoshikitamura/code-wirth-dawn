'use client';

import React from 'react';
import { Calendar, Trophy, Settings, Coins, Heart, LogIn, Home, User as UserIcon, Shield } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

import HegemonyModal from './HegemonyModal';
import AccountSettingsModal from '../inn/AccountSettingsModal';
import StatusModal from '../inn/StatusModal';

interface Props {
    currentLocationName: string;
    onEnterLocation: () => void;
    onReturnHome: () => void;
}

export default function GlobalStatusBar({ currentLocationName, onEnterLocation, onReturnHome }: Props) {
    const { userProfile, worldState, gold, showStatus, setShowStatus, equipBonus } = useGameStore();
    const [showHegemony, setShowHegemony] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);

    // Calendar & Age Computation
    const totalDays = userProfile?.accumulated_days || 0;
    const year = 742 + Math.floor(totalDays / 365);
    const month = 1 + Math.floor((totalDays % 365) / 30);
    const day = 1 + (totalDays % 30);
    const calendarString = `${year}年 ${month}月 ${day}日`;

    const hegemony = worldState?.hegemony || [
        { name: "ローランド", power: 25, color: "bg-blue-600" },
        { name: "マーカンド", power: 25, color: "bg-emerald-600" },
        { name: "華龍神朝", power: 25, color: "bg-red-600" },
        { name: "夜刀神国", power: 25, color: "bg-purple-700" }
    ];

    const maxVitality = userProfile?.max_vitality || 100;
    const currentVitality = userProfile?.vitality ?? maxVitality;
    const hpPercent = Math.max(0, Math.min(100, ((userProfile?.hp || 0) / ((userProfile?.max_hp || 1) + (equipBonus?.hp || 0))) * 100));

    return (
        <header className="relative shrink-0 w-full z-50 bg-slate-950 p-4 pt-6 border-b border-amber-900/30 shadow-lg">
            {showHegemony && <HegemonyModal worldState={worldState} onClose={() => setShowHegemony(false)} />}
            {showSettings && <AccountSettingsModal onClose={() => setShowSettings(false)} />}
            {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}

            {/* 覇権・暦 */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-slate-800">
                    <Calendar size={12} className="text-amber-500" />
                    <span className="text-[9px] font-serif tracking-wider text-amber-100/70">{calendarString}</span>
                </div>
                <button onClick={() => setShowHegemony(true)} className="flex-1 mx-3 px-2 py-1 bg-black/40 rounded border border-slate-800 cursor-pointer hover:bg-black/60 transition-colors group">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] uppercase text-slate-500 font-bold flex items-center gap-1 group-hover:text-amber-500 transition-colors">
                            <Trophy size={10} className="text-amber-600" /> 世界の覇権
                        </span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
                        {hegemony.map((n, idx) => (
                            <div key={idx} className={`h-full ${n.color}`} style={{ width: `${n.power}%` }} />
                        ))}
                    </div>
                </button>
                <button onClick={() => setShowSettings(true)} className="p-1.5 text-slate-400 group relative">
                    <Settings size={16} className="group-hover:text-amber-500 transition-colors" />
                </button>
            </div>

            {/* プロフィール */}
            <div className="flex items-center gap-3 mb-3">
                {/* ユーザーアイコン — 丸枠 + タップでステータスモーダル */}
                <button onClick={() => setShowStatus(true)} className="relative active:scale-90 transition-transform">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-slate-800 overflow-hidden shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                        <div className="w-full h-full flex items-center justify-center text-amber-500 bg-slate-900">
                            {userProfile?.avatar_url ? (
                                <img src={userProfile.avatar_url} alt="You" className="object-cover w-full h-full" />
                            ) : (
                                <UserIcon size={24} />
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-600 text-slate-950 text-[8px] font-black px-1 rounded-sm border border-slate-900">
                        Lv.{userProfile?.level || 1}
                    </div>
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-amber-500 font-bold uppercase truncate">{userProfile?.title_name || "冒険者"}</p>
                    <h1 className="text-sm font-black text-slate-100 truncate">{userProfile?.name || "Player"}</h1>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 bg-black/50 px-2 py-0.5 rounded border border-amber-900/30">
                        <Coins size={10} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-100">{gold.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* HP表示 */}
                        <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-green-900/30">
                            <Shield size={10} className="text-green-500" />
                            <span className="text-[10px] font-bold text-green-100">{userProfile?.hp || 0}/{(userProfile?.max_hp || 0) + (equipBonus?.hp || 0)}</span>
                        </div>
                        {/* Vitality表示 */}
                        <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-red-900/30">
                            <Heart size={10} className="text-red-500" />
                            <span className="text-[10px] font-bold text-red-100">{currentVitality}/{maxVitality}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* クイックアクション */}
            <div className="flex gap-2">
                <button
                    onClick={onEnterLocation}
                    className="flex-1 h-9 bg-amber-900/30 border border-amber-600/50 rounded flex items-center justify-center gap-2 group transition-all active:scale-[0.98] hover:bg-amber-800/40"
                >
                    <LogIn size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-100">{currentLocationName} に入る</span>
                </button>
                <button
                    onClick={onReturnHome}
                    className="flex-1 h-9 bg-slate-800/40 border border-slate-600/50 rounded flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-slate-700/50"
                >
                    <Home size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-300">名もなき旅人の拠所へ</span>
                </button>
            </div>
        </header>
    );
}
