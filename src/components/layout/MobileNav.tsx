'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Beer, ShoppingBag, Shield, Map as MapIcon, Compass } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export default function MobileNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { setShowStatus } = useGameStore();

    const navItems = [
        { label: '宿屋', path: '/inn', icon: <Home className="w-5 h-5" /> },
        { label: '酒場', path: '/pub', icon: <Beer className="w-5 h-5" /> },
        { label: '商店', path: '/shop', icon: <ShoppingBag className="w-5 h-5" /> },
        { label: '状況', path: '/status', icon: <Shield className="w-5 h-5" /> },
        { label: '地図', path: '/world-map', icon: <Compass className="w-5 h-5" /> },
    ];

    const handleClick = (item: any) => {
        if (item.path === '/status') {
            setShowStatus(true);
        } else {
            router.push(item.path);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a] border-t border-[#a38b6b]/30 pb-safe-area md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center h-16 px-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => handleClick(item)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform
                                ${isActive ? 'text-[#e3d5b8]' : 'text-gray-500'}
                            `}
                        >
                            <div className={`p-1.5 rounded-full ${isActive ? 'bg-[#a38b6b]/20' : ''}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] font-bold ${isActive ? 'text-[#a38b6b]' : 'text-gray-600'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
