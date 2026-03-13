import React, { useState, useEffect } from 'react';
import { Shield, Sword, Heart, Activity } from 'lucide-react';

interface CustomEnemy {
    name: string;
    level: number;
    hp: number;
    atk: number;
    def: number;
    image_url: string;
    skills: string[];
}

interface EnemyEditorProps {
    value: CustomEnemy;
    onChange: (enemy: CustomEnemy) => void;
}

const SKILL_CATALOG = [
    { id: 'attack', name: '通常攻撃', cost: 0, minLevel: 1 },
    { id: 'heavy_attack', name: '強撃 (大ダメージ)', cost: 50, minLevel: 5 },
    { id: 'heal', name: '自己回復', cost: 80, minLevel: 10 },
    { id: 'poison', name: '毒付与', cost: 120, minLevel: 15 },
    { id: 'drain_vit', name: '魂喰らい (Vit減少)', cost: 1000, minLevel: 30 },
];

export default function EnemyEditor({ value, onChange }: EnemyEditorProps) {
    const [tp, setTp] = useState(0);
    const [maxTp, setMaxTp] = useState(0);

    // Calculate TP based on Level
    useEffect(() => {
        const calculatedMaxTp = value.level * 50 + 100; // Base 100 + 50 per level
        setMaxTp(calculatedMaxTp);
    }, [value.level]);

    // Calculate Used TP
    useEffect(() => {
        let used = 0;
        used += value.hp * 1;    // 1 TP = 1 HP
        used += value.atk * 10;  // 10 TP = 1 ATK
        used += value.def * 10;  // 10 TP = 1 DEF

        value.skills.forEach(skillId => {
            const skill = SKILL_CATALOG.find(s => s.id === skillId);
            if (skill) used += skill.cost;
        });

        setTp(maxTp - used);
    }, [value, maxTp]);

    const handleUpdate = (field: keyof CustomEnemy, val: any) => {
        onChange({ ...value, [field]: val });
    };

    const toggleSkill = (skillId: string) => {
        if (value.skills.includes(skillId)) {
            handleUpdate('skills', value.skills.filter(s => s !== skillId));
        } else {
            handleUpdate('skills', [...value.skills, skillId]);
        }
    };

    return (
        <div className="bg-[#1a1a24] border border-red-900/50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-red-400">カスタムエネミー設計</h3>
                <div className={`text-xl font-mono font-bold px-3 py-1 rounded bg-black border ${tp < 0 ? 'text-red-500 border-red-500' : 'text-green-400 border-green-500'}`}>
                    TP: {tp} / {maxTp}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">エネミー名</label>
                        <input
                            type="text"
                            value={value.name}
                            onChange={e => handleUpdate('name', e.target.value)}
                            className="w-full bg-black/50 border border-red-900/50 rounded p-2 text-white focus:border-red-500 outline-none"
                            placeholder="例: マッドゴブリン"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">画像URL (任意)</label>
                        <input
                            type="text"
                            value={value.image_url}
                            onChange={e => handleUpdate('image_url', e.target.value)}
                            className="w-full bg-black/50 border border-red-900/50 rounded p-2 text-white outline-none"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1 flex justify-between">
                            <span>想定レベル (1-50)</span>
                            <span className="text-red-400">基礎構築力(TP)を決定</span>
                        </label>
                        <input
                            type="number"
                            min="1" max="50"
                            value={value.level}
                            onChange={e => handleUpdate('level', parseInt(e.target.value) || 1)}
                            className="w-full bg-black/50 border border-red-900/50 rounded p-2 text-white outline-none text-center text-xl font-bold"
                        />
                    </div>
                </div>

                <div className="bg-black/40 p-4 rounded border border-gray-800 space-y-4">
                    <h4 className="text-sm font-bold text-gray-300 border-b border-gray-700 pb-2">ステータス振り分け</h4>

                    <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                        <Heart className="w-5 h-5 text-green-500" />
                        <input
                            type="range" min="10" max={Math.max(100, value.level * 50)}
                            value={value.hp}
                            onChange={e => handleUpdate('hp', parseInt(e.target.value))}
                            className="accent-green-500"
                        />
                        <span className="w-12 text-right font-mono text-green-400">{value.hp}</span>

                        <Sword className="w-5 h-5 text-red-500" />
                        <input
                            type="range" min="1" max={Math.max(10, value.level * 2)}
                            value={value.atk}
                            onChange={e => handleUpdate('atk', parseInt(e.target.value))}
                            className="accent-red-500"
                        />
                        <span className="w-12 text-right font-mono text-red-400">{value.atk}</span>

                        <Shield className="w-5 h-5 text-blue-500" />
                        <input
                            type="range" min="1" max={Math.max(10, value.level * 2)}
                            value={value.def}
                            onChange={e => handleUpdate('def', parseInt(e.target.value))}
                            className="accent-blue-500"
                        />
                        <span className="w-12 text-right font-mono text-blue-400">{value.def}</span>
                    </div>

                    <div className="text-[10px] text-gray-500 text-right">HP: 1TP / ATK: 10TP / DEF: 10TP</div>
                </div>
            </div>

            <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2 flex items-center gap-2 text-purple-400">
                    <Activity className="w-4 h-4" /> 特殊能力 (スキル)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SKILL_CATALOG.map(skill => {
                        const isLocked = value.level < skill.minLevel;
                        const isSelected = value.skills.includes(skill.id);
                        return (
                            <button
                                key={skill.id}
                                disabled={isLocked}
                                onClick={() => toggleSkill(skill.id)}
                                className={`text-left p-2 rounded border text-xs transition-all ${isLocked
                                        ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-purple-900/50 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                                            : 'bg-black/40 border-gray-700 text-gray-400 hover:border-purple-900'
                                    }`}
                            >
                                <div className="font-bold flex justify-between">
                                    <span>{skill.name}</span>
                                    {isLocked && <span className="text-red-900 flex-shrink-0">Lv.{skill.minLevel}〜</span>}
                                </div>
                                <div className={`font-mono mt-1 ${isLocked ? 'text-gray-700' : 'text-gray-500'}`}>
                                    Cost: {skill.cost} TP
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {tp < 0 && (
                <div className="mt-4 bg-red-900/40 border border-red-500 text-red-200 text-xs p-2 rounded text-center animate-pulse">
                    警告: TPがマイナスです。ステータスを下げるか、想定レベルを上げてください。
                </div>
            )}
        </div>
    );
}
