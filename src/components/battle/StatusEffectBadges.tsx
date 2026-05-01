'use client';

import { StatusEffect, StatusEffectId } from '@/lib/statusEffects';

// ─── バッジ定義 ───────────────────────────────────────────────

interface BadgeDef {
    label: string;
    category: 'buff' | 'debuff';
    color: string;        // テキスト色 (tailwind)
    bg: string;           // 背景色 (tailwind)
    border: string;       // ボーダー (tailwind)
    blink?: 'fast' | 'mid' | 'slow' | null;
}

const BADGE_MAP: Partial<Record<StatusEffectId, BadgeDef>> = {
    // ─ バフ ─────────────────────────────────────────
    atk_up:       { label: '↑A', category: 'buff',   color: 'text-orange-300', bg: 'bg-orange-900/80', border: 'border-orange-500',  blink: null },
    def_up:       { label: '↑D', category: 'buff',   color: 'text-blue-300',   bg: 'bg-blue-900/80',   border: 'border-blue-500',    blink: null },
    def_up_heavy: { label: '↑↑D',category: 'buff',  color: 'text-blue-200',   bg: 'bg-blue-900/80',   border: 'border-blue-400',    blink: null },
    regen:        { label: '♥',   category: 'buff',   color: 'text-green-300',  bg: 'bg-green-900/80',  border: 'border-green-500',   blink: 'slow' },
    evasion_up:   { label: '↑E', category: 'buff',   color: 'text-cyan-300',   bg: 'bg-cyan-900/80',   border: 'border-cyan-500',    blink: null },
    taunt:        { label: '☆',   category: 'buff',   color: 'text-yellow-300', bg: 'bg-yellow-900/80', border: 'border-yellow-500',  blink: null },
    stun_immune:  { label: '◎',   category: 'buff',   color: 'text-violet-300', bg: 'bg-violet-900/80', border: 'border-violet-500',  blink: null },
    // ─ デバフ ────────────────────────────────────────
    stun:         { label: 'S',  category: 'debuff', color: 'text-yellow-200', bg: 'bg-yellow-900/80', border: 'border-yellow-400',  blink: 'fast' },
    bind:         { label: 'S',  category: 'debuff', color: 'text-yellow-200', bg: 'bg-yellow-900/80', border: 'border-yellow-400',  blink: 'fast' },
    blind:        { label: 'B',  category: 'debuff', color: 'text-purple-200', bg: 'bg-purple-900/80', border: 'border-purple-400',  blink: 'mid' },
    blind_minor:  { label: 'b',  category: 'debuff', color: 'text-purple-300', bg: 'bg-purple-900/80', border: 'border-purple-500',  blink: 'mid' },
    poison:       { label: '☠',   category: 'debuff', color: 'text-lime-300',   bg: 'bg-lime-900/80',   border: 'border-lime-500',    blink: 'slow' },
    bleed:        { label: '✦',   category: 'debuff', color: 'text-red-300',    bg: 'bg-red-900/80',    border: 'border-red-500',     blink: 'fast' },
    bleed_minor:  { label: '✧',   category: 'debuff', color: 'text-red-400',    bg: 'bg-red-900/80',    border: 'border-red-600',     blink: 'fast' },
    fear:         { label: '!',   category: 'debuff', color: 'text-orange-200', bg: 'bg-orange-900/80', border: 'border-orange-400',  blink: 'mid' },
    atk_down:     { label: '↓A', category: 'debuff', color: 'text-red-300',    bg: 'bg-red-950/80',    border: 'border-red-700',     blink: null },
    def_down:     { label: '↓D', category: 'debuff', color: 'text-blue-300',   bg: 'bg-blue-950/80',   border: 'border-blue-700',    blink: null },
    burn:         { label: '🔥',  category: 'debuff', color: 'text-orange-300', bg: 'bg-orange-900/80', border: 'border-orange-500',  blink: 'fast' },
    freeze:       { label: '❄',   category: 'debuff', color: 'text-cyan-200',   bg: 'bg-cyan-900/80',   border: 'border-cyan-400',    blink: 'mid' },
    curse:        { label: '☯',   category: 'debuff', color: 'text-purple-300', bg: 'bg-purple-900/80', border: 'border-purple-500',  blink: 'mid' },
    // ─ 特殊バフ ──────────────────────────────────────
    barrier:      { label: '🛡',  category: 'buff',   color: 'text-amber-300',  bg: 'bg-amber-900/80',  border: 'border-amber-500',   blink: 'slow' },
    // cure_* / ap_max は即時効果のため表示不要
};

