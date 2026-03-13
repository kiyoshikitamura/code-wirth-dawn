'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Link as LinkIcon, AlertCircle, CheckCircle2, Camera, Upload, Crown, Zap, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { UI_RULES } from '@/constants/game_rules';

interface Props {
    onClose: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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
    const [identities, setIdentities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const [avatarSuccess, setAvatarSuccess] = useState('');
    const [billingLoading, setBillingLoading] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchIdentities() {
            setLoading(true);
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                setError(error.message);
            } else if (user) {
                setIdentities(user.identities || []);
            }
            setLoading(false);
        }
        fetchIdentities();
    }, []);

    const isAnonymous = identities.length === 0 || identities.every(id => id.provider === 'anonymous');
    const currentTier: SubscriptionTier = (userProfile as any)?.subscription_tier ?? 'free';

    const handleLinkIdentity = async (provider: 'google' | 'twitter') => {
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider: provider,
                options: { redirectTo: `${window.location.origin}/inn` }
            });
            if (error) throw error;
        } catch (e: any) {
            console.error('Link Identity Error:', e);
            setError(e.message || 'アカウント連携に失敗しました');
        }
    };

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

    const handleReturnToTitle = () => {
        if (isAnonymous) {
            if (!confirm("現在、未連携アカウントのため、タイトルに戻るとデータにアクセスできなくなります。本当にタイトルに戻りますか？")) {
                return;
            }
        }
        window.location.href = '/title';
    };

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
            setAvatarError('ファイルサイズが大きすぎます。2MB以下の画像を選択してください。');
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
                    <LinkIcon className="w-6 h-6" />
                    アカウント設定
                </h2>

                {/* ── サブスクリプション Tier 表示 ── */}
                <div className="mb-6 pb-6 border-b border-[#3e2723]">
                    <h3 className="text-[#a38b6b] text-sm font-bold mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        プラン
                    </h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded text-sm font-bold mb-4 ${TIER_COLORS[currentTier]}`}>
                        {currentTier === 'premium' && <Crown className="w-3.5 h-3.5" />}
                        {currentTier === 'basic' && <Zap className="w-3.5 h-3.5" />}
                        {TIER_LABELS[currentTier]}
                    </div>

                    {currentTier !== 'premium' && (
                        <div className="space-y-2">
                            {currentTier === 'free' && (
                                <button
                                    onClick={() => handleUpgradeTier('basic')}
                                    disabled={!!billingLoading || isAnonymous}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-600 text-blue-300 text-sm font-bold rounded hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Zap className="w-4 h-4" />
                                    {billingLoading === 'basic' ? '処理中...' : 'Basic にアップグレード'}
                                </button>
                            )}
                            <button
                                onClick={() => handleUpgradeTier('premium')}
                                disabled={!!billingLoading || isAnonymous}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-yellow-500 text-yellow-300 text-sm font-bold rounded hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Crown className="w-4 h-4" />
                                {billingLoading === 'premium' ? '処理中...' : 'Premium にアップグレード'}
                            </button>
                            {isAnonymous && (
                                <p className="text-xs text-gray-500 text-center">※ 課金にはアカウント連携が必要です</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── アバター変更セクション ── */}
                <div className="mb-6 pb-6 border-b border-[#3e2723]">
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
                            <p className="text-xs text-gray-600 mt-1">JPEG / PNG / WebP・2MB以下</p>
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

                {/* ── エラー表示 ── */}
                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-200 p-3 rounded mb-6 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8 text-gray-500 animate-pulse font-serif italic">
                        読み込み中...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {isAnonymous ? (
                            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-sm">
                                <div className="flex items-center gap-2 text-yellow-500 mb-2 font-bold">
                                    <ShieldAlert className="w-5 h-5" />
                                    <span>未連携アカウント</span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed font-serif">
                                    現在、あなたのデータは端末にのみ保存される「匿名プレイ」状態です。
                                    ブラウザのデータを削除したり、別の端末からプレイしたい場合は、外部アカウントと連携(データ引き継ぎ)を行ってください。
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-900/20 border border-green-700/50 p-4 rounded-sm">
                                <div className="flex items-center gap-2 text-green-400 mb-2 font-bold">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>アカウント連携済み</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-3">
                                    以下のプロバイダでデータ引き継ぎが有効です:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-300 ml-2 space-y-1">
                                    {identities.filter(id => id.provider !== 'anonymous').map(id => (
                                        <li key={id.identity_id} className="capitalize">{id.provider}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="pt-4 border-t border-[#3e2723] space-y-3">
                            <p className="text-[#a38b6b] text-sm font-bold text-center mb-4">連携するアカウントを選択</p>
                            <button
                                onClick={() => handleLinkIdentity('google')}
                                className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 px-4 rounded transition-colors shadow flex items-center justify-center gap-2"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                Google で連携する
                            </button>
                        </div>

                        <div className="text-center mt-6 space-y-4">
                            <span className="text-xs text-gray-600 font-mono break-all bg-black/50 p-2 rounded block">
                                内部ID: {userProfile?.id || 'Unknown'}
                            </span>

                            <button
                                onClick={handleReturnToTitle}
                                className="w-full bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-900/40 font-bold py-3 px-4 rounded transition-colors shadow flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-5 h-5" />
                                タイトルに戻る
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
