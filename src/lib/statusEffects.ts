/**
 * 状態異常エンジン (Status Effects Engine) - spec v3.0
 *
 * バフ・デバフの付与・判定・ターン処理を担う。
 * 提案A: StatusEffect に value フィールドを追加し、def_up等の固定値を保持する。
 */

// ─── 型定義 ──────────────────────────────────────────────────

export interface StatusEffect {
    id: StatusEffectId;
    duration: number; // 残りターン数
    value?: number;   // 数値パラメータ (def_up: DEF加算値, atk_down: ATK減少率 等)
}

export type StatusEffectId =
    | 'atk_up'       // 攻撃UP: 与ダメージ x1.5
    | 'def_up'       // 防御UP: ダメージを value 分軽減（固定値）
    | 'def_up_heavy' // 防御UP(強): def_upと同処理、value=30等
    | 'taunt'        // 挑発: 敵の攻撃を自分に引きつける
    | 'regen'        // リジェネ: ターン終了時 MaxHP×5%回復
    | 'poison'       // 毒: ターン終了時 MaxHP×5%ダメージ
    | 'burn'         // 炎上: 毒と同じDoTだが表示が「炎上」
    | 'stun'         // スタン: 次ターン行動不能 (AP回復もスキップ)
    | 'bind'         // 拘束: stunの別名（ターン行動不能）
    | 'bleed'        // 出血: カード使用時3ダメージ
    | 'bleed_minor'  // 軽微な出血: カード使用時1ダメージ
    | 'fear'         // 恐怖: デッキに使用不可カード混入
    | 'stun_immune'  // スタン免疫: 1ターンスタンを無効化
    | 'blind'        // 目潰し: 攻撃が50%の確率でミスする
    | 'blind_minor'  // 軽微な目潰し: 攻撃が30%ミス
    | 'evasion_up'   // 回避UP: 攻撃を30%の確率で回避
    | 'atk_down'     // 攻撃DOWN: 与ダメージ x0.7
    | 'cure_status'  // 状態異常解除（poison/bleed/stun等を即時解除）
    | 'cure_debuff'  // デバフ解除（atk_down/blind等を即時解除）
    | 'def_down'     // 防御DOWN: 被ダメージ 1.3倍相当（DEF半減）
    | 'freeze'       // 凍結: stunの上位互換（行動不能）
    | 'curse'        // 呪い: ATK DOWN相当
    | 'ap_max'      // AP全回復（card_dark_pact用）
    | 'barrier'     // バリア: def_upの全体版（聖壁等）
    | 'berserk';    // v4.1: 狂戦士 ATK×2.0 + DEF半減

// ─── v2.9.3k: デバフ成功率テーブル ─────────────────────────────
// 各デバフeffect_idごとの付与成功率（0.0〜1.0）
// ここに定義のないeffect_idはデフォルト100%成功
const DEBUFF_SUCCESS_RATES: Partial<Record<StatusEffectId, number>> = {
    stun:        0.40,  // スタン: 40% — 最も強力な行動不能
    bind:        0.40,  // 拘束: 40% — スタン同等
    freeze:      0.45,  // 凍結: 45%
    blind:       0.50,  // 目潰し: 50%
    blind_minor: 0.65,  // 軽微な目潰し: 65%
    fear:        0.50,  // 恐怖: 50%
    poison:      0.70,  // 毒: 70%
    burn:        0.70,  // 炎上: 70%（毒と同率）
    bleed:       0.70,  // 出血: 70%
    bleed_minor: 0.80,  // 軽微な出血: 80%
    atk_down:    0.60,  // ATK DOWN: 60%
    def_down:    0.60,  // DEF DOWN: 60%
};

/**
 * デバフ付与の成功判定。
 * @param effectId 付与しようとしている状態異常ID
 * @returns true = 付与成功、false = レジストされた
 */
export function rollDebuffSuccess(effectId: StatusEffectId | string): boolean {
    const rate = DEBUFF_SUCCESS_RATES[effectId as StatusEffectId];
    if (rate === undefined) return true; // テーブルにないID（バフ系など）は常に成功
    return Math.random() < rate;
}

export interface TickResult {
    newEffects: StatusEffect[];
    hpDelta: number; // 正=回復、負=ダメージ
    messages: string[];
    expired: StatusEffectId[];
}

// ─── 効果名マップ（ログ表示用） ─────────────────────────────

