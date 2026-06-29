/**
 * アイテム関連の共通ユーティリティ
 * Shop / Status / Battle で横断的に使用する
 */

/**
 * slug からアイテム画像URLを返す
 * public/images/items/{slug}.png に配置済みの画像を参照
 */
export function getItemImageUrl(slug: string | null | undefined): string | null {
    if (!slug) return null;
    return `/images/items/${slug}.png`;
}

/**
 * effect_data (JSONB) から人間が読める効果テキストを生成する。
 * 例: { heal: 50 } -> "HP +50回復"
 *     { power: 20, type: "attack" } -> "威力 20"
 *     { description: "テキスト" } -> "テキスト"
 */
export function formatEffectData(effectData: any): string {
    if (!effectData || typeof effectData !== 'object' || Object.keys(effectData).length === 0) {
        return '';
    }
    // descriptionフィールドが最優先
    if (effectData.description) return String(effectData.description);

    const parts: string[] = [];
    // v2.9.3l: 全キーを網羅的にパース
    if (effectData.heal_full || effectData.heal_all) parts.push('HP全回復');
    else if (effectData.heal != null && effectData.heal > 0) parts.push(`HP +${effectData.heal}回復`);
    else if (effectData.heal_pct != null && effectData.heal_pct > 0) parts.push(`HP ${Math.floor(effectData.heal_pct * 100)}%回復`);
    if (effectData.mp_heal != null && effectData.mp_heal > 0) parts.push(`MP +${effectData.mp_heal}回復`);
    if (effectData.damage != null && effectData.damage > 0) parts.push(`${effectData.damage}ダメージ`);
    if (effectData.aoe_damage != null && effectData.aoe_damage > 0) parts.push(`全体${effectData.aoe_damage}ダメージ`);
    if (effectData.power != null && effectData.power > 0) parts.push(`威力 ${effectData.power}`);
    if (effectData.atk_bonus != null) parts.push(`ATK +${effectData.atk_bonus}`);
    if (effectData.def_bonus != null) parts.push(`DEF ${effectData.def_bonus > 0 ? '+' : ''}${effectData.def_bonus}`);
    if (effectData.hp_bonus != null) parts.push(`最大HP +${effectData.hp_bonus}`);
    if (effectData.max_hp_bonus != null) parts.push(`最大HP +${effectData.max_hp_bonus}`);
    if (effectData.vit_restore != null) parts.push(`Vitality +${effectData.vit_restore}回復`);
    if (effectData.escape) parts.push('戦闘離脱');
    if (effectData.remove_effect != null) {
        const removeLabel: Record<string, string> = { poison: '毒解除', bleed: '出血解除', stun: 'スタン解除' };
        parts.push(removeLabel[effectData.remove_effect] || `${effectData.remove_effect}解除`);
    }
    if (effectData.effect_id != null) {
        const efLabel: Record<string, string> = {
            atk_up: '攻撃UP', def_up: '防御UP', regen: 'リジェネ',
            poison: '毒付与', stun: 'スタン付与', blind: '暗闇付与',
            evasion_up: '回避UP', stun_immune: 'スタン耐性',
        };
        parts.push(efLabel[effectData.effect_id] || effectData.effect_id);
    }
    if (effectData.duration != null && parts.length > 0) parts.push(`${effectData.duration}T持続`);

    return parts.length > 0 ? parts.join(' / ') : '';
}

/**
 * effect_data から構造化された効果リストを返す（詳細ポップアップ用）
 */
// ─── 効果数値（％・実数）の文字列化ヘルパー ───
function getEffectValueString(id: string, value?: number): string {
    const val = value;
    switch (id) {
        case 'atk_up':
            return val !== undefined ? `+${Math.round(val * 100)}%` : '+50%';
        case 'atk_up_fatal':
            return val !== undefined ? `+${Math.round(val * 100)}%` : '+100%';
        case 'atk_down':
            return val !== undefined ? `-${Math.round(val * 100)}%` : '-30%';
        case 'def_up':
            return val !== undefined ? `+${val}` : ''; // def_upはマスタ等で設定されているはず
        case 'def_up_heavy':
            return val !== undefined ? `+${val}` : '+30';
        case 'def_down':
            return val !== undefined ? `-${Math.round(val * 100)}%` : '-50%';
        case 'evasion_up':
            return val !== undefined ? `+${Math.round(val * 100)}%` : '+30%';
        case 'barrier':
            return val !== undefined ? `+${val}` : '+15';
        case 'unyielding_barrier':
            return val !== undefined ? `+${val}` : '+30';
        case 'berserk':
            return 'ATK+100%/DEF-50%';
        default:
            if (val !== undefined && val > 0) {
                return `+${val}`;
            }
            return '';
    }
}

