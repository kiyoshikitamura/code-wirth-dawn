'use client';

import React, { useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Camera, Upload, Crown, Zap, LogOut, Volume2, Coins, Pencil, User, Hash, Settings, Link, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { clearGameStarted } from '@/hooks/useAuthGuard';
import { UI_RULES } from '@/constants/game_rules';
import SoundSettingsPanel from '@/components/sound/SoundSettingsPanel';
import PurchaseConfirmModal from '@/components/ui/PurchaseConfirmModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkSuccess, setLinkSuccess] = useState(false);

    // v27.0: 購入確認ポップアップ
    const [purchaseConfirm, setPurchaseConfirm] = useState<any>(null);
    // v27.0: タイトルに戻る確認
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // v27.0: プラン詳細展開
    const [showPlanDetails, setShowPlanDetails] = useState(false);
    // v27.0: ポータルローディング
    const [portalLoading, setPortalLoading] = useState(false);
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

    // ── 共通billing呼び出し（JWT認証付き） v27.0 ──
    const callBillingCheckout = async (body: Record<string, any>) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('認証セッションがありません');
        const res = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '決済URLの取得に失敗しました');
        return data.url;
    };

    // ── プランアップグレード（確認ポップアップ経由） ──
    const requestUpgradeTier = (tier: 'basic' | 'premium') => {
        setPurchaseConfirm({ type: 'subscription', tier });
    };
    const executeUpgradeTier = async (tier: 'basic' | 'premium') => {
        setBillingLoading(tier);
        try {
            const url = await callBillingCheckout({ mode: 'subscription', tier });
            window.location.href = url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBillingLoading(null);
            setPurchaseConfirm(null);
        }
    };

    // ── ゴールド購入（確認ポップアップ経由） ──
    const requestBuyGold = (packageKey: 'gold_10k' | 'gold_50k') => {
        setPurchaseConfirm({ type: 'gold', packageKey });
    };
    const executeBuyGold = async (packageKey: 'gold_10k' | 'gold_50k') => {
        setBillingLoading(packageKey);
        try {
            const url = await callBillingCheckout({ mode: 'payment', packageKey });
            window.location.href = url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBillingLoading(null);
            setPurchaseConfirm(null);
        }
    };

    // ── Stripe カスタマーポータル v27.0 ──
    const handleOpenPortal = async () => {
        setPortalLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('認証セッションがありません');
            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'ポータルURLの取得に失敗しました');
            window.location.href = data.url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setPortalLoading(false);
        }
    };

    // ── Google アカウント連携 (linkIdentity) ──
    const handleLinkGoogle = async () => {
        setLinkLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/inn`,
                },
            });
            if (error) throw error;
            // → Google OAuth画面にリダイレクトされる
            // → コールバック後 /inn に戻り、匿名アカウントにGoogle identityが紐付く
        } catch (e: any) {
            setError(`Google連携に失敗しました: ${e.message}`);
            setLinkLoading(false);
        }
    };

    // ── タイトルに戻る（v27.0: ConfirmDialog使用） ──
    const requestReturnToTitle = () => {
        setShowLogoutConfirm(true);
    };
    const executeReturnToTitle = async () => {
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
        <>
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
                    §3  登録プラン表示 (v27.0: 詳細展開 + ポータルリンク)
                   ══════════════════════════════════════════════ */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        プラン
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded text-sm font-bold ${TIER_COLORS[currentTier]}`}>
                            {currentTier === 'premium' && <Crown className="w-3.5 h-3.5" />}
                            {currentTier === 'basic' && <Zap className="w-3.5 h-3.5" />}
                            {TIER_LABELS[currentTier]}
                        </div>
                        <button
                            onClick={() => setShowPlanDetails(!showPlanDetails)}
                            className="text-[10px] text-[#a38b6b] hover:text-amber-400 transition-colors flex items-center gap-1"
                        >
                            {showPlanDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {showPlanDetails ? '閉じる' : '詳細を見る'}
                        </button>
                    </div>

                    {showPlanDetails && (
                        <div className="mt-3 bg-black/30 border border-slate-800 rounded p-3 text-xs space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                            {currentTier === 'free' && (
                                <>
                                    <p className="text-slate-400">キャラクタースロット: <span className="text-slate-200">1枠</span></p>
                                    <p className="text-slate-400">英霊登録: <span className="text-red-400">不可</span></p>
                                    <p className="text-slate-400">Weeklyボーナス: <span className="text-red-400">なし</span></p>
                                </>
                            )}
                            {currentTier === 'basic' && (
                                <>
                                    <p className="text-slate-400">月額: <span className="text-slate-200">880円（税込）</span></p>
                                    <p className="text-slate-400">キャラクタースロット: <span className="text-slate-200">3枠</span></p>
                                    <p className="text-slate-400">英霊登録: <span className="text-slate-200">最大3体 (ロイヤリティ 25%)</span></p>
                                    <p className="text-slate-400">Weeklyボーナス: <span className="text-blue-300">2,000G/週</span></p>
                                </>
                            )}
                            {currentTier === 'premium' && (
                                <>
                                    <p className="text-slate-400">月額: <span className="text-slate-200">2,200円（税込）</span></p>
                                    <p className="text-slate-400">キャラクタースロット: <span className="text-slate-200">5枠</span></p>
                                    <p className="text-slate-400">英霊登録: <span className="text-slate-200">最大10体 (ロイヤリティ 35%)</span></p>
                                    <p className="text-slate-400">Weeklyボーナス: <span className="text-yellow-300">5,000G/週</span></p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Stripeカスタマーポータル (有料プランのみ) */}
                    {currentTier !== 'free' && (
                        <button
                            onClick={handleOpenPortal}
                            disabled={portalLoading}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-slate-400 border border-slate-700 rounded hover:text-amber-400 hover:border-[#a38b6b] transition-colors disabled:opacity-40"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {portalLoading ? '読み込み中...' : 'プラン管理・解約（Stripe）'}
                        </button>
                    )}
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
                    §5.5  Google連携（テストプレイユーザーのみ表示）
                   ══════════════════════════════════════════════ */}
                {isAnonymous && (
                    <div className="mb-5 pb-5 border-b border-[#3e2723]">
                        <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg p-4">
                            <h3 className="text-amber-400 text-sm font-bold mb-2 flex items-center gap-2">
                                <Link className="w-4 h-4" />
                                アカウント連携
                            </h3>
                            <p className="text-amber-300/70 text-xs leading-relaxed mb-3">
                                テストプレイのデータを保護するには、Googleアカウントとの連携が必要です。
                                連携後も<strong className="text-amber-300">全てのデータが引き継がれ</strong>、
                                サブスクリプションやゴールド購入も利用可能になります。
                            </p>
                            <button
                                onClick={handleLinkGoogle}
                                disabled={linkLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 border border-amber-500/60 text-amber-200 text-sm font-bold rounded hover:bg-amber-900/40 hover:border-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {linkLoading ? '連携中...' : 'Google アカウントと連携する'}
                            </button>
                            <p className="text-[10px] text-amber-600/60 text-center mt-2">
                                ※ 7日間の保存期限が解除され、データが永続化されます
                            </p>
                        </div>
                    </div>
                )}

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
                                            onClick={() => requestUpgradeTier('basic')}
                                            disabled={!!billingLoading}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-600 text-blue-300 text-sm font-bold rounded hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Basic にアップグレード
                                        </button>
                                    )}
                                    <button
                                        onClick={() => requestUpgradeTier('premium')}
                                        disabled={!!billingLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-yellow-500 text-yellow-300 text-sm font-bold rounded hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Crown className="w-4 h-4" />
                                        Premium にアップグレード
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
                                    onClick={() => requestBuyGold('gold_10k')}
                                    disabled={!!billingLoading}
                                    className="w-full flex items-center justify-between py-2.5 px-4 border border-yellow-700/50 text-yellow-200 text-sm rounded hover:bg-yellow-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-yellow-400 font-bold">🪙 10,000 G</span>
                                        <span className="text-gray-400 text-xs">スターターパック</span>
                                    </span>
                                    <span className="font-bold text-yellow-300">330円（税込）</span>
                                </button>
                                <button
                                    onClick={() => requestBuyGold('gold_50k')}
                                    disabled={!!billingLoading}
                                    className="w-full flex items-center justify-between py-2.5 px-4 border border-yellow-600/60 text-yellow-200 text-sm rounded hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-yellow-900/10"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-yellow-400 font-bold">🪙 50,000 G</span>
                                        <span className="text-gray-400 text-xs">アドベンチャーパック</span>
                                        <span className="text-[10px] bg-yellow-600 text-white px-1.5 py-0.5 rounded font-bold">おすすめ</span>
                                    </span>
                                    <span className="font-bold text-yellow-300">1,430円（税込）</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════
                    §8  タイトルに戻る (v27.0: ConfirmDialog使用)
                   ══════════════════════════════════════════════ */}
                <div className="pt-2">
                    <button
                        onClick={requestReturnToTitle}
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

        {/* v27.0: 購入確認ポップアップ */}
        {purchaseConfirm && (
            <PurchaseConfirmModal
                purchase={purchaseConfirm}
                loading={!!billingLoading}
                onConfirm={() => {
                    if (purchaseConfirm.type === 'subscription') {
                        executeUpgradeTier(purchaseConfirm.tier);
                    } else {
                        executeBuyGold(purchaseConfirm.packageKey);
                    }
                }}
                onCancel={() => setPurchaseConfirm(null)}
            />
        )}

        {/* v27.0: タイトルに戻る確認ダイアログ */}
        {showLogoutConfirm && (
            <ConfirmDialog
                title="タイトルに戻る"
                variant={isAnonymous ? 'danger' : 'warning'}
                message={
                    isAnonymous
                        ? 'テストプレイのデータは保存されません。タイトルに戻るとこのデータは失われます。本当にタイトルに戻りますか？'
                        : 'ログアウトしてタイトル画面に戻ります。よろしいですか？'
                }
                confirmText="タイトルに戻る"
                cancelText="キャンセル"
                onConfirm={executeReturnToTitle}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        )}
        </>
    );
}
