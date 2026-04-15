'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** sessionStorage キー */
const GAME_STARTED_KEY = 'cwd_game_started';

/**
 * タイトル画面経由でゲームを開始したことを記録する。
 * title/page.tsx の checkUserStatus で router.push('/inn') 直前に呼ぶ。
 */
export function setGameStarted(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(GAME_STARTED_KEY, '1');
    }
}

/**
 * ゲーム開始フラグをクリアする。
 * サインアウト時などに呼ぶ。
 */
export function clearGameStarted(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(GAME_STARTED_KEY);
    }
}

/**
 * ゲームページ保護用フック。
 *
 * - タイトル画面を経由せずに直接アクセスされた場合は /title にリダイレクト。
 * - Supabase セッションが失効している場合もリダイレクト。
 * - /battle-test は対象外にするため、そのページでは呼ばない。
 *
 * 使い方:
 *   function InnPageInner() {
 *     useAuthGuard();  // ← 先頭で呼ぶ
 *     ...
 *   }
 */
export function useAuthGuard(): void {
    const router = useRouter();
    const checked = useRef(false);

    useEffect(() => {
        // StrictMode の二重呼び出しを防ぐ
        if (checked.current) return;
        checked.current = true;

        // ① タイトル経由フラグをチェック
        const gameStarted = sessionStorage.getItem(GAME_STARTED_KEY);
        if (!gameStarted) {
            router.replace('/title');
            return;
        }

        // ② Supabase セッションの有効性を非同期で検証
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                clearGameStarted();
                router.replace('/title');
            }
        });
    }, [router]);
}
