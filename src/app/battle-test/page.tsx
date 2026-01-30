'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull } from 'lucide-react';
import Image from 'next/image';

export default function BattleTestPage() {
    const router = useRouter();
    const {
        battleState,
        hand,
        initializeBattle,
        attackEnemy,
        endTurn,
        processNpcTurn,
        setTactic,
        fleeBattle,
        selectedScenario,
        fetchUserProfile
    } = useGameStore();

    const [logs, setLogs] = useState<string[]>([]);

    // We only initialize if direct access (not from Pub attack) or if hand is empty (bug recovery)
    useEffect(() => {
        fetchUserProfile();
        if (!battleState.enemy || hand.length === 0) {
            initializeBattle();
        }
    }, []);

    useEffect(() => {
        setLogs(battleState.messages);
    }, [battleState.messages]);

    // Update: Handle Pub NPC Death
    useEffect(() => {
        if (battleState.isVictory && !selectedScenario && battleState.enemy?.id) {
            // If it's a victory and NOT a scenario (i.e. Pub Battle), eliminate the NPC.
            fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'kill', npc_id: battleState.enemy.id })
            }).catch(err => console.error("Failed to eliminate NPC:", err));
        }
    }, [battleState.isVictory, selectedScenario, battleState.enemy]);

    const handleCardClick = async (index: number) => {
        if (battleState.isVictory) return;
        const card = hand[index];
        await attackEnemy(card);
        handleTurnEnd();
    };

    const handleTurnEnd = async () => {
        await endTurn();
        // NPC Turn
        setTimeout(async () => {
            await processNpcTurn();
        }, 800);
    };

    const handleFlee = () => {
        if (confirm("本当に逃げますか？")) {
            fleeBattle();
        }
    };

    if (!battleState.enemy) return <div className="p-8 text-white min-h-screen bg-gray-900 flex items-center justify-center">Loading Battle...</div>;

    const enemy = battleState.enemy;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative overflow-hidden flex flex-col">
            {/* Background Image (Optional) */}
            <div className="absolute inset-0 z-0 opacity-30">
                <Image
                    src="/backgrounds/battle_bg.png"
                    alt="Battle BG"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* HEADER: Quest/Enemy Name */}
            <header className="relative z-10 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-serif font-bold text-red-400 tracking-wider flex items-center gap-2">
                        <Sword className="w-5 h-5" />
                        {selectedScenario ? `依頼: ${selectedScenario.title}` : `VS ${enemy.name}`}
                    </h1>
                </div>

                {/* Tactics & Flee Controls */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-gray-600">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400 mr-2">作戦:</span>
                        <select
                            value={battleState.currentTactic || 'Aggressive'}
                            onChange={(e) => setTactic(e.target.value as any)}
                            className="bg-transparent text-sm text-yellow-200 focus:outline-none cursor-pointer"
                        >
                            <option value="Aggressive">ガンガンいこうぜ</option>
                            <option value="Defensive">いのちだいじに</option>
                            <option value="Standby">様子をみろ</option>
                        </select>
                    </div>

                    <button
                        onClick={handleFlee}
                        className="flex items-center gap-1 px-4 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 rounded border border-red-700 transition-colors text-sm"
                    >
                        <Footprints className="w-4 h-4" /> 逃げる
                    </button>
                </div>
            </header>

            {/* MAIN BATTLE AREA */}
            <main className="relative z-10 flex-1 flex flex-col p-4 gap-4 max-w-6xl mx-auto w-full">

                {/* TOP SECTION: Party Icons (Left) vs Enemy (Center/Right) */}
                <div className="flex-1 flex gap-8">

                    {/* LEFT: Party Members (Icons) */}
                    <div className="w-1/4 flex flex-col gap-4">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest border-b border-gray-700 pb-1 mb-2">Party</div>
                        <div className="flex flex-col gap-3">
                            {/* Player (Self) */}
                            <div className="flex items-center gap-3 bg-black/40 p-2 rounded border-l-2 border-blue-500">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-500 relative shrink-0">
                                    <div className="w-full h-full bg-blue-900/50 flex items-center justify-center text-xs">You</div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold truncate">あなた</div>
                                    <div className="text-xs text-blue-300">
                                        HP {useGameStore.getState().userProfile?.hp ?? '?'}/{useGameStore.getState().userProfile?.max_hp ?? '?'}
                                    </div>
                                    <div className="text-xs text-purple-300">
                                        MP {useGameStore.getState().userProfile?.mp ?? '?'}/{useGameStore.getState().userProfile?.max_mp ?? '?'}
                                    </div>
                                </div>
                            </div>

                            {/* NPC Members */}
                            {battleState.party.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 bg-black/40 p-2 rounded border-l-2 border-green-600">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-500 relative shrink-0">
                                        {member.image ? (
                                            <Image src={member.image} alt={member.name} width={40} height={40} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs">{member.name[0]}</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-gray-200 truncate">{member.name}</div>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-green-400">HP {member.hp}</span>
                                            <span className="text-blue-400">Lv.{member.level}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER/RIGHT: Enemy & Logs */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {/* Enemy Visual */}
                        <div className="relative group mb-12 animate-float">
                            <div className={`w-64 h-64 ${battleState.isVictory ? 'opacity-50 grayscale transition-all duration-1000' : ''}`}>
                                {/* Placeholder Monster */}
                                <div className="w-full h-full bg-gradient-to-br from-red-900 to-black rounded-lg shadow-[0_0_50px_rgba(220,38,38,0.3)] flex items-center justify-center border-4 border-red-900 transform rotate-3 group-hover:rotate-0 transition-transform">
                                    <Skull className="w-24 h-24 text-red-500/80" />
                                </div>
                            </div>

                            {/* Enemy Status Bar */}
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-80 bg-black/80 p-3 rounded border border-red-900 text-center shadow-xl">
                                <h2 className="text-xl font-bold text-red-100 mb-1">{enemy.name} <span className="text-sm text-red-400 font-normal">Lv.{enemy.level}</span></h2>
                                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-red-600 transition-all duration-500 ease-out"
                                        style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-red-300 mt-1 flex justify-between px-1">
                                    <span>HP: {enemy.hp} / {enemy.maxHp}</span>
                                    <span>Threat: High</span>
                                </div>
                            </div>
                        </div>

                        {/* Battle Log Overlay (Bottom Right or Center) */}
                        <div className="absolute bottom-0 right-0 w-96 max-h-60 overflow-y-auto bg-black/70 border border-gray-700 rounded p-4 font-mono text-sm space-y-1 shadow-2xl">
                            {logs.slice(-6).map((log, i) => (
                                <div key={i} className="animate-fade-in border-b border-gray-800/50 pb-1 last:border-0 text-gray-300">
                                    <span className="text-blue-500 mr-2">[{i + 1}]</span>
                                    {log}
                                </div>
                            ))}
                            {battleState.isVictory && (
                                <div className="text-yellow-400 font-bold text-center mt-2 py-2 border-t border-yellow-900 bg-yellow-900/20 rounded animate-pulse">
                                    VICTORY!
                                    <div className="text-xs font-normal text-yellow-200 mt-1">報酬を確認して帰還します...</div>
                                    <button onClick={() => router.push('/inn')} className="mt-2 px-4 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-sm">
                                        凱旋する
                                    </button>
                                </div>
                            )}
                            {/* Defeat/Flee State */}
                            {!battleState.isVictory && battleState.messages.includes("一行は逃げ出した...") && (
                                <div className="text-gray-400 font-bold text-center mt-2 py-2 border-t border-gray-700 bg-gray-800/50 rounded">
                                    ESCAPED...
                                    <button onClick={() => router.push('/inn')} className="mt-2 px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm mb-2">
                                        戦略的撤退
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM: Card Hand (Player Actions) */}
                <div className="h-48 pt-4 border-t border-gray-800 bg-black/40 backdrop-blur-sm -mx-4 px-4 flex flex-col justify-center">
                    <div className="flex justify-center gap-4 overflow-x-auto pb-2">
                        {hand.map((card, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleCardClick(idx)}
                                disabled={battleState.isVictory}
                                className="w-32 h-44 bg-[#1a1a1a] border-2 border-[#333] hover:border-blue-500 hover:-translate-y-2 transition-all duration-200 rounded-lg flex flex-col items-center justify-between p-3 relative group shadow-lg shrink-0 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                <div className="absolute top-2 right-2 text-xs font-bold text-blue-400 border border-blue-900 rounded px-1">{card.cost} MP</div>
                                <div className="mt-4 p-2 bg-gray-800 rounded-full">
                                    {card.type === 'Skill' ? <Sparkles className="w-6 h-6 text-yellow-400" /> :
                                        card.type === 'Item' ? <Heart className="w-6 h-6 text-green-400" /> :
                                            <Sword className="w-6 h-6 text-gray-400" />}
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-sm font-bold text-gray-100 truncate w-full">{card.name}</div>
                                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2 h-8 leading-tight">{card.description}</div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-0.5 rounded w-full text-center ${card.type === 'Skill' ? 'bg-blue-900/30 text-blue-300' :
                                    card.type === 'Item' ? 'bg-green-900/30 text-green-300' :
                                        'bg-gray-800 text-gray-400'
                                    }`}>
                                    {card.type}
                                </div>
                            </button>
                        ))}
                        {hand.length === 0 && !battleState.isVictory && (
                            <div className="flex items-center justify-center text-gray-500 text-sm italic w-full">
                                カードを配っています...
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
