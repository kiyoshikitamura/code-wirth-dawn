'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Crown, Zap, Package, Upload, Send, Plus, Coins, RefreshCw, Loader2 } from 'lucide-react';
import GoldSlotPurchaseModal from './GoldSlotPurchaseModal';
import { getAuthToken } from '@/lib/authToken';

/* ── Usage data shape from /api/ugc/v2/usage ─────────────────────────────── */
interface SlotUsage {
    used: number;
    base_limit: number;
    extra: number;
    limit: number;
    max_extra: number;
}

interface RateUsage {
    used: number;
    base_limit?: number;
    extra?: number;
    limit: number;
    resets_at: string;
}

interface UsageData {
    tier: string;
    gold: number;
    drafts: SlotUsage;
    published: SlotUsage;
    daily_import: RateUsage;
    daily_publish: RateUsage;
    daily_save: RateUsage;
    gold_costs: {
        extra_draft_slot: number;
        extra_published_slot: number;
        extra_daily_import: number;
    };
}

/* ── Usage Bar ────────────────────────────────────────────────────────────── */
function UsageBar({
    label,
    icon: Icon,
    used,
    limit,
    extra,
}: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    used: number;
    limit: number;
    extra?: number;
}) {
    const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
    const textColor = pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-gray-400';

    return (
        <div className="flex-1 min-w-[80px]">
            <div className="flex items-center gap-1 mb-0.5">
                <Icon className="w-3 h-3 text-gray-500" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
                <span className={`text-[10px] font-mono ml-auto ${textColor}`}>
                    {used}/{limit}
                    {extra ? <span className="text-amber-600"> (+{extra})</span> : null}
                </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ── Tier Badge ───────────────────────────────────────────────────────────── */
function TierBadge({ tier }: { tier: string }) {
    switch (tier) {
        case 'premium':
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    <Crown className="w-3 h-3" /> Premium
                </span>
            );
        case 'basic':
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-400/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                    <Zap className="w-3 h-3" /> Basic
                </span>
            );
        default:
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-600/20 text-gray-400 text-[10px] font-bold border border-gray-500/30">
                    Free
                </span>
            );
    }
}

/* ── Loading Skeleton ─────────────────────────────────────────────────────── */
function Skeleton() {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1a120e] border-b border-[#3e2723]">
            <Loader2 className="w-4 h-4 text-amber-400/60 animate-spin shrink-0" />
            <span className="text-[10px] text-[#6d4c3d]">ステータスを読み込み中...</span>
        </div>
    );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function WorkshopStatusPanel() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPurchase, setShowPurchase] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    const fetchUsage = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);

        try {
            const token = await getAuthToken();
            const res = await fetch('/api/ugc/v2/usage', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `HTTP ${res.status}`);
            }
            const json: UsageData = await res.json();
            setData(json);
        } catch (e) {
            console.error('[WorkshopStatusPanel]', e);
            setError(e instanceof Error ? e.message : 'データの取得に失敗しました。');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchUsage();
        }
    }, [fetchUsage]);

    const handlePurchased = useCallback(() => {
        fetchUsage(true);
    }, [fetchUsage]);

    if (loading) return <Skeleton />;

    if (error) {
        return (
            <div className="flex items-center justify-between px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-lg">
                <span className="text-xs text-red-400">{error}</span>
                <button
                    onClick={() => fetchUsage()}
                    className="text-[10px] px-2 py-1 rounded bg-[#3e2723] text-[#a38b6b] hover:text-amber-400 transition-colors"
                >
                    再試行
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <>
            <div className="flex flex-row items-center gap-2 px-3 py-2 bg-[#1a120e] border-b border-[#3e2723] shrink-0">
                {/* Left: Tier Badge */}
                <TierBadge tier={data.tier} />

                {/* Center: Usage Bars (vertical stack) */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <UsageBar
                        label="下書き"
                        icon={Package}
                        used={data.drafts.used}
                        limit={data.drafts.limit}
                        extra={data.drafts.extra > 0 ? data.drafts.extra : undefined}
                    />
                    <UsageBar
                        label="公開"
                        icon={Send}
                        used={data.published.used}
                        limit={data.published.limit}
                        extra={data.published.extra > 0 ? data.published.extra : undefined}
                    />
                    <UsageBar
                        label="Import"
                        icon={Upload}
                        used={data.daily_import.used}
                        limit={data.daily_import.limit}
                        extra={data.daily_import.extra && data.daily_import.extra > 0 ? data.daily_import.extra : undefined}
                    />
                </div>

                {/* Right: Gold + Purchase Button */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold font-mono">
                        <Coins className="w-3 h-3" />
                        {data.gold.toLocaleString()}
                    </span>

                    <button
                        onClick={() => setShowPurchase(true)}
                        className="flex items-center gap-0.5 px-1.5 py-1 rounded bg-[#3e2723] text-[#e3d5b8] hover:bg-[#4e342e] text-[9px] font-bold transition-colors border border-[#5c3c2a]"
                    >
                        <Plus className="w-2.5 h-2.5" /> 枠追加
                    </button>

                    <button
                        onClick={() => fetchUsage(true)}
                        disabled={refreshing}
                        className="p-1 rounded hover:bg-[#3e2723] transition-colors disabled:opacity-30"
                        title="更新"
                    >
                        {refreshing
                            ? <Loader2 className="w-3 h-3 text-[#a38b6b] animate-spin" />
                            : <RefreshCw className="w-3 h-3 text-[#6d4c3d]" />
                        }
                    </button>
                </div>
            </div>

            {/* Purchase Modal */}
            <GoldSlotPurchaseModal
                isOpen={showPurchase}
                onClose={() => setShowPurchase(false)}
                usageData={data}
                onPurchased={handlePurchased}
            />
        </>
    );
}
