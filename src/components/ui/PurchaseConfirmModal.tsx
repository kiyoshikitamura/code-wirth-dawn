'use client';

import React, { useState } from 'react';
import { Crown, Zap, Coins, Check, ExternalLink, ShieldCheck } from 'lucide-react';

type PurchaseType = 'subscription' | 'gold';

interface SubscriptionInfo {
    type: 'subscription';
    tier: 'basic' | 'premium';
}

interface GoldInfo {
    type: 'gold';
    packageKey: 'gold_10k' | 'gold_30k' | 'gold_50k';
}

type PurchaseInfo = SubscriptionInfo | GoldInfo;

interface PurchaseConfirmModalProps {
    purchase: PurchaseInfo;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const PLAN_DETAILS = {
    basic: {
        name: 'Basic プラン',
        price: '880円（税込）/月',
        trial: '最初の7日間無料',
        icon: <Zap className="w-5 h-5 text-blue-400" />,
        color: 'border-blue-600',
        btnColor: 'bg-blue-900/40 border-blue-600 text-blue-200 hover:bg-blue-900/60',
        features: [
            'キャラクタースロット 3枠',
            '英霊登録 最大3体',
            '英霊ロイヤリティ 25%',
            'Weekly 2,000G ボーナス',
            '⚡ 青枠プロフィール装飾',
        ],
    },
    premium: {
        name: 'Premium プラン',
        price: '2,200円（税込）/月',
        trial: '最初の7日間無料',
        icon: <Crown className="w-5 h-5 text-yellow-400" />,
        color: 'border-yellow-500',
        btnColor: 'bg-yellow-900/40 border-yellow-500 text-yellow-200 hover:bg-yellow-900/60',
        features: [
            'キャラクタースロット 5枠',
            '英霊登録 最大10体',
            '英霊ロイヤリティ 35%',
            'Weekly 5,000G ボーナス',
            '👑 金枠プロフィール装飾',
        ],
    },
};

const GOLD_DETAILS = {
    gold_10k: {
        name: 'スターターパック',
        amount: '10,000 G',
        price: '330円（税込）',
    },
    gold_30k: {
        name: 'スタンダードパック',
        amount: '30,000 G',
        price: '950円（税込）',
    },
    gold_50k: {
        name: 'アドベンチャーパック',
        amount: '50,000 G',
        price: '1,430円（税込）',
    },
};

/**
 * 課金確認ポップアップ
 * 特商法に基づく最終確認画面として機能。
 * プラン内容・金額・自動更新の有無を明示してから決済画面へ遷移する。
 */
export default function PurchaseConfirmModal({
    purchase,
    onConfirm,
    onCancel,
    loading = false,
}: PurchaseConfirmModalProps) {
    const [agreed, setAgreed] = useState(false);

    if (purchase.type === 'subscription') {
        const plan = PLAN_DETAILS[purchase.tier];
        return (
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
                onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
            >
                <div className={`bg-[#1a120b] border-2 ${plan.color} w-full max-w-sm shadow-2xl p-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto`}>
                    {/* ヘッダー */}
                    <div className="flex items-center gap-2 mb-4 border-b border-[#3e2723] pb-3">
                        {plan.icon}
                        <h3 className="text-lg font-serif font-bold text-[#e3d5b8]">{plan.name}にアップグレード</h3>
                    </div>

                    {/* 料金情報 */}
                    <div className="bg-black/40 border border-slate-700 rounded p-3 mb-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">月額料金</span>
                            <span className="font-bold text-[#e3d5b8]">{plan.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">更新</span>
                            <span className="text-slate-300">毎月自動更新</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">トライアル</span>
                            <span className="text-emerald-400 font-bold">{plan.trial}</span>
                        </div>
                    </div>

                    {/* 特典一覧 */}
                    <div className="mb-4">
                        <h4 className="text-xs text-[#a38b6b] font-bold mb-2">特典内容</h4>
                        <ul className="space-y-1.5">
                            {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 同意チェック */}
                    <label className="flex items-start gap-2 mb-4 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5 accent-amber-500 w-4 h-4"
                        />
                        <span className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                            <a href="/legal/terms" target="_blank" className="text-amber-400 underline">利用規約</a>
                            ・
                            <a href="/legal/tokusho" target="_blank" className="text-amber-400 underline">特定商取引法に基づく表記</a>
                            に同意の上、購入に進みます。トライアル期間終了後に自動で課金が開始されます。
                        </span>
                    </label>

                    {/* ボタン */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 py-2.5 text-sm font-bold bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-40"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading || !agreed}
                            className={`flex-1 py-2.5 text-sm font-bold border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${plan.btnColor} flex items-center justify-center gap-1.5`}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {loading ? '処理中...' : '購入に進む'}
                        </button>
                    </div>

                    <p className="text-[9px] text-slate-600 text-center mt-3 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Stripe決済画面に遷移します
                    </p>
                </div>
            </div>
        );
    }

    // ── ゴールド購入 ──
    const gold = GOLD_DETAILS[purchase.packageKey];
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-[#1a120b] border-2 border-yellow-700/60 w-full max-w-sm shadow-2xl p-5 animate-in zoom-in-95 duration-200">
                {/* ヘッダー */}
                <div className="flex items-center gap-2 mb-4 border-b border-[#3e2723] pb-3">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-serif font-bold text-[#e3d5b8]">ゴールド購入</h3>
                </div>

                {/* 購入内容 */}
                <div className="bg-black/40 border border-slate-700 rounded p-3 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">パッケージ</span>
                        <span className="font-bold text-[#e3d5b8]">{gold.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">付与ゴールド</span>
                        <span className="font-bold text-yellow-400">🪙 {gold.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">価格</span>
                        <span className="font-bold text-[#e3d5b8]">{gold.price}</span>
                    </div>
                </div>

                <p className="text-[11px] text-slate-500 mb-4">
                    ※ 一度限りの購入です（自動更新なし）。決済完了後、ゲーム内にゴールドが即時付与されます。
                </p>

                {/* ボタン */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-bold bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-40"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-bold bg-yellow-900/40 border border-yellow-600 text-yellow-200 rounded hover:bg-yellow-900/60 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {loading ? '処理中...' : '購入に進む'}
                    </button>
                </div>

                <p className="text-[9px] text-slate-600 text-center mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Stripe決済画面に遷移します
                </p>
            </div>
        </div>
    );
}
