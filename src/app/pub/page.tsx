'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, Users, UserPlus, UserMinus, MessageSquare, Shield, Sword, Heart, Coins, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MobileNav from '@/components/layout/MobileNav';

// Updated to match PartyMember
interface PartyMember {
    id: string;
    name: string;
    job_class: string;
    gender: string;
    level: number;
    durability: number;
    max_durability: number;
    cover_rate: number;
    inject_cards: string[]; // Card IDs
    origin: string;
    is_active: boolean;
    avatar_url?: string;
    personality_type?: string;
}

export default function PubPage() {
    const router = useRouter();
    const { worldState, userProfile, fetchUserProfile, fetchWorldState, gold } = useGameStore();
    const [localMembers, setLocalMembers] = useState<PartyMember[]>([]);
    const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<PartyMember | null>(null);
    const [dialogue, setDialogue] = useState<string>('');

    // Fetch Logic
    const fetchPubData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/pub');
            if (res.ok) {
                const data = await res.json();
                setLocalMembers(data.pub);
                setPartyMembers(data.party);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorldState();
        fetchUserProfile();
        fetchPubData();
    }, []);

    // Actions
    const handleHire = async (member: PartyMember) => {
        if (!confirm(`${member.name} を仲間に誘いますか？`)) return;

        if (partyMembers.length >= 4) {
            alert("これ以上、仲間を連れて行けません。(最大5人パーティ)");
            return;
        }

        try {
            const res = await fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'hire', member_id: member.id })
            });
            if (res.ok) {
                setDialogue(`「よろしく頼むぜ、相棒。」`);
                await fetchPubData();
                setSelectedMember(null);
            } else {
                const err = await res.json();
                alert(`勧誘失敗: ${err.error}`);
            }
        } catch (e) { console.error(e); }
    };

    const handleDismiss = async (member: PartyMember) => {
        if (!confirm(`${member.name} と別れますか？\n(現在の街に留まります)`)) return;

        try {
            const res = await fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'dismiss', member_id: member.id })
            });
            if (res.ok) {
                setDialogue(`「達者でな。縁があったらまた会おう。」`);
                await fetchPubData();
                setSelectedMember(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleTalk = (member: PartyMember) => {
        const isAlly = partyMembers.some(p => p.id === member.id);

        let msgs = [
            "ういーっす。",
            "いい酒だ...",
            "仕事ないかなぁ。",
            "外は物騒だぜ。"
        ];

        if (isAlly) {
            msgs = [
                "次の目的地はどこだ？",
                "背中は任せてくれ。",
                "準備万端だぜ。",
                "俺たちの連携、悪くなかったな。"
            ];
        } else {
            // Stranger logic
            if (member.job_class === 'Warrior') msgs.push("腕には自信があるんだがな。", "戦場が俺を呼んでいる。");
            if (member.job_class === 'Mage') msgs.push("知識こそが力よ。", "魔法の研究資金が必要なの。");
            if (worldState?.status === 'Ruined') msgs.push("この街ももう終わりか...", "早く逃げたほうがいいかもしれねぇ。");
        }

        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        setDialogue(`「${msg}」`);
        setSelectedMember(member);
    };

    // Render Helpers
    const getNationColor = () => {
        const n = worldState?.controlling_nation;
        if (n === 'Roland') return 'bg-blue-950/80 border-blue-800';
        if (n === 'Markand') return 'bg-yellow-950/80 border-yellow-800';
        if (n === 'Karyu') return 'bg-red-950/80 border-red-800';
        if (n === 'Yato') return 'bg-purple-950/80 border-purple-800';
        return 'bg-gray-900/80 border-gray-700';
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans p-4 relative overflow-hidden pb-24 md:pb-0">
            {/* BG */}
            <div className="absolute inset-0 bg-[url('/backgrounds/pub-interior.jpg')] bg-cover bg-center opacity-40 blur-sm pointer-events-none"></div>

            <header className="relative z-10 max-w-5xl mx-auto flex items-center justify-between py-4 border-b border-gray-700 mb-6 glass-panel p-4 rounded bg-black/60">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/inn')} className="hover:text-white text-gray-400 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-950/50 rounded-full border border-amber-800/50">
                            <span className="text-xl">🍺</span>
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-serif text-amber-500 font-bold tracking-wider whitespace-nowrap">酒場『錆びた剣』</h1>
                            <p className="text-[10px] md:text-xs text-gray-400">Members & Equipment</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-amber-900/30">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span className="text-sm font-bold text-white">{gold}</span>
                    <span className="text-[10px] text-gray-400">G</span>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Center / Talk Area */}
                <section className="lg:col-span-2 space-y-6">
                    {/* Dialogue Box */}
                    <div className={`p-6 rounded-lg border-2 min-h-[120px] flex items-center shadow-2xl relative ${getNationColor()}`}>
                        {selectedMember ? (
                            <div className="flex gap-4 items-center w-full">
                                <div className="w-16 h-16 rounded border border-gray-500 bg-black overflow-hidden flex-shrink-0">
                                    <img
                                        src={selectedMember.avatar_url || '/avatars/adventurer.jpg'}
                                        onError={(e) => e.currentTarget.src = '/avatars/adventurer.jpg'}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-amber-400 font-bold text-sm mb-1">{selectedMember.name} <span className="text-xs text-gray-400">({selectedMember.job_class} Lv.{selectedMember.level})</span></div>
                                    <div className="text-[10px] text-gray-400 mb-1">耐久: {selectedMember.durability}/{selectedMember.max_durability} | カバー: {selectedMember.cover_rate}%</div>
                                    <p className="font-serif italic text-sm md:text-base leading-relaxed">{dialogue}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 items-center w-full">
                                <div className="w-16 h-16 rounded border border-gray-500 bg-black overflow-hidden flex-shrink-0">
                                    <img src="/avatars/pub_staff.png" alt="Staff" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-amber-400 font-bold text-sm mb-1">酒場の看板娘 <span className="text-xs text-gray-400"></span></div>
                                    <p className="font-serif italic text-sm md:text-base leading-relaxed">「いらっしゃい！新しい仲間を探しているの？」</p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Action Buttons (Below Dialogue) */}
                    {selectedMember && (
                        <div className="flex justify-end gap-2 mt-4">
                            {!partyMembers.some(p => p.id === selectedMember.id) ? (
                                <button onClick={() => selectedMember && handleHire(selectedMember)} className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded shadow flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]">
                                    <UserPlus className="w-3 h-3" /> 仲間に誘う
                                </button>
                            ) : (
                                <button onClick={() => selectedMember && handleDismiss(selectedMember)} className="px-4 py-2 bg-gray-600/50 hover:bg-gray-500 text-gray-300 text-xs rounded shadow flex items-center justify-center gap-2 border border-gray-500 whitespace-nowrap min-w-[100px]">
                                    <UserMinus className="w-3 h-3" /> 別れる
                                </button>
                            )}
                        </div>
                    )}

                    {/* NPC Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Current Party */}
                        <div className="bg-black/60 border border-gray-700 rounded p-4">
                            <h2 className="text-amber-500 font-bold mb-3 flex items-center gap-2 border-b border-gray-800 pb-2">
                                <Users className="w-4 h-4" /> パーティメンバー (Active)
                            </h2>
                            <div className="space-y-2">
                                <div className="p-2 bg-blue-900/20 border border-blue-900/50 rounded flex justify-between items-center opacity-70">
                                    <span className="text-sm font-bold text-blue-200">{userProfile?.title_name} (You)</span>
                                </div>
                                {partyMembers.map(m => (
                                    <div key={m.id}
                                        onClick={() => handleTalk(m)}
                                        className={`p-2 border rounded cursor-pointer transition-all flex justify-between items-center group
                                            ${selectedMember?.id === m.id ? 'bg-amber-900/30 border-amber-600' : 'bg-gray-900/30 border-gray-800 hover:bg-gray-800'}
                                        `}>
                                        <div>
                                            <div className="text-sm font-bold text-gray-300 group-hover:text-white whitespace-nowrap truncate max-w-[120px]">{m.name}</div>
                                            <div className="text-[10px] text-gray-500 whitespace-nowrap">{m.job_class} Lv.{m.level}</div>
                                        </div>
                                        <div className="flex gap-2 text-[10px] text-gray-400">
                                            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {m.durability}</span>
                                            <span className="flex items-center gap-0.5"><Shield className="w-3 h-3" /> {m.cover_rate}%</span>
                                        </div>
                                    </div>
                                ))}
                                {partyMembers.length === 0 && <div className="text-xs text-gray-600 text-center py-4">仲間はいません。</div>}
                            </div>
                        </div>

                        {/* Local NPCs */}
                        <div className="bg-black/60 border border-gray-700 rounded p-4">
                            <h2 className="text-gray-400 font-bold mb-3 flex items-center gap-2 border-b border-gray-800 pb-2">
                                <MessageSquare className="w-4 h-4" /> 探索者プール (Recruits)
                            </h2>
                            {loading ? (
                                <div className="text-center text-xs text-gray-500 py-4">店内を見渡しています...</div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                                    {localMembers.map(m => (
                                        <div key={m.id}
                                            onClick={() => handleTalk(m)}
                                            className={`p-2 border rounded cursor-pointer transition-all flex justify-between items-center group
                                                ${selectedMember?.id === m.id ? 'bg-amber-900/30 border-amber-600' : 'bg-gray-900/30 border-gray-800 hover:bg-gray-800'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-300 group-hover:text-white whitespace-nowrap truncate">{m.name}</div>
                                                    <div className="text-[10px] text-gray-500 whitespace-nowrap">{m.job_class} Lv.{m.level}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-600 group-hover:text-amber-500 transition-colors">
                                                交渉
                                            </div>
                                        </div>
                                    ))}
                                    {localMembers.length === 0 && <div className="text-xs text-gray-600 text-center py-4">候補生がいません...</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Right Column: NPC Detail (Stat Sheet) */}
                <aside className="bg-gray-900/80 border border-gray-700 rounded p-4 h-fit">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest border-b border-gray-700 pb-2">Status</h3>

                    {selectedMember ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="w-full aspect-square bg-black rounded border border-gray-600 mb-4 overflow-hidden relative group">
                                <img
                                    src={selectedMember.avatar_url || '/avatars/adventurer.jpg'}
                                    onError={(e) => e.currentTarget.src = '/avatars/adventurer.jpg'}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                    <div className="text-lg font-bold text-white">{selectedMember.name}</div>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs font-mono text-gray-300">
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Class</span>
                                    <span>{selectedMember.job_class}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Level</span>
                                    <span>{selectedMember.level}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Durability</span>
                                    <span className="text-green-400">{selectedMember.durability} / {selectedMember.max_durability}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Cover Rate</span>
                                    <div className="flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-blue-400" />
                                        <span className="text-blue-400">{selectedMember.cover_rate}%</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-gray-500 block mb-1">Deck Injection</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedMember.inject_cards?.length > 0 ? selectedMember.inject_cards.map((cid, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-800 text-[10px] rounded text-amber-200 border border-gray-600">
                                                {cid}
                                            </span>
                                        )) : <span className="text-gray-600 italic">None</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="text-[10px] text-gray-500 mb-1">Origin</div>
                                <div className="text-xs text-amber-200">{selectedMember.origin}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 text-xs py-10">
                            キャラクターを選択してください
                        </div>
                    )}
                </aside>
            </main>
            <MobileNav />
        </div>
    );
}
