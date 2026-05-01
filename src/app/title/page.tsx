'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { setGameStarted, clearGameStarted } from '@/hooks/useAuthGuard';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { Sword, Map as MapIcon, Hourglass, Compass, LogIn, PlayCircle } from 'lucide-react';
import { useBgm } from '@/hooks/useBgm';

export default function TitlePage() {
    const router = useRouter();
    const { userProfile, fetchUserProfile } = useGameStore();
    useBgm('bgm_title');

    // Flow State:
    //   ENTRY  → タイトル画面（Tap to Start）
    //   MENU   → New Game / Continue / Test Play ボタン
    //   CHAR_CREATION → キャラクター作成フォーム
    //   CREATING      → 作成中ローディング
    const [mode, setModeRaw] = useState<'ENTRY' | 'MENU' | 'CONTINUE_MENU' | 'CHAR_CREATION' | 'CREATING' | 'DELETING'>('ENTRY');
    const modeRef = useRef<'ENTRY' | 'MENU' | 'CONTINUE_MENU' | 'CHAR_CREATION' | 'CREATING' | 'DELETING'>('ENTRY');
    // mode を変更するときは必ずこのラッパーを使う（modeRef を同期更新するため）
    const setMode = useCallback((m: 'ENTRY' | 'MENU' | 'CONTINUE_MENU' | 'CHAR_CREATION' | 'CREATING' | 'DELETING') => {
        modeRef.current = m;
        setModeRaw(m);
    }, []);

    // テストプレイ（匿名）フラグ — CHAR_CREATION 時にバナー表示用
    const [isTestPlay, setIsTestPlay] = useState(false);

    // OAuth エラーメッセージ
    const [authError, setAuthError] = useState<string | null>(null);

    // アバター
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('画像は10MB以内にしてください。'); return; }
        const ok = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ok.includes(file.type)) { alert('JPEG / PNG / WebP のみ対応しています。'); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>('Male');
    const [age, setAge] = useState(20);
    const [previewStats, setPreviewStats] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteCheck1, setDeleteCheck1] = useState(false);
    const [deleteCheck2, setDeleteCheck2] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // New Game で既存キャラが見つかった場合の上書き確認
    const [showNewGameOverwrite, setShowNewGameOverwrite] = useState(false);
    const [pendingSessionToken, setPendingSessionToken] = useState<string | null>(null);

    // Dynamic Flavor Text
    const getFlavorText = (currentAge: number) => {
        if (currentAge <= 19) return "若さは最大の武器...";
        if (currentAge <= 29) return "心身ともに円熟の時...";
        if (currentAge <= 39) return "経験は盾となり...";
        return "黄昏の時が近づく...";
    };


    // ─── ユーザー状態確認 ─────────────────────────────────────────────────
    const checkUserStatus = useCallback(async () => {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            await supabase.auth.signOut();
            setMode('ENTRY');
            return;
        }

        await fetchUserProfile();
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        // セッショントークン取得（削除フローで使用）
        const { data: { session } } = await supabase.auth.getSession();

        // Intent フラグの読み取り
        const isNewGameIntent = typeof window !== 'undefined' && sessionStorage.getItem('cwd_new_game_intent') === '1';
        if (isNewGameIntent) sessionStorage.removeItem('cwd_new_game_intent');

        const isDeleteIntent = typeof window !== 'undefined' && sessionStorage.getItem('cwd_delete_intent') === '1';
        if (isDeleteIntent) sessionStorage.removeItem('cwd_delete_intent');

        // 「タイトルに戻る」意図チェック — ゲーム画面から明示的にタイトルへ戻った場合
        // セッションが残存していても自動リダイレクトせずメニューを表示する
        const isReturnToTitle = typeof window !== 'undefined' && sessionStorage.getItem('cwd_return_to_title') === '1';
        if (isReturnToTitle) sessionStorage.removeItem('cwd_return_to_title');

        if (profile) {
            // 優先度: deleteIntent > newGameIntent > returnToTitle > 自動ログイン
            // deleteIntent / newGameIntent は明示的な新アクションなので
            // 古い returnToTitle フラグが残存していても優先する
            if (isDeleteIntent && session?.access_token) {
                setIsDeleting(true);
                try {
                    const res = await fetch('/api/profile/reset', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${session.access_token}` },
                    });
                    if (!res.ok) throw new Error((await res.json()).error);
                    clearGameStarted();
                    // ローカルストレージもクリア（New Game が stale データを参照しないように）
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('game-storage');
                        localStorage.removeItem('quest-storage');
                    }
                    // 削除成功 → サインアウトせずにキャラ作成画面へ直行
                    // （再度OAuth認証する冗長ステップを省く）
                    await new Promise(r => setTimeout(r, 1500));
                    setAuthError(null);
                    setIsTestPlay(false);
                    setMode('CHAR_CREATION');
                } catch (err: any) {
                    setAuthError(`削除に失敗しました: ${err.message}`);
                    setMode('MENU');
                } finally {
                    setIsDeleting(false);
                }
                return;
            }
            if (isNewGameIntent) {
                // 既存キャラがある場合: 削除確認ダイアログを表示
                setPendingSessionToken(session?.access_token || null);
                setShowNewGameOverwrite(true);
                setMode('MENU');
                return;
            }
            if (isReturnToTitle) {
                // 明示的にタイトルに戻ったので、セッションをクリアしてメニューを表示
                await supabase.auth.signOut();
                clearGameStarted();
                setMode('MENU');
                return;
            }
            setGameStarted();
            router.push('/inn');
        } else {
            if (isDeleteIntent) {
                await supabase.auth.signOut();
                setAuthError('削除対象のキャラクターが見つかりませんでした。');
                setMode('MENU');
                return;
            }
            setIsTestPlay(user.is_anonymous ?? false);
            setMode('CHAR_CREATION');
        }
    }, [fetchUserProfile, router]);

    // ─── OAuth コールバック処理 ────────────────────────────────────────────
    // Supabase は detectSessionInUrl=true（デフォルト）で ?code= を自動検出し
    // exchangeCodeForSession を内部実行した後 SIGNED_IN イベントを発火する。
    // そのため URL 直読みではなく onAuthStateChange で検知する方式に統一する。
    useEffect(() => {
        // auth_error パラメータのみ直接確認（コールバック失敗時）
        const params = new URLSearchParams(window.location.search);
        const authErrParam = params.get('auth_error');
        if (authErrParam) {
            setAuthError(`認証エラー: ${decodeURIComponent(authErrParam)}`);
            setMode('MENU');
            window.history.replaceState({}, '', '/title');
        }

        // SIGNED_IN / INITIAL_SESSION: Google OAuth 完了 or 匿名サインイン完了
        // modeRef で現在の mode を同期参照し、CREATING 中（Test Play 処理中）は二重呼び出しを防ぐ
        // 注: OAuth コールバックで ?code= の交換がリスナー登録前に完了した場合、
        //     SIGNED_IN ではなく INITIAL_SESSION が発火するため両方をハンドルする
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[title] auth event:', event, 'mode:', modeRef.current);
            const isSignIn = event === 'SIGNED_IN' && session;
            const isOAuthReturn = event === 'INITIAL_SESSION' && session && window.location.search.includes('code=');
            if (isSignIn || isOAuthReturn) {
                // URL に ?code= が残っていればクリーン
                if (window.location.search.includes('code=')) {
                    window.history.replaceState({}, '', '/title');
                }
                // Test Play は handleTestPlay 内で checkUserStatus を直接呼ぶため
                // CREATING モード中は onAuthStateChange からの二重呼び出しをスキップ
                if (modeRef.current !== 'CREATING' && modeRef.current !== 'DELETING') {
                    // 削除意図がある場合は削除中画面を表示（「世界に降り立っています」を見せない）
                    const hasDeleteIntent = typeof window !== 'undefined' && sessionStorage.getItem('cwd_delete_intent') === '1';
                    setMode(hasDeleteIntent ? 'DELETING' : 'CREATING');
                    checkUserStatus();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [checkUserStatus, setMode]);

    // ─── ハンドラー ───────────────────────────────────────────────────────

    const handleTapToStart = () => setMode('MENU');

    /**
     * New Game — Google OAuth 必須
     * OAuth 完了後 /auth/callback → /title?code=xxx → exchangeCodeForSession → checkUserStatus
     */
    const handleNewGame = async () => {
        setAuthError(null);
        // 前回セッション・ストアをクリア
        clearGameStarted();
        try { await supabase.auth.signOut(); } catch (_) {}
        if (typeof window !== 'undefined') {
            localStorage.removeItem('game-storage');
            localStorage.removeItem('quest-storage');
            // New Game の意図を記録（OAuth後、既存キャラ存在チェック用）
            sessionStorage.setItem('cwd_new_game_intent', '1');
            // 古い intent フラグをクリア（残存防止）
            sessionStorage.removeItem('cwd_return_to_title');
            sessionStorage.removeItem('cwd_delete_intent');
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // /title に直接リダイレクト → Supabase が ?code= を自動検出し
                // onAuthStateChange で SIGNED_IN を発火する
                redirectTo: `${window.location.origin}/title`,
                queryParams: { prompt: 'select_account' },
            }
        });
        if (error) {
            setAuthError(`Google 認証の開始に失敗しました: ${error.message}`);
        }
        // → ブラウザが Google の認証画面に遷移するため、以降の処理は /auth/callback 経由で再開
    };

    /**
     * Continue — Google OAuth でログインして既存プロフィールへ
     */
    const handleContinue = async () => {
        setAuthError(null);
        // 古い intent フラグをクリア（残存防止）
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('cwd_return_to_title');
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/title`,
            }
        });
        if (error) {
            setAuthError(`Google 認証の開始に失敗しました: ${error.message}`);
        }
    };

    /**
     * Test Play — 匿名認証。DBに1週間保存（影として機能）。引き継ぎ不可。
     */
    const handleTestPlay = async () => {
        setMode('CREATING');
        setAuthError(null);
        clearGameStarted();
        try { await supabase.auth.signOut(); } catch (_) {}
        if (typeof window !== 'undefined') {
            localStorage.removeItem('game-storage');
            localStorage.removeItem('quest-storage');
        }

        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
            alert('通信エラー: ' + error.message);
            setMode('ENTRY');
            return;
        }
        setIsTestPlay(true);
        await checkUserStatus();
    };

    // Calculate Stats Effect
    useEffect(() => {
        if (age < 15 || age > 40) return;
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/auth/calculate-stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ age: age })
                });
                const data = await res.json();
                if (!res.ok) setErrorMsg(data.error || 'Invalid calculation');
                else { setPreviewStats(data.stats); setErrorMsg(''); }
            } catch (e) { console.error(e); }
        };
        const timer = setTimeout(fetchStats, 300);
        return () => clearTimeout(timer);
    }, [age]);

    const handleCharacterSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setShowConfirm(false);
        if (!name.trim() || !previewStats) return;
        setMode('CREATING');
        setIsUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const userId = session?.user?.id;

            if (!userId) {
                throw new Error('認証セッションが見つかりません。再度お試しください。');
            }

            const { data: startLoc } = await supabase.from('locations').select('id').eq('slug', 'loc_border_town').maybeSingle();

            const dummyBirthDate = new Date();
            dummyBirthDate.setFullYear(dummyBirthDate.getFullYear() - age);
            const birthDateStr = dummyBirthDate.toISOString().split('T')[0];

            // 1. まずプロフィール初期化を実行（アバターURLは一旦空で）
            const resInit = await fetch('/api/profile/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    user_id: userId,
                    title_name: name,
                    gender: gender,
                    age: age,
                    birth_date: birthDateStr,
                    max_hp: previewStats.max_hp,
                    max_vitality: previewStats.max_vitality,
                    max_deck_cost: previewStats.max_deck_cost,
                    atk: previewStats.atk,
                    def: previewStats.def,
                    gold: previewStats.gold,
                    accumulated_days: 0,
                    current_location_id: startLoc?.id,
                })
            });

            if (!resInit.ok) throw new Error((await resInit.json()).error);

            // 2. プロフィール作成後、アバターがあればサーバー経由でアップロード
            if (avatarFile && userId) {
                try {
                    const formData = new FormData();
                    formData.append('file', avatarFile);

                    const uploadRes = await fetch('/api/character/avatar', {
                        method: 'POST',
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                            'x-user-id': userId,
                        },
                        body: formData,
                    });

                    if (!uploadRes.ok) {
                        const errData = await uploadRes.json();
                        throw new Error(errData.error || 'アップロード失敗');
                    }
                } catch (uploadErr: any) {
                    console.warn('[avatar upload] 例外発生:', uploadErr);
                    alert(`アイコン画像のアップロード中にエラーが発生しました。\nアイコンなしでキャラクターを作成します。\n(${uploadErr.message || uploadErr})`);
                }
            }

            setIsUploading(false);

            await new Promise(r => setTimeout(r, 2000));
            await fetchUserProfile();
            setGameStarted();
            router.push('/inn');
        } catch (err: any) {
            console.error(err);
            alert(`作成失敗: ${err.message}`);
            setMode('CHAR_CREATION');
        }
    };

    // ─── CREATING 画面 ────────────────────────────────────────────────────
    if (mode === 'CREATING') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a38b6b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(163,139,107,0.1)_0%,transparent_70%)] animate-pulse-slow"></div>
                </div>
                <MapIcon className="w-24 h-24 animate-spin-slow mb-8 text-amber-500 opacity-80" />
                <h2 className="text-xl md:text-2xl text-[#e3d5b8] mb-8 animate-fade-in tracking-[0.2em] font-bold drop-shadow-lg">世界に降り立っています...</h2>
                <div className="h-32 relative z-10"></div>
                <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden z-10">
                    <div className="h-full bg-amber-500 animate-progress-indeterminate"></div>
                </div>
            </div>
        );
    }

    // ─── DELETING 画面（キャラクター削除処理中） ─────────────────────────────
    if (mode === 'DELETING') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a38b6b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(163,139,107,0.1)_0%,transparent_70%)] animate-pulse-slow"></div>
                </div>
                <MapIcon className="w-16 h-16 animate-spin-slow mb-6 text-red-400 opacity-80" />
                <h2 className="text-xl md:text-2xl text-red-300/80 mb-4 animate-fade-in tracking-[0.2em] font-bold drop-shadow-lg">データを削除中...</h2>
                <p className="text-sm text-slate-500 tracking-widest">しばらくお待ちください</p>
                <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden z-10">
                    <div className="h-full bg-red-500 animate-progress-indeterminate"></div>
                </div>
            </div>
        );
    }

    // ─── TITLE / CHAR_CREATION 背景 ───────────────────────────────────────
    const renderTitleBackground = () => (
        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-950">
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: 'url("/backgrounds/key_visual/main_kv_journey_empty.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/80" />
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }} />
        </div>
    );

    return (
        <div className="min-h-screen text-gray-200 font-sans flex flex-col items-center justify-center p-4 relative">

            {mode === 'ENTRY' || mode === 'MENU' || mode === 'CONTINUE_MENU' ? renderTitleBackground() : null}

            {/* Character Creation Background */}
            {mode === 'CHAR_CREATION' && (
                <div className="absolute inset-0 bg-[#e3d5b8] pointer-events-none">
                    <div className="absolute inset-0 mix-blend-multiply opacity-40" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-wall.png")' }}></div>
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
                </div>
            )}

            <main className={`relative z-10 w-full max-w-md ${mode === 'CHAR_CREATION' ? 'bg-[#e3d5b8]/10 text-slate-900 p-8 rounded-lg border-[3px] border-amber-800/60 shadow-2xl backdrop-blur-md relative overflow-hidden' : 'p-8 flex flex-col items-center'}`}>

                {mode === 'CHAR_CREATION' && (
                    <div className="absolute inset-2 border border-amber-800/30 pointer-events-none rounded"></div>
                )}

                {(mode === 'ENTRY' || mode === 'MENU' || mode === 'CONTINUE_MENU') && (
                    <header className="text-center mb-16 mt-10">
                        <h1 className="text-5xl font-serif text-slate-300 mb-3 tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                            <span className="text-amber-500">C</span>ode: Wirth-Dawn
                        </h1>
                        <div className="text-xs text-amber-600/80 uppercase tracking-[0.4em] font-serif">Chronicles of the Unnamed</div>
                    </header>
                )}

                {/* ─── ENTRY ─── */}
                {mode === 'ENTRY' && (
                    <div
                        className="w-full flex-1 flex flex-col items-center pt-24 pb-8 animate-fade-in opacity-80 cursor-pointer"
                        onClick={handleTapToStart}
                    >
                        <div className="text-xl font-serif text-amber-500/70 tracking-[0.5em] uppercase p-4" style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                            Tap to Start
                        </div>
                    </div>
                )}

                {/* ─── MENU ─── */}
                {mode === 'MENU' && (
                    <div className="w-full space-y-3 animate-fade-in-up mt-10">

                        {/* 認証エラー表示 */}
                        {authError && (
                            <div className="bg-red-950/60 border border-red-700 text-red-300 text-xs font-serif px-3 py-2 rounded mb-2 text-center">
                                {authError}
                            </div>
                        )}

                        {/* New Game — Google OAuth 必須 */}
                        <button
                            onClick={handleNewGame}
                            className="w-full bg-amber-900/20 border border-amber-500/50 text-amber-400 font-serif py-4 rounded hover:bg-amber-900/40 hover:border-amber-400 transition-all shadow-lg flex flex-col justify-center items-center gap-1 group"
                        >
                            <div className="flex items-center gap-2">
                                <Sword className="w-5 h-5 group-hover:text-amber-300 transition-colors" />
                                <span className="group-hover:text-amber-200 tracking-widest text-base">New Game</span>
                            </div>
                            <span className="text-[11px] text-amber-500/80 tracking-wide">Google連携が必要</span>
                        </button>

                        {/* Continue — Google OAuth */}
                        <button
                            onClick={() => setMode('CONTINUE_MENU')}
                            className="w-full bg-slate-900/50 border border-slate-600 text-slate-300 font-serif py-4 rounded hover:bg-slate-800 hover:border-slate-400 transition-all tracking-widest flex justify-center items-center gap-2 group"
                        >
                            <LogIn className="w-4 h-4 group-hover:text-slate-200 transition-colors" />
                            <span className="group-hover:text-white">Continue / Transfer</span>
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px bg-slate-800" />
                            <span className="text-[10px] text-slate-600 font-serif tracking-widest">または</span>
                            <div className="flex-1 h-px bg-slate-800" />
                        </div>

                        {/* Test Play — 匿名（7日間のみ） */}
                        <button
                            onClick={handleTestPlay}
                            className="w-full bg-slate-900/40 border border-slate-500/70 text-slate-300 font-serif py-3 rounded hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-400 transition-all tracking-widest flex flex-col items-center gap-1 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-slate-400" />
                                <span className="font-bold">Test Play</span>
                            </div>
                            <span className="text-[10px] text-slate-400/80 tracking-wide">アカウント連携なし・7日間限定・データ引き継ぎ不可</span>
                        </button>

                    </div>
                )}

                {/* ─── New Game 上書き確認モーダル（MENU外に配置して位置ズレ防止） ─── */}
                {showNewGameOverwrite && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={async () => { setShowNewGameOverwrite(false); setDeleteCheck1(false); setDeleteCheck2(false); await supabase.auth.signOut(); setMode('MENU'); }}>
                        <div className="bg-[#100808] border-2 border-amber-700/70 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="text-4xl mb-3">⚔️</div>
                                <h3 className="text-xl font-serif text-amber-400 tracking-widest mb-2">既存データの検出</h3>
                                <p className="text-amber-300/80 text-xs leading-relaxed">
                                    このGoogleアカウントには<strong className="text-amber-400">既にキャラクターが存在</strong>します。<br />
                                    New Gameを開始するには、<strong className="text-red-400">既存の全データを削除</strong>する必要があります。
                                </p>
                            </div>
                            <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4 space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={deleteCheck1} onChange={(e) => setDeleteCheck1(e.target.checked)} className="mt-0.5 accent-red-600 w-4 h-4 flex-shrink-0" />
                                    <span className="text-red-300/80 text-xs leading-relaxed group-hover:text-red-200 transition-colors">
                                        キャラクターに紐づく<strong>全ての資産・履歴が削除される</strong>ことを理解しました
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={deleteCheck2} onChange={(e) => setDeleteCheck2(e.target.checked)} className="mt-0.5 accent-red-600 w-4 h-4 flex-shrink-0" />
                                    <span className="text-red-300/80 text-xs leading-relaxed group-hover:text-red-200 transition-colors">
                                        この操作は<strong>絶対に元に戻せない</strong>ことを理解しました
                                    </span>
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        setShowNewGameOverwrite(false);
                                        setDeleteCheck1(false);
                                        setDeleteCheck2(false);
                                        await supabase.auth.signOut();
                                        setMode('MENU');
                                    }}
                                    className="flex-1 py-3 border border-slate-700 text-slate-400 font-serif rounded-lg text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowNewGameOverwrite(false);
                                        setDeleteCheck1(false);
                                        setDeleteCheck2(false);
                                        setMode('DELETING');
                                        try {
                                            const { data: { session: freshSession } } = await supabase.auth.getSession();
                                            const token = freshSession?.access_token || pendingSessionToken;
                                            if (!token) throw new Error('セッションが無効です。再度お試しください。');
                                            const res = await fetch('/api/profile/reset', {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` },
                                            });
                                            // 404 = プロフィール未検出 = 既に削除済み → 成功扱い
                                            if (!res.ok && res.status !== 404) {
                                                throw new Error((await res.json()).error);
                                            }
                                            // 削除成功 → ローディング演出後にキャラ作成画面へ
                                            if (typeof window !== 'undefined') {
                                                localStorage.removeItem('game-storage');
                                                localStorage.removeItem('quest-storage');
                                            }
                                            await new Promise(r => setTimeout(r, 2500));
                                            setIsTestPlay(false);
                                            setAuthError(null);
                                            setMode('CHAR_CREATION');
                                        } catch (err: any) {
                                            setAuthError(`削除に失敗しました: ${err.message}`);
                                            await supabase.auth.signOut();
                                            setMode('MENU');
                                        } finally {
                                            setIsDeleting(false);
                                            setPendingSessionToken(null);
                                        }
                                    }}
                                    disabled={!deleteCheck1 || !deleteCheck2 || isDeleting}
                                    className="flex-1 py-3 bg-red-900/40 border border-red-700 text-red-300 font-serif font-bold rounded-lg text-sm hover:bg-red-900/60 hover:border-red-500 hover:text-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? '削除中...' : '削除して新規作成'}
                                </button>
                            </div>
                            <button
                                onClick={async () => {
                                    setShowNewGameOverwrite(false);
                                    setDeleteCheck1(false);
                                    setDeleteCheck2(false);
                                    setPendingSessionToken(null);
                                    setGameStarted();
                                    router.push('/inn');
                                }}
                                className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-1"
                            >
                                既存キャラクターで続ける →
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── CONTINUE_MENU ─── */}
                {mode === 'CONTINUE_MENU' && (
                    <div className="w-full space-y-3 animate-fade-in-up mt-10">
                        <h2 className="text-center text-sm font-serif text-amber-500/80 tracking-[0.3em] uppercase mb-4">Continue / Transfer</h2>

                        {authError && (
                            <div className="bg-red-950/60 border border-red-700 text-red-300 text-xs font-serif px-3 py-2 rounded mb-2 text-center">
                                {authError}
                            </div>
                        )}

                        <button
                            onClick={handleContinue}
                            className="w-full bg-slate-900/50 border border-slate-600 text-slate-300 font-serif py-4 rounded hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-200 transition-all flex flex-col items-center gap-1 group"
                        >
                            <div className="flex items-center gap-2">
                                <LogIn className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                                <span className="tracking-widest text-base">前回の継続</span>
                            </div>
                            <span className="text-[10px] text-slate-400/80 tracking-wide">Googleアカウントでログインして続きから始める</span>
                        </button>

                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px bg-slate-800" />
                            <span className="text-[10px] text-slate-600 font-serif tracking-widest">または</span>
                            <div className="flex-1 h-px bg-slate-800" />
                        </div>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full bg-red-950/20 border border-red-900/40 text-red-400/80 font-serif py-3 rounded hover:bg-red-950/40 hover:border-red-700 hover:text-red-300 transition-all flex flex-col items-center gap-1 text-sm"
                        >
                            <span className="tracking-widest font-bold">キャラクター削除（リセット）</span>
                            <span className="text-[10px] tracking-wide opacity-70">全データを消去して最初からやり直す</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setAuthError(null); setMode('MENU'); }}
                            className="w-full border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 font-serif text-xs tracking-widest py-2 rounded transition-colors text-center"
                        >
                            タイトルに戻る
                        </button>

                    </div>
                )}

                {/* ─── 削除確認ポップアップ（CONTINUE_MENU外に配置して位置ズレ防止） ─── */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => { setShowDeleteConfirm(false); setDeleteCheck1(false); setDeleteCheck2(false); }}>
                        <div className="bg-[#100808] border-2 border-red-800/70 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="text-4xl mb-3">⚠️</div>
                                <h3 className="text-xl font-serif text-red-400 tracking-widest mb-2">キャラクター削除</h3>
                                <p className="text-red-300/80 text-xs leading-relaxed">
                                    この操作は<strong className="text-red-400">絶対に元に戻せません</strong>。<br />
                                    キャラクター・所持金・装備・クエスト履歴など<br />
                                    <strong className="text-red-400">すべての資産と記録が永久に消滅</strong>します。
                                </p>
                            </div>
                            <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4 space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={deleteCheck1} onChange={(e) => setDeleteCheck1(e.target.checked)} className="mt-0.5 accent-red-600 w-4 h-4 flex-shrink-0" />
                                    <span className="text-red-300/80 text-xs leading-relaxed group-hover:text-red-200 transition-colors">
                                        キャラクターに紐づく<strong>全ての資産・履歴が削除される</strong>ことを理解しました
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={deleteCheck2} onChange={(e) => setDeleteCheck2(e.target.checked)} className="mt-0.5 accent-red-600 w-4 h-4 flex-shrink-0" />
                                    <span className="text-red-300/80 text-xs leading-relaxed group-hover:text-red-200 transition-colors">
                                        この操作は<strong>絶対に元に戻せない</strong>ことを理解しました
                                    </span>
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteCheck1(false); setDeleteCheck2(false); }}
                                    className="flex-1 py-3 border border-slate-700 text-slate-400 font-serif rounded-lg text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    disabled={!deleteCheck1 || !deleteCheck2}
                                    onClick={async () => {
                                        setShowDeleteConfirm(false);
                                        setDeleteCheck1(false);
                                        setDeleteCheck2(false);
                                        if (typeof window !== 'undefined') sessionStorage.setItem('cwd_delete_intent', '1');
                                        await handleContinue();
                                    }}
                                    className="flex-1 py-3 bg-red-900/40 border border-red-700 text-red-300 font-serif font-bold rounded-lg text-sm hover:bg-red-900/60 hover:border-red-500 hover:text-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    削除して再スタート
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* ─── CHAR_CREATION ─── */}
                {mode === 'CHAR_CREATION' && (
                    <form onSubmit={handleCharacterSubmit} className="space-y-8 animate-fade-in relative z-10 p-2">
                        <h2 className="text-center text-2xl font-serif text-amber-900 tracking-widest mb-6 border-b border-amber-900/20 pb-4">
                            契約の書
                        </h2>

                        {/* テストプレイ警告バナー */}
                        {isTestPlay && (
                            <div className="bg-amber-950/80 border border-amber-700/60 rounded-lg px-4 py-3 text-center">
                                <p className="text-amber-400 text-xs font-bold tracking-wide mb-1">⚠️ テストプレイ中</p>
                                <p className="text-amber-500/80 text-[10px] leading-relaxed">
                                    このキャラクターは <strong>7日後に失効</strong> します。<br />
                                    データを引き継ぐには、ゲーム内から Google アカウントと連携してください。
                                </p>
                            </div>
                        )}

                        {/* アバターアップロード */}
                        <div className="flex flex-col items-center gap-3">
                            <label className="block text-xs text-amber-900/70 font-serif tracking-widest uppercase text-center">Avatar (Optional)</label>
                            <label className="cursor-pointer group">
                                <div className="w-20 h-20 rounded-full border-2 border-amber-900/40 group-hover:border-amber-800 overflow-hidden flex items-center justify-center bg-amber-900/10 transition-all">
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                                        : <span className="text-3xl opacity-40">💤</span>
                                    }
                                </div>
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                            </label>
                            <span className="text-[10px] text-amber-900/50">{avatarPreview ? 'タップして変更' : 'タップしてアップロード'}</span>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs text-amber-900/70 font-serif tracking-widest uppercase">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-amber-900/40 focus:border-amber-800 text-amber-950 p-2 outline-none transition-colors text-xl text-center font-serif italic placeholder-amber-900/30"
                                placeholder="汝の名は..."
                                maxLength={16}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs text-amber-900/70 font-serif tracking-widest uppercase text-center">Gender</label>
                            <div className="flex justify-center gap-2">
                                {['Male', 'Female', 'Unknown'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGender(g as any)}
                                        className={`flex-1 py-3 border rounded transition-all duration-300 font-serif text-sm tracking-widest
                                            ${gender === g
                                                ? 'bg-amber-900 border-amber-950 text-amber-100 shadow-inner'
                                                : 'bg-transparent border-amber-900/30 text-amber-900/60 hover:border-amber-900/60'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="block text-xs text-amber-900/70 font-serif tracking-widest uppercase text-center">Age</label>
                            <div className="space-y-2 px-2">
                                <div className="flex justify-between text-xs font-serif text-amber-900/60">
                                    <span>15</span>
                                    <span className="text-amber-900 font-bold text-lg">{age}</span>
                                    <span>40</span>
                                </div>
                                <input
                                    type="range"
                                    min="15"
                                    max="40"
                                    value={age}
                                    onChange={(e) => setAge(Number(e.target.value))}
                                    className="w-full accent-amber-900 cursor-pointer"
                                />
                            </div>

                            {/* Dynamic Flavor & Stats */}
                            <div className="bg-amber-900/5 p-4 rounded border border-amber-900/10 min-h[120px] relative">
                                <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                                    <Hourglass size={40} />
                                </div>
                                <p className="text-center font-serif text-amber-900 text-lg italic mb-3">
                                    「{getFlavorText(age)}」
                                </p>

                                {previewStats ? (
                                    <div className="space-y-1">
                                        <div className="grid grid-cols-4 gap-1 text-center font-mono text-amber-950/80 text-xs">
                                            <div className="bg-amber-900/10 py-1 rounded">HP<br /><span className="text-sm font-bold">{previewStats.max_hp}</span></div>
                                            <div className="bg-amber-900/10 py-1 rounded">ATK<br /><span className="text-sm font-bold">{previewStats.atk}</span></div>
                                            <div className="bg-amber-900/10 py-1 rounded">DEF<br /><span className="text-sm font-bold">{previewStats.def}</span></div>
                                            <div className="bg-amber-900/10 py-1 rounded">Vit<br /><span className="text-sm font-bold">{previewStats.max_vitality}</span></div>
                                        </div>
                                        <div className="text-center bg-amber-900/10 py-1 rounded font-mono text-amber-950/80 text-xs">
                                            Gold　<span className="text-sm font-bold text-amber-800">{previewStats.gold?.toLocaleString() ?? '—'} G</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-xs text-amber-900/50 py-2">読み解き中...</div>
                                )}
                            </div>

                            {errorMsg && <p className="text-red-800 text-xs text-center font-bold">{errorMsg}</p>}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            disabled={!name.trim() || !previewStats}
                            className="w-full group bg-slate-950 text-amber-500 font-serif font-bold tracking-widest py-4 rounded disabled:opacity-50 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl flex items-center justify-center gap-3 overflow-hidden"
                        >
                            <span className="relative z-10 transition-transform group-hover:scale-105">世界に降り立つ</span>
                            <Compass className="w-5 h-5 relative z-10 transition-transform duration-700 group-hover:rotate-180 text-amber-600 group-hover:text-amber-400" />
                        </button>

                        {/* タイトルに戻る */}
                        <button
                            type="button"
                            onClick={async () => {
                                clearGameStarted();
                                try { await supabase.auth.signOut(); } catch (_) {}
                                setMode('ENTRY');
                                setName('');
                                setAvatarFile(null);
                                setAvatarPreview(null);
                            }}
                            className="w-full border border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 font-serif text-xs tracking-widest py-2 rounded transition-colors text-center"
                        >
                            タイトルに戻る
                        </button>

                        {/* 最終確認モーダル */}
                        {showConfirm && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowConfirm(false)}>
                                <div className="bg-[#1c1710] border-2 border-amber-600/70 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                                    <h3 className="text-lg font-serif text-amber-400 text-center mb-6 tracking-widest">— 契約の確認 —</h3>

                                    {/* テストプレイ警告（確認モーダル内） */}
                                    {isTestPlay && (
                                        <div className="bg-amber-950/60 border border-amber-800/50 rounded px-3 py-2 mb-4 text-center">
                                            <p className="text-amber-500 text-[10px]">⚠️ テストプレイ — 7日後に失効します</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 mb-6">
                                        {avatarPreview && (
                                            <div className="flex justify-center mb-3">
                                                <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full border-2 border-amber-700 object-cover" />
                                            </div>
                                        )}
                                        <div className="bg-slate-900/80 rounded-lg p-4 space-y-2 text-sm border border-amber-700/40">
                                            <div className="flex justify-between">
                                                <span className="text-amber-400/80 font-serif">名前</span>
                                                <span className="text-amber-100 font-bold">{name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-400/80 font-serif">性別</span>
                                                <span className="text-amber-100">{gender === 'Male' ? '男' : gender === 'Female' ? '女' : '不明'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-400/80 font-serif">年齢</span>
                                                <span className="text-amber-100">{age}歳</span>
                                            </div>
                                            {previewStats && (
                                                <div className="space-y-1 pt-2 border-t border-amber-700/30">
                                                    <div className="grid grid-cols-4 gap-1">
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">HP</div><div className="text-amber-200 font-mono font-bold">{previewStats.max_hp}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">ATK</div><div className="text-amber-200 font-mono font-bold">{previewStats.atk}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">DEF</div><div className="text-amber-200 font-mono font-bold">{previewStats.def}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">Vit</div><div className="text-amber-200 font-mono font-bold">{previewStats.max_vitality}</div></div>
                                                    </div>
                                                    <div className="text-center text-[10px] text-amber-400/60">Gold　<span className="text-amber-200 font-mono font-bold">{previewStats.gold?.toLocaleString() ?? '—'} G</span></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-amber-700/50 text-amber-400/80 font-serif rounded-lg text-sm hover:border-amber-600 hover:text-amber-300 transition-colors">戻る</button>
                                        <button
                                            onClick={() => handleCharacterSubmit()}
                                            className="flex-1 py-3 bg-amber-900/30 border border-amber-600 text-amber-200 font-serif font-bold rounded-lg text-sm hover:bg-amber-900/50 hover:border-amber-400 hover:text-white transition-all shadow-lg"
                                        >
                                            確定する
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                )}
            </main>
        </div>
    );
}
