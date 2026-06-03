'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Package, Upload, Send, X, ShoppingCart, AlertTriangle, Loader2, Check } from 'lucide-react';
import { getAuthToken } from '@/lib/authToken';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Props {
    isOpen: boolean;
    onClose: () => void;
    usageData: {
        tier: string;
        gold: number;
        drafts: { extra: number; max_extra: number; limit: number; used: number; base_limit: number };
        published: { extra: number; max_extra: number; limit: number; used: number; base_limit: number };
        daily_import: { extra?: number; limit: number; used: number; base_limit?: number };
        gold_costs: {
            extra_draft_slot: number;
            extra_published_slot: number;
            extra_daily_import: number;
        };
    } | null;
    onPurchased: () => void;
}

type SlotType = 'draft' | 'published' | 'daily_import';

interface PurchaseOption {
    type: SlotType;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    addAmount: string;
    cost: number;
    currentExtra: number;
    maxExtra: number;
    isDaily: boolean;
}

/* ── Component ────────────────────────────────────────────────────────────── */
export default function GoldSlotPurchaseModal({
    isOpen,
    onClose,
    usageData,
    onPurchased,
}: Props) {
    const router = useRouter();
    const [purchasing, setPurchasing] = useState<SlotType | null>(null);
    const [successType, setSuccessType] = useState<SlotType | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setPurchasing(null);
            setSuccessType(null);
            setError(null);
        }
    }, [isOpen]);

    const handlePurchase = useCallback(async (slotType: SlotType, label: string, cost: number) => {
        if (!confirm(`${label}を ${cost.toLocaleString()} G で購入しますか？`)) return;

        setPurchasing(slotType);
        setError(null);
        setSuccessType(null);

        try {
            const token = await getAuthToken();
            const res = await fetch('/api/ugc/v2/purchase-slot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ slot_type: slotType }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || '購入に失敗しました。');
                return;
            }

            setSuccessType(slotType);
            onPurchased();

            // Clear success after 2 seconds
            setTimeout(() => setSuccessType(null), 2000);
        } catch (e) {
            console.error('[GoldSlotPurchaseModal]', e);
            setError('通信エラーが発生しました。');
        } finally {
            setPurchasing(null);
        }
    }, [onPurchased]);

    if (!isOpen || !usageData) return null;

    const gold = usageData.gold;
    const costs = usageData.gold_costs;

    const options: PurchaseOption[] = [
        {
            type: 'draft',
            icon: Package,
            label: '下書き枠 +1',
            description: '下書き・審査中・却下の合計上限を増やします',
            addAmount: '+1',
            cost: costs.extra_draft_slot,
            currentExtra: usageData.drafts.extra,
            maxExtra: usageData.drafts.max_extra,
            isDaily: false,
        },
        {
            type: 'published',
            icon: Send,
            label: '公開枠 +1',
            description: '同時公開可能なクエスト数を増やします',
            addAmount: '+1',
            cost: costs.extra_published_slot,
            currentExtra: usageData.published.extra,
            maxExtra: usageData.published.max_extra,
            isDaily: false,
        },
        {
            type: 'daily_import',
            icon: Upload,
            label: 'インポート回数 +5',
            description: '本日のインポート上限を +5 回追加（当日限り）',
            addAmount: '+5',
            cost: costs.extra_daily_import,
            currentExtra: usageData.daily_import.extra || 0,
            maxExtra: 999,
            isDaily: true,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-[420px] flex flex-col bg-[#0d0907] border border-[#3e2723] rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e2723] bg-[#1a120e]">
                    <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <h2 className="text-sm font-bold text-[#e3d5b8]">
                            ゴールドで枠を追加
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-[#3e2723] transition-colors"
                        aria-label="閉じる"
                    >
                        <X className="w-4 h-4 text-[#a38b6b]" />
                    </button>
                </div>

                {/* Gold Balance */}
                <div className="px-4 py-2.5 border-b border-[#3e2723]/60 bg-[#1a120e]/60">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#6d4c3d] uppercase tracking-wider">所持ゴールド</span>
                        <span className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-sm">
                            <Coins className="w-4 h-4" />
                            {gold.toLocaleString()} G
                        </span>
                    </div>
                </div>

                {/* Purchase Options */}
                <div className="p-4 space-y-3">
                    {options.map((opt) => {
                        const Icon = opt.icon;
                        const atMax = opt.currentExtra >= opt.maxExtra;
                        const cantAfford = gold < opt.cost;
                        const disabled = atMax || cantAfford || purchasing !== null;
                        const isSuccess = successType === opt.type;
                        const isPurchasing = purchasing === opt.type;

                        return (
                            <div
                                key={opt.type}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    isSuccess
                                        ? 'bg-emerald-900/20 border-emerald-600/50'
                                        : atMax
                                            ? 'bg-[#1a120e]/50 border-[#3e2723]/50 opacity-50'
                                            : 'bg-[#1a120e] border-[#3e2723] hover:border-[#5c3c2a]'
                                }`}
                            >
                                {/* Icon */}
                                <div className={`p-2 rounded-lg shrink-0 ${
                                    isSuccess
                                        ? 'bg-emerald-900/40 text-emerald-400'
                                        : 'bg-[#3e2723] text-amber-400'
                                }`}>
                                    <Icon className="w-4 h-4" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#e3d5b8]">{opt.label}</span>
                                        {opt.isDaily && (
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-900/30 text-amber-500 font-bold">
                                                当日限り
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[#6d4c3d] mt-0.5">{opt.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-mono text-[#a38b6b]">
                                            追加済み: {opt.currentExtra}
                                            {!opt.isDaily && ` / ${opt.maxExtra}`}
                                        </span>
                                        <span className="text-[10px] font-mono text-amber-500">
                                            {opt.cost.toLocaleString()} G
                                        </span>
                                    </div>
                                </div>

                                {/* Buy Button */}
                                <button
                                    onClick={() => handlePurchase(opt.type, opt.label, opt.cost)}
                                    disabled={disabled}
                                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                                        isSuccess
                                            ? 'bg-emerald-700 text-emerald-100 cursor-default'
                                            : disabled
                                                ? 'bg-[#3e2723]/50 text-[#6d4c3d] cursor-not-allowed'
                                                : 'bg-[#8b5a2b] text-white hover:bg-[#6b4522] active:scale-95'
                                    }`}
                                >
                                    {isPurchasing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : isSuccess ? (
                                        <>
                                            <Check className="w-3 h-3" /> 完了
                                        </>
                                    ) : atMax ? (
                                        '上限'
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-3 h-3" /> 購入
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-4 mb-3 flex items-start gap-2 p-2.5 rounded bg-red-900/20 border border-red-700/40">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-red-300">{error}</span>
                    </div>
                )}

                {/* Gold insufficient warning */}
                {gold < Math.min(costs.extra_draft_slot, costs.extra_published_slot, costs.extra_daily_import) && (
                    <div className="mx-4 mb-3 flex items-start gap-2 p-2.5 rounded bg-amber-900/15 border border-amber-700/30">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-[10px] text-amber-300 block">
                                ゴールドが不足しています。
                            </span>
                            <button
                                onClick={() => { onClose(); router.push('/inn'); }}
                                className="text-[10px] text-amber-400 underline hover:text-amber-300 mt-0.5"
                            >
                                宿屋 → アカウント設定 へ移動
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end px-4 py-2.5 border-t border-[#3e2723] bg-[#1a120e]">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-[#3e2723] text-[#e3d5b8] text-xs font-bold rounded hover:bg-[#4e342e] transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
