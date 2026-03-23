// slugベースでitems.effect_data.descriptionを更新するスクリプト
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// slugごとの日本語説明マップ
const DESCRIPTIONS: Record<string, string> = {
    'item_potion_s': 'HPを少量回復する基本的な薬。',
    'item_ration': '冒険に必須の保存食料。',
    'item_torch': '暗い場所を照らす探索用の松明。',
    'item_tent': '野営時に使用する簡易テント。',
    'item_antidote': '毒状態を解除する薬。',
    'item_holy_water': 'アンデッド系に大ダメージを与える聖なる水。',
    'item_oil_pot': '投擲して炎上ダメージを与える瓶。',
    'item_whetstone': '武器を研いで物理ダメージを一時的に強化。',
    'item_smokescreen': '煙幕を張って戦闘から逃走を容易にする。',
    'item_whiskey': '飲むと少し回復するが酩酊状態になる。',
    'book_iron_sword': '基本的な剣術。攻撃スキル。',
    'book_dagger': '護身用の短剣術。0コスト攻撃。',
    'book_axe': '斧を振り下ろす高威力だが命中率が低い攻撃。',
    'book_heal_s': '神聖な祈りで味方のHPを回復する。',
    'gear_knight_shield': '堅固な盾で敵の攻撃を防ぐ防御スキル。',
    'gear_silver_lance': '貫通力の高い槍で敵を突く。',
    'scroll_holy_smite': '聖なる力で敵に大ダメージを与える。',
    'acc_crusader_ring': '装備すると常時、信仰による守護を受ける。',
    'book_scimitar': '曲刀で斬りつけ、出血状態にする。',
    'item_alchemy_kit': '火球を放つ魔法攻撃。',
    'item_merchant_bag': '商取引スキル。戦闘後の獲得金が増加。',
    'gear_desert_cloak': '回避率を上昇させる砂漠の外套。',
    'item_poison_manual': '敵に猛毒を付与する暗器術。',
    'gear_magic_lamp': 'ランプから魔人を召喚して攻撃させる。',
    'book_katana': '居合の一撃。クリティカル率が高い。',
    'item_ofuda_set': '結界を張り味方を守る呪符術。',
    'gear_samurai_armor': '重厚な鎧で防御力大幅UP。挑発効果付き。',
    'scroll_shikigami': '式神を呼び出して自動攻撃させる。',
    'gear_ninja_tool': '暗器を投げつける忍術。',
    'sword_kusanagi': '神話の剣の模造品。全体攻撃。',
    'book_kungfu': '連続攻撃を繰り出す拳法。2回攻撃。',
    'gear_dragon_spear': '大薙刀で敵全体を薙ぎ払う。',
    'scroll_chi_blast': '気功の力で防御を無視した攻撃を放つ。',
    'gear_iron_fist': '鉄の爪で引き裂く。出血と連撃。',
    'manual_assassination': '一撃で敵を仕留める暗殺術。即死効果。',
    'item_forbidden_scroll': 'Vitalityを消費して破格の威力を発揮する禁術。',
    'item_ruins_map': '偽物の宝の地図。罠の可能性あり。',
    'gear_adventurer_boots': '履くと確実に逃走できるブーツ。',
    'item_repair_kit': 'NPC仲間の耐久値を回復する修理キット。',
    'item_revive_incense': '死亡したNPC仲間を蘇生させる希少な香。',
    'skill_provoke': '敵の注意を引きつけるタンク用スキル。',
    'skill_meditation': '瞑想してMPを回復する。',
    'gear_heavy_armor': '重装鎧。物理ダメージを常時軽減する。',
    'item_bomb_large': '敵全体にダメージを与える大型爆弾。',
    'skill_berserk': '防御を捨てて攻撃力を倍化する狂戦士の技。',
    'item_lucky_coin': '会心の一撃が出やすくなる幸運のコイン。',
    'item_royal_decree': '使用すると名声が大幅に上昇する勅令書。',
    'gear_cursed_mask': 'スリップダメージを受けるが高性能な呪い仮面。',
    'skill_vital_strike': 'Vitalityを犠牲に超火力を放つ命削りの奥義。',
    'item_debris_clear': '崩壊した地域の瓦礫撤去に必要な許可証。',
    'grimoire_fire': '火球を放つ基本的な魔法攻撃。',
    'grimoire_ice': '氷の槍で攻撃し、鈍足状態を付与。',
    'grimoire_thunder': '雷撃で攻撃し、スタン状態を付与。',
    'gear_archmage_staff': '装備すると魔法攻撃の威力が大幅に上がる。',
    'skill_barrier_all': 'パーティ全員にバリアを張る広域防壁。',
    'gear_inquisitor_mace': 'カオス属性の敵に特効の聖なる槌。',
    'item_golden_dice': 'ランダムで大金獲得か損害を被る黄金のサイコロ。',
    'skill_bribe': 'Goldを支払い敵を帰還させる賄賂術。',
    'gear_snake_flute': '蛇を召喚して毒攻撃を行う笛。',
    'gear_longbow': '遠距離から高命中の矢を放つ大弓。',
    'item_tea_set': '戦闘中に精神統一しMP大回復。',
    'gear_hannya_mask': '敵全体を「恐怖」状態にする般若の面。',
    'skill_zen': '瞑想し次ターンの攻撃を完全無効化する禅の技。',
    'manual_dim_mak': '確率で即死、外れても麻痺にする秘技。',
    'gear_nunchaku': '低コストで連続攻撃を放つヌンチャク術。',
    'skill_iron_skin': '物理ダメージを1回だけ完全無効化。',
    'skill_lion_roar': '雄叫びで敵全体をスタンさせる獅子吼。',
    'tool_lockpick': '宝箱の解錠成功率を上げる盗賊の道具。',
    'gear_travel_bag': 'アイテムドロップ率が微増する旅のリュック。',
    'skill_survival': '野営時のHP回復量が増加するサバイバル術。',
    'skill_first_aid': 'MPを使わずにHPを微量回復する応急手当。',
    'item_cursed_idol': '持っているだけで不運を呼ぶ呪いの偶像。',
    'gear_rusty_sword': '最も弱い武器。しかし無いよりはマシ。',
    'skill_necromancy': '倒した敵を操り盾にする禁断の死霊術。',
    'skill_cannibalism': '敵を食べてHP回復。Vitalityを消費する禁忌。',
    'gear_merchant_abacus': '所持金に応じたダメージを与える商人のそろばん。',
    'gear_paper_fan': '攻撃と同時に防御バフを付与する鉄扇術。',
    'skill_pressure_point': '敵の防御力を完全に無視する経絡秘孔の技。',
    'grimoire_teleport': '好きな拠点へ即時移動できる転移の魔法書。',
    'item_world_map': '移動時のランダムイベント回避率が上昇する地図。',
};

async function main() {
    let updated = 0;
    for (const [slug, description] of Object.entries(DESCRIPTIONS)) {
        const { data: item } = await sb.from('items').select('id, effect_data').eq('slug', slug).single();
        if (!item) { console.warn(`Not found: ${slug}`); continue; }

        const newEffectData = { ...(item.effect_data || {}), description };
        const { error } = await sb.from('items').update({ effect_data: newEffectData }).eq('id', item.id);
        if (error) {
            console.error(`Failed: ${slug}:`, error.message);
        } else {
            updated++;
        }
    }
    console.log(`Updated ${updated}/${Object.keys(DESCRIPTIONS).length} items with descriptions`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
