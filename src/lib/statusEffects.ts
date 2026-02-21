/**
 * 状態異常エンジン (Status Effects Engine) - spec v2.5
 *
 * バフ・デバフの付与・判定・毎ターン処理を担う。
 */

// ─── 型定義 ───────────────────────────────────────────────

export interface StatusEffect {
    id: StatusEffectId;
    duration: number; // 残りターン数
}

export type StatusEffectId =
    | 'atk_up'    // 攻撃UP: 物理ダメージ x1.5
    | 'def_up'    // 防御UP: 被物理ダメージ x0.5 (DEF後)
    | 'taunt'     // 挑発: 敵の単体攻撃を自身に引きつける (v2.7)
    | 'regen'     // リジェネ: ターン終了時 MaxHPの5%回復
    | 'poison'    // 毒: ターン終了時 MaxHPの5%ダメージ
    | 'stun'      // 気絶: 次ターン行動不能 (AP回復もスキップ)
    | 'bleed'     // 出血: カード使用毎に3ダメージ
    | 'fear';     // 恐怖: デッキに使用不可カード混入

export interface TickResult {
    newEffects: StatusEffect[];
    hpDelta: number; // 正=回復、負=ダメージ
    messages: string[];
    expired: StatusEffectId[];
}

// ─── 効果名マップ（ログ表示用） ──────────────────────────

const EFFECT_NAMES: Record<StatusEffectId, string> = {
    atk_up: '攻撃力上昇',
    def_up: '防御力上昇',
    taunt: '挑発',
    regen: 'リジェネ',
    poison: '毒',
    stun: '気絶',
    bleed: '出血',
    fear: '恐怖',
};

export function getEffectName(id: StatusEffectId): string {
    return EFFECT_NAMES[id] || id;
}

// ─── 付与 ─────────────────────────────────────────────────

/**
 * 状態異常を付与する。同一IDが既にあればdurationを上書き（延長）。
 */
export function applyEffect(
    effects: StatusEffect[],
    id: StatusEffectId,
    duration: number
): StatusEffect[] {
    const existing = effects.find(e => e.id === id);
    if (existing) {
        // 期間上書き（重複ルール: 効果は加算されず期間のみ延長）
        return effects.map(e => e.id === id ? { ...e, duration } : e);
    }
    return [...effects, { id, duration }];
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

// ─── 判定 ─────────────────────────────────────────────────

/**
 * 特定の状態異常が有効か判定。
 */
export function hasEffect(effects: StatusEffect[], id: StatusEffectId): boolean {
    return effects.some(e => e.id === id && e.duration > 0);
}

/**
 * 攻撃側の乗算係数を返す。atk_up → x1.5、それ以外 → x1.0
 */
export function getAttackMod(effects: StatusEffect[]): number {
    return hasEffect(effects, 'atk_up') ? 1.5 : 1.0;
}

/**
 * 防御側の乗算係数を返す。def_up → x0.5、それ以外 → x1.0
 */
export function getDefenseMod(effects: StatusEffect[]): number {
    return hasEffect(effects, 'def_up') ? 0.5 : 1.0;
}

// ─── ターン終了処理 ──────────────────────────────────────

/**
 * End Phase: regen/poison適用、duration減算、期限切れ削除。
 * @param effects 現在の状態異常リスト
 * @param maxHp 対象のMaxHP（regen/poison計算用）
 * @param targetName ログ表示用の名前
 */
export function tickEffects(
    effects: StatusEffect[],
    maxHp: number,
    targetName: string = ''
): TickResult {
    let hpDelta = 0;
    const messages: string[] = [];
    const expired: StatusEffectId[] = [];

    // regen/poison 適用
    if (hasEffect(effects, 'regen')) {
        const heal = Math.max(1, Math.floor(maxHp * 0.05));
        hpDelta += heal;
        messages.push(`${targetName}のリジェネ効果！ HP +${heal}`);
    }

    if (hasEffect(effects, 'poison')) {
        const dmg = Math.max(1, Math.floor(maxHp * 0.05));
        hpDelta -= dmg;
        messages.push(`${targetName}は毒に蝕まれている... HP -${dmg}`);
    }

    // duration 減算 & 期限切れ削除
    const newEffects = effects
        .map(e => ({ ...e, duration: e.duration - 1 }))
        .filter(e => {
            if (e.duration <= 0) {
                expired.push(e.id);
                messages.push(`${targetName}の${getEffectName(e.id)}が切れた。`);
                return false;
            }
            return true;
        });

    return { newEffects, hpDelta, messages, expired };
}

// ─── Bleed判定（カード使用時） ───────────────────────────

/**
 * カード使用時のbleedダメージ。出血状態なら3ダメージ。
 */
export function getBleedDamage(effects: StatusEffect[]): number {
    return hasEffect(effects, 'bleed') ? 3 : 0;
}

// ─── スタン判定 ──────────────────────────────────────────

/**
 * スタン状態か判定。スタン中はAP回復も行動もスキップ。
 */
export function isStunned(effects: StatusEffect[]): boolean {
    return hasEffect(effects, 'stun');
}

// ─── 挑発判定 (v2.7) ─────────────────────────────────────

/**
 * 挑発状態か判定。taunt中は敵のsingle_enemy攻撃を引きつける。
 */
export function hasTaunt(effects: StatusEffect[]): boolean {
    return hasEffect(effects, 'taunt');
}
