'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { Sword, Shield, Map as MapIcon, Hourglass } from 'lucide-react';

export default function TitlePage() {
    const router = useRouter();
    const { userProfile, fetchUserProfile } = useGameStore();
    const [step, setStep] = useState<'FORM' | 'CREATING'>('FORM');

    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>('Male');

    // Force clear old state on mount if needed, or just trust the user came here intentionally
    useEffect(() => {
        // Optional: Ensure we have a profile to update, or create one if missing
        fetchUserProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setStep('CREATING');

        try {
            // If userProfile is null (new user), we might need to insert?
            // Existing logic assumes 'user_profiles' exists via template/auth.
            // Safe fallback: Update if exists, Input if not?
            // For now assuming existing restricted profile from 'reset'.

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    title_name: name,
                    gender: gender,
                    age: 20,
                    accumulated_days: 0,
                    gold: 1000,
                    current_location_id: (await getHubId()) // Ensure starting at Hub
                })
                .eq('id', userProfile?.id || (await supabase.auth.getUser()).data.user?.id);

            // If Update failed due to no ID, handled by Supabase Auth generally. 
            // In this local-ish app, we rely on the single user row concept often used in dev.

            if (error) console.error("Profile update error", error);

            // Long animation
            await new Promise(r => setTimeout(r, 4000));

            await fetchUserProfile();
            router.push('/inn');
        } catch (err) {
            console.error(err);
            setStep('FORM');
        }
    };

    const getHubId = async () => {
        const { data } = await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').single();
        return data?.id;
    }

    if (step === 'CREATING') {
        return (
            <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#a38b6b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(163,139,107,0.1)_0%,transparent_70%)] animate-pulse-slow"></div>
                </div>

                <MapIcon className="w-24 h-24 animate-spin-slow mb-8 text-[#a38b6b] opacity-80" />

                <h2 className="text-3xl md:text-5xl text-[#e3d5b8] mb-8 animate-fade-in tracking-[0.2em] font-bold drop-shadow-lg">
                    世界を構築中...
                </h2>

                <div className="space-y-4 text-center text-gray-400 font-mono text-sm md:text-base h-32">
                    <p className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>&gt; 因果律の定着を確認...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '1.5s' }}>&gt; 歴史の編纂を開始...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '2.5s' }}>&gt; 魂の座標を確定。</p>
                </div>

                <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#a38b6b] animate-progress-indeterminate"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050b14] text-gray-200 font-sans flex flex-col items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-[url('/backgrounds/creation_bg.jpg')] bg-cover bg-center opacity-20 pointer-events-none"></div>

            <main className="relative z-10 w-full max-w-lg bg-[#0a121e]/90 border border-[#a38b6b]/30 p-8 rounded-lg shadow-[0_0_30px_rgba(163,139,107,0.1)] backdrop-blur-sm">
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-serif text-[#e3d5b8] mb-2 tracking-widest drop-shadow-md">Code: Wirth-Dawn</h1>
                    <div className="text-xs text-[#a38b6b] uppercase tracking-[0.3em] opacity-80">Chronicles of the Unnamed</div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
                    <div className="space-y-2">
                        <label className="block text-sm text-[#a38b6b] font-serif tracking-wider">あなたの名前</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border-b-2 border-[#333] focus:border-[#a38b6b] text-gray-200 p-3 outline-none transition-colors text-lg text-center font-serif placeholder-gray-800"
                            placeholder="名前を入力..."
                            autoFocus
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm text-[#a38b6b] font-serif tracking-wider text-center">性別</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setGender('Male')}
                                className={`p-4 border rounded flex flex-col items-center gap-2 transition-all duration-300 ${gender === 'Male'
                                        ? 'bg-[#1a202c] border-blue-500/50 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-105'
                                        : 'bg-black/30 border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                                    }`}
                            >
                                <Sword className="w-8 h-8" strokeWidth={1.5} />
                                <span className="text-sm font-serif">男性</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setGender('Female')}
                                className={`p-4 border rounded flex flex-col items-center gap-2 transition-all duration-300 ${gender === 'Female'
                                        ? 'bg-[#1a202c] border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-105'
                                        : 'bg-black/30 border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                                    }`}
                            >
                                <Shield className="w-8 h-8" strokeWidth={1.5} />
                                <span className="text-sm font-serif">女性</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full group relative overflow-hidden bg-[#a38b6b] text-[#1a0f00] font-bold py-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#c2b280] mt-8 shadow-lg"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest text-lg font-serif">
                            世界へ旅立つ <MapIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                </form>
            </main>
        </div>
    );
}
