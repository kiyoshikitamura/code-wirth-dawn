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
 * - ブラウザバックを検知して /title にリダイレクト（全保護ページ共通）。
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

        // linkIdentity OAuth コールバック中（?code= あり）はガードをスキップ
        // linkIdentity は既存セッションに identity を追加するだけなので認証は有効
        if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
            return;
        }

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

        // ③ ブラウザバック検知 → /title にリダイレクト（全保護ページ共通）
        const handlePopState = () => {
            clearGameStarted();
            // タイトル画面で自動リダイレクトされないようにフラグを立てる
            sessionStorage.setItem('cwd_return_to_title', '1');
            router.replace('/title');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [router]);
}