const EFFECT_NAMES: Record<StatusEffectId, string> = {
    atk_up:       '攻撃力UP',
    def_up:       '防御強化',
    def_up_heavy: '鉄壁防御',
    taunt:        '挑発',
    regen:        'リジェネ',
    poison:       '毒',
    burn:         '炎上',
    stun:         'スタン',
    bind:         '拘束',
    bleed:        '出血',
    bleed_minor:  '軽微な出血',
    fear:         '恐怖',
    stun_immune:  'スタン耐性',
    blind:        '目潰し',
    blind_minor:  '軽微な目潰し',
    evasion_up:   '回避UP',
    atk_down:     '攻撃力DOWN',
    cure_status:  '状態回復',
    cure_debuff:  'デバフ解除',
    def_down:     '防御力DOWN',
    freeze:       '凍結',
    curse:        '呪い',
    ap_max:       'AP全回復',
    barrier:      'バリア',
    berserk:      '狂戦士',
};

export function getEffectName(id: StatusEffectId): string {
    return EFFECT_NAMES[id] || id;
}

export function isValidEffectId(id: string): boolean {
    return id in EFFECT_NAMES;
}

// ─── 付与 ────────────────────────────────────────────────────

/**
 * 状態異常を付与する。同じIDが既にあれば duration と value を更新（延長ルール）。
 * value: def_up なら DEF加算値、atk_down は使用しない（固定0.7倍）等
 */
export function applyEffect(
    effects: StatusEffect[],
    id: StatusEffectId,
    duration: number,
    value?: number
): StatusEffect[] {
    const existing = effects.find(e => e.id === id);
    if (existing) {
        return effects.map(e => {
            if (e.id === id) {
                const stackableBuffs: StatusEffectId[] = ['atk_up', 'def_up', 'def_up_heavy', 'barrier', 'evasion_up'];
                let newValue = value !== undefined ? value : e.value;
                
                if (stackableBuffs.includes(id)) {
                    // デフォルト効果量（valueが指定されていない場合）
                    let addedValue = value;
                    if (addedValue === undefined) {
                        if (id === 'atk_up') addedValue = 0.5; // +50%
                        else if (id === 'evasion_up') addedValue = 0.3; // +30%
                        else addedValue = 0;
                    }
                    
                    const currentValue = e.value !== undefined ? e.value : (
                        id === 'atk_up' ? 0.5 : (id === 'evasion_up' ? 0.3 : 0)
                    );
                    newValue = currentValue + addedValue;
                }
                
                return { ...e, duration: Math.max(e.duration, duration), value: newValue };
            }
            return e;
        });
    }
    
    // 初回付与時のデフォルト効果量補完
    let initialValue = value;
    if (initialValue === undefined) {
        if (id === 'atk_up') initialValue = 0.5;
        else if (id === 'evasion_up') initialValue = 0.3;
    }
    
    return [...effects, { id, duration, value: initialValue }];
}

/**
 * 状態異常を除去する。
 */
export function removeEffect(
    effects: StatusEffect[],
    id: StatusEffectId
): StatusEffect[] {
    return effects.filter(e => e.id !== id);
}

// ─── 判定 ────────────────────────────────────────────────────

/**
 * 指定の状態異常が有効化判定。
 */
export function hasEffect(effects: StatusEffect[], id: StatusEffectId): boolean {
    return effects.some(e => e.id === id && e.duration > 0);
}

/**
 * 攻撃力の乗算係数を返す。atk_up → 1.0 + 累積値(デフォ0.5)、それ以外 → 1.0
 */
export function getAttackMod(effects: StatusEffect[]): number {
    const atkEffect = effects.find(e => e.id === 'atk_up' && e.duration > 0);
    if (atkEffect) {
        return 1.0 + (atkEffect.value ?? 0.5);
    }
    return 1.0;
}

/**
 * 防御バフによる固定DEF加算値を返す（提案A）。
 * def_up / def_up_heavy / barrier の value を返す。なければ 0。
 */
export function getDefBonus(effects: StatusEffect[]): number {
    const defEffect = effects.find(
        e => (e.id === 'def_up' || e.id === 'def_up_heavy' || e.id === 'barrier') && e.duration > 0
    );
    return defEffect?.value ?? 0;
}

/**
 * 攻撃力デバフの乗算係数を返す。atk_down → x0.7、それ以外 → x1.0
 */
export function getAtkDownMod(effects: StatusEffect[]): number {
    return hasEffect(effects, 'atk_down') ? 0.7 : 1.0;
}

/**
 * 防御デバフの DEF 減算率を返す。def_down → DEF半減(0.5倍)、それ以外 → 1.0
 */