export function getEffectList(effectData: any): { label: string; value: string; color: string }[] {
    if (!effectData || typeof effectData !== 'object') return [];
    const list: { label: string; value: string; color: string }[] = [];

    // ─── 効果ID→表示名マップ ───
    const effectIdLabel: Record<string, string> = {
        bleed_minor: '出血（小）', bleed: '出血', bleed_major: '出血（大）',
        poison: '毒', burn: '炎上', stun: 'スタン', blind: '暗闇', blind_minor: '目潰し（軽微）', bind: '拘束',
        freeze: '凍結', curse: '呪い', fear: '恐怖',
        def_up: '防御UP', def_up_heavy: '鉄壁防御', def_down: '防御DOWN',
        atk_up: '攻撃UP', atk_up_fatal: '攻撃UP（強）', atk_down: '攻撃DOWN',
        regen: '継続回復', berserk: '狂戦士',
        evasion_up: '回避UP', stun_immune: 'スタン耐性', taunt: '挑発',
        morale_up: '士気向上', spd_up: '速度UP',
        
        // 特殊効果の追加 (statusEffects.tsと同期)
        unyielding_barrier: '不屈の防陣',
        cover_all: '身代わりの盾',
        counter_spike: '棘の鎧',
        sacrificial_ap: '生贄の儀式',
        mana_charge: 'マナチャージ',
        death_sentence: '死神の宣告',
        revenge_shield: '報復の盾',
        soul_boost: 'ソウルブースト',
        element_resonance: '属性の共鳴',
        crit_vulnerability: '被クリティカル率UP',
        ap_max: 'AP全回復',
        ap_recover: 'AP回復',
        barrier: 'バリア',
        cure_status: '状態回復',
        cure_debuff: 'デバフ解除',
    };

    // ─── HP/MP回復 ───
    if (effectData.heal_full || effectData.heal_all) {
        list.push({ label: 'HP回復', value: '全回復', color: 'text-green-400' });
    } else if (effectData.heal != null && effectData.heal > 0) {
        list.push({ label: 'HP回復', value: `+${effectData.heal}`, color: 'text-green-400' });
    } else if (effectData.heal_pct != null && effectData.heal_pct > 0) {
        list.push({ label: 'HP回復', value: `${Math.floor(effectData.heal_pct * 100)}%`, color: 'text-green-400' });
    }

    // ─── ダメージ系 ───
    if (effectData.damage != null && effectData.damage > 0) {
        list.push({ label: '攻撃', value: `${effectData.damage} ダメージ`, color: 'text-red-400' });
    }
    if (effectData.aoe_damage != null && effectData.aoe_damage > 0) {
        list.push({ label: '全体攻撃', value: `${effectData.aoe_damage} ダメージ`, color: 'text-red-400' });
    }
    if (effectData.power != null && effectData.power > 0) {
        list.push({ label: '威力', value: String(effectData.power), color: 'text-red-400' });
    }

    // ─── ステータスボーナス ───
    if (effectData.atk_bonus != null) {
        list.push({ label: 'ATK', value: `${effectData.atk_bonus > 0 ? '+' : ''}${effectData.atk_bonus}`, color: effectData.atk_bonus >= 0 ? 'text-red-400' : 'text-red-600' });
    }
    if (effectData.def_bonus != null) {
        list.push({ label: 'DEF', value: `${effectData.def_bonus > 0 ? '+' : ''}${effectData.def_bonus}`, color: effectData.def_bonus >= 0 ? 'text-blue-400' : 'text-blue-600' });
    }
    if (effectData.hp_bonus != null) {
        list.push({ label: '最大HP', value: `+${effectData.hp_bonus}`, color: 'text-green-400' });
    }
    if (effectData.max_hp_bonus != null) {
        list.push({ label: '最大HP', value: `+${effectData.max_hp_bonus}`, color: 'text-green-400' });
    }

    // ─── 特殊効果 ───
    if (effectData.vit_restore != null) {
        list.push({ label: 'Vitality回復', value: `+${effectData.vit_restore}`, color: 'text-rose-400' });
    }
    if (effectData.escape) {
        list.push({ label: '効果', value: '確実戦闘離脱', color: 'text-cyan-400' });
    }
    if (effectData.escape_chance != null) {
        list.push({ label: '戦闘離脱', value: `成功率${Math.floor(effectData.escape_chance * 100)}%`, color: 'text-cyan-400' });
    }
    if (effectData.stun_self_chance != null) {
        list.push({ label: '副作用', value: `${Math.floor(effectData.stun_self_chance * 100)}%でスタン`, color: 'text-red-500' });
    }
    if (effectData.def_penalty != null && effectData.def_penalty > 0) {
        list.push({ label: '副作用', value: `防御力低下`, color: 'text-red-500' });
    }
    if (effectData.remove_effect != null) {
        const removeLabel: Record<string, string> = {
            poison: '毒を解除', bleed: '出血を解除', stun: 'スタンを解除',
            blind: '暗闇を解除', bind: '拘束を解除',
        };
        list.push({ label: '解除', value: removeLabel[effectData.remove_effect] || `${effectData.remove_effect}を解除`, color: 'text-emerald-400' });
    }

    // ─── effect フィールド（消耗品の特殊効果ラベル）───
    if (effectData.effect != null) {
        const effectValueLabel: Record<string, string> = {
            buff_all: '全体バフ', revive_full: '完全蘇生', full_restore: '完全回復',
            mp_restore: 'MP回復', escape: '戦闘離脱', regen: '継続回復',
            berserk: '狂戦士化', poison_weapon: '毒塗布',
            evasion_up: '回避UP', capital_pass: '通行許可',
            reputation_reset: '名声リセット',
        };
        const label = effectValueLabel[effectData.effect];
        if (label) {
            list.push({ label: '特殊効果', value: label, color: 'text-purple-400' });
        }
    }

    // ─── バフ/デバフ付与 ───
    if (effectData.effect_id != null) {
        const id = effectData.effect_id;
        const name = effectIdLabel[id] || id;
        
        const isBuffDebuff = ['atk_up', 'atk_up_fatal', 'atk_down', 'def_up', 'def_up_heavy', 'def_down', 'evasion_up', 'barrier', 'unyielding_barrier', 'berserk'].includes(id);
        const rawVal = isBuffDebuff ? (effectData.effect_val || effectData.power) : undefined;
        let targetVal = rawVal !== undefined && rawVal !== null ? Number(rawVal) : undefined;
        if (targetVal !== undefined && !isNaN(targetVal) && ['atk_up', 'atk_up_fatal', 'atk_down', 'def_down', 'evasion_up'].includes(id)) {
            targetVal = targetVal / 100;
        }

        const valStr = getEffectValueString(id, targetVal);
        const valSuffix = valStr ? `(${valStr})` : '';

        list.push({ label: '付与', value: `${name}${valSuffix}`, color: 'text-purple-400' });
    }
    if (effectData.effect_duration != null) {
        list.push({ label: '持続', value: `${effectData.effect_duration}ターン`, color: 'text-amber-400' });
    } else if (effectData.duration != null) {
        list.push({ label: '持続', value: `${effectData.duration}ターン`, color: 'text-amber-400' });
    }

    // ─── 追加エフェクト（禁術の秘薬等）───
    if (Array.isArray(effectData.extra_effects)) {
        for (const extra of effectData.extra_effects) {
            if (extra.id) {
                const id = extra.id;
                const name = effectIdLabel[id] || id;
                const valStr = getEffectValueString(id, extra.value);
                const valSuffix = valStr ? `(${valStr})` : '';
                list.push({ label: '追加効果', value: `${name}${valSuffix} (${extra.duration ?? 3}T)`, color: 'text-purple-400' });
            }
        }
    }

    // ─── 戦闘開始バフ（パッシブ） ───
    if (effectData.battle_start_buff != null) {
        const buffs = Array.isArray(effectData.battle_start_buff)
            ? effectData.battle_start_buff
            : [effectData.battle_start_buff];

        for (const buff of buffs) {
            const id = buff.buff_type || buff.id;
            const dur = buff.duration;
            const val = buff.value;
            if (id && dur) {
                const name = effectIdLabel[id] || id;
                const valStr = getEffectValueString(id, val);
                const valSuffix = valStr ? `(${valStr})` : '';
                list.push({
                    label: '戦闘時効果',
                    value: `${name}${valSuffix} (${dur}T)`,
                    color: 'text-purple-400'
                });
            }
        }
    }

    // ─── 使用タイミング ───
    if (effectData.use_timing != null) {
        const timingLabel: Record<string, string> = { battle: '戦闘中', field: 'フィールド', any: 'いつでも' };
        list.push({ label: '使用', value: timingLabel[effectData.use_timing] || effectData.use_timing, color: 'text-slate-400' });
    }

    // ─── スキルカード固有 ───
    if (effectData.card_type != null) {
        const typeLabel: Record<string, string> = { Skill: 'スキル', Defense: '防御', Support: 'サポート', Heal: '回復', Magic: '魔法' };
        list.push({ label: '種別', value: typeLabel[effectData.card_type] || effectData.card_type, color: 'text-cyan-400' });
    }
    if (effectData.target_type != null) {
        const targetLabel: Record<string, string> = { single_enemy: '単体敵', all_enemies: '全体敵', random_enemy: 'ランダム敵', self: '自身', single_ally: '味方単体', all_allies: '味方全体' };
        list.push({ label: '対象', value: targetLabel[effectData.target_type] || effectData.target_type, color: 'text-sky-400' });
    }
    if (effectData.ap_cost != null && effectData.ap_cost > 0) {
        list.push({ label: '消費AP', value: String(effectData.ap_cost), color: 'text-orange-400' });
    }
    if (effectData.deck_cost != null && effectData.deck_cost > 0) {
        list.push({ label: 'デッキコスト', value: String(effectData.deck_cost), color: 'text-indigo-400' });
    }

    return list;
}

