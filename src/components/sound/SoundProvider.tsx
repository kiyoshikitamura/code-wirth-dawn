/**
 * SoundProvider — サウンドシステム初期化コンポーネント
 *
 * layout.tsx に配置し、以下を担当:
 * 1. 初回ユーザー操作で AudioContext を resume (Autoplay Policy 対応)
 * 2. soundStore の volume 設定を SoundManager に反映
 */

'use client';

import { useEffect } from 'react';
import { soundManager } from '@/lib/soundManager';
import { useSoundStore } from '@/store/soundStore';

export default function SoundProvider() {
    const bgmVolume = useSoundStore((s) => s.bgmVolume);
    const seVolume = useSoundStore((s) => s.seVolume);

    // 初期化: localStorage から復元された volume を SoundManager に反映
    useEffect(() => {
        if (!soundManager) return;

        soundManager.init();
        soundManager.setBgmVolume(bgmVolume);
        soundManager.setSeVolume(seVolume);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // volume 変更の即時反映
    useEffect(() => {
        soundManager?.setBgmVolume(bgmVolume);
    }, [bgmVolume]);

    useEffect(() => {
        soundManager?.setSeVolume(seVolume);
    }, [seVolume]);

    // Autoplay Policy 解除: 初回のユーザー操作で AudioContext.resume()
    useEffect(() => {
        if (!soundManager) return;
        const sm = soundManager; // null narrowing for callback scope

        const handleInteraction = () => {
            sm.init();
            sm.resume();
            // 一度だけ実行
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction, { once: false, passive: true });
        window.addEventListener('touchstart', handleInteraction, { once: false, passive: true });
        window.addEventListener('keydown', handleInteraction, { once: false, passive: true });

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    // このコンポーネントはUIを描画しない
    return null;
}
