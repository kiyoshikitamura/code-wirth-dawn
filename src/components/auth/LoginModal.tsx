
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
    onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.session) {
                // Successful login
                // Check if profile exists, if so go to Inn, else maybe stay?
                // For now, just reload or go to Inn
                router.push('/inn');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a121e] border border-[#a38b6b] p-6 rounded max-w-sm w-full relative shadow-2xl">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-white">✕</button>

                <h2 className="text-xl font-serif text-[#e3d5b8] mb-4 text-center">冒険の再開</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs text-[#a38b6b] mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 p-2 text-gray-200 text-sm focus:border-[#a38b6b] outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[#a38b6b] mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 p-2 text-gray-200 text-sm focus:border-[#a38b6b] outline-none"
                            required
                        />
                    </div>

                    {error && <div className="text-red-500 text-xs text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#a38b6b] text-[#1a0f00] font-bold py-2 rounded hover:bg-[#c2b280] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Reading Grimoire...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}