const BLINK_CLASS: Record<string, string> = {
    fast: 'animate-[badgePulseHard_0.6s_ease-in-out_infinite]',
    mid:  'animate-[badgePulseMid_1.0s_ease-in-out_infinite]',
    slow: 'animate-[badgePulseSlow_1.5s_ease-in-out_infinite]',
};

// ─── Props ────────────────────────────────────────────────────

interface StatusEffectBadgesProps {
    /** StatusEffect 配列 (player_effects / target.status_effects / member.status_effects) */
    effects: (StatusEffect | { id: string; duration: number })[];
    /** sm: 12px アイコン用 / md: 16px スプライト下用 */
    size?: 'sm' | 'md';
    /** 最大表示バッジ数（デフォルト6） */
    maxBadges?: number;
}

// ─── Component ────────────────────────────────────────────────

export default function StatusEffectBadges({
    effects,
    size = 'sm',
    maxBadges = 6,
}: StatusEffectBadgesProps) {
    // 有効な効果のみ（duration > 0、かつバッジ定義あり）
    const active = effects
        .filter(e => e.duration > 0 && BADGE_MAP[e.id as StatusEffectId])
        .slice(0, maxBadges);

    // BUFF 先・DEBUFF 後でソート
    const sorted = [
        ...active.filter(e => BADGE_MAP[e.id as StatusEffectId]?.category === 'buff'),
        ...active.filter(e => BADGE_MAP[e.id as StatusEffectId]?.category === 'debuff'),
    ];

    if (sorted.length === 0) return null;

    const isMd = size === 'md';
    const containerCls = `flex flex-wrap gap-[2px] ${isMd ? 'gap-[3px]' : ''}`;
    const badgeBase = isMd
        ? 'inline-flex items-center justify-center w-[18px] h-[18px] rounded-sm text-[9px] font-bold border leading-none select-none'
        : 'inline-flex items-center justify-center w-[14px] h-[14px] rounded-sm text-[7px] font-bold border leading-none select-none';

    return (
        <>
            {/* アニメーション keyframes（グローバルに注入） */}
            <style>{`
                @keyframes badgePulseHard {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.25; }
                }
                @keyframes badgePulseMid {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }
                @keyframes badgePulseSlow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.60; }
                }
            `}</style>
            <div className={containerCls}>
                {sorted.map((e, idx) => {
                    const def = BADGE_MAP[e.id as StatusEffectId]!;
                    const blinkCls = def.blink ? BLINK_CLASS[def.blink] : '';
                    const jaNames: Record<string, string> = {
                        atk_up: '攻撃力上昇', def_up: '防御強化', def_up_heavy: '鉄壁防御',
                        regen: 'リジェネ', evasion_up: '回避上昇', taunt: '挑発',
                        stun_immune: 'スタン耐性', stun: 'スタン', bind: '拘束',
                        blind: '目潰し', blind_minor: '目潰し(軽)', poison: '毒',
                        bleed: '出血', bleed_minor: '出血(軽)', fear: '恐怖',
                        atk_down: '攻撃力低下', def_down: '防御力低下',
                        burn: '炎上', freeze: '凍結', curse: '呪い', barrier: 'バリア',
                    };
                    const jaName = jaNames[e.id] || e.id;
                    return (
                        <span
                            key={`${e.id}-${idx}`}
                            title={`${jaName} (残り${e.duration}T)`}
                            className={`${badgeBase} ${def.bg} ${def.color} ${def.border} ${blinkCls} shadow-sm`}
                        >
                            {def.label}
                        </span>
                    );
                })}
            </div>
        </>
    );
}
