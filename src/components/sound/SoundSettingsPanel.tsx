/**
 * SoundSettingsPanel — BGM/SE ボリュームスライダー
 */

'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSoundStore } from '@/store/soundStore';
import { soundManager } from '@/lib/soundManager';

export default function SoundSettingsPanel() {
    const { bgmVolume, seVolume, setBgmVolume, setSeVolume } = useSoundStore();

    const handleSePreview = () => {
        soundManager?.playSE('se_click');
    };

    return (
        <div className="space-y-4">
            {/* BGM Volume */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[#a38b6b] text-sm font-bold flex items-center gap-2">
                        {bgmVolume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        BGM
                    </label>
                    <span className="text-xs text-gray-400 font-mono w-10 text-right">
                        {bgmVolume === 0 ? 'OFF' : `${Math.round(bgmVolume * 100)}%`}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(bgmVolume * 100)}
                    onChange={(e) => setBgmVolume(parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
            </div>

            {/* SE Volume */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[#a38b6b] text-sm font-bold flex items-center gap-2">
                        {seVolume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        SE（効果音）
                    </label>
                    <span className="text-xs text-gray-400 font-mono w-10 text-right">
                        {seVolume === 0 ? 'OFF' : `${Math.round(seVolume * 100)}%`}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(seVolume * 100)}
                    onChange={(e) => setSeVolume(parseInt(e.target.value) / 100)}
                    onMouseUp={handleSePreview}
                    onTouchEnd={handleSePreview}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
            </div>
        </div>
    );
}
