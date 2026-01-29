'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, Users, UserPlus, UserMinus, MessageSquare, Shield, Sword, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Npc Type Definition
interface NPC {
    id: string;
    name: string;
    job_class: string;
    level: number;
    hp: number;
    max_hp: number;
    mp: number;
    max_mp: number;
    attack: number;
    defense: number;
    personality_type: string;
    alignment_nation_id?: string;
    avatar_url?: string;
    tactic_mode?: string;
}

export default function PubPage() {
    const router = useRouter();
    const { worldState, userProfile, fetchUserProfile, fetchWorldState } = useGameStore();
    const [localNpcs, setLocalNpcs] = useState<NPC[]>([]);
    const [partyNpcs, setPartyNpcs] = useState<NPC[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
    const [dialogue, setDialogue] = useState<string>('');

    // Fetch Logic
    const fetchPubData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/pub');
            if (res.ok) {
                const data = await res.json();
                setLocalNpcs(data.pub);
                setPartyNpcs(data.party);
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
    const handleHire = async (npc: NPC) => {
        if (!confirm(`${npc.name} を仲間に誘いますか？`)) return;

        // Frontend Check for convenience
        if (partyNpcs.length >= 4) {
            alert("これ以上、仲間を連れて行けません。(最大5人パーティ)");
            return;
        }

        try {
            const res = await fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'hire', npc_id: npc.id })
            });
            if (res.ok) {
                setDialogue(`「よろしく頼むぜ、相棒。」`);
                await fetchPubData();
                setSelectedNpc(null);
            } else {
                const err = await res.json();
                alert(`勧誘失敗: ${err.error}`);
            }
        } catch (e) { console.error(e); }
    };

    const handleDismiss = async (npc: NPC) => {
        if (!confirm(`${npc.name} と別れますか？\n(現在の街に留まります)`)) return;

        try {
            const res = await fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'dismiss', npc_id: npc.id })
            });
            if (res.ok) {
                setDialogue(`「達者でな。縁があったらまた会おう。」`);
                await fetchPubData();
                setSelectedNpc(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleTalk = (npc: NPC) => {
        // Generate dynamic dialogue based on personality & world state
        const nation = worldState?.controlling_nation || 'Neutral';
        const isAlly = partyNpcs.some(p => p.id === npc.id);

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
            if (npc.job_class === 'Warrior') msgs.push("腕には自信があるんだがな。", "戦場が俺を呼んでいる。");
            if (npc.job_class === 'Mage') msgs.push("知識こそが力よ。", "魔法の研究資金が必要なの。");

            // World State logic
            if (worldState?.status === 'Ruined') msgs.push("この街ももう終わりか...", "早く逃げたほうがいいかもしれねぇ。");
            if (nation === npc.alignment_nation_id) msgs.push("ここは故郷の匂いがするな。", "この国のために働きたいもんだ。");
        }

        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        setDialogue(`「${msg}」`);
        setSelectedNpc(npc);
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
        <div className="min-h-screen bg-black text-gray-200 font-sans p-4 relative overflow-hidden">
            {/* BG */}
            <div className="absolute inset-0 bg-[url('/backgrounds/pub-interior.jpg')] bg-cover bg-center opacity-40 blur-sm pointer-events-none"></div>

            <header className="relative z-10 max-w-5xl mx-auto flex items-center justify-between py-4 border-b border-gray-700 mb-6 glass-panel p-4 rounded bg-black/60">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/inn')} className="hover:text-white text-gray-400 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-serif text-amber-500 font-bold tracking-wider">酒場『錆びた剣』</h1>
                        <p className="text-xs text-gray-400">@{worldState?.location_name || 'Unknown'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-mono text-amber-300">Party: {partyNpcs.length + 1} / 5</div>
                    <div className="text-xs text-gray-500">Gold: {userProfile?.gold} G</div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Center / Talk Area */}
                <section className="lg:col-span-2 space-y-6">
                    {/* Dialogue Box */}
                    <div className={`p-6 rounded-lg border-2 min-h-[120px] flex items-center shadow-2xl relative ${getNationColor()}`}>
                        {selectedNpc ? (
                            <div className="flex gap-4 items-center w-full">
                                <div className="w-16 h-16 rounded border border-gray-500 bg-black overflow-hidden flex-shrink-0">
                                    <img src={selectedNpc.avatar_url || '/avatars/npc_default.jpg'} alt="NPC" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-amber-400 font-bold text-sm mb-1">{selectedNpc.name} <span className="text-xs text-gray-400">({selectedNpc.job_class} Lv.{selectedNpc.level})</span></div>
                                    <p className="font-serif italic text-lg leading-relaxed">{dialogue}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-center w-full">酒場の喧騒が聞こえる...</p>
                        )}

                        {selectedNpc && (
                            <div className="absolute right-4 bottom-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        if (selectedNpc && !confirm(`${selectedNpc.name} に戦いを挑みますか？\n(危険な行為です)`)) return;
                                        if (selectedNpc) {
                                            const enemy = {
                                                id: selectedNpc.id,
                                                name: selectedNpc.name,
                                                level: selectedNpc.level,
                                                hp: selectedNpc.hp,
                                                maxHp: selectedNpc.max_hp
                                            };
                                            useGameStore.getState().startBattle(enemy);
                                            useGameStore.getState().selectScenario(null);
                                            router.push('/battle-test');
                                        }
                                    }}
                                    className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded shadow flex items-center gap-1 border border-red-800"
                                >
                                    <Sword className="w-3 h-3" /> 襲う
                                </button>

                                {!partyNpcs.some(p => p.id === selectedNpc.id) ? (
                                    <button onClick={() => selectedNpc && handleHire(selectedNpc)} className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded shadow flex items-center gap-1">
                                        <UserPlus className="w-3 h-3" /> 仲間に誘う
                                    </button>
                                ) : (
                                    <button onClick={() => selectedNpc && handleDismiss(selectedNpc)} className="px-3 py-1 bg-gray-600/50 hover:bg-gray-500 text-gray-300 text-xs rounded shadow flex items-center gap-1 border border-gray-500">
                                        <UserMinus className="w-3 h-3" /> 別れる
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* NPC Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Current Party */}
                        <div className="bg-black/60 border border-gray-700 rounded p-4">
                            <h2 className="text-amber-500 font-bold mb-3 flex items-center gap-2 border-b border-gray-800 pb-2">
                                <Users className="w-4 h-4" /> パーティメンバー
                            </h2>
                            <div className="space-y-2">
                                <div className="p-2 bg-blue-900/20 border border-blue-900/50 rounded flex justify-between items-center opacity-70">
                                    <span className="text-sm font-bold text-blue-200">{userProfile?.title_name} (You)</span>
                                </div>
                                {partyNpcs.map(npc => (
                                    <div key={npc.id}
                                        onClick={() => handleTalk(npc)}
                                        className={`p-2 border rounded cursor-pointer transition-all flex justify-between items-center group
                                            ${selectedNpc?.id === npc.id ? 'bg-amber-900/30 border-amber-600' : 'bg-gray-900/30 border-gray-800 hover:bg-gray-800'}
                                        `}>
                                        <div>
                                            <div className="text-sm font-bold text-gray-300 group-hover:text-white">{npc.name}</div>
                                            <div className="text-[10px] text-gray-500">{npc.job_class} Lv.{npc.level}</div>
                                        </div>
                                        <div className="flex gap-2 text-[10px] text-gray-400">
                                            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {npc.hp}</span>
                                            <span className="flex items-center gap-0.5"><Sword className="w-3 h-3" /> {npc.attack}</span>
                                        </div>
                                    </div>
                                ))}
                                {partyNpcs.length === 0 && <div className="text-xs text-gray-600 text-center py-4">仲間はいません。</div>}
                            </div>
                        </div>

                        {/* Local NPCs */}
                        <div className="bg-black/60 border border-gray-700 rounded p-4">
                            <h2 className="text-gray-400 font-bold mb-3 flex items-center gap-2 border-b border-gray-800 pb-2">
                                <MessageSquare className="w-4 h-4" /> この店にいる客
                            </h2>
                            {loading ? (
                                <div className="text-center text-xs text-gray-500 py-4">店内を見渡しています...</div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                                    {localNpcs.map(npc => (
                                        <div key={npc.id}
                                            onClick={() => handleTalk(npc)}
                                            className={`p-2 border rounded cursor-pointer transition-all flex justify-between items-center group
                                                ${selectedNpc?.id === npc.id ? 'bg-amber-900/30 border-amber-600' : 'bg-gray-900/30 border-gray-800 hover:bg-gray-800'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* <div className="w-8 h-8 rounded bg-gray-800"></div> */}
                                                <div>
                                                    <div className="text-sm font-bold text-gray-300 group-hover:text-white">{npc.name}</div>
                                                    <div className="text-[10px] text-gray-500">{npc.job_class} Lv.{npc.level}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-600 group-hover:text-amber-500 transition-colors">
                                                話す
                                            </div>
                                        </div>
                                    ))}
                                    {localNpcs.length === 0 && <div className="text-xs text-gray-600 text-center py-4">客は誰もいないようだ...</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Right Column: NPC Detail (Stat Sheet) */}
                <aside className="bg-gray-900/80 border border-gray-700 rounded p-4 h-fit">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest border-b border-gray-700 pb-2">Status</h3>

                    {selectedNpc ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="w-full aspect-square bg-black rounded border border-gray-600 mb-4 overflow-hidden relative group">
                                <img src={selectedNpc.avatar_url || '/avatars/npc_default.jpg'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                    <div className="text-lg font-bold text-white">{selectedNpc.name}</div>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs font-mono text-gray-300">
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Class</span>
                                    <span>{selectedNpc.job_class}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Level</span>
                                    <span>{selectedNpc.level}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">HP</span>
                                    <span className="text-green-400">{selectedNpc.hp} / {selectedNpc.max_hp}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">MP</span>
                                    <span className="text-blue-400">{selectedNpc.mp} / {selectedNpc.max_mp}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Attack</span>
                                    <span>{selectedNpc.attack}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-gray-500">Defense</span>
                                    <span>{selectedNpc.defense}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="text-[10px] text-gray-500 mb-1">Personality</div>
                                <div className="text-xs text-amber-200">{selectedNpc.personality_type}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 text-xs py-10">
                            キャラクターを選択してください
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}
