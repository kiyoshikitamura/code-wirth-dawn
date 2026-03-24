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
    { id: 'heavy_attack', name: '強撃', cost: 50, minLevel: 5 },
    { id: 'heal', name: '自己回復', cost: 80, minLevel: 10 },
    { id: 'poison', name: '毒付与', cost: 120, minLevel: 15 },
    { id: 'drain_vit', name: '魂喰らい', cost: 1000, minLevel: 30 },
];

export default function EnemyEditor({ value, onChange }: EnemyEditorProps) {
    const [tp, setTp] = useState(0);
    const [maxTp, setMaxTp] = useState(0);

    useEffect(() => {
        const calculatedMaxTp = value.level * 50 + 100;
        setMaxTp(calculatedMaxTp);
    }, [value.level]);

    useEffect(() => {
        let used = 0;
        used += value.hp * 1;
        used += value.atk * 10;
        used += value.def * 10;
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
        <div className="bg-slate-800/50 border border-red-900/30 rounded-xl p-3 space-y-3">
            {/* Header + TP */}
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <Sword size={12} /> エネミー設計
                </h3>
                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${tp < 0 ? 'text-red-400 border-red-600 bg-red-900/30' : 'text-green-400 border-green-700 bg-green-900/20'}`}>
                    TP: {tp}/{maxTp}
                </div>
            </div>

            {/* Name + Level */}
            <div className="space-y-2">
                <input
                    type="text"
                    value={value.name}
                    onChange={e => handleUpdate('name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none focus:border-red-500 transition-colors"
                    placeholder="エネミー名"
                />
                <div className="flex gap-2 items-center">
                    <label className="text-[10px] text-slate-400 whitespace-nowrap">Lv.</label>
                    <input
                        type="number"
                        min="1" max="50"
                        value={value.level}
                        onChange={e => handleUpdate('level', parseInt(e.target.value) || 1)}
                        className="w-16 bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none text-center font-bold focus:border-red-500"
                    />
                    <input
                        type="text"
                        value={value.image_url}
                        onChange={e => handleUpdate('image_url', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-[11px] text-white outline-none focus:border-slate-500"
                        placeholder="画像URL (任意)"
                    />
                </div>
            </div>

            {/* Stats Sliders */}
            <div className="bg-slate-900/60 rounded-lg p-3 space-y-2.5 border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <Heart size={12} className="text-green-400 flex-shrink-0" />
                    <input type="range" min="10" max={Math.max(100, value.level * 50)} value={value.hp}
                        onChange={e => handleUpdate('hp', parseInt(e.target.value))} className="flex-1 accent-green-500 h-1.5" />
                    <span className="w-10 text-right font-mono text-green-400 text-xs">{value.hp}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Sword size={12} className="text-red-400 flex-shrink-0" />
                    <input type="range" min="1" max={Math.max(10, value.level * 2)} value={value.atk}
                        onChange={e => handleUpdate('atk', parseInt(e.target.value))} className="flex-1 accent-red-500 h-1.5" />
                    <span className="w-10 text-right font-mono text-red-400 text-xs">{value.atk}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield size={12} className="text-blue-400 flex-shrink-0" />
                    <input type="range" min="1" max={Math.max(10, value.level * 2)} value={value.def}
                        onChange={e => handleUpdate('def', parseInt(e.target.value))} className="flex-1 accent-blue-500 h-1.5" />
                    <span className="w-10 text-right font-mono text-blue-400 text-xs">{value.def}</span>
                </div>
                <div className="text-[9px] text-slate-600 text-right">HP: 1TP / ATK: 10TP / DEF: 10TP</div>
            </div>

            {/* Skills */}
            <div>
                <h4 className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Activity size={10} /> 特殊能力
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                    {SKILL_CATALOG.map(skill => {
                        const isLocked = value.level < skill.minLevel;
                        const isSelected = value.skills.includes(skill.id);
                        return (
                            <button
                                key={skill.id}
                                disabled={isLocked}
                                onClick={() => toggleSkill(skill.id)}
                                className={`text-left p-2 rounded-lg border text-[10px] transition-all ${isLocked
                                    ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                                    : isSelected
                                        ? 'bg-amber-900/30 border-amber-600 text-amber-200 shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-700'
                                }`}
                            >
                                <div className="font-bold flex justify-between">
                                    <span>{skill.name}</span>
                                    {isLocked && <span className="text-red-900/60">Lv.{skill.minLevel}〜</span>}
                                </div>
                                <div className={`font-mono mt-0.5 ${isLocked ? 'text-slate-700' : 'text-slate-500'}`}>
                                    {skill.cost} TP
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {tp < 0 && (
                <div className="bg-red-900/30 border border-red-600/50 text-red-300 text-[10px] p-2 rounded-lg text-center animate-pulse">
                    ⚠ TPがマイナスです。ステータスを下げるか、想定レベルを上げてください。
                </div>
            )}
        </div>
    );
}
