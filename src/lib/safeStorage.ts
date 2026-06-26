/**
 * safeStorage.ts — クライアント側ストレージのセーフティラッパー
 * 
 * ブラウザ設定で Cookie やローカルストレージへのアクセスが制限・ブロックされている場合に
 * SecurityError / DOMException でアプリケーションがクラッシュするのを完全に防ぎます。
 */

import { StateStorage } from 'zustand/middleware';

export const safeLocalStorage = {
    getItem(key: string): string | null {
        if (typeof window === 'undefined') return null;
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            console.warn('[safeLocalStorage] getItem failed:', e);
            return null;
        }
    },
    setItem(key: string, value: string): void {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            console.warn('[safeLocalStorage] setItem failed:', e);
        }
    },
    removeItem(key: string): void {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            console.warn('[safeLocalStorage] removeItem failed:', e);
        }
    }
};

export const safeSessionStorage = {
    getItem(key: string): string | null {
        if (typeof window === 'undefined') return null;
        try {
            return window.sessionStorage.getItem(key);
        } catch (e) {
            console.warn('[safeSessionStorage] getItem failed:', e);
            return null;
        }
    },
    setItem(key: string, value: string): void {
        if (typeof window === 'undefined') return;
        try {
            window.sessionStorage.setItem(key, value);
        } catch (e) {
            console.warn('[safeSessionStorage] setItem failed:', e);
        }
    },
    removeItem(key: string): void {
        if (typeof window === 'undefined') return;
        try {
            window.sessionStorage.removeItem(key);
        } catch (e) {
            console.warn('[safeSessionStorage] removeItem failed:', e);
        }
    }
};

/**
 * Zustand の persist ミドルウェア用安全なストレージオブジェクト
 */
export const safeStateStorage: StateStorage = {
    getItem(name: string): string | null {
        return safeLocalStorage.getItem(name);
    },
    setItem(name: string, value: string): void {
        safeLocalStorage.setItem(name, value);
    },
    removeItem(name: string): void {
        safeLocalStorage.removeItem(name);
    }
};
