/**
 * SoundProvider — サウンドシステム初期化コンポーネント
 *
 * layout.tsx に配置し、以下を担当:
 * 1. 初回ユーザー操作で AudioContext を resume (Autoplay Policy 対応)
 * 2. soundStore の ON/OFF 設定を SoundManager に反映
 */

'use client';

import { useEffect } from 'react';
import { soundManager } from '@/lib/soundManager';
import { useSoundStore } from '@/store/soundStore';

export default function SoundProvider() {
    const bgmEnabled = useSoundStore((s) => s.bgmEnabled);
    const seEnabled = useSoundStore((s) => s.seEnabled);

    // 初期化: localStorage から復元された ON/OFF を SoundManager に反映
    useEffect(() => {
        if (!soundManager) return;

        soundManager.init();
        soundManager.setBgmEnabled(bgmEnabled);
        soundManager.setSeEnabled(seEnabled);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ON/OFF 変更の即時反映
    useEffect(() => {
        soundManager?.setBgmEnabled(bgmEnabled);
    }, [bgmEnabled]);

    useEffect(() => {
        soundManager?.setSeEnabled(seEnabled);
    }, [seEnabled]);

    // Autoplay Policy 解除: 初回のユーザー操作で AudioContext.resume() + 保留BGM再生
    useEffect(() => {
        if (!soundManager) return;
        const sm = soundManager;

        // iOS Safari: audio.play()はユーザージェスチャの同期コールスタック内でないとブロックされる
        // そのためasyncにせず、resume()はfire-and-forget、playPendingBgmも同期で呼ぶ
        const handleInteraction = () => {
            sm.init();
            sm.resume(); // fire-and-forget (Promise無視)
            sm.playPendingBgm(); // 同期的にaudio.play()を呼ぶ
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
