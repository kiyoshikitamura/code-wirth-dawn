/**
 * seed_location_encounters.ts
 * location_encounters テーブルに各拠点のエンカウント設定を投入する。
 *
 * 前提: location_encounters テーブルが Supabase に作成済みであること。
 *   DDL: docs/spec_v1_world_system.md §5.3 を参照
 *
 * 実行方法:
 *   npx tsx scripts/seed_location_encounters.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================================
// エンカウント設定（実際のDBスラッグに準拠）
//
// 確認済みスラッグ一覧（2026-04-03 時点）:
//   loc_regalia      = 王都レガリア (Capital: Roland)
//   loc_meridia      = 黄金都市イスハーク (Capital: Markand)
//   loc_yato         = 神都「出雲」 (Capital: Yato)
//   loc_charon       = 天極城「龍京」 (Capital: Karyu)
//   loc_border_town  = 国境の町
//   loc_ancient_ruins = 古代遺跡の町
//   loc_market_town  = 市場町
//   loc_plains_city  = 平原の都市
//   loc_port_city    = 港町
//   loc_white_fort   = 白亜の砦
//   loc_north_fort   = 北の防衛砦
//   loc_monitor_post = 監視哨
//   loc_iron_mine    = 鉄の鉱山村
//   loc_temple_town  = 門前町
//   loc_coliseum     = 闘技都市
//   loc_oasis        = オアシスの村
//   loc_resort       = 保養地
//   loc_frontier_village = 最果ての村
//   loc_valley       = 谷間の集落
//   loc_highland     = 高原の村
//
// encounter_type: 'random' = 通常移動エンカウント
//                 'bounty_hunter' = 賞金稼ぎ（悪名高いプレイヤー向け）
// weight: 重み（数値が大きいほど出やすい）
// ===================================================

const encounterConfig: Array<{
    location_slug: string;
    encounter_type: 'random' | 'bounty_hunter';
    enemy_group_slug: string;
    weight: number;
}> = [
    // ============================================
    // ローラン系 (秩序圏): 聖騎士・盗賊・アンデッド
    // ============================================
    // 王都レガリア (Capital)
    { location_slug: 'loc_regalia',      encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',  weight: 3 },
    { location_slug: 'loc_regalia',      encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group', weight: 1 },
    { location_slug: 'loc_regalia',      encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 白亜の砦
    { location_slug: 'loc_white_fort',   encounter_type: 'random',        enemy_group_slug: 'roland_undead_group',  weight: 2 },
    { location_slug: 'loc_white_fort',   encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',  weight: 2 },
    { location_slug: 'loc_white_fort',   encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 北の防衛砦
    { location_slug: 'loc_north_fort',   encounter_type: 'random',        enemy_group_slug: 'roland_undead_group',  weight: 3 },
    { location_slug: 'loc_north_fort',   encounter_type: 'random',        enemy_group_slug: 'neutral_wolf_group',   weight: 1 },
    { location_slug: 'loc_north_fort',   encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 平原の都市
    { location_slug: 'loc_plains_city',  encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',  weight: 2 },
    { location_slug: 'loc_plains_city',  encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group', weight: 2 },
    { location_slug: 'loc_plains_city',  encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 港町
    { location_slug: 'loc_port_city',    encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',  weight: 3 },
    { location_slug: 'loc_port_city',    encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group', weight: 1 },
    { location_slug: 'loc_port_city',    encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },

    // ============================================
    // マルカンド系 (混沌圏): 砂漠・蠍・商人盗賊
    // ============================================
    // 黄金都市イスハーク (Capital)
    { location_slug: 'loc_meridia',      encounter_type: 'random',        enemy_group_slug: 'markand_desert_group', weight: 3 },
    { location_slug: 'loc_meridia',      encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',  weight: 1 },
    { location_slug: 'loc_meridia',      encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 市場町
    { location_slug: 'loc_market_town',  encounter_type: 'random',        enemy_group_slug: 'markand_desert_group', weight: 2 },
    { location_slug: 'loc_market_town',  encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',  weight: 2 },
    { location_slug: 'loc_market_town',  encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // オアシスの村
    { location_slug: 'loc_oasis',        encounter_type: 'random',        enemy_group_slug: 'markand_desert_group', weight: 3 },
    { location_slug: 'loc_oasis',        encounter_type: 'random',        enemy_group_slug: 'markand_worm_group',   weight: 1 },
    { location_slug: 'loc_oasis',        encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 鉄の鉱山村
    { location_slug: 'loc_iron_mine',    encounter_type: 'random',        enemy_group_slug: 'markand_worm_group',   weight: 3 },
    { location_slug: 'loc_iron_mine',    encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group', weight: 1 },
    { location_slug: 'loc_iron_mine',    encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 保養地
    { location_slug: 'loc_resort',       encounter_type: 'random',        enemy_group_slug: 'markand_desert_group', weight: 2 },
    { location_slug: 'loc_resort',       encounter_type: 'random',        enemy_group_slug: 'neutral_wolf_group',   weight: 1 },
    { location_slug: 'loc_resort',       encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },

    // ============================================
    // 夜刀神国系 (正義圏): 妖怪・天狗・忍者
    // ============================================
    // 神都「出雲」 (Capital)
    { location_slug: 'loc_yato',         encounter_type: 'random',        enemy_group_slug: 'yato_yokai_group',     weight: 3 },
    { location_slug: 'loc_yato',         encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group', weight: 1 },
    { location_slug: 'loc_yato',         encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 門前町
    { location_slug: 'loc_temple_town',  encounter_type: 'random',        enemy_group_slug: 'yato_yokai_group',     weight: 3 },
    { location_slug: 'loc_temple_town',  encounter_type: 'random',        enemy_group_slug: 'yato_tengu_group',     weight: 1 },
    { location_slug: 'loc_temple_town',  encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 監視哨
    { location_slug: 'loc_monitor_post', encounter_type: 'random',        enemy_group_slug: 'yato_tengu_group',     weight: 2 },
    { location_slug: 'loc_monitor_post', encounter_type: 'random',        enemy_group_slug: 'yato_yokai_group',     weight: 2 },
    { location_slug: 'loc_monitor_post', encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },
    // 高原の村
    { location_slug: 'loc_highland',     encounter_type: 'random',        enemy_group_slug: 'yato_yokai_group',     weight: 2 },
    { location_slug: 'loc_highland',     encounter_type: 'random',        enemy_group_slug: 'neutral_wolf_group',   weight: 2 },
    { location_slug: 'loc_highland',     encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',         weight: 1 },

    // ============================================
    // 華龍神朝系 (悪圏): キョンシー・妖狐・兵馬俑
    // ============================================
    // 天極城「龍京」 (Capital)
    { location_slug: 'loc_charon',       encounter_type: 'random',        enemy_group_slug: 'karyu_terracotta_group', weight: 3 },
    { location_slug: 'loc_charon',       encounter_type: 'random',        enemy_group_slug: 'karyu_spirit_group',     weight: 1 },
    { location_slug: 'loc_charon',       encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',           weight: 1 },
    // 闘技都市
    { location_slug: 'loc_coliseum',     encounter_type: 'random',        enemy_group_slug: 'karyu_terracotta_group', weight: 2 },
    { location_slug: 'loc_coliseum',     encounter_type: 'random',        enemy_group_slug: 'karyu_spirit_group',     weight: 2 },
    { location_slug: 'loc_coliseum',     encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',           weight: 1 },
    // 谷間の集落
    { location_slug: 'loc_valley',       encounter_type: 'random',        enemy_group_slug: 'karyu_spirit_group',     weight: 3 },
    { location_slug: 'loc_valley',       encounter_type: 'random',        enemy_group_slug: 'roland_undead_group',    weight: 1 },
    { location_slug: 'loc_valley',       encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',           weight: 1 },

    // ============================================
    // 中立・辺境地帯
    // ============================================
    // 国境の町
    { location_slug: 'loc_border_town',      encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group',  weight: 2 },
    { location_slug: 'loc_border_town',      encounter_type: 'random',        enemy_group_slug: 'roland_bandit_group',   weight: 2 },
    { location_slug: 'loc_border_town',      encounter_type: 'random',        enemy_group_slug: 'neutral_wolf_group',    weight: 1 },
    { location_slug: 'loc_border_town',      encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',          weight: 1 },
    // 古代遺跡の町
    { location_slug: 'loc_ancient_ruins',    encounter_type: 'random',        enemy_group_slug: 'roland_undead_group',   weight: 3 },
    { location_slug: 'loc_ancient_ruins',    encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group',  weight: 2 },
    { location_slug: 'loc_ancient_ruins',    encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',          weight: 1 },
    // 最果ての村
    { location_slug: 'loc_frontier_village', encounter_type: 'random',        enemy_group_slug: 'neutral_wolf_group',    weight: 3 },
    { location_slug: 'loc_frontier_village', encounter_type: 'random',        enemy_group_slug: 'neutral_goblin_group',  weight: 1 },
    { location_slug: 'loc_frontier_village', encounter_type: 'bounty_hunter', enemy_group_slug: 'bandit_group',          weight: 1 },
];

async function main() {
    console.log('Connecting to Supabase...');

    // 1. Fetch all location IDs from DB using slugs
    const locationSlugs = [...new Set(encounterConfig.map(c => c.location_slug))];
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, slug, name')
        .in('slug', locationSlugs);

    if (locError || !locations) {
        console.error('Failed to fetch locations:', locError);
        process.exit(1);
    }

    const locMap = new Map<string, string>(); // slug -> id
    locations.forEach(l => locMap.set(l.slug, l.id));

    console.log(`Found ${locations.length} / ${locationSlugs.length} locations in DB.`);
    if (locations.length < locationSlugs.length) {
        const missing = locationSlugs.filter(s => !locMap.has(s));
        console.warn(`  Missing slugs: ${missing.join(', ')}`);
    }

    // 2. Build insert rows (skip unknown slugs)
    const rows = encounterConfig
        .map(c => {
            const location_id = locMap.get(c.location_slug);
            if (!location_id) return null;
            return {
                location_id,
                encounter_type: c.encounter_type,
                enemy_group_slug: c.enemy_group_slug,
                weight: c.weight
            };
        })
        .filter(Boolean) as any[];

    console.log(`Prepared ${rows.length} encounter rows.`);

    // 3. Clear existing records (use gt approach for UUID PKs)
    const { error: clearError } = await supabase
        .from('location_encounters')
        .delete()
        .gt('id', 0); // bigserial id > 0 → 全件削除

    if (clearError) {
        // テーブルが空でも成功とする
        if (clearError.code !== 'PGRST116') {
            console.warn('Clear warning (may be empty table):', clearError.message);
        }
    } else {
        console.log('Cleared existing location_encounters rows.');
    }

    // 4. Insert in batches of 50
    const BATCH = 50;
    let insertedCount = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error: insertError, data: inserted } = await supabase
            .from('location_encounters')
            .insert(batch)
            .select('id');

        if (insertError) {
            console.error(`Batch ${i / BATCH + 1} failed:`, insertError);
            process.exit(1);
        }
        insertedCount += inserted?.length ?? 0;
        console.log(`  Inserted batch ${i / BATCH + 1}: ${inserted?.length} rows`);
    }

    console.log(`\n✅ Done! Inserted ${insertedCount} location encounter records.`);
}

main();
