'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';

interface Props {
    onClose: () => void;
}

export default function AccountSettingsModal({ onClose }: Props) {
    const { userProfile } = useGameStore();
    const [identities, setIdentities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const handleLinkIdentity = async (provider: 'google' | 'twitter') => {
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/inn`,
                }
            });
            if (error) throw error;
            // The browser will redirect to the OAuth provider
        } catch (e: any) {
            console.error('Link Identity Error:', e);
            setError(e.message || 'アカウント連携に失敗しました');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a120b] border-2 border-[#a38b6b] w-full max-w-md shadow-2xl relative p-6 font-sans">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-serif font-bold text-[#e3d5b8] mb-6 flex items-center gap-2 border-b border-[#a38b6b]/40 pb-2">
                    <LinkIcon className="w-6 h-6" />
                    データ引き継ぎ設定
                </h2>

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

                            {/* X (Twitter) Linking - Assuming Supabase is configured for it */}
                            {/* <button
                                onClick={() => handleLinkIdentity('twitter')}
                                className="w-full bg-black text-white hover:bg-gray-900 border border-gray-800 font-bold py-3 px-4 rounded transition-colors shadow flex items-center justify-center gap-2"
                            >
                                <span className="font-serif text-xl leading-none">𝕏</span>
                                X (Twitter) で連携する
                            </button> */}
                        </div>

                        <div className="text-center mt-6">
                            <span className="text-xs text-gray-600 font-mono break-all bg-black/50 p-2 rounded block">
                                内部ID: {userProfile?.id || 'Unknown'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

