import React, { useState, useEffect } from 'react';
import { Package, Zap, Coins } from 'lucide-react';

export interface CustomReward {
    type: 'item' | 'skill';
    name: string;
    description: string;
    image_url: string;
    effect_type: 'heal' | 'damage' | 'shield';
    effect_value: number;
    ap_cost: number; // Only for skills
    deck_cost: number; // Auto-calculated
    price?: number; // Auto-calculated
}

interface CustomItemEditorProps {
    value: CustomReward | null;
    onChange: (reward: CustomReward | null) => void;
}

export default function CustomItemEditor({ value, onChange }: CustomItemEditorProps) {
    const isEnabled = value !== null;

    const toggleEnable = () => {
        if (isEnabled) {
            onChange(null);
        } else {
            onChange({
                type: 'item',
                name: '謎のポーション',
                description: '作成者不明のアイテム',
                image_url: '',
                effect_type: 'heal',
                effect_value: 10,
                ap_cost: 1,
                deck_cost: 5,
                price: 100
            });
        }
    };

    const handleUpdate = (field: keyof CustomReward, val: any) => {
        if (!value) return;
        const newVal = { ...value, [field]: val };

        // Auto-calculate deck_cost (cost_val)
        let cost = 5; // Base cost
        if (newVal.type === 'skill') {
            // Quadratic scaling for extreme cost on high power
            cost += Math.floor(Math.pow(newVal.effect_value, 1.3));
            cost -= newVal.ap_cost * 5; // AP cost offsets deck cost
        } else {
            cost += Math.floor(Math.pow(newVal.effect_value, 1.2));
        }

        newVal.deck_cost = Math.max(1, cost);
        newVal.price = newVal.deck_cost * 20;

        onChange(newVal);
    };

    return (
        <section className="bg-[#1a1525] border border-gold-900/30 p-6 rounded shadow-lg mt-6">
            <div className="flex justify-between items-center mb-4 border-b border-gold-900/50 pb-2">
                <h2 className="text-xl font-bold text-gold-300 flex items-center gap-2">
                    <Package className="w-5 h-5" /> クリア報酬設定 (UGCアイテム)
                </h2>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={toggleEnable}
                        className="w-4 h-4 accent-gold-500 rounded bg-black"
                    />
                    <span className={isEnabled ? 'text-gold-400 font-bold' : 'text-gray-500'}>有効</span>
                </label>
            </div>

            {isEnabled && value && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-400">※すべて「is_ugc: true」が付与され売値は1G固定です</div>
                        <div className="bg-black border border-gold-500/50 px-2 py-1 rounded text-gold-400 font-mono font-bold flex items-center gap-1">
                            <Coins className="w-3 h-3" /> デッキコスト: {value.deck_cost}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className={`border rounded p-3 cursor-pointer text-center transition-all ${value.type === 'item' ? 'bg-green-900/30 border-green-500 text-green-200' : 'bg-black/50 border-gray-700 text-gray-500'}`}>
                            <input type="radio" name="rewardType" className="hidden" checked={value.type === 'item'} onChange={() => handleUpdate('type', 'item')} />
                            <Package className="w-6 h-6 mx-auto mb-1" />
                            消費アイテム
                        </label>
                        <label className={`border rounded p-3 cursor-pointer text-center transition-all ${value.type === 'skill' ? 'bg-purple-900/30 border-purple-500 text-purple-200' : 'bg-black/50 border-gray-700 text-gray-500'}`}>
                            <input type="radio" name="rewardType" className="hidden" checked={value.type === 'skill'} onChange={() => handleUpdate('type', 'skill')} />
                            <Zap className="w-6 h-6 mx-auto mb-1" />
                            スキルカード
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">アイテム/スキル名</label>
                            <input
                                type="text"
                                value={value.name}
                                onChange={e => handleUpdate('name', e.target.value)}
                                className="w-full bg-black/50 border border-gold-900/50 rounded p-2 text-white focus:border-gold-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">フレーバーテキスト</label>
                            <input
                                type="text"
                                value={value.description}
                                onChange={e => handleUpdate('description', e.target.value)}
                                className="w-full bg-black/50 border border-gold-900/50 rounded p-2 text-white focus:border-gold-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">画像URL (任意)</label>
                            <input
                                type="text"
                                value={value.image_url}
                                onChange={e => handleUpdate('image_url', e.target.value)}
                                className="w-full bg-black/50 border border-gold-900/50 rounded p-2 text-white outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_1fr] gap-4 bg-black/30 p-3 rounded border border-gray-800">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">効果タイプ</label>
                                <select
                                    value={value.effect_type}
                                    onChange={e => handleUpdate('effect_type', e.target.value)}
                                    className="w-full bg-black border border-gray-600 rounded p-2 text-white outline-none"
                                >
                                    <option value="heal">回復 (HP)</option>
                                    <option value="damage">ダメージ (敵)</option>
                                    <option value="shield">シールド付与</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">効果量 (1-1000)</label>
                                <input
                                    type="number" min="1" max="1000"
                                    value={value.effect_value}
                                    onChange={e => handleUpdate('effect_value', parseInt(e.target.value) || 1)}
                                    className="w-full bg-black border border-gray-600 rounded p-2 text-white outline-none font-mono"
                                />
                            </div>
                        </div>

                        {value.type === 'skill' && (
                            <div className="bg-purple-900/20 p-3 rounded border border-purple-900/50">
                                <label className="block text-xs text-purple-300 mb-1">消費AP (0-5)</label>
                                <input
                                    type="range" min="0" max="5"
                                    value={value.ap_cost}
                                    onChange={e => handleUpdate('ap_cost', parseInt(e.target.value) || 0)}
                                    className="w-full accent-purple-500"
                                />
                                <div className="text-center font-mono text-purple-400 mt-1">{value.ap_cost} AP</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
