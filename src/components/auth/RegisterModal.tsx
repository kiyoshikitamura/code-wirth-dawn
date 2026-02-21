
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface RegisterModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function RegisterModal({ onClose, onSuccess }: RegisterModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                }
            });

            if (error) throw error;

            setMessage("確認メールを送信しました。メールを確認して登録を完了してください。");
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a121e] border border-[#a38b6b] p-6 rounded max-w-sm w-full relative shadow-2xl">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-white">✕</button>

                <h2 className="text-xl font-serif text-[#e3d5b8] mb-4 text-center">新規冒険者登録</h2>

                {message ? (
                    <div className="text-green-400 text-center p-4">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
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
                                minLength={6}
                            />
                        </div>

                        {error && <div className="text-red-500 text-xs text-center">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#a38b6b] text-[#1a0f00] font-bold py-2 rounded hover:bg-[#c2b280] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : '登録メールを送信'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
