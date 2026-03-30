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
    if (effectData.heal != null) parts.push(`HP +${effectData.heal}回復`);
    if (effectData.mp_heal != null) parts.push(`MP +${effectData.mp_heal}回復`);
    if (effectData.power != null && effectData.power > 0) parts.push(`威力 ${effectData.power}`);
    if (effectData.atk_bonus != null) parts.push(`ATK +${effectData.atk_bonus}`);
    if (effectData.def_bonus != null) parts.push(`DEF +${effectData.def_bonus}`);
    if (effectData.duration != null) parts.push(`${effectData.duration}ターン持続`);
    if (effectData.effect != null) parts.push(String(effectData.effect));
    if (effectData.status != null) parts.push(`状態: ${effectData.status}`);
    if (effectData.effect_id != null) parts.push(`付与: ${effectData.effect_id}`);
    if (effectData.max_hp_bonus != null) parts.push(`最大HP +${effectData.max_hp_bonus}`);

    return parts.length > 0 ? parts.join(' / ') : '';
}

/**
 * effect_data から構造化された効果リストを返す（詳細ポップアップ用）
 */
export function getEffectList(effectData: any): { label: string; value: string; color: string }[] {
    if (!effectData || typeof effectData !== 'object') return [];
    const list: { label: string; value: string; color: string }[] = [];

    if (effectData.heal != null) list.push({ label: 'HP回復', value: `+${effectData.heal}`, color: 'text-green-400' });
    if (effectData.mp_heal != null) list.push({ label: 'MP回復', value: `+${effectData.mp_heal}`, color: 'text-blue-400' });
    if (effectData.power != null && effectData.power > 0) list.push({ label: '威力', value: String(effectData.power), color: 'text-red-400' });
    if (effectData.atk_bonus != null) list.push({ label: 'ATK', value: `+${effectData.atk_bonus}`, color: 'text-red-400' });
    if (effectData.def_bonus != null) list.push({ label: 'DEF', value: `+${effectData.def_bonus}`, color: 'text-blue-400' });
    if (effectData.max_hp_bonus != null) list.push({ label: '最大HP', value: `+${effectData.max_hp_bonus}`, color: 'text-green-400' });
    if (effectData.duration != null) list.push({ label: '持続', value: `${effectData.duration}ターン`, color: 'text-amber-400' });
    if (effectData.effect != null) list.push({ label: '効果', value: String(effectData.effect), color: 'text-purple-400' });
    if (effectData.status != null) list.push({ label: '状態', value: String(effectData.status), color: 'text-yellow-400' });
    if (effectData.effect_id != null) list.push({ label: '付与', value: String(effectData.effect_id), color: 'text-purple-400' });

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
    const map: Record<string, string> = { weapon: '武器', armor: '防具', accessory: 'アクセサリー' };
    return map[slot] || slot;
}

