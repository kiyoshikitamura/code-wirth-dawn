'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SimpleUserProfilePopupProps {
    isOpen: boolean;
    onClose: () => void;
    avatarUrl?: string;
    name: string;
    epithet?: string;
    introduction?: string;
    level?: number;
    age?: number;
}

export default function SimpleUserProfilePopup({
    isOpen,
    onClose,
    avatarUrl,
    name,
    epithet,
    introduction,
    level,
    age,
}: SimpleUserProfilePopupProps) {
    if (!isOpen) return null;

    const displayAvatar = avatarUrl || '/avatars/adventurer.jpg';
    const displayName = epithet ? `${epithet} ${name}` : name;
    const displayIntro = introduction || '自己紹介は設定されていません。';

    return (
        <div 
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-[#1a120b] border-2 border-[#a38b6b] w-full max-w-xs shadow-2xl relative p-5 font-sans rounded text-center animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 閉じるボタン */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex flex-col items-center mt-2 space-y-3">
                    {/* アイコン */}
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#a38b6b]/50 bg-gray-800 shadow-md">
                        <img
                            src={displayAvatar}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // フォールバック画像
                                (e.target as HTMLImageElement).src = '/avatars/adventurer.jpg';
                            }}
                        />
                    </div>

                    {/* 名前 */}
                    <div className="space-y-0.5">
                        {epithet && (
                            <p className="text-[10px] text-[#a38b6b] font-bold tracking-wide uppercase">
                                {epithet}
                            </p>
                        )}
                        <h4 className="text-[#e3d5b8] text-base font-serif font-black tracking-wide">
                            {name}
                        </h4>
                    </div>

                    {/* レベル・年齢 */}
                    {(level !== undefined || age !== undefined) && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#e3d5b8]/70 bg-[#0d0906]/40 border border-[#a38b6b]/10 px-2.5 py-0.5 rounded">
                            {level !== undefined && (
                                <span>Lv.{level}</span>
                            )}
                            {level !== undefined && age !== undefined && (
                                <span className="text-[#a38b6b]/30">|</span>
                            )}
                            {age !== undefined && (
                                <span>{age}歳</span>
                            )}
                        </div>
                    )}

                    {/* 装飾の区切り線 */}
                    <div className="w-12 h-[1px] bg-[#a38b6b]/30 my-1" />

                    {/* 自己紹介 */}
                    <div className="bg-[#0d0906] border border-[#a38b6b]/20 rounded p-3 w-full min-h-[50px] flex items-center justify-center">
                        <p className="text-[#e3d5b8]/90 text-xs font-serif leading-relaxed italic break-all">
                            「{displayIntro}」
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