export function getDefDownMod(effects: StatusEffect[]): number {
    return hasEffect(effects, 'def_down') ? 0.5 : 1.0;
}

/**
 * 目潰し状態のミス確率を返す（0.0〜1.0）。
 * blind → 50%ミス、blind_minor → 30%ミス
 */
export function getMissChance(effects: StatusEffect[]): number {
    if (hasEffect(effects, 'blind')) return 0.5;
    if (hasEffect(effects, 'blind_minor')) return 0.3;
    return 0;
}

/**
 * 回避UP状態の回避確率を返す（0.0〜1.0）。最大90%まで。
 */
export function getEvasionChance(effects: StatusEffect[]): number {
    const evaEffect = effects.find(e => e.id === 'evasion_up' && e.duration > 0);
    if (evaEffect) {
        return Math.min(0.9, evaEffect.value ?? 0.3);
    }
    return 0;
}

// ─── ターン終了処理 ──────────────────────────────────────────

/**
 * End Phase: regen/poison適用、duration減算、期限切れ効果を削除。
 */
export function tickEffects(
    effects: StatusEffect[],
    maxHp: number,
    targetName: string = '',
    skipIds?: StatusEffectId[]
): TickResult {
    let hpDelta = 0;
    const messages: string[] = [];
    const expired: StatusEffectId[] = [];

    if (hasEffect(effects, 'regen')) {
        const heal = Math.max(1, Math.floor(maxHp * 0.05));
        hpDelta += heal;
        messages.push(`${targetName}のリジェネ効果！ HP +${heal}`);
    }

    if (hasEffect(effects, 'poison')) {
        const dmg = Math.max(1, Math.floor(maxHp * 0.05));
        hpDelta -= dmg;
        messages.push(`${targetName}は毒に侵まれている... HP -${dmg}`);
    }

    if (hasEffect(effects, 'burn')) {
        const dmg = Math.max(1, Math.floor(maxHp * 0.05));
        hpDelta -= dmg;
        messages.push(`${targetName}は炎に包まれている... HP -${dmg}`);
    }

    const newEffects = effects
        .map(e => {
            // skipIds に含まれるエフェクトはこのtickではデクリメントしない
            if (skipIds?.includes(e.id)) return e;
            return { ...e, duration: e.duration - 1 };
        })
        .filter(e => {
            if (e.duration <= 0) {
                expired.push(e.id);
                if (e.id !== 'stun_immune') {
                    messages.push(`${targetName}の${getEffectName(e.id)}が切れた。`);
                }
                return false;
            }
            return true;
        });

    return { newEffects, hpDelta, messages, expired };
}

// ─── Bleed判定（カード使用時） ───────────────────────────────

/**
 * 出血状態のダメージ（カード使用時発動）。
 * bleed → 3ダメ、bleed_minor → 1ダメ
 */
export function getBleedDamage(effects: StatusEffect[]): number {
    if (hasEffect(effects, 'bleed')) return 3;
    if (hasEffect(effects, 'bleed_minor')) return 1;
    return 0;
}

// ─── スタン判定 ─────────────────────────────────────────────

/**
 * スタン/拘束中か判定。スタン中はAP回復も行動もできない。
 */
export function isStunned(effects: StatusEffect[]): boolean {
    return hasEffect(effects, 'stun') || hasEffect(effects, 'bind');
}

// ─── 挑発判定 (v2.7) ────────────────────────────────────────

/**
 * 挑発中か判定。taunt中は敵のsingle_enemy攻撃を自分に引きつける。
 */
export function hasTaunt(effects: StatusEffect[]): boolean {
    return hasEffect(effects, 'taunt');
}

// ─── 状態解除ヘルパー ────────────────────────────────────────

/** 負の状態異常（毒/出血/スタン/睡眠等）を全解除 */
export const NEGATIVE_EFFECTS: StatusEffectId[] = ['poison', 'burn', 'bleed', 'bleed_minor', 'stun', 'bind', 'fear', 'blind', 'blind_minor', 'atk_down', 'def_down'];
/** デバフ効果（atk_down/blind等）を解除 */
export const DEBUFF_EFFECTS: StatusEffectId[] = ['atk_down', 'def_down', 'blind', 'blind_minor'];

export function cureStatus(effects: StatusEffect[]): StatusEffect[] {
    return effects.filter(e => !NEGATIVE_EFFECTS.includes(e.id));
}

export function cureDebuff(effects: StatusEffect[]): StatusEffect[] {
    return effects.filter(e => !DEBUFF_EFFECTS.includes(e.id));
}
