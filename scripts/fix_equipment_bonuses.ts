/**
 * 全装備品の effect_data にステータスボーナス値を設定する
 * npx tsx scripts/fix_equipment_bonuses.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 装備品ごとのボーナス定義（ゲームバランスに基づく設定）
const EQUIPMENT_BONUSES: Record<string, { atk_bonus?: number; def_bonus?: number; hp_bonus?: number; description: string }> = {
    // --- 武器 (weapon) ---
    'gear_rusty_sword':       { atk_bonus: 2, description: '最も弱い武器。しかし無いよりはマシ。' },
    'gear_silver_lance':      { atk_bonus: 8, description: '光を美しく反射する装飾が見事な白銀のランス。' },
    'gear_inquisitor_mace':   { atk_bonus: 10, description: 'カオス属性の敵に特効の聖なる槌。' },
    'gear_longbow':           { atk_bonus: 7, description: '遠距離から高命中の矢を放つ大弓。' },
    'gear_archmage_staff':    { atk_bonus: 12, description: '装備すると魔法攻撃の威力が大幅に上がる。' },
    'gear_dragon_spear':      { atk_bonus: 14, description: '大薙刀で敵全体を薙ぎ払う。' },
    'gear_iron_fist':         { atk_bonus: 6, description: '鉄の爪で引き裂く。出血と連撃。' },
    'gear_nunchaku':          { atk_bonus: 5, description: '低コストで連続攻撃を放つヌンチャク術。' },
    'gear_paper_fan':         { atk_bonus: 4, def_bonus: 3, description: '攻撃と同時に防御バフを付与する鉄扇術。' },
    'gear_merchant_abacus':   { atk_bonus: 3, description: '所持金に応じたダメージを与える商人のそろばん。' },
    'sword_kusanagi':         { atk_bonus: 18, description: '夜刀神国の神話に登場する剣の模造品。' },
    'item_thief_blade':       { atk_bonus: 15, description: '民を救えなかった狂剣の遺品。' },
    'item_mino_axe':          { atk_bonus: 20, description: 'ミノタウロス・キングの巨大な斧。' },

    // --- 防具 (armor) ---
    'gear_knight_shield':     { def_bonus: 8, description: '帝国正規軍の重装騎士に支給される頑強な盾。' },
    'gear_heavy_armor':       { def_bonus: 12, hp_bonus: 10, description: '全身を鋼鉄で覆い隠す防御力重視の鎧。' },
    'gear_samurai_armor':     { def_bonus: 10, description: '夜刀神国の侍が身につける鎧。' },
    'gear_desert_cloak':      { def_bonus: 4, description: '砂漠の砂嵐から身を守り回避率も高める外套。' },
    'item_white_robe':        { def_bonus: 10, description: '異端へと堕ちた元大司教の法衣。' },

    // --- アクセサリー (accessory) ---
    'acc_crusader_ring':      { def_bonus: 3, hp_bonus: 10, description: '神の御加護が宿った奇跡の指輪。' },
    'gear_cursed_mask':       { atk_bonus: 8, description: '圧倒的な力と引き換えに正気を削り取る仮面。' },
    'gear_magic_lamp':        { atk_bonus: 6, description: 'ランプから魔人を召喚して攻撃させる。' },
    'gear_ninja_tool':        { atk_bonus: 4, description: 'クナイや手裏剣など暗器を素早く取り出す腰袋。' },
    'gear_snake_flute':       { atk_bonus: 5, description: '蛇を呼び寄せ敵に仕向ける伝統的な木管楽器。' },
    'gear_adventurer_boots':  { def_bonus: 2, description: '確実に逃走を決め機動力を高めるブーツ。' },
    'gear_hannya_mask':       { atk_bonus: 6, description: '見る者を震え上がらせる般若の面。' },
    'gear_travel_bag':        { hp_bonus: 5, description: 'アイテムドロップ率が微増する旅のリュック。' },
    'item_pirate_hat':        { hp_bonus: 20, description: '血塗られた艦隊の長の帽子。' },
    'item_merchant_bag':      { hp_bonus: 5, description: 'お金が増えると言われる魔法の鞄。' },
    'item_alchemy_kit':       { atk_bonus: 4, description: '火球などの魔法試薬を作り出せる機材。' },
    'item_tea_set':           { def_bonus: 2, description: 'お茶で精神を統一し乱れた魔力を回復させる茶器。' },
    'item_ofuda_set':         { def_bonus: 4, description: '魔除けの呪符で結界を張るお札の束。' },
    'item_lucky_coin':        { atk_bonus: 2, description: '会心の一撃が連発する不思議な硬貨。' },
    'item_golden_dice':       { atk_bonus: 3, description: '戦場の結果を運否天賦に任せる純金のサイコロ。' },
    'item_cursed_idol':       { atk_bonus: 1, def_bonus: -2, description: '不運を撒き散らす呪われた木彫りの人形。' },
    'tool_lockpick':          { description: '宝箱の解錠成功率を上げる盗賊の道具。' },
    'item_poison_manual':     { atk_bonus: 3, description: '敵に猛毒を付与する暗器術の書。' },
    'item_forbidden_scroll':  { atk_bonus: 10, description: 'Vitalityを消費して破格の威力を発揮する禁術。' },
};

async function main() {
    console.log('=== 装備品 effect_data ボーナス値設定 ===\n');

    let count = 0;
    for (const [slug, bonusData] of Object.entries(EQUIPMENT_BONUSES)) {
        // 既存の effect_data を取得
        const { data: item } = await supabase
            .from('items')
            .select('id, effect_data')
            .eq('slug', slug)
            .single();

        if (!item) {
            console.log(`  ⚠️  ${slug}: アイテムが見つかりません`);
            continue;
        }

        // 既存の effect_data にボーナス値をマージ
        const existingData = item.effect_data || {};
        const newEffectData = { ...existingData, ...bonusData };

        const { error } = await supabase
            .from('items')
            .update({ effect_data: newEffectData })
            .eq('id', item.id);

        if (error) {
            console.error(`  ❌ ${slug}: ${error.message}`);
        } else {
            const parts = [];
            if (bonusData.atk_bonus) parts.push(`ATK+${bonusData.atk_bonus}`);
            if (bonusData.def_bonus) parts.push(`DEF+${bonusData.def_bonus}`);
            if (bonusData.hp_bonus) parts.push(`HP+${bonusData.hp_bonus}`);
            console.log(`  ✅ ${slug}: ${parts.join(', ') || '(ボーナスなし)'}`);
            count++;
        }
    }

    console.log(`\n✅ ${count} 件更新完了`);
}

main().catch(console.error);
