'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Coins, Sparkles, Key, CreditCard, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import PurchaseConfirmModal from './PurchaseConfirmModal';

interface Props {
    onClose: () => void;
}

export default function BillingModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { userProfile, fetchUserProfile } = useGameStore();
    const [loadingKey, setLoadingKey] = useState<string | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    
    // 購入確認ポップアップの状態
    const [purchaseConfirm, setPurchaseConfirm] = useState<{
        type: 'subscription' | 'gold';
        tier?: 'basic' | 'premium';
        packageKey?: 'gold_10k' | 'gold_30k' | 'gold_50k' | 'gold_starter' | 'gold_elite';
    } | null>(null);

    React.useEffect(() => {
        soundManager?.init();
        fetchUserProfile();
    }, []);

    const handleOpenPortal = async () => {
        soundManager?.playSE('se_click');
        setPortalLoading(true);
        setError(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'ポータルの起動に失敗しました。');
            window.location.href = data.url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setPortalLoading(false);
        }
    };

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        soundManager?.playSE('se_click');
        onClose();
    };

    // 共通の決済セッション作成処理
    const callBillingCheckout = async (body: Record<string, any>) => {
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '決済URLの取得に失敗しました');
        return data.url;
    };

    // プラン入会要求
    const requestUpgradeTier = (tier: 'basic' | 'premium') => {
        soundManager?.playSE('se_click');
        setError(null);
        setPurchaseConfirm({ type: 'subscription', tier });
    };

    const executeUpgradeTier = async (tier: 'basic' | 'premium') => {
        setLoadingKey(tier);
        try {
            const url = await callBillingCheckout({ mode: 'subscription', tier });
            window.location.href = url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingKey(null);
            setPurchaseConfirm(null);
        }
    };

    // ゴールド・パッケージ購入要求
    const requestBuyGold = (packageKey: 'gold_10k' | 'gold_30k' | 'gold_50k' | 'gold_starter' | 'gold_elite') => {
        soundManager?.playSE('se_click');
        setError(null);
        setPurchaseConfirm({ type: 'gold', packageKey });
    };

    const executeBuyGold = async (packageKey: 'gold_10k' | 'gold_30k' | 'gold_50k' | 'gold_starter' | 'gold_elite') => {
        setLoadingKey(packageKey);
        try {
            const url = await callBillingCheckout({ mode: 'payment', packageKey });
            window.location.href = url;
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingKey(null);
            setPurchaseConfirm(null);
        }
    };

    // 1回限り購入パッケージの購入済みステータス取得
    const isPurchasedStarter = userProfile?.has_purchased_starter === true;
    const isPurchasedElite = userProfile?.has_purchased_elite === true;
    const currentTier = userProfile?.subscription_tier || 'free';

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
            {/* 特商法確認モーダル */}
            {purchaseConfirm && (
                <PurchaseConfirmModal
                    type={purchaseConfirm.type}
                    tier={purchaseConfirm.tier}
                    packageKey={purchaseConfirm.packageKey}
                    onConfirm={async () => {
                        soundManager?.playSE('se_click');
                        if (purchaseConfirm.type === 'subscription' && purchaseConfirm.tier) {
                            await executeUpgradeTier(purchaseConfirm.tier);
                        } else if (purchaseConfirm.type === 'gold' && purchaseConfirm.packageKey) {
                            await executeBuyGold(purchaseConfirm.packageKey);
                        }
                    }}
                    onCancel={() => {
                        soundManager?.playSE('se_click');
                        setPurchaseConfirm(null);
                    }}
                />
            )}

            <div className="relative w-full max-w-4xl bg-slate-950/90 border border-amber-900/40 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.15)] flex flex-col max-h-[90vh] text-slate-100 overflow-hidden animate-in zoom-in-95 duration-250">
                {/* ヘッダー */}
                <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        <h2 className="text-lg font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                            魔導ショップ ＆ 旅人の契約
                        </h2>
                    </div>
                    <button 
                        onClick={handleClose} 
                        disabled={isClosing}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-55"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* スクロールコンテンツ */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
                    {error && (
                        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-xs text-red-400 font-semibold text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {/* 1. サブスクリプション契約セクション */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500/80 border-b border-amber-900/20 pb-2">
                            1. 旅人のサブスクリプション契約 (月額プラン)
                        </h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            ※ 各有料プランは月額自動更新となります。初回契約時は7日間の無料トライアルが適用されます（生涯1回のみ）。
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Plan */}
                            <div className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all bg-[#0a0d1a]/80
                                ${currentTier === 'basic' ? 'border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.25)]' : 'border-slate-800/80 hover:border-slate-700'}`}>
                                {currentTier === 'basic' && (
                                    <div className="absolute -top-2.5 right-4 bg-indigo-600 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded border border-indigo-400 flex items-center gap-1 shadow-md">
                                        <CheckCircle2 size={10} /> 現在加入中
                                    </div>
                                )}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="font-serif font-black text-indigo-400 text-base">Basic プラン</h4>
                                        <span className="text-slate-400 text-xs font-mono font-bold">880円（税込）/ 月</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-4 leading-normal">
                                        週ごとのゴールドに加え、魔術学院で強力なスキルを獲得できる各種鍵アイテムを毎週付与する標準プラン。
                                    </p>
                                    <ul className="text-[9px] text-slate-300 space-y-2 border-t border-slate-900 pt-3 mb-5">
                                        <li className="flex justify-between items-center text-indigo-300 font-bold bg-indigo-950/20 px-2 py-1 rounded">
                                            <span>🎁 Weeklyログインボーナス</span>
                                            <span>2,000 G + 鍵各1個</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-400">└ 付与される鍵の内訳:</span>
                                            <span>知識と契約の鍵 x1 / 魔道と鉄壁の鍵 x1</span>
                                        </li>
                                        <li className="flex justify-between"><span>👥 キャラクタースロット</span><span>3 枠 (Free: 1)</span></li>
                                        <li className="flex justify-between"><span>🏰 英霊 (Heroic) 登録</span><span>最大 3体 (Free: 0)</span></li>
                                        <li className="flex justify-between"><span>🪙 英霊ロイヤリティ率</span><span>25 % (Free: —)</span></li>
                                        <li className="flex justify-between"><span>🌐 UGC 作成公開 / 保存</span><span>最大 5枠 / 10枠</span></li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => requestUpgradeTier('basic')}
                                    disabled={loadingKey !== null || currentTier === 'basic'}
                                    className={`w-full py-2 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-[0.98] border
                                        ${currentTier === 'basic'
                                            ? 'bg-slate-800/30 text-slate-500 border-slate-850 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-650 hover:to-indigo-550 text-indigo-100 border-indigo-500 shadow-lg shadow-indigo-950/20'
                                        }`}
                                >
                                    {loadingKey === 'basic' ? '処理中...' : currentTier === 'basic' ? '加入中' : 'Basic プランを契約'}
                                </button>
                            </div>

                            {/* Premium Plan */}
                            <div className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all bg-[#120f1c]/80
                                ${currentTier === 'premium' ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'border-slate-800/80 hover:border-slate-700'}`}>
                                {currentTier === 'premium' && (
                                    <div className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded border border-amber-400 flex items-center gap-1 shadow-md">
                                        <CheckCircle2 size={10} /> 現在加入中
                                    </div>
                                )}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="font-serif font-black text-amber-400 text-base">Premium プラン</h4>
                                        <span className="text-slate-400 text-xs font-mono font-bold">2,200円（税込）/ 月</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-4 leading-normal">
                                        旅人の冒険枠・英霊スロットを大幅に拡張し、毎週大量のゴールドと複数の鍵を付与する最上位プラン。
                                    </p>
                                    <ul className="text-[9px] text-slate-300 space-y-2 border-t border-slate-900 pt-3 mb-5">
                                        <li className="flex justify-between items-center text-amber-300 font-bold bg-amber-950/20 px-2 py-1 rounded">
                                            <span>👑 Weeklyログインボーナス</span>
                                            <span>5,000 G + 鍵5個</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-400">└ 付与される鍵の内訳:</span>
                                            <span>知識と契約の鍵 x3 / 魔道と鉄壁の鍵 x2</span>
                                        </li>
                                        <li className="flex justify-between"><span>👥 キャラクタースロット</span><span>5 枠 (Free: 1)</span></li>
                                        <li className="flex justify-between"><span>🏰 英霊 (Heroic) 登録</span><span>最大 10体 (Free: 0)</span></li>
                                        <li className="flex justify-between"><span>🪙 英霊ロイヤリティ率</span><span>35 % (Free: —)</span></li>
                                        <li className="flex justify-between"><span>🌐 UGC 作成公開 / 保存</span><span>最大 30枠 / 50枠</span></li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => requestUpgradeTier('premium')}
                                    disabled={loadingKey !== null || currentTier === 'premium'}
                                    className={`w-full py-2 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-[0.98] border
                                        ${currentTier === 'premium'
                                            ? 'bg-slate-800/30 text-slate-500 border-slate-850 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-950/20'
                                        }`}
                                >
                                    {loadingKey === 'premium' ? '処理中...' : currentTier === 'premium' ? '加入中' : 'Premium プランを契約'}
                                </button>
                            </div>
                        </div>

                        {currentTier !== 'free' && (
                            <div className="mt-4 p-4 rounded-xl border border-slate-800/80 bg-[#120f1c]/35 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">サブスクリプションの変更・解約について</h4>
                                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                                        プランのアップグレード、お支払い方法の変更、解約などのお手続きは、Stripeカスタマーポータルより安全に行っていただくことができます。
                                    </p>
                                </div>
                                <button
                                    onClick={handleOpenPortal}
                                    disabled={portalLoading || loadingKey !== null}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-350 hover:text-white font-bold text-xs rounded-lg transition-all active:scale-[0.97] shrink-0"
                                >
                                    {portalLoading ? '処理中...' : 'プラン管理・解約手続き'}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* 2. アカウント1回限り限定パッケージ */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500/80 border-b border-amber-900/20 pb-2">
                            2. アカウント限定スペシャルパック (1回限り)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Starter Pack */}
                            <div className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all bg-gradient-to-b from-[#111c1e]/40 to-slate-950/60
                                ${isPurchasedStarter ? 'border-slate-900 bg-slate-950/20 opacity-60' : 'border-teal-900/40 hover:border-teal-800'}`}>
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="font-serif font-black text-teal-400 text-base">スターターパック</h4>
                                        <span className="text-slate-400 text-xs font-mono font-bold">880円（税込）</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-4 leading-normal">
                                        冒険をスタートした旅人のために、大量のゴールドと合計8個のパック開封用鍵を同梱したお得なブースト用パック。
                                    </p>
                                    <div className="bg-black/35 border border-teal-950/30 rounded-xl p-3 mb-5 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black text-amber-400">
                                            <span>💰 付与ゴールド</span>
                                            <span>10,000 G</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black text-teal-300">
                                            <span>🔑 知識と契約の鍵 (basic)</span>
                                            <span className="flex items-center gap-1"><Key size={10} /> x 5</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black text-indigo-300">
                                            <span>🔑 魔道と鉄壁の鍵 (academy)</span>
                                            <span className="flex items-center gap-1"><Key size={10} /> x 3</span>
                                        </div>
                                        <div className="border-t border-slate-900 pt-1.5 flex justify-between items-center text-[9px] text-slate-500">
                                            <span>※ パック開封価値換算</span>
                                            <span className="font-bold text-amber-500/80">実質 40,000 G分</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => requestBuyGold('gold_starter')}
                                    disabled={loadingKey !== null || isPurchasedStarter}
                                    className={`w-full py-2 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-[0.98] border
                                        ${isPurchasedStarter
                                            ? 'bg-slate-900/50 text-slate-600 border-slate-900 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-650 hover:to-teal-550 text-teal-100 border-teal-500 shadow-md shadow-teal-950/20'
                                        }`}
                                >
                                    {loadingKey === 'gold_starter' ? '処理中...' : isPurchasedStarter ? '購入済み' : 'スターターパックを購入'}
                                </button>
                            </div>

                            {/* Elite Pack */}
                            <div className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all bg-gradient-to-b from-[#1f1610]/40 to-slate-950/60
                                ${isPurchasedElite ? 'border-slate-900 bg-slate-950/20 opacity-60' : 'border-orange-900/40 hover:border-orange-850'}`}>
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="font-serif font-black text-orange-400 text-base">エリートパック</h4>
                                        <span className="text-slate-400 text-xs font-mono font-bold">1,320円（税込）</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-4 leading-normal">
                                        一気に戦力を整えたい探求者へ、30,000Gと大量の鍵アイテム（合計13個）を詰め合わせた、最もコストパフォーマンスの高い限定パック。
                                    </p>
                                    <div className="bg-black/35 border border-orange-950/30 rounded-xl p-3 mb-5 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black text-amber-400">
                                            <span>💰 付与ゴールド</span>
                                            <span>30,000 G</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black text-teal-300">
                                            <span>🔑 知識と契約の鍵 (basic)</span>
                                            <span className="flex items-center gap-1"><Key size={10} /> x 8</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black text-indigo-300">
                                            <span>🔑 魔道と鉄壁 of 鍵 (academy)</span>
                                            <span className="flex items-center gap-1"><Key size={10} /> x 5</span>
                                        </div>
                                        <div className="border-t border-slate-900 pt-1.5 flex justify-between items-center text-[9px] text-slate-500">
                                            <span>※ パック開封価値換算</span>
                                            <span className="font-bold text-amber-500/80">実質 79,000 G分</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => requestBuyGold('gold_elite')}
                                    disabled={loadingKey !== null || isPurchasedElite}
                                    className={`w-full py-2 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-[0.98] border
                                        ${isPurchasedElite
                                            ? 'bg-slate-900/50 text-slate-600 border-slate-900 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-650 hover:to-orange-550 text-orange-100 border-orange-550 shadow-md shadow-orange-950/20'
                                        }`}
                                >
                                    {loadingKey === 'gold_elite' ? '処理中...' : isPurchasedElite ? '購入済み' : 'エリートパックを購入'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* 3. 通常ゴールド都度チャージ */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500/80 border-b border-amber-900/20 pb-2">
                            3. 通常ゴールド購入
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Starter Pack (10k G) */}
                            <div className="rounded-xl border border-slate-800/80 bg-[#070b15]/40 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                                <div className="text-center mb-3">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">スターター</span>
                                    <div className="flex items-center justify-center gap-1 text-amber-300 font-black text-sm">
                                        <Coins size={14} /> 10,000 G
                                    </div>
                                </div>
                                <button
                                    onClick={() => requestBuyGold('gold_10k')}
                                    disabled={loadingKey !== null}
                                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 rounded-lg text-[10px] font-bold tracking-wider transition-all active:scale-[0.97]"
                                >
                                    {loadingKey === 'gold_10k' ? '処理中...' : '330円（税込）で購入'}
                                </button>
                            </div>

                            {/* Standard Pack (30k G) */}
                            <div className="rounded-xl border border-slate-800/80 bg-[#070b15]/40 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                                <div className="text-center mb-3">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">スタンダード</span>
                                    <div className="flex items-center justify-center gap-1 text-amber-300 font-black text-sm">
                                        <Coins size={14} /> 30,000 G
                                    </div>
                                </div>
                                <button
                                    onClick={() => requestBuyGold('gold_30k')}
                                    disabled={loadingKey !== null}
                                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 rounded-lg text-[10px] font-bold tracking-wider transition-all active:scale-[0.97]"
                                >
                                    {loadingKey === 'gold_30k' ? '処理中...' : '950円（税込）で購入'}
                                </button>
                            </div>

                            {/* Adventure Pack (50k G) */}
                            <div className="rounded-xl border border-slate-850/80 bg-[#090d19]/60 p-4 flex flex-col justify-between hover:border-slate-750 transition-colors relative shadow-inner">
                                <div className="absolute top-1 right-2 text-[7px] text-amber-400 font-black uppercase tracking-wider border border-amber-800/35 px-1 rounded bg-black/45 scale-90">
                                    お得！
                                </div>
                                <div className="text-center mb-3">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">アドベンチャー</span>
                                    <div className="flex items-center justify-center gap-1 text-amber-200 font-black text-sm">
                                        <Coins size={14} className="text-amber-400" /> 50,000 G
                                    </div>
                                </div>
                                <button
                                    onClick={() => requestBuyGold('gold_50k')}
                                    disabled={loadingKey !== null}
                                    className="w-full py-1.5 bg-gradient-to-r from-amber-900/35 to-amber-800/35 hover:from-amber-900/50 hover:to-amber-800/50 text-amber-100 border border-amber-900/50 rounded-lg text-[10px] font-bold tracking-wider transition-all active:scale-[0.97]"
                                >
                                    {loadingKey === 'gold_50k' ? '処理中...' : '1,430円（税込）で購入'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* フッター */}
                <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950 flex justify-center items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-sans">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>SSL 暗号化により決済データは安全に送信されます。</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
