'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAuthToken, getAuthHeaders } from '@/lib/authToken';
import { useGameStore } from '@/store/gameStore';
import { clearGameStarted } from '@/hooks/useAuthGuard';
import { safeLocalStorage, safeSessionStorage } from '@/lib/safeStorage';
import { UI_RULES } from '@/constants/game_rules';
import SoundSettingsPanel from '@/components/sound/SoundSettingsPanel';
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

const AVATAR_BORDER_COLORS: Record<SubscriptionTier, string> = {
    free: 'border-[#a38b6b]/50',
    basic: 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
    premium: 'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
};

export default function AccountSettingsModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { userProfile, fetchUserProfile } = useGameStore();
    const router = useRouter();

    // UI States
    const [error, setError] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const [avatarSuccess, setAvatarSuccess] = useState('');
    const [billingLoading, setBillingLoading] = useState<string | null>(null);
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkSuccess, setLinkSuccess] = useState(false);

    // v27.0: タイトルに戻る確認
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // v27.0: プラン詳細展開
    const [showPlanDetails, setShowPlanDetails] = useState(false);
    // v27.0: ポータルローディング
    const [portalLoading, setPortalLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 内部IDポップアップステート
    const [showIdPopup, setShowIdPopup] = useState(false);
    const [idCopied, setIdCopied] = useState(false);

    // ユーザー名編集
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(userProfile?.name || '');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');

    // 自己紹介編集
    const [editIntro, setEditIntro] = useState(userProfile?.introduction || '');
    const [introLoading, setIntroLoading] = useState(false);
    const [introError, setIntroError] = useState('');
    const [introSuccess, setIntroSuccess] = useState('');

    // プロフィールデータ同期
    React.useEffect(() => {
        if (userProfile?.introduction !== undefined) {
            setEditIntro(userProfile.introduction || '');
        }
    }, [userProfile?.introduction]);

    // ── 自己紹介変更 ──
    const handleIntroSave = async () => {
        setIntroLoading(true);
        setIntroError('');
        setIntroSuccess('');
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('認証セッションがありません');

            const res = await fetch('/api/character/introduction', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ introduction: editIntro }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '自己紹介の変更に失敗しました');

            await fetchUserProfile();
            setIntroSuccess('自己紹介を保存しました');
            setTimeout(() => setIntroSuccess(''), 3000);
        } catch (e: any) {
            setIntroError(e.message);
        } finally {
            setIntroLoading(false);
        }
    };

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
            const token = await getAuthToken();
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

    const handleCopyId = () => {
        if (!userProfile?.id) return;
        navigator.clipboard.writeText(userProfile.id);
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
    };

    // ── Stripe カスタマーポータル v27.0 ──
    const handleOpenPortal = async () => {
        setPortalLoading(true);
        try {
            const token = await getAuthToken();
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
            // 本登録完了後に自動でパックプロモーションを開くため、sessionStorageにフラグを保存
            safeSessionStorage.setItem('wirth_dawn_just_registered', 'true');

            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/inn`,
                    queryParams: {
                        prompt: 'select_account consent'
                    }
                },
            });
            if (error) throw error;
            // → Google OAuth画面にリダイレクトされる
            // → コールバック後 /inn に戻り、匿名アカウントにGoogle identityが紐付く
        } catch (e: any) {
            safeSessionStorage.removeItem('wirth_dawn_just_registered');
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
        safeLocalStorage.removeItem('game-storage');
        safeLocalStorage.removeItem('quest-storage');
        safeSessionStorage.setItem('cwd_return_to_title', '1');
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
            const authHeaders = await getAuthHeaders();

            const res = await fetch('/api/character/avatar', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
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

    if (!mounted) return null;

    return createPortal(
        <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
            <div className="bg-[#1a120b] border-2 border-[#a38b6b] w-full max-w-md shadow-2xl relative p-6 font-sans overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-serif font-bold text-[#e3d5b8] mb-6 border-b border-[#a38b6b]/40 pb-2">
                    設定
                </h2>

                {/* ── エラー表示 ── */}
                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">
                        <p>{error}</p>
                    </div>
                )}

                {/* ── カテゴリ1：プロフィール ── */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <div className="flex items-center gap-4">
                        {/* アバター画像＋重ね合わせカメラバッジ */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <div className={`w-full h-full rounded-full overflow-hidden border-2 bg-gray-800 ${AVATAR_BORDER_COLORS[currentTier]}`}>
                                <img
                                    src={userProfile?.avatar_url || UI_RULES.DEFAULT_AVATAR}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label
                                htmlFor="avatar-upload"
                                className={`absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#1a120b] border border-[#a38b6b] flex items-center justify-center cursor-pointer transition-all hover:bg-[#a38b6b]/20
                                    ${avatarUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="アバター画像を変更 (JPEG/PNG/WebP・10MB以下)"
                            >
                                <Camera className="w-3.5 h-3.5 text-[#a38b6b]" />
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                                id="avatar-upload"
                                disabled={avatarUploading}
                            />
                        </div>

                        {/* ユーザー名＆ID表示ボタン */}
                        <div className="flex-1 min-w-0">
                            {isEditingName ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        maxLength={16}
                                        className="w-full bg-[#0d0906] border border-[#a38b6b]/50 text-[#e3d5b8] px-2 py-1 rounded text-sm font-serif focus:border-amber-500 outline-none transition-colors"
                                        placeholder="ユーザー名を入力"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleNameSave}
                                            disabled={nameLoading || editName.trim().length === 0}
                                            className="flex-1 py-1 text-xs font-bold bg-amber-900/40 border border-amber-600 text-amber-200 rounded hover:bg-amber-900/60 transition-colors disabled:opacity-40"
                                        >
                                            {nameLoading ? '保存中...' : '保存'}
                                        </button>
                                        <button
                                            onClick={handleNameCancel}
                                            disabled={nameLoading}
                                            className="flex-1 py-1 text-xs font-bold bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                                        >
                                            キャンセル
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600">名前の変更は週1回まで可能です</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-[#e3d5b8] text-lg font-serif italic truncate max-w-[140px]">
                                            {userProfile?.name || '名もなき旅人'}
                                        </span>
                                        {currentTier === 'basic' && (
                                            <span className="text-blue-400 text-sm flex-shrink-0 select-none font-sans" title="Basic">⚡</span>
                                        )}
                                        {currentTier === 'premium' && (
                                            <span className="text-yellow-400 text-sm flex-shrink-0 select-none font-sans" title="Premium">👑</span>
                                        )}
                                        <button
                                            onClick={() => { setEditName(userProfile?.name || ''); setIsEditingName(true); setNameError(''); setNameSuccess(''); }}
                                            className="p-1 text-[#a38b6b] hover:text-amber-400 transition-colors flex-shrink-0"
                                            title="名前を変更"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => setShowIdPopup(true)}
                                            className="text-[10px] text-[#a38b6b] hover:text-amber-400 transition-colors border border-[#a38b6b]/30 px-2 py-0.5 rounded bg-black/20"
                                        >
                                            内部IDを表示
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {avatarError && (
                        <div className="mt-2 text-red-400 text-xs">
                            {avatarError}
                        </div>
                    )}
                    {avatarSuccess && (
                        <div className="mt-2 text-green-400 text-xs">
                            {avatarSuccess}
                        </div>
                    )}
                    {nameError && (
                        <div className="mt-2 text-red-400 text-xs">
                            {nameError}
                        </div>
                    )}
                    {nameSuccess && (
                        <div className="mt-2 text-green-400 text-xs">
                            {nameSuccess}
                        </div>
                    )}

                    {/* 自己紹介設定 */}
                    <div className="mt-4 pt-4 border-t border-[#3e2723]/30">
                        <label className="block text-xs font-bold text-[#a38b6b] mb-1.5">自己紹介 (最大30文字)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editIntro}
                                onChange={(e) => {
                                    setEditIntro(e.target.value);
                                    setIntroError('');
                                    setIntroSuccess('');
                                }}
                                maxLength={30}
                                placeholder="自己紹介を入力してください"
                                className="flex-1 bg-[#0d0906] border border-[#a38b6b]/50 text-[#e3d5b8] px-3 py-1.5 rounded text-xs font-serif focus:border-amber-500 outline-none transition-colors"
                            />
                            <button
                                onClick={handleIntroSave}
                                disabled={introLoading || editIntro === (userProfile?.introduction || '')}
                                className="px-4 py-1.5 text-xs font-bold bg-amber-900/40 border border-amber-600 text-amber-200 rounded hover:bg-amber-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {introLoading ? '保存中...' : '保存'}
                            </button>
                        </div>
                        {introError && <p className="mt-1 text-red-400 text-[10px]">{introError}</p>}
                        {introSuccess && <p className="mt-1 text-green-400 text-[10px]">{introSuccess}</p>}
                    </div>
                </div>

                {/* ── カテゴリ2：プレイガイド ── */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3">
                        プレイガイド ＆ 公式リンク
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                onClose();
                                router.push('/play-guide');
                            }}
                            className="w-full flex items-center justify-center py-2.5 px-4 bg-amber-950/20 border border-[#a38b6b]/40 text-amber-200 text-sm font-bold rounded hover:bg-amber-900/40 hover:border-amber-400 transition-all cursor-pointer"
                        >
                            プレイガイドを開く
                        </button>
                        <a
                            href="https://x.com/kitamu2026"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-900/40 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-bold rounded transition-all text-center"
                        >
                            公式X (旧Twitter)
                        </a>
                    </div>
                </div>

                {/* ── カテゴリ3：サウンド設定 ── */}
                <div className="mb-5 pb-5 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3">
                        サウンド設定
                    </h3>
                    <SoundSettingsPanel />
                </div>

                {/* ── カテゴリ4：プラン・アカウント設定 ── */}
                <div className="mb-5 pb-5 border-b border-[#3e2723] space-y-4">
                    <div>
                        <h3 className="text-[#a38b6b] text-sm font-bold mb-3">
                            プラン・アカウント設定
                        </h3>
                        <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center px-3 py-1 border rounded text-sm font-bold ${TIER_COLORS[currentTier]}`}>
                                {TIER_LABELS[currentTier]}
                            </div>
                            <button
                                onClick={() => setShowPlanDetails(!showPlanDetails)}
                                className="text-[10px] text-[#a38b6b] hover:text-amber-400 transition-colors"
                            >
                                {showPlanDetails ? '詳細を閉じる' : '詳細を見る'}
                            </button>
                        </div>

                        {showPlanDetails && (
                            <div className="mt-3 bg-black/30 border border-slate-800 rounded p-3 text-xs space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                                {currentTier === 'free' && (
                                    <>
                                        <p className="text-slate-400">キャラクタースロット: <span className="text-slate-200">1枠</span></p>
                                        <p className="text-slate-400">英霊登録: <span className="text-slate-200">不可</span></p>
                                        <p className="text-slate-400">Weeklyボーナス: <span className="text-slate-200">なし</span></p>
                                    </>
                                )}
                                {currentTier === 'basic' && (
                                    <>
                                        <p className="text-slate-400">月額: <span className="text-slate-200">880円（税込）</span></p>
                                        <p className="text-slate-400">キャラクタースロット: <span className="text-slate-200">3枠</span></p>
                                        <p className="text-slate-400">英霊登録: <span className="text-slate-200">最大3体 (ロイヤリティ 25%)</span></p>
                                        <p className="text-slate-400">Weeklyボーナス: <span className="text-slate-200">2,000G/週</span></p>
                                    </>
                                )}
                                {currentTier === 'premium' && (
                                    <>
                                        <p className="text-slate-400">月額: <span className="text-slate-200">2,200円（税込）</span></p>
                                        <p className="text-slate-400">キャラクタースロット: <span className="text-slate-200">5枠</span></p>
                                        <p className="text-slate-400">英霊登録: <span className="text-slate-200">最大10体 (ロイヤリティ 35%)</span></p>
                                        <p className="text-slate-400">Weeklyボーナス: <span className="text-slate-200">5,000G/週</span></p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Stripeカスタマーポータル */}
                        {currentTier !== 'free' && (
                            <button
                                onClick={handleOpenPortal}
                                disabled={portalLoading}
                                className="mt-3 w-full flex items-center justify-center py-1.5 text-[11px] font-bold text-slate-400 border border-slate-700 rounded hover:text-amber-400 hover:border-[#a38b6b] transition-colors disabled:opacity-40"
                            >
                                {portalLoading ? '読み込み中...' : 'プラン管理・解約'}
                            </button>
                        )}
                    </div>

                    {/* Google連携（ゲストユーザーのみ表示） */}
                    {isAnonymous && (
                        <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg p-4">
                            <h4 className="text-amber-400 text-xs font-bold mb-2">
                                アカウント連携
                            </h4>
                            <p className="text-amber-300/70 text-[11px] leading-relaxed mb-3">
                                テストプレイのデータを保護するには、Googleアカウントとの連携が必要です。
                                連携後もすべてのデータが引き継がれ、サブスクリプションやゴールド購入も利用可能になります。
                            </p>
                            <button
                                onClick={handleLinkGoogle}
                                disabled={linkLoading}
                                className="w-full flex items-center justify-center py-2 px-4 bg-white/10 border border-amber-500/60 text-amber-200 text-xs font-bold rounded hover:bg-amber-900/40 hover:border-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {linkLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-2" />
                                        Google 認証を開始中...
                                    </>
                                ) : (
                                    "Google アカウントと連携する"
                                )}
                            </button>
                            <p className="text-[10px] text-amber-600/60 text-center mt-2">
                                7日間の保存期限が解除され、データが永続化されます
                            </p>
                        </div>
                    )}
                </div>

                {/* ── 最下部：タイトルに戻る ── */}
                <div className="pt-2">
                    <button
                        onClick={requestReturnToTitle}
                        className="w-full bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-900/40 font-bold py-3 px-4 rounded transition-colors shadow flex items-center justify-center"
                    >
                        タイトルに戻る
                    </button>
                    {isAnonymous && (
                        <p className="text-[10px] text-red-400/60 text-center mt-2">
                            テストプレイのデータは保存されません
                        </p>
                    )}
                </div>

                {/* 内部IDポップアップダイアログ */}
                {showIdPopup && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-[110] animate-in fade-in duration-150">
                        <div className="bg-[#1a120b] border-2 border-[#a38b6b] p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
                            <h4 className="text-[#e3d5b8] text-sm font-bold border-b border-[#a38b6b]/30 pb-2">内部ID (お問い合わせ用)</h4>
                            <div className="bg-black/50 p-2 rounded text-xs font-mono text-gray-400 break-all select-all">
                                {userProfile?.id || 'Unknown'}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopyId}
                                    className="flex-1 py-2 text-xs font-bold bg-amber-900/40 border border-amber-600 text-amber-200 rounded hover:bg-amber-900/60 transition-colors"
                                >
                                    {idCopied ? 'コピー完了' : 'コピーする'}
                                </button>
                                <button
                                    onClick={() => setShowIdPopup(false)}
                                    className="flex-1 py-2 text-xs font-bold bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

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
        </>,
        document.body
    );
}
