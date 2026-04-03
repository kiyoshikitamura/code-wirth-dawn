/**
 * useBgm — ページ単位のBGM管理フック
 *
 * 使用例:
 *   useBgm('bgm_inn');     // マウント時にBGM再生
 *   useBgm(null);          // BGM なし
 *   useBgm(dynamicKey);    // キー変更でクロスフェード切替
 */

'use client';

import { useEffect, useRef } from 'react';
import { soundManager } from '@/lib/soundManager';

export function useBgm(bgmKey: string | null): void {
    const prevKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!soundManager) return;

        if (bgmKey && bgmKey !== prevKeyRef.current) {
            soundManager.playBgm(bgmKey);
            prevKeyRef.current = bgmKey;
        } else if (!bgmKey && prevKeyRef.current) {
            soundManager.stopBgm();
            prevKeyRef.current = null;
        }
    }, [bgmKey]);

    // アンマウント時はBGMを止めない（ページ遷移で次のページのuseBgmが切り替える）
}
