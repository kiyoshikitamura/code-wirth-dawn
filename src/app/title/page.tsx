'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { Sword, Shield, Map as MapIcon, Hourglass, Compass, LogIn, PlayCircle } from 'lucide-react';
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
    const [mode, setMode] = useState<'ENTRY' | 'MENU' | 'CHAR_CREATION' | 'CREATING'>('ENTRY');

    // テストプレイ（匿名）フラグ — CHAR_CREATION 時にバナー表示用
    const [isTestPlay, setIsTestPlay] = useState(false);

    // OAuth エラーメッセージ
    const [authError, setAuthError] = useState<string | null>(null);

    // アバター
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('画像は2MB以内にしてください。'); return; }
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

    // Dynamic Flavor Text
    const getFlavorText = (currentAge: number) => {
        if (currentAge <= 19) return "若さは最大の武器...";
        if (currentAge <= 29) return "心身ともに円熟の時...";
        if (currentAge <= 39) return "経験は盾となり...";
        return "黄昏の時が近づく...";
    };

    // ─── OAuth コールバック処理 ────────────────────────────────────────────
    // /auth/callback から ?code= で戻ってきた場合にセッションを確立する
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const authErrParam = params.get('auth_error');

        if (authErrParam) {
            setAuthError(`認証エラー: ${authErrParam}`);
            setMode('MENU');
            return;
        }

        if (code) {
            // URL をクリーン
            window.history.replaceState({}, '', '/title');
            // コードをセッションに交換してから状態確認
            setMode('CREATING');
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                    setAuthError(`認証に失敗しました: ${error.message}`);
                    setMode('MENU');
                } else {
                    checkUserStatus();
                }
            });
        }
    }, []);

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

        if (profile) {
            router.push('/inn');
        } else {
            // 匿名かどうかを判定してフラグをセット
            setIsTestPlay(user.is_anonymous ?? false);
            setMode('CHAR_CREATION');
        }
    }, [fetchUserProfile, router]);

    // ─── ハンドラー ───────────────────────────────────────────────────────

    const handleTapToStart = () => setMode('MENU');

    /**
     * New Game — Google OAuth 必須
     * OAuth 完了後 /auth/callback → /title?code=xxx → exchangeCodeForSession → checkUserStatus
     */
    const handleNewGame = async () => {
        setAuthError(null);
        // 前回セッション・ストアをクリア
        try { await supabase.auth.signOut(); } catch (_) {}
        if (typeof window !== 'undefined') {
            localStorage.removeItem('game-storage');
            localStorage.removeItem('quest-storage');
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
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
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
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

            // アバターアップロード（任意）
            let uploadedAvatarUrl: string | null = null;
            if (avatarFile && userId) {
                try {
                    const ext = avatarFile.name.split('.').pop();
                    const folder = isTestPlay ? 'anon' : 'users';
                    const path = `${folder}/${userId}/${Date.now()}.${ext}`;
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
                    if (!uploadError) {
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                        uploadedAvatarUrl = urlData.publicUrl;
                    }
                } catch (uploadErr) {
                    console.warn('[avatar upload] 失敗（続行）:', uploadErr);
                }
            }
            setIsUploading(false);

            const { data: startLoc } = await supabase.from('locations').select('id').eq('slug', 'loc_border_town').maybeSingle();

            const dummyBirthDate = new Date();
            dummyBirthDate.setFullYear(dummyBirthDate.getFullYear() - age);
            const birthDateStr = dummyBirthDate.toISOString().split('T')[0];

            const res = await fetch('/api/profile/init', {
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
                    ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
                })
            });

            if (!res.ok) throw new Error((await res.json()).error);

            await new Promise(r => setTimeout(r, 4000));
            await fetchUserProfile();
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
                <h2 className="text-3xl md:text-5xl text-[#e3d5b8] mb-8 animate-fade-in tracking-[0.2em] font-bold drop-shadow-lg">世界を構築中...</h2>
                <div className="space-y-4 text-center text-gray-400 font-mono text-sm md:text-base h-32 relative z-10">
                    <p className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>&gt; 因果律の定着を確認...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '1.5s' }}>&gt; 歴史の編纂を開始...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '2.5s' }}>&gt; 魂の座標を確定。</p>
                </div>
                <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden z-10">
                    <div className="h-full bg-amber-500 animate-progress-indeterminate"></div>
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

            {mode === 'ENTRY' || mode === 'MENU' ? renderTitleBackground() : null}

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

                {(mode === 'ENTRY' || mode === 'MENU') && (
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
                            className="w-full bg-amber-900/20 border border-amber-500/50 text-amber-400 font-serif py-4 rounded hover:bg-amber-900/40 hover:border-amber-400 transition-all shadow-lg tracking-widest flex justify-center items-center gap-2 group"
                        >
                            <Sword className="w-5 h-5 group-hover:text-amber-300 transition-colors" />
                            <span className="group-hover:text-amber-200">New Game</span>
                            <span className="text-[10px] text-amber-600/70 ml-1">(Google アカウント必須)</span>
                        </button>

                        {/* Continue — Google OAuth */}
                        <button
                            onClick={handleContinue}
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
                            className="w-full bg-transparent border border-slate-700/50 text-slate-500 font-serif py-3 rounded hover:bg-slate-900/30 hover:text-slate-400 hover:border-slate-600 transition-all tracking-widest flex flex-col items-center gap-0.5 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4" />
                                <span>Test Play</span>
                            </div>
                            <span className="text-[9px] text-slate-600 tracking-wide">アカウント連携なし・7日間限定・データ引き継ぎ不可</span>
                        </button>
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

                        {/* 最終確認モーダル */}
                        {showConfirm && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowConfirm(false)}>
                                <div className="bg-[#1a1208] border-2 border-amber-800/60 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
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
                                        <div className="bg-black/40 rounded-lg p-4 space-y-2 text-sm border border-amber-900/30">
                                            <div className="flex justify-between">
                                                <span className="text-amber-900/70 font-serif">名前</span>
                                                <span className="text-amber-200 font-bold">{name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-900/70 font-serif">性別</span>
                                                <span className="text-amber-200">{gender === 'Male' ? '男' : gender === 'Female' ? '女' : '不明'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-900/70 font-serif">年齢</span>
                                                <span className="text-amber-200">{age}歳</span>
                                            </div>
                                            {previewStats && (
                                                <div className="space-y-1 pt-2 border-t border-amber-900/20">
                                                    <div className="grid grid-cols-4 gap-1">
                                                        <div className="text-center"><div className="text-[10px] text-amber-900/60">HP</div><div className="text-amber-300 font-mono font-bold">{previewStats.max_hp}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-900/60">ATK</div><div className="text-amber-300 font-mono font-bold">{previewStats.atk}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-900/60">DEF</div><div className="text-amber-300 font-mono font-bold">{previewStats.def}</div></div>
                                                        <div className="text-center"><div className="text-[10px] text-amber-900/60">Vit</div><div className="text-amber-300 font-mono font-bold">{previewStats.max_vitality}</div></div>
                                                    </div>
                                                    <div className="text-center text-[10px] text-amber-900/60">Gold　<span className="text-amber-300 font-mono font-bold">{previewStats.gold?.toLocaleString() ?? '—'} G</span></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-amber-900/40 text-amber-900/70 font-serif rounded-lg text-sm hover:border-amber-800 transition-colors">戻る</button>
                                        <button
                                            onClick={() => handleCharacterSubmit()}
                                            className="flex-1 py-3 bg-slate-950 border border-amber-700 text-amber-400 font-serif font-bold rounded-lg text-sm hover:bg-slate-900 hover:border-amber-500 transition-all shadow-lg"
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
