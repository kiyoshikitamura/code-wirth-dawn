import React from 'react';
import { Package, Zap, Coins } from 'lucide-react';

export interface CustomReward {
    type: 'item' | 'skill';
    name: string;
    description: string;
    image_url: string;
    effect_type: 'heal' | 'damage' | 'shield';
    effect_value: number;
    ap_cost: number;
    deck_cost: number;
    price?: number;
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

        let cost = 5;
        if (newVal.type === 'skill') {
            cost += Math.floor(Math.pow(newVal.effect_value, 1.3));
            cost -= newVal.ap_cost * 5;
        } else {
            cost += Math.floor(Math.pow(newVal.effect_value, 1.2));
        }

        newVal.deck_cost = Math.max(1, cost);
        newVal.price = newVal.deck_cost * 20;

        onChange(newVal);
    };

    return (
        <div className="bg-slate-900/80 border border-amber-900/30 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Package size={12} /> クリア報酬 (UGCアイテム)
                </h3>
                <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={toggleEnable}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                    />
                    <span className={isEnabled ? 'text-amber-400 font-bold' : 'text-slate-500'}>有効</span>
                </label>
            </div>

            {isEnabled && value && (
                <div className="p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {/* Cost Badge */}
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">※ is_ugc: true / 売値1G固定</span>
                        <span className="bg-slate-800 border border-amber-700/50 px-2 py-0.5 rounded text-amber-400 font-mono font-bold flex items-center gap-1">
                            <Coins size={10} /> コスト: {value.deck_cost}
                        </span>
                    </div>

                    {/* Type Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <label className={`border rounded-lg p-2.5 cursor-pointer text-center transition-all text-xs ${
                            value.type === 'item' ? 'bg-green-900/20 border-green-600 text-green-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                            <input type="radio" name="rewardType" className="hidden" checked={value.type === 'item'} onChange={() => handleUpdate('type', 'item')} />
                            <Package size={16} className="mx-auto mb-1" />
                            消費アイテム
                        </label>
                        <label className={`border rounded-lg p-2.5 cursor-pointer text-center transition-all text-xs ${
                            value.type === 'skill' ? 'bg-blue-900/20 border-blue-600 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                            <input type="radio" name="rewardType" className="hidden" checked={value.type === 'skill'} onChange={() => handleUpdate('type', 'skill')} />
                            <Zap size={16} className="mx-auto mb-1" />
                            スキルカード
                        </label>
                    </div>

                    {/* Fields */}
                    <div className="space-y-2">
                        <div>
                            <label className="block text-[10px] text-amber-600 font-bold mb-0.5">名前</label>
                            <input
                                type="text"
                                value={value.name}
                                onChange={e => handleUpdate('name', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none focus:border-amber-600 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] text-amber-600 font-bold mb-0.5">フレーバーテキスト</label>
                            <input
                                type="text"
                                value={value.description}
                                onChange={e => handleUpdate('description', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none focus:border-amber-600 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">画像URL (任意)</label>
                            <input
                                type="text"
                                value={value.image_url}
                                onChange={e => handleUpdate('image_url', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-[11px] text-white outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Effect Settings */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">効果タイプ</label>
                                <select
                                    value={value.effect_type}
                                    onChange={e => handleUpdate('effect_type', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none"
                                >
                                    <option value="heal">回復 (HP)</option>
                                    <option value="damage">ダメージ</option>
                                    <option value="shield">シールド</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">効果量</label>
                                <input
                                    type="number" min="1" max="1000"
                                    value={value.effect_value}
                                    onChange={e => handleUpdate('effect_value', parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none font-mono"
                                />
                            </div>
                        </div>

                        {/* AP Cost for skills */}
                        {value.type === 'skill' && (
                            <div className="bg-blue-900/20 p-2.5 rounded-lg border border-blue-800/50">
                                <label className="block text-[10px] text-blue-400 mb-1">消費AP (0-5)</label>
                                <input
                                    type="range" min="0" max="5"
                                    value={value.ap_cost}
                                    onChange={e => handleUpdate('ap_cost', parseInt(e.target.value) || 0)}
                                    className="w-full accent-blue-500"
                                />
                                <div className="text-center font-mono text-blue-400 text-xs mt-0.5">{value.ap_cost} AP</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
