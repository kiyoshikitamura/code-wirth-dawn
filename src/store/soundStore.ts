/**
 * soundStore — BGM/SE ボリューム設定の状態管理
 * Zustand + localStorage persist でリロード後も設定保持
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { soundManager } from '@/lib/soundManager';

interface SoundState {
    bgmVolume: number;   // 0.0 ~ 1.0 (0 = OFF)
    seVolume: number;    // 0.0 ~ 1.0 (0 = OFF)
    setBgmVolume: (vol: number) => void;
    setSeVolume: (vol: number) => void;
}

export const useSoundStore = create<SoundState>()(
    persist(
        (set) => ({
            bgmVolume: 0.7,
            seVolume: 0.8,

            setBgmVolume: (vol: number) => {
                const clamped = Math.max(0, Math.min(1, vol));
                soundManager?.setBgmVolume(clamped);
                set({ bgmVolume: clamped });
            },

            setSeVolume: (vol: number) => {
                const clamped = Math.max(0, Math.min(1, vol));
                soundManager?.setSeVolume(clamped);
                set({ seVolume: clamped });
            },
        }),
        {
            name: 'wirth-dawn-sound-settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
