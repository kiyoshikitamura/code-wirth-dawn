/**
 * soundStore — BGM/SE ON/OFF 設定の状態管理
 * Zustand + localStorage persist でリロード後も設定保持
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { soundManager } from '@/lib/soundManager';

interface SoundState {
    bgmEnabled: boolean;
    seEnabled: boolean;
    toggleBgm: () => void;
    toggleSe: () => void;
}

export const useSoundStore = create<SoundState>()(
    persist(
        (set, get) => ({
            bgmEnabled: true,
            seEnabled: true,

            toggleBgm: () => {
                const next = !get().bgmEnabled;
                soundManager?.setBgmEnabled(next);
                set({ bgmEnabled: next });
            },

            toggleSe: () => {
                const next = !get().seEnabled;
                soundManager?.setSeEnabled(next);
                set({ seEnabled: next });
            },
        }),
        {
            name: 'wirth-dawn-sound-settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
