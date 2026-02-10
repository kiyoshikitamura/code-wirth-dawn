'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { Sword, Shield, Map as MapIcon, Hourglass } from 'lucide-react';

export default function TitlePage() {
    const router = useRouter();
    const { userProfile, fetchUserProfile } = useGameStore();
    const [step, setStep] = useState<'FORM' | 'CREATING'>('FORM');

    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>('Male');

    // New UI State
    const [inputAge, setInputAge] = useState(20);
    const [inputMonth, setInputMonth] = useState(1);
    const [inputDay, setInputDay] = useState(1);

    const [birthDate, setBirthDate] = useState(''); // Computed YYYY-MM-DD
    const [age, setAge] = useState<number | null>(null);
    const [previewStats, setPreviewStats] = useState<any>(null);
    const [dateError, setDateError] = useState('');

    // Force clear old state on mount if needed, or just trust the user came here intentionally
    useEffect(() => {
        // Optional: Ensure we have a profile to update, or create one if missing
        fetchUserProfile();
    }, []);

    // Recalculate Birth Date and Fetch Stats when inputs change
    useEffect(() => {
        if (inputAge < 16 || inputAge > 25) return;
        if (inputMonth < 1 || inputMonth > 12) return;
        if (inputDay < 1 || inputDay > 31) return;

        const today = new Date();
        let birthYear = today.getFullYear() - inputAge;

        // Adjust year if birthday hasn't happened yet this year
        // If current Month/Day < Input Month/Day, then to be 'inputAge' years old today, 
        // you must have been born in (Year - Age - 1)?
        // Wait.
        // If today is 2026-02-09.
        // I am 20 years old.
        // Birthday is 03-01.
        // If born 2006-03-01 => Age today is 19. (Not 20)
        // So to be 20 today, I must have been born in 2005.
        // Logic:
        // tempAge = today.year - candidateYear
        // if (today < birthdayThisYear) tempAge--
        // We want tempAge == inputAge.

        // Let's assume candidateYear = today.year - inputAge.
        // If (today < birthdayThisYear), actualAge = inputAge - 1.
        // So we need to subtract 1 from birthYear to match the desired age?

        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        let isBirthdayPassed = false;
        if (currentMonth > inputMonth) isBirthdayPassed = true;
        else if (currentMonth === inputMonth && currentDay >= inputDay) isBirthdayPassed = true;

        if (!isBirthdayPassed) {
            birthYear -= 1;
        }

        // Validate Date
        const computedDateStr = `${birthYear}-${String(inputMonth).padStart(2, '0')}-${String(inputDay).padStart(2, '0')}`;
        const isValidDate = !isNaN(new Date(computedDateStr).getTime());

        if (!isValidDate) {
            setDateError('無効な日付です');
            setPreviewStats(null);
            return;
        }

        setBirthDate(computedDateStr);
        setDateError('');

        // Fetch Stats
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/auth/calculate-stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ birth_date: computedDateStr })
                });

                const data = await res.json();
                if (!res.ok) {
                    setDateError(data.error || 'Invalid date');
                } else {
                    setAge(data.age);
                    setPreviewStats(data.stats);
                }
            } catch (e) {
                console.error(e);
            }
        };

        const timer = setTimeout(fetchStats, 500); // Debounce
        return () => clearTimeout(timer);

    }, [inputAge, inputMonth, inputDay]);

    // Cleanup unused handler
    // const handleDateChange = ... (Removed)

    const handleDateChange = async (dateStr: string) => {
        setBirthDate(dateStr);
        setDateError('');
        setPreviewStats(null);
        setAge(null);

        if (!dateStr) return;

        try {
            const res = await fetch('/api/auth/calculate-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ birth_date: dateStr })
            });

            const data = await res.json();
            if (!res.ok) {
                setDateError(data.error || 'Invalid date');
            } else {
                setAge(data.age);
                setPreviewStats(data.stats);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setStep('CREATING');

        try {
            // Get Auth User
            const { data: { user } } = await supabase.auth.getUser();
            const hubId = await getHubId();

            if (!hubId) {
                console.warn("Hub location not found. Defaulting to null.");
            }

            // Call server API
            const res = await fetch('/api/profile/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id, // Pass Auth ID if available
                    title_name: name,
                    gender: gender,
                    age: age,
                    birth_date: birthDate,
                    max_hp: previewStats.max_hp,
                    max_vitality: previewStats.max_vitality,
                    max_deck_cost: previewStats.max_deck_cost,
                    accumulated_days: 0,
                    gold: 1000,
                    current_location_id: hubId
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Initialization failed');
            }

            // Long animation
            await new Promise(r => setTimeout(r, 5500));

            await fetchUserProfile();
            router.push('/inn');
        } catch (err: any) {
            console.error(err);
            alert(`旅立ちの準備に失敗しました: ${err.message}`);
            setStep('FORM');
        }
    };

    const getHubId = async () => {
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('id')
                .eq('name', '名もなき旅人の拠所')
                .maybeSingle(); // Safer than single()

            if (error) console.error("Location Fetch Error:", error);
            return data?.id;
        } catch (e) {
            console.error("Unknown error fetching hub:", e);
            return null;
        }
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

                <div className="space-y-4 text-center text-gray-400 font-mono text-sm md:text-base h-32 relative z-10">
                    <p className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>&gt; 因果律の定着を確認...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '1.5s' }}>&gt; 歴史の編纂を開始...</p>
                    <p className="animate-fade-in-up" style={{ animationDelay: '2.5s' }}>&gt; 魂の座標を確定。</p>
                    {/* Removed "Expanding map" text as requested */}
                </div>

                {/* Enhanced Animation Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Central burst */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[1px] shadow-[0_0_100px_50px_rgba(163,139,107,0.5)] animate-pulse"></div>

                    {/* Rising particles (simple css implementation) */}
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-[#a38b6b] rounded-full animate-float-up"
                                style={{
                                    width: Math.random() * 4 + 'px',
                                    height: Math.random() * 4 + 'px',
                                    left: Math.random() * 100 + '%',
                                    bottom: '-20px',
                                    animationDuration: (Math.random() * 5 + 5) + 's',
                                    animationDelay: (Math.random() * 2) + 's'
                                }}
                            />
                        ))}
                    </div>
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

                    <div className="space-y-4">
                        <label className="block text-sm text-[#a38b6b] font-serif tracking-wider text-center">年齢・誕生日</label>

                        {/* Age Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>16歳</span>
                                <span className="text-[#a38b6b] font-bold text-lg">{inputAge}歳</span>
                                <span>25歳</span>
                            </div>
                            <input
                                type="range"
                                min="16"
                                max="25"
                                value={inputAge}
                                onChange={(e) => setInputAge(Number(e.target.value))}
                                className="w-full accent-[#a38b6b] cursor-pointer"
                            />
                        </div>

                        {/* Birthday Selects */}
                        <div className="flex gap-4 items-center">
                            <div className="relative w-1/2">
                                <select
                                    value={inputMonth}
                                    onChange={(e) => setInputMonth(Number(e.target.value))}
                                    className="w-full bg-black/50 border-b-2 border-[#333] focus:border-[#a38b6b] text-gray-200 p-3 pr-8 outline-none text-center font-serif appearance-none cursor-pointer"
                                    style={{ textAlignLast: 'center' }}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1} className="bg-[#0a121e] text-gray-200">
                                            {i + 1}
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">月</span>
                            </div>

                            <div className="relative w-1/2">
                                <select
                                    value={inputDay}
                                    onChange={(e) => setInputDay(Number(e.target.value))}
                                    className="w-full bg-black/50 border-b-2 border-[#333] focus:border-[#a38b6b] text-gray-200 p-3 pr-8 outline-none text-center font-serif appearance-none cursor-pointer"
                                    style={{ textAlignLast: 'center' }}
                                >
                                    {[...Array(31)].map((_, i) => (
                                        <option key={i + 1} value={i + 1} className="bg-[#0a121e] text-gray-200">
                                            {i + 1}
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">日</span>
                            </div>
                        </div>

                        {previewStats && (
                            <>
                                {previewStats.type && (
                                    <div className="text-[#e3d5b8] font-bold mb-2 text-center border-b border-gray-700 pb-1">
                                        {typeof previewStats.type === 'object' ? (previewStats.type.name || JSON.stringify(previewStats.type)) : previewStats.type} ({age}歳)
                                    </div>
                                )}
                                {previewStats.description && (
                                    <p className="text-xs text-gray-400 mb-3 text-center">{previewStats.description}</p>
                                )}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-[10px] text-gray-500">HP</div>
                                        <div className="text-[#a38b6b] font-mono font-bold text-lg">{previewStats.max_hp}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500">Cost</div>
                                        <div className="text-[#a38b6b] font-mono">{previewStats.max_deck_cost}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500">Vit</div>
                                        <div className="text-[#a38b6b] font-mono">{previewStats.max_vitality}</div>
                                    </div>
                                </div>
                            </>
                        )}
                        {dateError && <p className="text-red-400 text-xs text-center mt-1">{dateError}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim() || !birthDate || !previewStats}
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
