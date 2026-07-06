import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Backpack, Crown, Flame, Shield, X, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';

interface InheritanceModalProps {
    onClose: () => void;
    cause?: string;
}

export default function InheritanceModal({ onClose, cause = 'voluntary' }: InheritanceModalProps) {
    const { userProfile, inventory, fetchInventory, fetchUserProfile } = useGameStore();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [retiring, setRetiring] = useState(false);
    const [step, setStep] = useState<'select' | 'confirm' | 'epilogue'>('select');
    
    // Summary of inheritance variables
    const tier = userProfile?.subscription_tier ?? 'free';
    const allowedSlots = tier === 'premium' ? 50 : (tier === 'basic' ? 30 : 10);
    const goldInheritRate = tier === 'premium' ? 1.0 : (tier === 'basic' ? 1.0 : 0.5);
    const inheritedGold = Math.floor((userProfile?.gold || 0) * goldInheritRate);

    // Calculate Legacy Points preview
    const baseLP = ((userProfile?.accumulated_days || 0) * 10) + ((userProfile?.level || 1) * 100);
    const lpMultiplier = tier === 'premium' ? 1.5 : (tier === 'basic' ? 1.2 : 1.0);
    const previewLP = Math.floor(baseLP * lpMultiplier);
    const previewBP = Math.floor(previewLP / 300);

    useEffect(() => {
        const loadInventory = async () => {
            setLoading(true);
            try {
                await fetchInventory();
            } catch (e) {
                console.error('Failed to fetch inventory', e);
            } finally {
                setLoading(false);
            }
        };
        loadInventory();
    }, []);

    // Filter out skills/deck cards. We allow weapon, armor, accessory (equipment) and consumables.
    const inheritanceCandidates = inventory.filter(i => 
        !i.is_skill && 
        i.item_type !== 'skill_card' && 
        (i.quantity || 0) > 0
    );

    const handleToggleItem = (itemId: string) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(prev => prev.filter(id => id !== itemId));
        } else {
            if (selectedItems.length >= allowedSlots) {
                alert(`選択枠がいっぱいです。形見引き継ぎ枠は最大 ${allowedSlots}個 です。`);
                return;
            }
            setSelectedItems(prev => [...prev, itemId]);
        }
    };

    const handleExecuteRetire = async () => {
        setRetiring(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/character/retire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    cause: cause,
                    heirloom_item_ids: selectedItems.map(id => {
                        const invItem = inventory.find(i => String(i.id) === String(id));
                        return invItem ? String(invItem.item_id) : null;
                    }).filter(Boolean)
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '引退処理に失敗しました。');
            }

            // Move to Epilogue Narrative
            setStep('epilogue');
        } catch (e: any) {
            alert(e.message || 'エラーが発生しました。');
        } finally {
            setRetiring(false);
        }
    };

    const handleTransitionToNewGame = () => {
        // Redirect to character creation screen and clear state
        window.location.href = '/title?inherited=true';
    };

    return createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-xl h-[92dvh] bg-[#090d16] border-2 border-amber-950/40 rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-slate-100 font-serif">
                
                {/* ── SELECT STEP ── */}
                {step === 'select' && (
                    <>
                        {/* Header */}
                        <header className="flex items-center justify-between px-4 py-3 border-b border-amber-950/30 bg-[#060910] shrink-0">
                            <h2 className="text-sm font-bold tracking-widest text-amber-400 flex items-center gap-1.5 font-serif">
                                <Flame className="w-4 h-4 text-red-500 animate-pulse" /> 旅路の終焉と継承
                            </h2>
                            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-full transition-colors active:scale-95">
                                <X className="w-4 h-4" />
                            </button>
                        </header>

                        {/* Overview Banner */}
                        <div className="bg-[#1e1410] border-b border-amber-900/20 px-4 py-3 shrink-0">
                            <h3 className="text-xs font-bold text-amber-300 font-serif mb-1 flex items-center gap-1.5">
                                <Crown size={12} className="text-amber-500" />
                                {tier.toUpperCase()} プラン特典の継承
                            </h3>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-amber-200/80">
                                <div className="bg-black/40 p-2 rounded border border-amber-900/20 text-center">
                                    <div className="text-gray-500">ゴールド継承</div>
                                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">{goldInheritRate * 100}%</div>
                                    <div className="text-[8px] text-gray-500">上限なし</div>
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-amber-900/20 text-center">
                                    <div className="text-gray-500">形見アイテム</div>
                                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">{selectedItems.length}/{allowedSlots}</div>
                                    <div className="text-[8px] text-gray-500">武器・防具・消耗品</div>
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-amber-900/20 text-center">
                                    <div className="text-gray-500">スキルカード</div>
                                    <div className="text-xs font-bold text-green-400 font-mono mt-0.5">100%</div>
                                    <div className="text-[8px] text-gray-500">全自動継承</div>
                                </div>
                            </div>
                        </div>

                        {/* Candidates Item List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <div className="text-[11px] text-slate-400 font-bold mb-2">
                                引き継ぎたい「形見（装備・消耗品）」をリストから選択してください (最大 {allowedSlots}個):
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                    <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                    <span className="text-xs text-amber-400 font-medium">所持品を整理中...</span>
                                </div>
                            ) : inheritanceCandidates.length === 0 ? (
                                <div className="text-center text-slate-500 py-16 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/10">
                                    引き継げるアイテム（形見）を所持していません。
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-1.5">
                                    {inheritanceCandidates.map(item => {
                                        const isSelected = selectedItems.includes(item.id);
                                        return (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleToggleItem(item.id)} 
                                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                                                    isSelected 
                                                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/20 text-white' 
                                                    : 'bg-slate-900/20 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => {}} // Controlled via parent onClick
                                                        className="accent-amber-500" 
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold">{item.name}</span>
                                                        <span className="text-[9px] text-slate-500">所持数: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                {item.is_equipped && (
                                                    <span className="px-1.5 py-0.5 bg-blue-950/40 text-blue-400 text-[8px] rounded border border-blue-900/30 font-bold shrink-0">装備中</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Action Footer */}
                        <footer className="px-4 py-3.5 bg-[#060910] border-t border-amber-950/30 flex justify-between items-center shrink-0">
                            <span className="text-[10px] text-slate-400">
                                引き継ぎゴールド: <span className="text-amber-400 font-bold font-mono">{inheritedGold.toLocaleString()} G</span>
                            </span>
                            <button
                                onClick={() => setStep('confirm')}
                                className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-amber-950/20"
                            >
                                確認画面へ <ArrowRight size={12} />
                            </button>
                        </footer>
                    </>
                )}

                {/* ── CONFIRM STEP ── */}
                {step === 'confirm' && (
                    <div className="flex flex-col h-full justify-between">
                        {/* Header */}
                        <header className="flex items-center justify-between px-4 py-3 border-b border-red-950/30 bg-[#060910] shrink-0">
                            <h2 className="text-sm font-bold tracking-widest text-red-500 flex items-center gap-1.5 font-serif">
                                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /> 意思の最終確認
                            </h2>
                            <button onClick={() => setStep('select')} className="p-1 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-full transition-colors active:scale-95">
                                <X className="w-4 h-4" />
                            </button>
                        </header>

                        {/* Warning Box */}
                        <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-5 overflow-y-auto">
                            <div className="w-16 h-16 rounded-full bg-red-950/50 border-2 border-red-600 flex items-center justify-center text-red-400 animate-pulse shrink-0">
                                <AlertTriangle size={32} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-base font-bold text-white font-serif">このキャラクターの旅路を終えますか？</h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                                    旅を終えた冒険者は「英霊」として石碑に刻まれ、直接操作することはできなくなります。
                                    魂に宿る「冒険の記憶」と一部の財産は、次なる冒険者（次世代）へ受け継がれます。
                                </p>
                            </div>

                            {/* Summary Table */}
                            <div className="w-full max-w-sm bg-black/40 border border-red-900/20 rounded-xl p-3.5 space-y-2.5 text-xs text-left">
                                <div className="flex justify-between border-b border-slate-800 pb-1">
                                    <span className="text-gray-500">引退冒険者:</span>
                                    <span className="font-bold text-white">{userProfile?.name} (Lv.{userProfile?.level})</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-1">
                                    <span className="text-gray-500">継承ゴールド:</span>
                                    <span className="font-bold text-amber-400 font-mono">{(userProfile?.gold || 0).toLocaleString()} G ➡️ {inheritedGold.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800 pb-1">
                                    <span className="text-gray-500">継承形見アイテム:</span>
                                    <span className="font-bold text-white">{selectedItems.length} 個</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">継承ボーナス (BP):</span>
                                    <span className="font-bold text-green-400 flex items-center gap-1 font-mono">
                                        <Sparkles size={10} /> +{previewBP} BP
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Buttons */}
                        <footer className="px-4 py-4 bg-[#060910] border-t border-red-950/30 flex gap-3 shrink-0">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-900 text-slate-200 text-xs font-bold rounded-lg transition-all"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleExecuteRetire}
                                disabled={retiring}
                                className="flex-1 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-red-950/30 flex items-center justify-center gap-1.5"
                            >
                                {retiring ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        引退中...
                                    </>
                                ) : (
                                    <>
                                        <Flame className="w-3.5 h-3.5" fill="currentColor" />
                                        旅を終え、英霊とする
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                )}

                {/* ── EPILOGUE STEP ── */}
                {step === 'epilogue' && (
                    <div className="flex flex-col h-full bg-[#05080e] animate-in fade-in duration-700">
                        {/* Narrative Scene */}
                        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-6 md:gap-8 overflow-y-auto">
                            {/* Fortune Teller Portrait */}
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 flex shrink-0 justify-center items-center shadow-xl shadow-black/80 relative group">
                                <img 
                                    src="/images/npcs/npc_fortune_teller.png" 
                                    alt="旅の占い師" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-amber-400 font-serif">
                                    旅の占い師
                                </div>
                            </div>

                            {/* Narrative Dialog Box */}
                            <div className="flex-grow max-w-sm space-y-4 text-center md:text-left">
                                <div className="bg-[#121824]/60 border border-amber-950/30 rounded-xl p-4 md:p-5 shadow-inner shadow-black/50 relative">
                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-500/60" />
                                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-500/60" />
                                    <div className="space-y-3 text-xs leading-relaxed text-amber-200/90 font-serif">
                                        <p>
                                            冒険者「{userProfile?.name || 'あなた'}」は、これまでの過酷な旅路を終え、静かに武器を置いた。
                                        </p>
                                        <p>
                                            その魂は『英霊の残影』となり、次代を担う新たな旅人を見守ることだろう。
                                        </p>
                                        <p className="text-amber-400/80 italic pt-2">
                                            「あなたの紡いだ物語は、終わらないわ。さあ、新たな運命の糸を紡ぎましょう。」
                                        </p>
                                    </div>
                                </div>

                                {/* Generational Inherited stats */}
                                <div className="bg-[#090d16] border border-slate-800 rounded-lg px-4 py-3 space-y-1.5 text-[10px] text-left text-slate-400">
                                    <div className="flex justify-between">
                                        <span>獲得レガシーポイント (LP):</span>
                                        <span className="font-bold text-white font-mono">{previewLP.toLocaleString()} LP</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>継承ボーナスポイント (BP):</span>
                                        <span className="font-bold text-green-400 font-mono">+{previewBP} BP</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>次世代へ託された資金:</span>
                                        <span className="font-bold text-amber-400 font-mono">{inheritedGold.toLocaleString()} G</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page Transition Button */}
                        <footer className="px-4 py-5 bg-[#060910] border-t border-amber-950/30 flex justify-center shrink-0">
                            <button
                                onClick={handleTransitionToNewGame}
                                className="w-full max-w-sm py-3 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-amber-950/40 flex items-center justify-center gap-1.5 font-serif border border-yellow-400/20"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                新たな伝説を紡ぐ (キャラメイクへ)
                            </button>
                        </footer>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
