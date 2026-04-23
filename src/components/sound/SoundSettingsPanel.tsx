/**
 * SoundSettingsPanel — BGM/SE ON/OFFトグル
 */

'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSoundStore } from '@/store/soundStore';

export default function SoundSettingsPanel() {
    const { bgmEnabled, seEnabled, toggleBgm, toggleSe } = useSoundStore();

    return (
        <div className="space-y-3">
            {/* BGM Toggle */}
            <div className="flex items-center justify-between">
                <label className="text-[#a38b6b] text-sm font-bold flex items-center gap-2">
                    {bgmEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                    BGM
                </label>
                <button
                    onClick={toggleBgm}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        bgmEnabled ? 'bg-amber-600' : 'bg-gray-700'
                    }`}
                    aria-label="BGM切り替え"
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                            bgmEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>

            {/* SE Toggle */}
            <div className="flex items-center justify-between">
                <label className="text-[#a38b6b] text-sm font-bold flex items-center gap-2">
                    {seEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                    SE（効果音）
                </label>
                <button
                    onClick={toggleSe}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        seEnabled ? 'bg-amber-600' : 'bg-gray-700'
                    }`}
                    aria-label="SE切り替え"
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                            seEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}
