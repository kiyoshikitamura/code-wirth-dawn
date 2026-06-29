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
    def_up_heavy: { label: '↑D', category: 'buff',  color: 'text-blue-200',   bg: 'bg-blue-900/80',   border: 'border-blue-400',    blink: null },
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
    berserk:             { label: '狂', category: 'buff',   color: 'text-red-200',    bg: 'bg-red-950/80',    border: 'border-red-500',     blink: 'mid' },
    counter_spike:       { label: '刺', category: 'buff',   color: 'text-amber-200',  bg: 'bg-amber-950/80',  border: 'border-amber-500',   blink: null },
    unyielding_barrier:  { label: '不', category: 'buff',   color: 'text-indigo-200', bg: 'bg-indigo-950/80', border: 'border-indigo-500',  blink: null },
    sacrificial_ap:      { label: '贄', category: 'buff',   color: 'text-emerald-200', bg: 'bg-emerald-950/80', border: 'border-emerald-500', blink: null },
    mana_charge:         { label: '充', category: 'buff',   color: 'text-purple-200', bg: 'bg-purple-950/80', border: 'border-purple-500',  blink: null },
    death_sentence:      { label: '💀', category: 'debuff', color: 'text-neutral-200', bg: 'bg-neutral-900/80',  border: 'border-neutral-500',  blink: 'slow' },
    cover_all:           { label: '代', category: 'buff',   color: 'text-orange-200', bg: 'bg-orange-950/80', border: 'border-orange-500',  blink: null },
    revenge_shield:      { label: '報', category: 'buff',   color: 'text-blue-200',   bg: 'bg-blue-950/80',   border: 'border-blue-500',    blink: null },
    soul_boost:          { label: '魂', category: 'buff',   color: 'text-pink-200',   bg: 'bg-pink-950/80',   border: 'border-pink-500',    blink: null },
    element_resonance:   { label: '共', category: 'buff',   color: 'text-teal-200',   bg: 'bg-teal-950/80',   border: 'border-teal-500',    blink: null },
    crit_vulnerability:  { label: '脆', category: 'debuff', color: 'text-red-300',    bg: 'bg-red-950/80',    border: 'border-red-400',     blink: null },
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
    const validEffects = (effects || []).filter(e => e.duration > 0 && BADGE_MAP[e.id as StatusEffectId]);

    // グルーピング化（同じIDのエフェクトは1つにまとめ、効果値は合計値、残りターンは最大値とする）
    const groupedMap = new Map<string, { id: string; duration: number; value?: number }>();
    validEffects.forEach(e => {
        const val = (e as any).value;
        const existing = groupedMap.get(e.id);
        if (existing) {
            const hasVal = val !== undefined || existing.value !== undefined;
            const newValue = hasVal ? (existing.value || 0) + (val || 0) : undefined;
            groupedMap.set(e.id, {
                id: e.id,
                duration: Math.max(existing.duration, e.duration),
                value: newValue
            });
        } else {
            groupedMap.set(e.id, { id: e.id, duration: e.duration, value: val });
        }
    });

    const active = Array.from(groupedMap.values()).slice(0, maxBadges);

    // BUFF 先・DEBUFF 後でソート
    const sorted = [
        ...active.filter(e => {
            const def = BADGE_MAP[e.id as StatusEffectId];
            const isNegative = e.value !== undefined && e.value < 0;
            return def?.category === 'buff' && !isNegative;
        }),
        ...active.filter(e => {
            const def = BADGE_MAP[e.id as StatusEffectId];
            const isNegative = e.value !== undefined && e.value < 0;
            return def?.category === 'debuff' || isNegative;
        }),
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
                    const jaNames: Record<string, string> = {
                        atk_up: '攻撃力上昇', def_up: '防御強化', def_up_heavy: '鉄壁防御',
                        regen: 'リジェネ', evasion_up: '回避上昇', taunt: '挑発',
                        stun_immune: 'スタン耐性', stun: 'スタン', bind: '拘束',
                        blind: '目潰し', blind_minor: '目潰し(軽)', poison: '毒',
                        bleed: '出血', bleed_minor: '出血(軽)', fear: '恐怖',
                        atk_down: '攻撃力低下', def_down: '防御力低下',
                        burn: '炎上', freeze: '凍結', curse: '呪い', barrier: 'バリア',
                        berserk: '狂戦士', counter_spike: '棘の鎧', unyielding_barrier: '不屈の防壁',
                        sacrificial_ap: '生贄の儀式', mana_charge: 'マナチャージ', death_sentence: '死神の宣告',
                        cover_all: '身代わりの盾', revenge_shield: '報復の盾', soul_boost: 'ソウルブースト',
                        element_resonance: '属性の共鳴', crit_vulnerability: '被クリ率UP',
                    };
                    let def = BADGE_MAP[e.id as StatusEffectId]!;
                    let jaName = jaNames[e.id] || e.id;

                    // 動的バフ/デバフバッジの書き換え (負の値の場合)
                    if (e.id === 'evasion_up' && (e as any).value !== undefined && (e as any).value < 0) {
                        def = {
                            label: '↓E',
                            category: 'debuff',
                            color: 'text-cyan-300',
                            bg: 'bg-cyan-950/80',
                            border: 'border-cyan-700',
                            blink: null
                        };
                        jaName = '回避低下';
                    } else if (e.id === 'atk_up' && (e as any).value !== undefined && (e as any).value < 0) {
                        def = {
                            label: '↓A',
                            category: 'debuff',
                            color: 'text-red-300',
                            bg: 'bg-red-950/80',
                            border: 'border-red-700',
                            blink: null
                        };
                        jaName = '攻撃力低下';
                    } else if (e.id === 'def_up' && (e as any).value !== undefined && (e as any).value < 0) {
                        def = {
                            label: '↓D',
                            category: 'debuff',
                            color: 'text-blue-300',
                            bg: 'bg-blue-950/80',
                            border: 'border-blue-700',
                            blink: null
                        };
                        jaName = '防御力低下';
                    }

                    const blinkCls = def.blink ? BLINK_CLASS[def.blink] : '';
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