/**
 * アイテムタイプを日本語ラベルに変換
 */
export function getItemTypeLabel(type: string, subType?: string | null): string {
    if (type === 'equipment') {
        const subMap: Record<string, string> = { weapon: '武器', armor: '防具', accessory: 'アクセサリー' };
        return subMap[subType || ''] || '装備品';
    }
    const map: Record<string, string> = {
        skill: 'スキル',
        skill_card: 'スキル',
        consumable: '消耗品',
        material: '素材',
        key_item: 'キーアイテム',
        trade_good: '交易品',
    };
    return map[type] || type;
}

/**
 * アイテムタイプに応じたボーダー色クラスを返す
 */
export function getItemTypeBorderColor(type: string): string {
    const map: Record<string, string> = {
        skill: 'border-blue-600',
        skill_card: 'border-blue-600',
        consumable: 'border-green-600',
        equipment: 'border-orange-600',
        material: 'border-amber-600',
        key_item: 'border-purple-600',
    };
    return map[type] || 'border-gray-600';
}

/**
 * 装備品の effect_data からステータスボーナスを計算
 */
export function getEquipmentBonus(effectData: any): { atk: number; def: number; hp: number } {
    if (!effectData || typeof effectData !== 'object') return { atk: 0, def: 0, hp: 0 };
    return {
        atk: effectData.atk_bonus || 0,
        def: effectData.def_bonus || 0,
        hp: effectData.hp_bonus || 0,
    };
}

/**
 * 装備品リストから合計ステータスボーナスを計算
 */
export function getTotalEquipmentBonus(equippedItems: { effect_data: any }[]): { atk: number; def: number; hp: number } {
    const total = { atk: 0, def: 0, hp: 0 };
    for (const item of equippedItems) {
        const bonus = getEquipmentBonus(item.effect_data);
        total.atk += bonus.atk;
        total.def += bonus.def;
        total.hp += bonus.hp;
    }
    return total;
}

/**
 * スロット名を日本語ラベルに変換
 */
export function getSlotLabel(slot: string): string {
    const map: Record<string, string> = {
        weapon: '武器',
        armor: '防具',
        accessory: 'アクセサリー',
        accessory_1: 'アクセサリー1',
        accessory_2: 'アクセサリー2',
        accessory_3: 'アクセサリー3',
    };
    return map[slot] || slot;
}

