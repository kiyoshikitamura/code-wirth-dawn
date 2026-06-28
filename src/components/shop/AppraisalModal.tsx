import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Coins, Search, Sparkles, ShieldAlert } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getAuthToken } from '@/lib/authToken';
import { getNpcForLocation } from '@/lib/getNpcForLocation';
import { soundManager } from '@/lib/soundManager';

interface Props {
    onClose: () => void;
    reputation: any;
}

interface AppraisalResult {
    id: number;
    slug: string;
    name: string;
    type: string;
    sub_type?: string;
    base_price: number;
    description: string;
    rarity: string;
    image_url: string | null;
}

export default function AppraisalModal({ onClose, reputation }: Props) {
    const { gold, inventory, worldState, fetchInventory, fetchUserProfile } = useGameStore();

    const [mounted, setMounted] = useState(false);
    const [isAppraising, setIsAppraising] = useState(false);
    const [appraisalStepText, setAppraisalStepText] = useState('');
    const [appraisalResult, setAppraisalResult] = useState<AppraisalResult | null>(null);
    const [actualCost, setActualCost] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // NPC情報の取得
    const locationSlug = worldState?.location_name || '';
    const repScore = reputation?.score || 0;
    const resolvedNpc = getNpcForLocation(locationSlug, 'shop', repScore);
    const npcName = resolvedNpc?.name || '道具屋店主';
    const npcRole = resolvedNpc?.role || '店主';
    const npcImg = resolvedNpc?.imageUrl || '/avatars/shopkeeper.png';

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // 未鑑定アイテム（ID: 706〜709）の集計
    const unappraisedItems = [
        { id: 706, name: 'アイテム（未鑑定）[N]', slug: 'item_unappraised_n', rarityLabel: 'N', costDesc: '1,000〜2,000' },
        { id: 707, name: 'アイテム（未鑑定）[R]', slug: 'item_unappraised_r', rarityLabel: 'R', costDesc: '2,000〜4,000' },
        { id: 708, name: 'アイテム（未鑑定）[SR]', slug: 'item_unappraised_sr', rarityLabel: 'SR', costDesc: '4,000〜7,000' },
        { id: 709, name: 'アイテム（未鑑定）[UR]', slug: 'item_unappraised_ur', rarityLabel: 'UR', costDesc: '7,000〜10,000' }
    ].map(config => {
        const invRows = inventory?.filter(i => i.item_id === config.id && !i.is_equipped) || [];
        const count = invRows.reduce((sum, row) => sum + (row.quantity || 1), 0);
        return {
            ...config,
            count
        };
    });

    const totalUnappraisedCount = unappraisedItems.reduce((sum, item) => sum + item.count, 0);

    const handleAppraise = async (itemId: number) => {
        if (isAppraising) return;

        setErrorMsg(null);
        setIsAppraising(true);
        setAppraisalStepText('品物の状態を観察しています...');

        // 鑑定プロセスの時間差メッセージ表示（1秒後に切り替え）
        const timer = setTimeout(() => {
            setAppraisalStepText('真贋を確かめています...');
        }, 900);

        try {
            // 最低1.8秒ディレイをかけて鑑定演出を見せる
            const apiPromise = (async () => {
                const token = await getAuthToken();
                const res = await fetch('/api/shop/appraise', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ item_id: itemId })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || '鑑定に失敗しました。');
                }
                return data;
            })();

            const [result] = await Promise.all([
                apiPromise,
                new Promise(resolve => setTimeout(resolve, 1800)) // 1.8秒待機演出
            ]);

            clearTimeout(timer);

            // 鑑定結果の設定
            setAppraisalResult(result.item);
            setActualCost(result.cost);

            // レアリティに応じたサウンド再生
            const rarity = (result.item.rarity || 'common').toLowerCase();
            if (rarity === 'epic' || rarity === 'legendary') {
                soundManager?.playSE('se_level_up');
            } else {
                soundManager?.playSE('se_item_get');
            }

            // ステートの同期
            fetchUserProfile();
            fetchInventory();

        } catch (e: any) {
            clearTimeout(timer);
            setErrorMsg(e.message || '通信エラーが発生しました。');
            soundManager?.playSE('se_cancel');
        } finally {
            setIsAppraising(false);
        }
    };

    // レアリティごとの結果演出設定
    const getResultDesign = (rarity: string) => {
        const lowerRarity = (rarity || 'common').toLowerCase();
        switch (lowerRarity) {
            case 'legendary': // UR
                return {
                    borderColor: 'border-red-600 shadow-[0_0_35px_rgba(239,68,68,0.8)]',
                    glowClass: 'animate-pulse text-red-500 font-extrabold',
                    overlayEffect: 'bg-red-950/20 border border-red-500/30 animate-shake',
                    npcMessage: '「何ということだ…これは滅多にみない逸品だ。まさか実在するとは…！」',
                    rarityBadge: 'bg-red-950 text-red-400 border-red-800'
                };
            case 'epic': // SR
                return {
                    borderColor: 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.7)]',
                    glowClass: 'text-yellow-500 font-bold',
                    overlayEffect: 'bg-yellow-950/10 border border-yellow-500/20',
                    npcMessage: '「おお、これはかなりの名品だぞ。世代を超えて使える品だろう。」',
                    rarityBadge: 'bg-yellow-950 text-yellow-400 border-yellow-800'
                };
            case 'rare': // R
                return {
                    borderColor: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
                    glowClass: 'text-blue-400 font-bold',
                    overlayEffect: 'bg-blue-950/10 border border-blue-500/20',
                    npcMessage: '「ほう、なかなかに良質な品だ。大切に使うといい。」',
                    rarityBadge: 'bg-blue-950 text-blue-400 border-blue-800'
                };
            case 'common': // N
            default:
                return {
                    borderColor: 'border-gray-400 shadow-lg',
                    glowClass: 'text-gray-400',
                    overlayEffect: 'bg-gray-900/10 border border-gray-700/20',
                    npcMessage: '「ふむ、ありふれた物のようだな。まあ、使えないこともないだろう。」',
                    rarityBadge: 'bg-gray-800 text-gray-400 border-gray-600'
                };
        }
    };

    const resultDesign = appraisalResult ? getResultDesign(appraisalResult.rarity) : null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 pointer-events-none" />
            
            {/* インライン CSS スタイル定義 (揺れ演出およびローディング用) */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.6s ease-in-out;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s infinite ease-in-out;
                }
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}} />

            <div className="relative z-10 bg-[#e3d5b8] text-[#2c241b] w-full max-w-lg h-[80dvh] flex flex-col rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 bg-[#3e2723] border-b-2 border-[#8b5a2b] flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-serif font-bold tracking-widest text-amber-400">鑑定所</h2>
                        </div>
                        <p className="text-[10px] text-[#a38b6b] mt-0.5 font-serif italic">― 眠れる品物の価値を白日の下に晒そう ―</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-amber-900/30 px-2.5 py-1 rounded border border-amber-700/50">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-200 font-mono text-sm">{gold.toLocaleString()} G</span>
                        </div>
                        <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">✕</button>
                    </div>
                </div>

                {/* NPC dialogue area */}
                <div className="bg-[#2c1e1a] border-b border-[#8b5a2b]/30 p-3 flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#8b5a2b] shrink-0 bg-gray-800">
                        <img src={npcImg} alt={npcName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#a38b6b] font-bold font-serif">{npcRole} - {npcName}</div>
                        <p className="text-xs text-amber-100 font-serif italic mt-0.5 leading-relaxed">
                            「アイテムの鑑定をするのか？鑑定したいアイテムを選んでくれ」
                        </p>
                    </div>
                </div>

                {/* Main list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('/textures/aged-paper.png')] bg-repeat">
                    {errorMsg && (
                        <div className="bg-red-950/20 border border-red-900/40 text-red-800 p-3 rounded text-xs flex gap-2 items-center font-bold">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-red-700" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {totalUnappraisedCount === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#8b5a2b]/30 rounded">
                            <Search className="w-12 h-12 text-[#8b5a2b]/40 mb-3" />
                            <p className="text-sm font-serif font-bold text-[#5c4a37]">鑑定できる未鑑定アイテムを所持していません</p>
                            <p className="text-xs text-[#8b6f4e] mt-1">クエスト報酬やドロップなどで手に入れてから再度お越しください。</p>
                        </div>
                    ) : (
                        unappraisedItems.map((item) => {
                            if (item.count === 0) return null; // 所持していない枠は表示しない
                            const canAfford = gold >= 1000; // 最低鑑定料(1000)に足りるか
                            
                            return (
                                <div key={item.id} className="bg-[#fdfbf7] border border-[#c2b280] p-3 rounded flex justify-between items-center hover:border-[#a38b6b] transition-all duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-[#e8dcc8] border border-[#c2b280] flex items-center justify-center shrink-0 overflow-hidden relative">
                                            <img src="/images/items/item_unappraised.png" alt="未鑑定" className="w-full h-full object-cover" />
                                            <span className="absolute bottom-0 right-0 bg-[#3e2723] text-[#e3d5b8] text-[9px] px-1 font-bold rounded-tl-sm border-t border-l border-[#8b5a2b]/40">x{item.count}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#3e2723] text-sm">アイテム（未鑑定）</span>
                                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                                                    item.rarityLabel === 'UR' ? 'border-red-600 text-red-600 bg-red-50' :
                                                    item.rarityLabel === 'SR' ? 'border-yellow-600 text-yellow-600 bg-yellow-50' :
                                                    item.rarityLabel === 'R' ? 'border-blue-600 text-blue-600 bg-blue-50' :
                                                    'border-gray-500 text-gray-600 bg-gray-50'
                                                }`}>{item.rarityLabel}</span>
                                            </div>
                                            <div className="text-[11px] text-[#8b6f4e] mt-1 font-serif">
                                                鑑定料の目安: <span className="font-bold font-mono text-[#3e2723]">{item.costDesc}</span> G
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleAppraise(item.id)}
                                        disabled={!canAfford || item.count <= 0}
                                        className={`px-4 py-2 rounded text-xs font-bold border transition-all ${
                                            !canAfford 
                                                ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                : 'bg-[#8b5a2b] hover:bg-[#724a23] text-[#e3d5b8] border-[#5c3a1b] shadow hover:shadow-md'
                                        }`}
                                    >
                                        鑑定する
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer instructions */}
                <div className="p-3 border-t border-[#8b5a2b]/30 bg-[#3e2723]/10 text-center text-[10px] text-[#8b6f4e] font-serif">
                    ※ 鑑定料は品物ごとに異なり、鑑定時にランダムに算出・減算されます。
                </div>
            </div>

            {/* 1. 鑑定中ローディング演出画面 */}
            {isAppraising && (
                <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
                    {/* 静かな魔方陣/虫眼鏡風の光の円 */}
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-dashed border-amber-500/30 rounded-full animate-spin-slow"></div>
                        <div className="absolute w-16 h-16 border border-amber-500/20 rounded-full animate-pulse-slow"></div>
                        <Search className="w-8 h-8 text-amber-500 animate-pulse" />
                    </div>
                    
                    <h3 className="text-amber-100 font-serif font-bold text-sm tracking-widest">{appraisalStepText}</h3>
                    <p className="text-[10px] text-[#a38b6b] mt-1.5 font-serif italic animate-pulse-slow">店主が眼識を研ぎ澄ましています...</p>
                </div>
            )}

            {/* 2. 鑑定結果モーダルポップアップ */}
            {appraisalResult && resultDesign && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/95 pointer-events-none" />
                    
                    <div className={`w-full max-w-sm rounded-xl overflow-hidden bg-gray-900 border-2 ${resultDesign.borderColor} shadow-2xl flex flex-col items-center p-6 text-center animate-in zoom-in-95 duration-300 ${resultDesign.overlayEffect}`}>
                        
                        {/* レアリティバッジ */}
                        <div className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-bold tracking-widest font-mono mb-2 ${resultDesign.rarityBadge}`}>
                            {appraisalResult.rarity}
                        </div>

                        <div className="text-xs text-amber-500/70 mb-4 font-serif">鑑定完了</div>
                        
                        {/* アイテム画像・輝きエフェクト */}
                        <div className="relative w-28 h-28 bg-gray-800/80 rounded-2xl border border-gray-700/60 flex items-center justify-center overflow-hidden mb-5">
                            {/* キラキラ演出バックグラウンド */}
                            {(appraisalResult.rarity.toLowerCase() === 'epic' || appraisalResult.rarity.toLowerCase() === 'legendary') && (
                                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(234,179,8,0.15)_0%,transparent_70%)] animate-pulse" />
                            )}
                            {appraisalResult.image_url ? (
                                <img src={appraisalResult.image_url} alt={appraisalResult.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-amber-500">✨</span>
                            )}
                        </div>

                        {/* アイテム名 */}
                        <h4 className={`text-xl font-bold mb-2 tracking-wide text-white ${resultDesign.glowClass}`}>
                            {appraisalResult.name}
                        </h4>

                        {/* 鑑定費用 */}
                        <div className="text-[10px] text-gray-500 font-mono mb-4">
                            鑑定料: <span className="text-amber-400 font-bold">{actualCost} G</span> を支払った
                        </div>

                        {/* アイテム効果/説明 */}
                        <div className="bg-black/40 border border-gray-800 rounded-lg p-3 w-full mb-6 max-h-24 overflow-y-auto">
                            <p className="text-xs text-gray-300 leading-relaxed font-serif">
                                {appraisalResult.description}
                            </p>
                        </div>

                        {/* 鑑定NPCセリフエリア */}
                        <div className="border-t border-gray-800/80 pt-4 w-full mb-6">
                            <div className="flex gap-2.5 items-center justify-start text-left bg-gray-950/40 p-2.5 rounded border border-gray-800/50">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-600/40 shrink-0 bg-gray-900">
                                    <img src={npcImg} alt={npcName} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] text-[#a38b6b] font-bold">{npcRole}</div>
                                    <p className="text-[11px] text-amber-100 font-serif italic mt-0.5 leading-relaxed">
                                        {resultDesign.npcMessage}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 受け取りボタン */}
                        <button
                            onClick={() => {
                                setAppraisalResult(null);
                                soundManager?.playSE('se_click');
                            }}
                            className={`w-full py-2.5 text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 ${
                                appraisalResult.rarity.toLowerCase() === 'legendary'
                                    ? 'bg-red-800 hover:bg-red-700 text-white border border-red-600'
                                    : appraisalResult.rarity.toLowerCase() === 'epic'
                                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black border border-yellow-500 font-black'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                            }`}
                        >
                            荷物に加える
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
