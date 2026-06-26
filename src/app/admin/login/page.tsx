'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeLocalStorage } from '@/lib/safeStorage';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/kpi', {
                headers: {
                    'x-admin-key': password
                }
            });

            if (res.ok) {
                safeLocalStorage.setItem('adminKey', password);
                router.push('/admin/dashboard');
            } else {
                setError('認証キーが正しくありません。');
            }
        } catch (err) {
            setError('接続エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#070d19] text-gray-100 font-sans">
            {/* 背景のネオン装飾 */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-md p-8 bg-[#0a1628]/80 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Code: Wirth-Dawn
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">管理者用ダッシュボード 認証</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            ADMIN SECRET KEY
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="管理者用の認証キーを入力してください"
                            className="w-full px-4 py-3 bg-[#0d1f38] border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all placeholder-gray-600"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="relative w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '認証中...' : 'ログイン'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/title" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                        ← ゲームのタイトル画面へ戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
