'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { Sword, Shield, Map as MapIcon, Hourglass } from 'lucide-react';
import SecretQuestionModal from '@/components/auth/SecretQuestionModal';

export default function TitlePage() {
    const router = useRouter();
    const { userProfile, fetchUserProfile } = useGameStore();

    // Flow State: ENTRY -> AUTH(Login/Register) -> SECRET_SETUP -> CHAR_CREATION -> GAME
    // Actually, ENTRY is the default view with Login/Start buttons.
    // If Start -> Check Auth. If no Auth -> Register Modal.
    // If Login -> Login Modal.
    // After Auth -> Check Secret. If no Secret -> Secret Modal.
    // After Secret -> Check Profile. If no Profile -> Char Creation (FORM).

    const [mode, setMode] = useState<'ENTRY' | 'SECRET_SETUP' | 'CHAR_CREATION' | 'CREATING'>('ENTRY');

    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>('Male');
    const [inputAge, setInputAge] = useState(20);
    const [inputMonth, setInputMonth] = useState(1);
    const [inputDay, setInputDay] = useState(1);
    const [birthDate, setBirthDate] = useState('');
    const [age, setAge] = useState<number | null>(null);
    const [previewStats, setPreviewStats] = useState<any>(null);
    const [dateError, setDateError] = useState('');

    // Initial Check
    useEffect(() => {
        checkUserStatus();
    }, []);

    const handleStart = async () => {
        setMode('CREATING'); // Shows loading state while authenticating
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
            alert('通信エラー: ' + error.message);
            setMode('ENTRY');
            return;
        }
        await checkUserStatus();
    };

    const checkUserStatus = async () => {
        // Use getUser to validate session against server (handles wiped users)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            await supabase.auth.signOut();
            setMode('ENTRY');
            return;
        }

        if (user) {
            // User is logged in. Check Secret & Profile.
            // 1. Check Secret
            const { data: secret } = await supabase
                .from('user_secrets')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!secret) {
                setMode('SECRET_SETUP');
                return;
            }

            // 2. Check Profile
            await fetchUserProfile();
            // We need to wait for store update or fetch directly
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                // All good, go to Inn
                router.push('/inn');
            } else {
                setMode('CHAR_CREATION');
            }
        }
    };

    // Calculate Stats Effect (Same as before)
    useEffect(() => {
        if (inputAge < 16 || inputAge > 25) return;
        const today = new Date();
        let birthYear = today.getFullYear() - inputAge;
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        let isBirthdayPassed = false;
        if (currentMonth > inputMonth) isBirthdayPassed = true;
        else if (currentMonth === inputMonth && currentDay >= inputDay) isBirthdayPassed = true;
        if (!isBirthdayPassed) birthYear -= 1;

        const computedDateStr = `${birthYear}-${String(inputMonth).padStart(2, '0')}-${String(inputDay).padStart(2, '0')}`;
        const isValidDate = !isNaN(new Date(computedDateStr).getTime());

        if (!isValidDate) {
            setDateError('無効な日付です');
            setPreviewStats(null);
            return;
        }

        setBirthDate(computedDateStr);
        setDateError('');

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/auth/calculate-stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ birth_date: computedDateStr })
                });
                const data = await res.json();
                if (!res.ok) setDateError(data.error || 'Invalid date');
                else {
                    setAge(data.age);
                    setPreviewStats(data.stats);
                }
            } catch (e) {
                console.error(e);
            }
        };
        const timer = setTimeout(fetchStats, 500);
        return () => clearTimeout(timer);
    }, [inputAge, inputMonth, inputDay]);

    const handleCharacterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setMode('CREATING');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: hubLoc } = await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').maybeSingle();

            const res = await fetch('/api/profile/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    title_name: name,
                    gender: gender,
                    age: age,
                    birth_date: birthDate,
                    max_hp: previewStats.max_hp,
                    max_vitality: previewStats.max_vitality,
                    max_deck_cost: previewStats.max_deck_cost,
                    accumulated_days: 0,
                    gold: 1000,
                    current_location_id: hubLoc?.id
                })
            });

            if (!res.ok) throw new Error((await res.json()).error);

            await new Promise(r => setTimeout(r, 5500)); // Animation wait
            await fetchUserProfile();
            router.push('/inn');
        } catch (err: any) {
            console.error(err);
            alert(`作成失敗: ${err.message}`);
            setMode('CHAR_CREATION');
        }
    };

    // Render Logic
    if (mode === 'CREATING') {
        // ... (Keep existing animation JSX)
        return (
            <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center text-gray-300 font-serif relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a38b6b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[200vw] h-[200vw] bg-[radial-gradient(circle,rgba(163,139,107,0.1)_0%,transparent_70%)] animate-pulse-slow"></div>
                </div>
                <MapIcon className="w-24 h-24 animate-spin-slow mb-8 text-[#a38b6b] opacity-80" />
                <h2 className="text-3xl md:text-5xl text-[#e3d5b8] mb-8 animate-fade-in tracking-[0.2em] font-bold drop-shadow-lg">世界を構築中...</h2>
                <div className="space-y-4 text-center text-gray-400 font-mono text-sm md:text-base h-32 relative z-10">
                    <p className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>&gt; 因果律の定着を確認...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '1.5s' }}>&gt; 歴史の編纂を開始...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '2.5s' }}>&gt; 魂の座標を確定。</p>
                </div>
                <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden z-10">
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

                {mode === 'ENTRY' && (
                    <div className="space-y-6 animate-fade-in">
                        <p className="text-center text-gray-400 font-serif mb-8">
                            運命の書を開き、あなたの物語を始めましょう。
                        </p>
                        <button
                            onClick={handleStart}
                            className="w-full bg-[#a38b6b] text-[#1a0f00] font-bold py-3 rounded hover:bg-[#c2b280] transition-colors shadow-lg tracking-widest"
                        >
                            <span className="flex items-center justify-center gap-2"><Sword className="w-4 h-4" /> はじめる</span>
                        </button>
                        <button
                            onClick={() => alert("外部アカウントによるデータ引き継ぎは現在準備中です。")}
                            className="w-full bg-transparent border border-[#a38b6b]/50 text-[#a38b6b] font-bold py-3 rounded hover:bg-[#a38b6b]/10 transition-colors tracking-widest"
                        >
                            <span className="flex items-center justify-center gap-2"><Hourglass className="w-4 h-4" /> データ引き継ぎ</span>
                        </button>
                    </div>
                )}

                {mode === 'CHAR_CREATION' && (
                    <form onSubmit={handleCharacterSubmit} className="space-y-8 animate-fade-in-up">
                        <div className="space-y-2">
                            {/* ... Form Content Same as Before ... */}
                            <label className="block text-sm text-[#a38b6b] font-serif tracking-wider">あなたの名前</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/50 border-b-2 border-[#333] focus:border-[#a38b6b] text-gray-200 p-3 outline-none transition-colors text-lg text-center font-serif placeholder-gray-800" placeholder="名前を入力..." autoFocus />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm text-[#a38b6b] font-serif tracking-wider text-center">性別</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setGender('Male')} className={`p-4 border rounded flex flex-col items-center gap-2 transition-all duration-300 ${gender === 'Male' ? 'bg-[#1a202c] border-blue-500/50 text-blue-200' : 'bg-black/30 border-gray-800 text-gray-600'}`}><Sword className="w-8 h-8" strokeWidth={1.5} /><span className="text-sm font-serif">男性</span></button>
                                <button type="button" onClick={() => setGender('Female')} className={`p-4 border rounded flex flex-col items-center gap-2 transition-all duration-300 ${gender === 'Female' ? 'bg-[#1a202c] border-red-500/50 text-red-200' : 'bg-black/30 border-gray-800 text-gray-600'}`}><Shield className="w-8 h-8" strokeWidth={1.5} /><span className="text-sm font-serif">女性</span></button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm text-[#a38b6b] font-serif tracking-wider text-center">年齢・誕生日</label>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-400"><span>16歳</span><span className="text-[#a38b6b] font-bold text-lg">{inputAge}歳</span><span>25歳</span></div>
                                <input type="range" min="16" max="25" value={inputAge} onChange={(e) => setInputAge(Number(e.target.value))} className="w-full accent-[#a38b6b] cursor-pointer" />
                            </div>
                            <div className="flex gap-4 items-center">
                                <select value={inputMonth} onChange={(e) => setInputMonth(Number(e.target.value))} className="w-1/2 bg-black/50 border-b-2 border-[#333] focus:border-[#a38b6b] text-gray-200 p-3 text-center">{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
                                <select value={inputDay} onChange={(e) => setInputDay(Number(e.target.value))} className="w-1/2 bg-black/50 border-b-2 border-[#333] focus:border-[#a38b6b] text-gray-200 p-3 text-center">{[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
                            </div>
                            {previewStats && (
                                <div className="text-center">
                                    <div className="text-[#e3d5b8] font-bold mb-2">{typeof previewStats.type === 'object' ? previewStats.type.name : previewStats.type}</div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div>HP: <span className="text-[#a38b6b]">{previewStats.max_hp}</span></div>
                                        <div>Cost: <span className="text-[#a38b6b]">{previewStats.max_deck_cost}</span></div>
                                        <div>Vit: <span className="text-[#a38b6b]">{previewStats.max_vitality}</span></div>
                                    </div>
                                </div>
                            )}
                            {dateError && <p className="text-red-400 text-xs text-center">{dateError}</p>}
                        </div>
                        <button type="submit" disabled={!name.trim() || !birthDate || !previewStats} className="w-full bg-[#a38b6b] text-[#1a0f00] font-bold py-4 rounded disabled:opacity-50 hover:bg-[#c2b280] shadow-lg flex items-center justify-center gap-2">
                            世界へ旅立つ <MapIcon className="w-5 h-5" />
                        </button>
                    </form>
                )}
            </main>


            {mode === 'SECRET_SETUP' && <SecretQuestionModal onSuccess={() => checkUserStatus()} onClose={() => { /* Force setup */ }} />}
        </div>
    );
}
