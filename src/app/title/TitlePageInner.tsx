'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { setGameStarted, clearGameStarted } from '@/hooks/useAuthGuard';
import { clearAuthTokenCache } from '@/lib/authToken';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { Sword, Map as MapIcon, Hourglass, Compass, LogIn, PlayCircle, BookOpen, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { useBgm } from '@/hooks/useBgm';
import DeleteConfirmModal from '@/components/title/DeleteConfirmModal';
import TermsOfServiceModal from '@/components/title/TermsOfServiceModal';
import { soundManager } from '@/lib/soundManager';

export default function TitlePageInner() {
    const router = useRouter();
    const { userProfile, fetchUserProfile } = useGameStore();
    const isReincarnation = !!(userProfile && !userProfile.is_alive);
    useBgm('bgm_title');

    // Flow State:
    //   ENTRY  → タイトル画面（Tap to Start）
    //   MENU   → New Game / Continue / Test Play ボタン
    //   CHAR_CREATION → キャラクター作成フォーム
    //   CREATING      → 作成中ローディング
    const [mode, setModeRaw] = useState<'ENTRY' | 'MENU' | 'CONTINUE_MENU' | 'CHAR_CREATION' | 'CREATING' | 'LANDING_CARD' | 'DELETING'>('ENTRY');
    const modeRef = useRef<'ENTRY' | 'MENU' | 'CONTINUE_MENU' | 'CHAR_CREATION' | 'CREATING' | 'LANDING_CARD' | 'DELETING'>('ENTRY');
    // mode を変更するときは必ずこのラッパーを使う（modeRef を同期更新するため）
    const setMode = useCallback((m: 'ENTRY' | 'MENU' | 'CONTINUE_MENU' | 'CHAR_CREATION' | 'CREATING' | 'LANDING_CARD' | 'DELETING') => {
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
    const [avatarPreview, setAvatarPreview] = useState<string | null>('/images/icons/observer_gem.png');
    const [showConfirm, setShowConfirm] = useState(false);
    const [creationStep, setCreationStep] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // BP Allocation States
    const [allocatedHpPoints, setAllocatedHpPoints] = useState(0);
    const [allocatedAtkPoints, setAllocatedAtkPoints] = useState(0);
    const [allocatedDefPoints, setAllocatedDefPoints] = useState(0);
    const [allocatedVitPoints, setAllocatedVitPoints] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteCheck1, setDeleteCheck1] = useState(false);
    const [deleteCheck2, setDeleteCheck2] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // New Game で既存キャラが見つかった場合の上書き確認
    const [showNewGameOverwrite, setShowNewGameOverwrite] = useState(false);
    const [pendingSessionToken, setPendingSessionToken] = useState<string | null>(null);
    // 利用規約モーダル表示
    const [showTermsModal, setShowTermsModal] = useState(false);
    // カードパック開封演出用
    const [packOpened, setPackOpened] = useState(false);

    // Dynamic Flavor Text
    const getFlavorText = (currentAge: number) => {
        if (currentAge <= 19) return "若さは最大の武器...";
        if (currentAge <= 29) return "心身ともに円熟の時...";
        if (currentAge <= 39) return "経験は盾となり...";
        return "黄昏の時が近づく...";
    };


    // ─── ユーザー状態確認 ─────────────────────────────────────────────────
    const checkUserStatus = useCallback(async () => {
        // 12秒で強制タイムアウトしてメニューに戻す保護タイマー
        const timeoutId = setTimeout(() => {
            console.warn('[checkUserStatus] ログイン処理がタイムアウトしました。');
            setAuthError('ログイン処理がタイムアウトしました。ネットワーク状況を確認し、再度お試しください。');
            setMode('MENU');
        }, 12000);

        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                await supabase.auth.signOut();
                clearAuthTokenCache();
                setMode('ENTRY');
                return;
            }

            await fetchUserProfile();
            const { data: profile, error: profileErr } = await supabase
                .from('user_profiles')
                .select('id, is_alive, legacy_points')
                .eq('id', user.id)
                .maybeSingle();

            if (profileErr) throw profileErr;

            // セッショントークン取得（削除フローで使用）
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr) throw sessionErr;

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
                // If character has retired or died, bypass redirect and send to char creation
                if (!profile.is_alive) {
                    setIsTestPlay(user.is_anonymous ?? false);
                    setMode('CHAR_CREATION');
                    return;
                }
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
                    clearAuthTokenCache();
                    clearGameStarted();
                    setMode('MENU');
                    return;
                }
                setGameStarted();
                router.push('/inn');
            } else {
                if (isDeleteIntent) {
                    await supabase.auth.signOut();
                    clearAuthTokenCache();
                    setAuthError('削除対象のキャラクターが見つかりませんでした。');
                    setMode('MENU');
                    return;
                }
                setIsTestPlay(user.is_anonymous ?? false);
                setMode('CHAR_CREATION');
            }
        } catch (err: any) {
            console.error('[checkUserStatus] エラーキャッチ:', err);
            setAuthError(`ログイン処理中にエラーが発生しました: ${err.message || err}`);
            setMode('MENU');
        } finally {
            clearTimeout(timeoutId);
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

    // ─── 新世代キャラクター降臨時のSE再生 ──────────────────────────────
    useEffect(() => {
        if (mode === 'LANDING_CARD' && soundManager) {
            soundManager.playSE('se_card_draw');
        }
    }, [mode]);

    // 利用規約ページなどからの戻り時に、利用規約モーダル表示状態を復元する
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const showTos = sessionStorage.getItem('cwd_show_tos');
            if (showTos === '1') {
                sessionStorage.removeItem('cwd_show_tos');
                setMode('MENU');
                setShowTermsModal(true);
            }
        }
    }, [setMode]);

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
        try { await supabase.auth.signOut(); clearAuthTokenCache(); } catch (_) {}
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('game-storage');
                localStorage.removeItem('quest-storage');
                // New Game の意図を記録（OAuth後、既存キャラ存在チェック用）
                sessionStorage.setItem('cwd_new_game_intent', '1');
                // 古い intent フラグをクリア（残存防止）
                sessionStorage.removeItem('cwd_return_to_title');
                sessionStorage.removeItem('cwd_delete_intent');
            } catch (err) {
                console.warn('[TitlePage] Storage operation failed:', err);
            }
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
        try { await supabase.auth.signOut(); clearAuthTokenCache(); } catch (_) {}
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
                    avatar_url: avatarFile ? '' : (avatarPreview || '/images/icons/observer_gem.png'),
                    allocated_hp_points: allocatedHpPoints,
                    allocated_atk_points: allocatedAtkPoints,
                    allocated_def_points: allocatedDefPoints,
                    allocated_vit_points: allocatedVitPoints,
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

            await new Promise(r => setTimeout(r, 1000));
            await fetchUserProfile();
            setGameStarted();

            // X Ads Conversion Tracking: Sign Up
            const signupId = process.env.NEXT_PUBLIC_X_CONVERSION_SIGNUP_ID;
            if (signupId) {
                const { trackXEvent } = await import('@/utils/xads');
                trackXEvent(signupId);
            }

            setMode('LANDING_CARD');
        } catch (err: any) {
            console.error(err);
            alert(`作成失敗: ${err.message}`);
            setMode('CHAR_CREATION');
        }
    };

    // ─── CREATING 画面 ────────────────────────────────────────────────────
    if (mode === 'CREATING') {
        const handleUnlockAudio = () => {
            if (soundManager) {
                soundManager.init();
                soundManager.resume();
                soundManager.playPendingBgm();
            }
        };

        return (
            <div 
                onClick={handleUnlockAudio}
                className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden cursor-pointer"
                title="画面をタップするとBGMが再生されます"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(163,139,107,0.1)_0%,transparent_70%)] animate-pulse-slow"></div>
                </div>
                <MapIcon className="w-24 h-24 animate-spin-slow mb-8 text-amber-500 opacity-80" />
                <h2 className="text-xl md:text-2xl text-[#e3d5b8] mb-4 animate-fade-in tracking-[0.2em] font-bold drop-shadow-lg">世界に降り立っています...</h2>
                <p className="text-xs text-slate-500/80 tracking-widest animate-pulse z-10 mb-8">画面タップでBGMが再生されます</p>
                <div className="h-16 relative z-10"></div>
                <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden z-10">
                    <div className="h-full bg-amber-500 animate-progress-indeterminate"></div>
                </div>
            </div>
        );
    }

    // ─── LANDING_CARD 画面（新世代キャラクター降臨演出） ───────────────────────
    if (mode === 'LANDING_CARD') {
        const handleStartAdventure = () => {
            router.push('/inn');
        };

        return (
            <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden p-6 select-none animate-in fade-in duration-1000">
                {/* Background Magic Circle Aura */}
                <div className="absolute w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(217,119,6,0.06)_0%,transparent_60%)] animate-pulse-slow pointer-events-none" />

                {/* Magical particles */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />

                {/* Glowing Spinning Sigil */}
                <div className="absolute w-96 h-96 rounded-full border border-amber-500/10 animate-spin-slow flex items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 rounded-full border border-dashed border-amber-500/20" />
                    <div className="absolute w-60 h-60 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.05)_0%,transparent_70%)] animate-pulse" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full gap-6 animate-in zoom-in-95 duration-1000">
                    <div className="space-y-1 text-center">
                        <span className="text-[10px] text-amber-500/80 font-mono tracking-[0.4em] uppercase">Descent of Soul</span>
                        <h2 className="text-base font-bold text-amber-400 tracking-[0.2em] font-serif uppercase drop-shadow-[0_2px_10px_rgba(217,119,6,0.3)] animate-pulse">
                            新たなる命、世界に降り立つ
                        </h2>
                    </div>

                    {/* Character Parchment/Etched Slab Panel */}
                    <div className="w-64 py-6 px-5 rounded-xl bg-gradient-to-b from-[#101422] to-[#06080e] border border-amber-500/30 shadow-[0_0_35px_rgba(217,119,6,0.18)] flex flex-col gap-4 relative overflow-hidden animate-in slide-in-from-bottom duration-1000">
                        {/* Gold Aura glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08)_0%,transparent_60%)]" />
                        <div className="absolute inset-2 border border-amber-500/15 rounded-lg pointer-events-none" />

                        {/* Avatar / Class Crest */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-20 rounded-full border-2 border-amber-500/40 bg-black overflow-hidden relative shadow-lg shadow-black/80">
                                <img 
                                    src={avatarPreview || '/images/icons/observer_gem.png'} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-amber-100 font-serif leading-tight">{name}</h3>
                                <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] text-slate-500">
                                    <span>年齢: {age}歳</span>
                                    <span className="opacity-40">|</span>
                                    <span>{gender === 'Male' ? '男性' : gender === 'Female' ? '女性' : '不明'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Inherited parameters details */}
                        <div className="border-t border-b border-amber-500/15 py-3 space-y-2 text-[10px] text-slate-400 font-serif">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                <div className="flex justify-between border-b border-stone-900 pb-0.5">
                                    <span>HP:</span>
                                    <span className="text-green-400 font-bold font-mono">{previewStats?.max_hp}</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-900 pb-0.5">
                                    <span>VIT:</span>
                                    <span className="text-orange-400 font-bold font-mono">{previewStats?.max_vitality}</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-900 pb-0.5">
                                    <span>ATK:</span>
                                    <span className="text-red-400 font-bold font-mono">{previewStats?.atk}</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-900 pb-0.5">
                                    <span>DEF:</span>
                                    <span className="text-cyan-400 font-bold font-mono">{previewStats?.def}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between text-[8.5px] text-amber-500/80 font-mono tracking-wide pt-1">
                                <span>DECK COST CAPACITY:</span>
                                <span className="font-bold font-mono text-amber-400">{previewStats?.max_deck_cost}</span>
                            </div>
                        </div>

                        <div className="text-center text-[9px] text-slate-500 tracking-wider font-serif">
                            初期レベル 1 
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-400 tracking-wide text-center leading-relaxed max-w-xs">
                        星々の契約は果たされ、新たな命が宿りました。<br />
                        宿屋から、果てなきフロンティアへの第一歩を。
                    </p>

                    {/* Start Adventure Button */}
                    <button
                        onClick={handleStartAdventure}
                        className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-amber-950/20 flex items-center justify-center gap-1.5 font-serif border border-yellow-400/20"
                    >
                        <Compass className="w-3.5 h-3.5 text-slate-950 animate-spin-slow" />
                        旅を始める（宿屋へ）
                    </button>
                </div>
            </div>
        );
    }

    // ─── DELETING 画面（キャラクター削除処理中） ─────────────────────────────
    if (mode === 'DELETING') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden">
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
        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-stone-950">
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: 'url("/backgrounds/key_visual/cozy_inn.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'url("/textures/dark-leather.png")' }} />
        </div>
    );

    return (
        <div className="min-h-screen text-gray-200 font-sans flex flex-col items-center justify-center p-4 relative">

            {mode === 'ENTRY' || mode === 'MENU' || mode === 'CONTINUE_MENU' ? renderTitleBackground() : null}

            {/* Character Creation Background */}
            {mode === 'CHAR_CREATION' && (
                <div className="absolute inset-0 bg-[#080a10] pointer-events-none">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-sm"
                        style={{ backgroundImage: 'url("/backgrounds/key_visual/cozy_inn.png")' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-slate-950/70 to-stone-950/90" />
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>
                </div>
            )}

            <main className={`relative z-10 w-full max-w-md ${mode === 'CHAR_CREATION' ? 'bg-[#0d0f1f]/90 text-amber-100 p-8 rounded-2xl border border-amber-500/30 shadow-2xl backdrop-blur-md relative overflow-hidden' : 'p-8 flex flex-col items-center'}`}>

                {mode === 'CHAR_CREATION' && (
                    <div className="absolute inset-2 border border-amber-500/10 pointer-events-none rounded-xl"></div>
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

                        {/* New Game — Google OAuth 必須 (利用規約同意後に実行) */}
                        <button
                            onClick={() => setShowTermsModal(true)}
                            className="w-full bg-amber-900/40 border border-amber-500/70 text-amber-300 font-serif py-3.5 rounded hover:bg-amber-800/60 hover:border-amber-400 transition-all shadow-lg flex justify-center items-center gap-2 group"
                        >
                            <Sword className="w-4 h-4 group-hover:text-amber-200 transition-colors" />
                            <span className="group-hover:text-amber-100 tracking-widest text-base">New Game</span>
                        </button>

                        {/* Continue — Google OAuth */}
                        <button
                            onClick={() => setMode('CONTINUE_MENU')}
                            className="w-full bg-stone-950/70 backdrop-blur-sm border border-stone-600 text-stone-100 font-serif py-3.5 rounded hover:bg-stone-900/90 hover:border-amber-500/50 hover:text-amber-200 transition-all tracking-widest flex justify-center items-center gap-2 group"
                        >
                            <LogIn className="w-4 h-4 group-hover:text-amber-200 transition-colors" />
                            <span className="group-hover:text-stone-100">Continue / Transfer</span>
                        </button>

                        {/* Test Play — 匿名（7日間のみ） */}
                        <button
                            onClick={handleTestPlay}
                            className="w-full bg-stone-950/60 backdrop-blur-sm border border-stone-700 text-stone-200 font-serif py-3.5 rounded hover:bg-stone-900/80 hover:text-white hover:border-stone-500 transition-all tracking-widest flex flex-col items-center gap-1 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-stone-400" />
                                <span className="font-bold">Test Play</span>
                            </div>
                            <span className="text-[10px] text-stone-400 tracking-wide">アカウント連携なし・7日間限定</span>
                        </button>

                        {/* Play Guide / プレイガイド */}
                        <Link
                            href="/play-guide"
                            className="w-full bg-stone-950/50 backdrop-blur-sm border border-stone-700 text-stone-200 font-serif py-3.5 rounded hover:bg-amber-950/30 hover:text-amber-300 hover:border-amber-500/50 transition-all tracking-widest flex items-center justify-center gap-2 text-sm group"
                        >
                            <BookOpen className="w-4 h-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
                            <span className="font-bold">プレイガイド</span>
                        </Link>


                        {/* フッター: コピーライト + 法的リンク */}
                        <div className="mt-8 pt-4 border-t border-slate-800/50 space-y-2 text-center">
                            <div className="flex justify-center gap-3 flex-wrap">
                                <Link href="/legal/terms" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">利用規約</Link>
                                <Link href="/legal/privacy" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">プライバシー</Link>
                                <Link href="/legal/tokusho" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">特商法表記</Link>
                                <Link href="/legal/credits" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">権利表記</Link>
                                <a href="https://x.com/kitamu2026" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">公式X</a>
                            </div>
                            <div className="text-[9px] text-slate-700">© 2026 Code: Wirth-Dawn</div>
                        </div>

                    </div>
                )}

                {/* ─── 利用規約同意モーダル ─── */}
                {showTermsModal && (
                    <TermsOfServiceModal
                        onAgree={() => {
                            setShowTermsModal(false);
                            handleNewGame();
                        }}
                        onCancel={() => setShowTermsModal(false)}
                    />
                )}

                {/* ─── New Game 上書き確認モーダル ─── */}
                {showNewGameOverwrite && (
                    <DeleteConfirmModal
                        title="既存データの検出"
                        icon="⚔️"
                        description={<>このGoogleアカウントには<strong className="text-amber-400">既にキャラクターが存在</strong>します。<br />New Gameを開始するには、<strong className="text-red-400">既存の全データを削除</strong>する必要があります。</>}
                        confirmText="削除して新規作成"
                        confirmLoadingText="削除中..."
                        isLoading={isDeleting}
                        onCancel={async () => {
                            setShowNewGameOverwrite(false);
                            await supabase.auth.signOut();
                            clearAuthTokenCache();
                            setMode('MENU');
                        }}
                        onConfirm={async () => {
                            setShowNewGameOverwrite(false);
                            setMode('DELETING');
                            try {
                                const { data: { session: freshSession } } = await supabase.auth.getSession();
                                const token = freshSession?.access_token || pendingSessionToken;
                                if (!token) throw new Error('セッションが無効です。再度お試しください。');
                                const res = await fetch('/api/profile/reset', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                });
                                if (!res.ok && res.status !== 404) {
                                    throw new Error((await res.json()).error);
                                }
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
                                clearAuthTokenCache();
                                setMode('MENU');
                            } finally {
                                setIsDeleting(false);
                                setPendingSessionToken(null);
                            }
                        }}
                        footerAction={
                            <button
                                onClick={async () => {
                                    setShowNewGameOverwrite(false);
                                    setPendingSessionToken(null);
                                    setGameStarted();
                                    router.push('/inn');
                                }}
                                className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-1"
                            >
                                既存キャラクターで続ける →
                            </button>
                        }
                    />
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
                            className="w-full bg-stone-950/70 backdrop-blur-sm border border-stone-600 text-stone-100 font-serif py-3.5 rounded hover:bg-stone-900/90 hover:border-amber-500/50 hover:text-amber-200 transition-all flex flex-col items-center gap-1 group"
                        >
                            <div className="flex items-center gap-2">
                                <LogIn className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                                <span className="tracking-widest text-base">前回の継続</span>
                            </div>
                            <span className="text-[10px] text-stone-400 tracking-wide">Googleアカウントでログインして続きから始める</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full bg-red-950/20 border border-red-900/40 text-red-400/80 font-serif py-3.5 rounded hover:bg-red-950/40 hover:border-red-700 hover:text-red-300 transition-all flex flex-col items-center gap-1 text-sm"
                        >
                            <span className="tracking-widest font-bold">キャラクター削除（リセット）</span>
                            <span className="text-[10px] tracking-wide opacity-70">全データを消去して最初からやり直す</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setAuthError(null); setMode('MENU'); }}
                            className="w-full bg-stone-950/40 backdrop-blur-sm border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 font-serif text-xs tracking-widest py-2 rounded transition-colors text-center"
                        >
                            タイトルに戻る
                        </button>

                    </div>
                )}

                {/* ─── 削除確認ポップアップ ─── */}
                {showDeleteConfirm && (
                    <DeleteConfirmModal
                        title="キャラクター削除"
                        description={<>この操作は<strong className="text-red-400">絶対に元に戻せません</strong>。<br />キャラクター・所持金・装備・クエスト履歴など<br /><strong className="text-red-400">すべての資産と記録が永久に消滅</strong>します。</>}
                        confirmText="削除して再スタート"
                        onCancel={() => setShowDeleteConfirm(false)}
                        onConfirm={async () => {
                            setShowDeleteConfirm(false);
                            if (typeof window !== 'undefined') sessionStorage.setItem('cwd_delete_intent', '1');
                            await handleContinue();
                        }}
                    />
                )}


                {/* ─── CHAR_CREATION ─── */}
                {mode === 'CHAR_CREATION' && (
                    <div className="space-y-4 animate-fade-in relative z-10 p-1 max-w-md mx-auto w-full text-slate-200">

                        {/* ⚠️ テストプレイ警告バナー (Trial Play) */}
                        {isTestPlay && (
                            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 text-center shadow-lg">
                                <p className="text-amber-400 text-xs font-bold tracking-wide mb-1">⚠️ テストプレイ中 (Trial Play)</p>
                                <p className="text-amber-200/80 text-[10px] leading-relaxed">
                                    このキャラクターは <strong>7日後に失効</strong> します。<br />
                                    データを引き継ぐには、ゲーム内から Google アカウントと連携してください。
                                </p>
                            </div>
                        )}

                        {/* 🔮 占い師ナビゲーターの立ち絵エリア */}
                        <div className="flex flex-col items-center justify-center pt-1">
                            <div className="relative w-28 h-28 md:w-32 md:h-32 mb-1 overflow-hidden rounded-full border border-amber-500/30 bg-slate-950/70 shadow-2xl flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(217,119,6,0.25)]">
                                <img 
                                    src="/images/npcs/npc_fortune_teller.png" 
                                    alt="Fortune Teller" 
                                    className="w-full h-full object-cover scale-110 object-top"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%2378350f'/><text x='50' y='55' font-size='30' text-anchor='middle' dominant-baseline='middle'>🔮</text></svg>";
                                    }}
                                />
                            </div>
                            <div className="text-center font-serif text-[9px] text-amber-500/60 tracking-[0.4em] uppercase mb-0.5">
                                — Observer of Fate —
                            </div>
                            <div className="text-center font-serif text-xs text-amber-400 font-bold tracking-widest">
                                占い師
                            </div>
                        </div>

                        {/* 🔮 会話テキストウィンドウ (Dark Card) */}
                        <div className="bg-slate-950/60 border border-amber-900/40 rounded-xl p-4 shadow-xl space-y-3.5 relative">
                            <div className="absolute top-2 right-2 opacity-[0.03] pointer-events-none">
                                <Sparkles className="w-10 h-10 text-amber-500" />
                            </div>
                            
                            {/* セリフの表示 - 改行を排除して自然にラップ、フォントサイズを小さく調整 */}
                            <div className="text-amber-200/90 font-serif leading-relaxed text-xs md:text-sm border-b border-amber-500/15 pb-3 text-center">
                                <p className="italic text-amber-100 font-medium whitespace-pre-line animate-fade-in tracking-wide">
                                    {creationStep === 0 && "「よくぞ、昏き霧の彼方よりこの境界へ辿り着いた、名もなき旅人よ。私は運命を読み解きし者……」"}
                                    {creationStep === 1 && "「水面に映る、お前の魂の響きを聞かせておくれ。この先、世界を歩むとき、人々はお前をなんと呼ぶのですか？」"}
                                    {creationStep === 2 && "「お前が魂を宿すその器の属性と、重ねてきた時の長さ（年齢）はいくらか？それによって、お前が世界に宿す力（ステータス）が決まるのです……」"}
                                    {creationStep === 3 && "「お前の精神がまとう外殻、肉体の肖像をここに描き出しなさい……」"}
                                    {creationStep === 4 && "「……ふむ、お前の運命の輪郭が整いました。お前という存在が、この閉ざされた霧の向こう側、世界へ降り立つ準備はできたようです。」"}
                                </p>
                            </div>

                            {/* 各ステップごとの入力UIコントロール */}
                            <div className="animate-fade-in">
                                {/* Step 1: Name Input */}
                                {creationStep === 1 && (
                                    <div className="space-y-1 py-1">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-transparent border-b border-amber-500/40 focus:border-amber-400 text-amber-100 p-2 outline-none transition-colors text-lg text-center font-serif italic placeholder-amber-500/20"
                                            placeholder="汝の名は..."
                                            maxLength={16}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {/* Step 2: Gender and Age Input (Integrated) */}
                                {creationStep === 2 && (
                                    <div className="space-y-3.5">
                                        {/* Gender Select */}
                                        <div className="space-y-1">
                                            <div className="text-center text-[9px] text-amber-500/70 uppercase tracking-widest font-serif">器の属性 (Gender)</div>
                                            <div className="flex justify-center gap-2">
                                                {['Male', 'Female', 'Unknown'].map((g) => (
                                                    <button
                                                        key={g}
                                                        type="button"
                                                        onClick={() => setGender(g as any)}
                                                        className={`flex-1 py-2 border rounded-lg transition-all duration-300 font-serif text-xs tracking-widest
                                                            ${gender === g
                                                                ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-lg shadow-amber-950/50'
                                                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
                                                    >
                                                        {g === 'Male' ? 'Male' : g === 'Female' ? 'Female' : 'Unknown'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Age Select Slider */}
                                        <div className="space-y-1.5 pt-2 border-t border-amber-950/15">
                                            <div className="text-center text-[9px] text-amber-500/70 uppercase tracking-widest font-serif">重ねた星霜 (Age: {age}歳)</div>
                                            <div className="space-y-1 px-2">
                                                <input
                                                    type="range"
                                                    min="15"
                                                    max="40"
                                                    value={age}
                                                    onChange={(e) => setAge(Number(e.target.value))}
                                                    className="w-full accent-amber-500 cursor-pointer bg-slate-900 h-1.5 rounded-lg appearance-none"
                                                />
                                                <div className="flex justify-between text-[9px] font-mono text-amber-500/40 pt-0.5">
                                                    <span>15歳</span>
                                                    <span>40歳</span>
                                                </div>
                                            </div>

                                            {/* BP Allocation Section */}
                                            {(() => {
                                                const lp = userProfile?.legacy_points || 0;
                                                const isAlive = userProfile?.is_alive ?? true;
                                                const availableBP = !isAlive && lp > 0
                                                    ? Math.floor(lp / 300)
                                                     : 0;
                                                if (availableBP <= 0) return null;
                                                const spent = allocatedHpPoints + allocatedAtkPoints + allocatedDefPoints + allocatedVitPoints;
                                                return (
                                                    <div className="bg-slate-900/60 p-3 rounded-lg border border-amber-500/30 space-y-2 mt-2">
                                                        <div className="flex justify-between items-center border-b border-amber-950/20 pb-1">
                                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-serif">継承ボーナス (BP分配)</span>
                                                            <span className="text-xs font-bold text-amber-400">
                                                                残り: {availableBP - spent} / {availableBP} BP
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            {/* HP */}
                                                            <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-amber-900/10">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-400 font-bold text-[9px]">HP (+5 / BP)</span>
                                                                    <span className="text-amber-100 font-bold font-mono text-[11px]">+{allocatedHpPoints * 5} HP</span>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setAllocatedHpPoints(p => Math.max(0, p - 1))}
                                                                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 font-bold text-center flex items-center justify-center border border-slate-700 active:scale-95 text-slate-300"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            if (spent < availableBP) setAllocatedHpPoints(p => p + 1);
                                                                        }}
                                                                        className="w-5 h-5 rounded bg-amber-900/40 hover:bg-amber-900/60 font-bold text-center flex items-center justify-center border border-amber-500/30 active:scale-95 text-amber-200"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* ATK */}
                                                            <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-amber-900/10">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-400 font-bold text-[9px]">ATK (+1 / BP)</span>
                                                                    <span className="text-amber-100 font-bold font-mono text-[11px]">+{allocatedAtkPoints} ATK</span>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setAllocatedAtkPoints(p => Math.max(0, p - 1))}
                                                                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 font-bold text-center flex items-center justify-center border border-slate-700 active:scale-95 text-slate-300"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            if (spent < availableBP) setAllocatedAtkPoints(p => p + 1);
                                                                        }}
                                                                        className="w-5 h-5 rounded bg-amber-900/40 hover:bg-amber-900/60 font-bold text-center flex items-center justify-center border border-amber-500/30 active:scale-95 text-amber-200"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* DEF */}
                                                            <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-amber-900/10">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-400 font-bold text-[9px]">DEF (+1 / BP)</span>
                                                                    <span className="text-amber-100 font-bold font-mono text-[11px]">+{allocatedDefPoints} DEF</span>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setAllocatedDefPoints(p => Math.max(0, p - 1))}
                                                                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 font-bold text-center flex items-center justify-center border border-slate-700 active:scale-95 text-slate-300"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            if (spent < availableBP) setAllocatedDefPoints(p => p + 1);
                                                                        }}
                                                                        className="w-5 h-5 rounded bg-amber-900/40 hover:bg-amber-900/60 font-bold text-center flex items-center justify-center border border-amber-500/30 active:scale-95 text-amber-200"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Max VIT */}
                                                            <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-amber-900/10">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-400 font-bold text-[9px]">VIT (+2 / BP)</span>
                                                                    <span className="text-amber-100 font-bold font-mono text-[11px]">+{allocatedVitPoints * 2} VIT</span>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setAllocatedVitPoints(p => Math.max(0, p - 1))}
                                                                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 font-bold text-center flex items-center justify-center border border-slate-700 active:scale-95 text-slate-300"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => {
                                                                            if (spent < availableBP) setAllocatedVitPoints(p => p + 1);
                                                                        }}
                                                                        className="w-5 h-5 rounded bg-amber-900/40 hover:bg-amber-900/60 font-bold text-center flex items-center justify-center border border-amber-500/30 active:scale-95 text-amber-200"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Dynamic Flavor & Stats */}
                                            <div className="bg-black/50 p-2.5 rounded-lg border border-amber-950/30 min-h-[85px] relative mt-1">
                                                <p className="text-center font-serif text-amber-400/80 text-xs italic mb-1.5">
                                                    「{getFlavorText(age)}」
                                                </p>
                                                {previewStats ? (
                                                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-amber-200/90 text-[10px]">
                                                        <div className="bg-amber-950/20 py-0.5 rounded">HP<br /><span className="text-xs font-bold text-amber-100">{previewStats.max_hp}</span></div>
                                                        <div className="bg-amber-950/20 py-0.5 rounded">ATK<br /><span className="text-xs font-bold text-amber-100">{previewStats.atk}</span></div>
                                                        <div className="bg-amber-950/20 py-0.5 rounded">DEF<br /><span className="text-xs font-bold text-amber-100">{previewStats.def}</span></div>
                                                        <div className="bg-amber-950/20 py-0.5 rounded">Vit<br /><span className="text-xs font-bold text-amber-100">{previewStats.max_vitality}</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-[10px] text-amber-500/40 py-2">運命を算定中...</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Avatar Upload */}
                                {creationStep === 3 && (
                                    <div className="flex flex-col items-center gap-2 py-1">
                                        <div className="text-center text-[9px] text-amber-500/70 uppercase tracking-widest font-serif mb-1">魂の肖像 (Avatar)</div>
                                        <label className="cursor-pointer group relative">
                                            <div className="w-16 h-16 rounded-full border border-amber-500/40 group-hover:border-amber-400 overflow-hidden flex items-center justify-center bg-slate-950/80 transition-all shadow-xl">
                                                <img 
                                                    src={avatarPreview || '/images/icons/observer_gem.png'} 
                                                    alt="avatar preview" 
                                                    className="w-full h-full object-cover" 
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = '/images/icons/observer_gem.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 bg-amber-950 border border-amber-500/50 rounded-full p-1 shadow-lg group-hover:bg-amber-900 transition-colors">
                                                <Plus className="w-2.5 h-2.5 text-amber-400" />
                                            </div>
                                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                                        </label>
                                        <span className="text-[9px] text-amber-500/50">{avatarFile ? 'タップして画像を変更' : 'タップしてカスタム画像をアップロード'}</span>
                                    </div>
                                )}

                                {/* Step 4: Final Confirmation (Contract) */}
                                {creationStep === 4 && (
                                    <div className="bg-slate-950/70 rounded-xl p-3.5 space-y-2.5 border border-amber-600/40 max-w-xs mx-auto shadow-inner">
                                        <div className="flex justify-center mb-1">
                                            <img 
                                                src={avatarPreview || '/images/icons/observer_gem.png'} 
                                                alt="avatar" 
                                                className="w-14 h-14 rounded-full border border-amber-500 object-cover shadow-lg" 
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = '/images/icons/observer_gem.png';
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between border-b border-amber-950/15 pb-1">
                                                <span className="text-amber-500/70 font-serif">旅人の名</span>
                                                <span className="text-amber-100 font-bold font-serif italic">{name}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-amber-950/15 pb-1">
                                                <span className="text-amber-500/70 font-serif">性別</span>
                                                <span className="text-amber-100">{gender === 'Male' ? 'Male' : gender === 'Female' ? 'Female' : 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-amber-950/15 pb-1">
                                                <span className="text-amber-500/70 font-serif">年齢</span>
                                                <span className="text-amber-100 font-mono">{age} 歳</span>
                                            </div>
                                            {previewStats && (
                                                <div className="pt-1 grid grid-cols-4 gap-1 text-center font-mono text-[9px] text-amber-200/80">
                                                    <div><div>HP</div><div className="text-amber-100 font-bold">{previewStats.max_hp + (allocatedHpPoints * 5)}</div></div>
                                                    <div><div>ATK</div><div className="text-amber-100 font-bold">{previewStats.atk + (allocatedAtkPoints * 1)}</div></div>
                                                    <div><div>DEF</div><div className="text-amber-100 font-bold">{previewStats.def + (allocatedDefPoints * 1)}</div></div>
                                                    <div><div>VIT</div><div className="text-amber-100 font-bold">{previewStats.max_vitality + (allocatedVitPoints * 2)}</div></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* エラーメッセージ表示 */}
                            {errorMsg && <p className="text-red-500 text-[10px] text-center font-bold mt-1">{errorMsg}</p>}
                        </div>

                        {/* 🔮 コントロールボタンエリア (Wizard Navigation - Premium Gold/Dark Aesthetic) */}
                        <div className="space-y-2 pt-1">
                            {creationStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setCreationStep(prev => prev + 1)}
                                    disabled={creationStep === 1 && !name.trim()}
                                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-serif font-bold tracking-widest py-3 rounded-lg disabled:opacity-30 border border-amber-400/30 active:scale-[0.99] transition-all shadow-[0_4px_15px_rgba(217,119,6,0.15)] flex items-center justify-center gap-2"
                                >
                                    <span>{creationStep === 0 ? '運命に身を委ねる' : '先へ進む'}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(true)}
                                    disabled={!name.trim() || !previewStats}
                                    className="w-full group bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-serif font-bold tracking-widest py-3.5 rounded-lg disabled:opacity-50 border border-amber-400/40 transition-all shadow-[0_4px_20px_rgba(217,119,6,0.25)] flex items-center justify-center gap-3 overflow-hidden active:scale-[0.99]"
                                >
                                    <span className="relative z-10 transition-transform group-hover:scale-105">世界に降り立つ（契約）</span>
                                    <Compass className="w-5 h-5 relative z-10 transition-transform duration-700 group-hover:rotate-180 text-amber-100" />
                                </button>
                            )}

                            <div className="flex gap-2">
                                {/* 前に戻る */}
                                {creationStep > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setCreationStep(prev => prev - 1)}
                                        className="flex-1 border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 hover:text-white font-serif text-[11px] tracking-widest py-2.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1 shadow-md"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
                                        <span>前に戻る</span>
                                    </button>
                                )}

                                {/* やり直す / タイトルに戻る */}
                                {(!isReincarnation || creationStep === 4) && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (creationStep === 4) {
                                                // 契約やり直し
                                                setCreationStep(0);
                                                setName('');
                                                setGender('Male');
                                                setAge(20);
                                                setAvatarFile(null);
                                                setAvatarPreview('/images/icons/observer_gem.png');
                                            } else {
                                                // タイトルに戻る
                                                clearGameStarted();
                                                try { await supabase.auth.signOut(); clearAuthTokenCache(); } catch (_) {}
                                                setMode('ENTRY');
                                                setName('');
                                                setAvatarFile(null);
                                                setAvatarPreview('/images/icons/observer_gem.png');
                                                setCreationStep(0);
                                            }
                                        }}
                                        className="flex-1 border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 hover:text-white font-serif text-[11px] tracking-widest py-2.5 rounded-lg transition-colors text-center shadow-md"
                                    >
                                        {creationStep === 4 ? 'やり直す' : 'タイトルへ戻る'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 最終確認モーダル */}
                        {showConfirm && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowConfirm(false)}>
                                <div className="bg-[#0d0f1f] border border-amber-500/30 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                                    <h3 className="text-lg font-serif text-amber-400 text-center mb-6 tracking-widest">— 運命の契約 —</h3>

                                    {isTestPlay && (
                                        <div className="bg-amber-950/60 border border-amber-800/50 rounded px-3 py-2 mb-4 text-center">
                                            <p className="text-amber-500 text-[10px]">⚠️ テストプレイ — 7日後に失効します</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-center mb-3">
                                            <img 
                                                src={avatarPreview || '/images/icons/observer_gem.png'} 
                                                alt="avatar" 
                                                className="w-16 h-16 rounded-full border border-amber-700 object-cover shadow-lg"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = '/images/icons/observer_gem.png';
                                                }}
                                            />
                                        </div>
                                        <div className="bg-slate-950/80 rounded-lg p-4 space-y-2 text-sm border border-amber-700/40">
                                            <div className="flex justify-between">
                                                <span className="text-amber-400/80 font-serif">名前</span>
                                                <span className="text-amber-100 font-bold">{name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-400/80 font-serif">性別</span>
                                                <span className="text-amber-100">{gender === 'Male' ? 'Male' : gender === 'Female' ? 'Female' : 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-400/80 font-serif">年齢</span>
                                                <span className="text-amber-100">{age}歳</span>
                                            </div>
                                            {previewStats && (
                                                <div className="space-y-1.5 pt-2 border-t border-amber-700/30">
                                                    <div className="grid grid-cols-4 gap-1">
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">HP</div><div className="text-amber-200 font-mono font-bold">{previewStats.max_hp}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">ATK</div><div className="text-amber-200 font-mono font-bold">{previewStats.atk}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">DEF</div><div className="text-amber-200 font-mono font-bold">{previewStats.def}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-400/60">Vit</div><div className="text-amber-200 font-mono font-bold">{previewStats.max_vitality}</div></div>
                                                    </div>
                                                    <div className="text-center text-[10px] text-amber-400/60 pt-1">Gold　<span className="text-amber-200 font-mono font-bold">{previewStats.gold?.toLocaleString() ?? '—'} G</span></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-slate-700/85 text-slate-300 font-serif rounded-lg text-xs hover:border-slate-650 hover:text-white transition-colors bg-slate-900/40">戻る</button>
                                        <button
                                            onClick={() => handleCharacterSubmit()}
                                            className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-serif font-bold rounded-lg text-xs hover:text-white transition-all shadow-lg border border-amber-400/30"
                                        >
                                            契約を交わす
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
