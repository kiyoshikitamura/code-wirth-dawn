'use client';

import React, { useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Camera, Upload, Crown, Zap, LogOut, Volume2, Coins, Pencil, User, Hash, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { clearGameStarted } from '@/hooks/useAuthGuard';
import { UI_RULES } from '@/constants/game_rules';
import SoundSettingsPanel from '@/components/sound/SoundSettingsPanel';

interface Props {
    onClose: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type SubscriptionTier = 'free' | 'basic' | 'premium';

const TIER_LABELS: Record<SubscriptionTier, string> = {
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
    free: 'text-gray-400 border-gray-600 bg-gray-900/30',
    basic: 'text-blue-300 border-blue-600 bg-blue-900/20',
    premium: 'text-yellow-300 border-yellow-500 bg-yellow-900/20',
};

export default function AccountSettingsModal({ onClose }: Props) {
    const { userProfile, fetchUserProfile } = useGameStore();

    // UI States
    const [error, setError] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const [avatarSuccess, setAvatarSuccess] = useState('');
    const [billingLoading, setBillingLoading] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ユーザー名編集
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(userProfile?.name || '');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');

    const isAnonymous = userProfile?.is_anonymous === true;
    const currentTier: SubscriptionTier = (userProfile as any)?.subscription_tier ?? 'free';

    // ── ユーザー名変更 ──
    const handleNameSave = async () => {
        const trimmed = editName.trim();
        if (trimmed === userProfile?.name) {
            setIsEditingName(false);
            return;
        }

        setNameLoading(true);
        setNameError('');
        setNameSuccess('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('認証セッションがありません');

            const res = await fetch('/api/character/name', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: trimmed }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '名前の変更に失敗しました');

            await fetchUserProfile();
            setNameSuccess('名前を変更しました');
            setIsEditingName(false);
            setTimeout(() => setNameSuccess(''), 3000);
        } catch (e: any) {
            setNameError(e.message);
        } finally {
            setNameLoading(false);
        }
    };

    const handleNameCancel = () => {
        setEditName(userProfile?.name || '');
        setIsEditingName(false);
        setNameError('');
    };

    // ── プランアップグレード ──
    const handleUpgradeTier = async (tier: 'basic' | 'premium') => {
        setBillingLoading(tier);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userProfile?.id, mode: 'subscription', tier }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '決済URLの取得に失敗しました');
            window.location.href = data.url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBillingLoading(null);
        }
    };

    // ── ゴールド購入 ──
    const handleBuyGold = async (packageKey: 'gold_10k' | 'gold_50k') => {
        setBillingLoading(packageKey);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userProfile?.id, mode: 'payment', packageKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '決済URLの取得に失敗しました');
            window.location.href = data.url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBillingLoading(null);
        }
    };

    // ── タイトルに戻る ──
    const handleReturnToTitle = async () => {
        if (isAnonymous) {
            if (!confirm("テストプレイのデータは保存されません。タイトルに戻るとこのデータは失われます。本当にタイトルに戻りますか？")) {
                return;
            }
        }
        clearGameStarted();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('game-storage');
            localStorage.removeItem('quest-storage');
            sessionStorage.setItem('cwd_return_to_title', '1');
        }
        try { await supabase.auth.signOut(); } catch (_) {}
        window.location.href = '/title';
    };

    // ── アバターアップロード ──
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError('');
        setAvatarSuccess('');

        if (!ALLOWED_TYPES.includes(file.type)) {
            setAvatarError('非対応の形式です。JPEG / PNG / WebP のみ使用できます。');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setAvatarError('ファイルサイズが大きすぎます。10MB以下の画像を選択してください。');
            return;
        }

        setAvatarUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || userProfile?.id;
            if (!userId) throw new Error('ユーザーIDが取得できません');

            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `${userId}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const avatarUrl = `${publicUrl}?t=${Date.now()}`;
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/character/avatar', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userId ? { 'x-user-id': userId } : {}),
                },
                body: JSON.stringify({
                    avatar_url: avatarUrl,
                    file_size: file.size,
                    file_type: file.type,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '更新に失敗しました');
            }

            await fetchUserProfile();
            setAvatarSuccess('アイコンを更新しました！');
        } catch (e: any) {
            console.error('[Avatar Upload]', e);
            setAvatarError(e.message || 'アップロードに失敗しました');
        } finally {
            setAvatarUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a120b] border-2 border-[#a38b6b] w-full max-w-md shadow-2xl relative p-6 font-sans overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-serif font-bold text-[#e3d5b8] mb-6 flex items-center gap-2 border-b border-[#a38b6b]/40 pb-2">
                    <Settings className="w-6 h-6" />
                    設定
                </h2>

                {/* ── エラー表示 ── */}
                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    §1  ユーザー名（編集可能）
                   ══════════════════════════════════════════════ */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        ユーザー名
                    </h3>
                    {isEditingName ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                maxLength={16}
                                className="w-full bg-[#0d0906] border border-[#a38b6b]/50 text-[#e3d5b8] px-3 py-2 rounded text-sm font-serif focus:border-amber-500 outline-none transition-colors"
                                placeholder="1〜16文字"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleNameSave}
                                    disabled={nameLoading || editName.trim().length === 0}
                                    className="flex-1 py-1.5 text-xs font-bold bg-amber-900/40 border border-amber-600 text-amber-200 rounded hover:bg-amber-900/60 transition-colors disabled:opacity-40"
                                >
                                    {nameLoading ? '保存中...' : '保存'}
                                </button>
                                <button
                                    onClick={handleNameCancel}
                                    disabled={nameLoading}
                                    className="flex-1 py-1.5 text-xs font-bold bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                                >
                                    キャンセル
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-600">※ 名前の変更は週1回まで</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-[#e3d5b8] text-lg font-serif italic">
                                {userProfile?.name || '名もなき旅人'}
                            </span>
                            <button
                                onClick={() => { setEditName(userProfile?.name || ''); setIsEditingName(true); setNameError(''); setNameSuccess(''); }}
                                className="p-1.5 text-[#a38b6b] hover:text-amber-400 transition-colors"
                                title="名前を変更"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {nameError && (
                        <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {nameError}
                        </div>
                    )}
                    {nameSuccess && (
                        <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {nameSuccess}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════
                    §2  プロフィールアイコン変更
                   ══════════════════════════════════════════════ */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        プロフィールアイコン
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#a38b6b]/50 bg-gray-800 flex-shrink-0">
                            <img
                                src={userProfile?.avatar_url || UI_RULES.DEFAULT_AVATAR}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                                id="avatar-upload"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className={`flex items-center justify-center gap-2 w-full py-2 px-4 border text-sm font-bold transition-all cursor-pointer
                                    ${avatarUploading
                                        ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'border-[#a38b6b] text-[#a38b6b] hover:bg-[#a38b6b]/10'
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                {avatarUploading ? 'アップロード中...' : '画像を変更'}
                            </label>
                            <p className="text-xs text-gray-600 mt-1">JPEG / PNG / WebP・10MB以下</p>
                        </div>
                    </div>
                    {avatarError && (
                        <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {avatarError}
                        </div>
                    )}
                    {avatarSuccess && (
                        <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {avatarSuccess}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════
                    §3  登録プラン表示
                   ══════════════════════════════════════════════ */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        プラン
                    </h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded text-sm font-bold ${TIER_COLORS[currentTier]}`}>
                        {currentTier === 'premium' && <Crown className="w-3.5 h-3.5" />}
                        {currentTier === 'basic' && <Zap className="w-3.5 h-3.5" />}
                        {TIER_LABELS[currentTier]}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    §4  内部ID（お問い合わせ用）
                   ══════════════════════════════════════════════ */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        内部ID
                    </h3>
                    <span className="text-xs text-gray-500 font-mono break-all bg-black/50 p-2 rounded block">
                        {userProfile?.id || 'Unknown'}
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1">※ お問い合わせ時にこのIDをお伝えください</p>
                </div>

                {/* ══════════════════════════════════════════════
                    §5  BGM / SE 音量変更
                   ══════════════════════════════════════════════ */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        サウンド設定
                    </h3>
                    <SoundSettingsPanel />
                </div>

                {/* ══════════════════════════════════════════════
                    §6-7  課金セクション（テストプレイユーザーには非表示）
                   ══════════════════════════════════════════════ */}
                {!isAnonymous && (
                    <>
                        {/* ── プランアップグレード ── */}
                        {currentTier !== 'premium' && (
                            <div className="mb-5 pb-5 border-b border-[#3e2723]">
                                <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    プランアップグレード
                                </h3>
                                <div className="space-y-2">
                                    {currentTier === 'free' && (
                                        <button
                                            onClick={() => handleUpgradeTier('basic')}
                                            disabled={!!billingLoading}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-600 text-blue-300 text-sm font-bold rounded hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Zap className="w-4 h-4" />
                                            {billingLoading === 'basic' ? '処理中...' : 'Basic にアップグレード'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleUpgradeTier('premium')}
                                        disabled={!!billingLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-yellow-500 text-yellow-300 text-sm font-bold rounded hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Crown className="w-4 h-4" />
                                        {billingLoading === 'premium' ? '処理中...' : 'Premium にアップグレード'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── ゴールド購入 ── */}
                        <div className="mb-5 pb-5 border-b border-[#3e2723]">
                            <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                                <Coins className="w-4 h-4" />
                                ゴールド購入
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleBuyGold('gold_10k')}
                                    disabled={!!billingLoading}
                                    className="w-full flex items-center justify-between py-2.5 px-4 border border-yellow-700/50 text-yellow-200 text-sm rounded hover:bg-yellow-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-yellow-400 font-bold">🪙 10,000 G</span>
                                        <span className="text-gray-400 text-xs">スターターパック</span>
                                    </span>
                                    <span className="font-bold text-yellow-300">
                                        {billingLoading === 'gold_10k' ? '処理中...' : '330円（税込）'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleBuyGold('gold_50k')}
                                    disabled={!!billingLoading}
                                    className="w-full flex items-center justify-between py-2.5 px-4 border border-yellow-600/60 text-yellow-200 text-sm rounded hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-yellow-900/10"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-yellow-400 font-bold">🪙 50,000 G</span>
                                        <span className="text-gray-400 text-xs">アドベンチャーパック</span>
                                        <span className="text-[10px] bg-yellow-600 text-white px-1.5 py-0.5 rounded font-bold">おすすめ</span>
                                    </span>
                                    <span className="font-bold text-yellow-300">
                                        {billingLoading === 'gold_50k' ? '処理中...' : '1,430円（税込）'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════
                    §8  タイトルに戻る
                   ══════════════════════════════════════════════ */}
                <div className="pt-2">
                    <button
                        onClick={handleReturnToTitle}
                        className="w-full bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-900/40 font-bold py-3 px-4 rounded transition-colors shadow flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        タイトルに戻る
                    </button>
                    {isAnonymous && (
                        <p className="text-[10px] text-red-400/60 text-center mt-2">
                            ⚠ テストプレイのデータは保存されません
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
