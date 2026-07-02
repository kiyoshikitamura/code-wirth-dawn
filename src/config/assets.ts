
// Static Asset Mapping for Scenario Engine
// Avoids dynamic AI generation at runtime.

export const SCENARIO_ASSETS: Record<string, string> = {
    // Dungeons
    'dungeon_sewer': '/images/quests/bg_catacombs.png',
    'dungeon_cave': '/images/quests/bg_cave.png',
    'dungeon_ruins': '/images/quests/bg_ruins_field.png',

    // Cities
    'city_slums': '/images/quests/bg_slum.png',
    'city_market': '/backgrounds/city/market.jpg',
    'city_castle': '/backgrounds/city/castle.jpg',
    'city_tavern': '/images/quests/bg_tavern_day.png',

    // Nature
    'nature_forest': '/images/quests/bg_forest_day.png',
    'nature_mountain': '/images/quests/bg_mountain.png',

    // Default Fallbacks
    'default': '/backgrounds/default.jpg',
    'bg_default': '/backgrounds/default.jpg',
    'battle_generic': '/backgrounds/battle_bg.png',
    'bg_battle': '/backgrounds/battle_bg.png',

    // ── クエスト用背景 (public/images/quests/) ──
    'bg_colosseum': '/images/quests/bg_colosseum.png',
    'bg_wasteland': '/images/quests/bg_wasteland.png',
    'bg_desert': '/images/quests/bg_desert.png',
    'bg_slum': '/images/quests/bg_slum.png',
    'bg_bandit_camp': '/images/quests/bg_bandit_camp.png',
    'bg_forest_day': '/images/quests/bg_forest_day.png',
    'bg_forest_night': '/images/quests/bg_forest_night.png',
    'bg_river': '/images/quests/bg_river.png',
    'bg_tavern_night': '/images/quests/bg_tavern_night.png',
    'bg_tavern_day': '/images/quests/bg_tavern_day.png',
    'bg_mountain': '/images/quests/bg_mountain.png',
    'bg_boss_altar': '/images/quests/bg_boss_altar.png',
    'bg_road_day': '/images/quests/bg_road_day.png',
    'bg_road_night': '/images/quests/bg_road_night.png',
    'bg_ruins_field': '/images/quests/bg_ruins_field.png',
    'bg_cave': '/images/quests/bg_cave.png',
    'bg_mine': '/images/quests/bg_mine.png',
    'bg_church': '/images/quests/bg_church.png',
    'bg_guild': '/images/quests/bg_guild.png',
    'bg_office': '/images/quests/bg_office.png',
    'bg_shop': '/images/quests/bg_shop.png',
    'bg_catacombs': '/images/quests/bg_catacombs.png',
    // スポット背景
    'bg_spot_yato_entrance': '/images/quests/bg_spot_yato_entrance.png',
    'bg_spot_yato_gate': '/images/quests/bg_spot_yato_gate.png',
    'bg_spot_yato_eclipse': '/images/quests/bg_spot_yato_eclipse.png',
    'bg_spot_karyu_thunder': '/images/quests/bg_spot_karyu_thunder.png',
    'bg_spot_karyu_tower': '/images/quests/bg_spot_karyu_tower.png',
    'bg_spot_karyu_throne': '/images/quests/bg_spot_karyu_throne.png',
    'bg_spot_karyu_snow': '/images/quests/bg_spot_karyu_snow.png',
    'bg_spot_karyu_fire': '/images/quests/bg_spot_karyu_fire.png',
    'bg_spot_karyu_earth': '/images/quests/bg_spot_karyu_earth.png',
    'bg_spot_roland_core': '/images/quests/bg_spot_roland_core.png',
    'bg_spot_roland_fire': '/images/quests/bg_spot_roland_fire.png',
    'bg_spot_roland_tomb': '/images/quests/bg_spot_roland_tomb.png',
    'bg_spot_markand_king': '/images/quests/bg_spot_markand_king.png',
    'bg_spot_markand_mirror': '/images/quests/bg_spot_markand_mirror.png',
    'bg_spot_markand_ruins': '/images/quests/bg_spot_markand_ruins.png',
    // 大天使侵攻編 + 英霊の遺産編 背景 (6011-6020)
    'bg_holy_empire': '/images/quests/bg_holy_empire.png',
    'bg_heroic_stele': '/images/quests/bg_heroic_stele.png',
    'bg_ishaq_ruined': '/images/quests/bg_ishaq_ruined.png',
    'bg_island': '/images/quests/bg_island.png',
    'bg_izumo_ruined': '/images/quests/bg_izumo_ruined.png',
    'bg_memory_forest': '/images/quests/bg_memory_forest.png',
    'bg_memory_gawain': '/images/quests/bg_memory_gawain.png',
    'bg_memory_mountain': '/images/quests/bg_memory_mountain.png',
    'bg_memory_oasis': '/images/quests/bg_memory_oasis.png',
    'bg_mountain_shrine': '/images/quests/bg_mountain_shrine.png',
    'bg_pyramid_chamber': '/images/quests/bg_pyramid_chamber.png',
    'bg_regalia_ruined': '/images/quests/bg_regalia_ruined.png',
    'bg_ryukyo_ruined': '/images/quests/bg_ryukyo_ruined.png',
    // ── ローランド/マルカンド地方クエスト用背景 (7010-7025) ──
    'bg_ruined_church': '/images/quests/bg_ruined_church.png',
    'bg_slums': '/images/quests/bg_slum.png',  // alias: CSVで bg_slums を使うケースのフォールバック
    'bg_camp': '/images/quests/bg_camp.png',
    'bg_fort': '/images/quests/bg_fort.png',
    'bg_shrine': '/images/quests/bg_shrine.png',
    'bg_crypt': '/images/quests/bg_crypt.png',
    'bg_desert_night': '/images/quests/bg_desert.png',  // 夜砂漠 → 砂漠共通にフォールバック
    'bg_mar_mansion': '/images/quests/bg_mar_mansion.png',
    'bg_mar_outlaw': '/images/quests/bg_mar_outlaw.png',
    'bg_mar_auction': '/images/quests/bg_mar_auction.png',
    'bg_mar_warlord': '/images/quests/bg_mar_warlord.png',
    // ── 夜刀地方クエスト用背景 (7030-7034) ──
    'bg_yato_road': '/images/quests/bg_yato_road.png',
    'bg_yato_forest': '/images/quests/bg_yato_forest.png',
    'bg_yato_city': '/images/quests/bg_yato_city.png',
    'bg_yato_den': '/images/quests/bg_yato_den.png',
    'bg_yato_mountain': '/images/quests/bg_yato_mountain.png',
    'bg_yato_shrine': '/images/quests/bg_yato_shrine.png',
    'bg_yato_tavern_night': '/images/quests/bg_yato_tavern_night.png',
    'bg_yat_haunted': '/images/quests/bg_yat_haunted.png',
    // ── 華龍地方クエスト用背景 (7040-7044) ──
    'bg_karyu_mountain': '/images/quests/bg_karyu_mountain.png',
    'bg_karyu_palace': '/images/quests/bg_karyu_palace.png',
    'bg_karyu_village': '/images/quests/bg_karyu_village.png',
    'bg_karyu_coast': '/images/quests/bg_karyu_coast.png',
    'bg_karyu_port': '/images/quests/bg_karyu_port.png',
    'bg_karyu_river': '/images/quests/bg_karyu_village.png',  // 河畔 → 村共通にフォールバック
    'bg_yato_street_night': '/images/quests/bg_yato_city.png',  // 夜の城下町 → 城下町共通にフォールバック
    'bg_har_city': '/images/quests/bg_har_city.png',
    'bg_har_cliff': '/images/quests/bg_har_cliff.png',
    // ── 伝説級クエスト用背景 (6105-6111) ──
    'bg_ruin_crypt': '/images/quests/bg_crypt.png',  // 遺跡地下墓地 → 地下墓地にフォールバック
    'bg_marcund': '/images/quests/bg_memory_oasis.png',  // マルカンドオアシスへのエイリアス
    'bg_marcund_desert': '/images/quests/bg_desert.png',  // マルカンド砂漠 → 砂漠共通にフォールバック
    // ── 狭間の迷宮シリーズ背景 (7060-7066) ──
    'bg_rift_entrance': '/images/quests/bg_rift_entrance.png',
    'bg_rift_camp': '/images/quests/bg_rift_camp.png',
    'bg_rift_camp_stairs': '/images/quests/bg_rift_camp_stairs.png',
    'bg_rift_maze': '/images/quests/bg_rift_maze.png',
    'bg_rift_upper_01': '/images/quests/bg_rift_upper_01.png',
    'bg_rift_upper_02': '/images/quests/bg_rift_upper_02.png',
    'bg_rift_middle_01': '/images/quests/bg_rift_middle_01.png',
    'bg_rift_middle_02': '/images/quests/bg_rift_middle_02.png',
    'bg_rift_middle_maze': '/images/quests/bg_rift_middle_maze.png',
    'bg_rift_lower_01': '/images/quests/bg_rift_lower_01.png',
    'bg_rift_lower_02': '/images/quests/bg_rift_lower_02.png',
    'bg_rift_abyss': '/images/quests/bg_rift_abyss.png',
    'bg_rift_abyss_02': '/images/quests/bg_rift_abyss_02.png',
    'bg_rift_abyss_03': '/images/quests/bg_rift_abyss_03.png',
    'fg_rift_gate_order': '/images/quests/fg_rift_gate_order.png',
    'fg_rift_gate_chaos': '/images/quests/fg_rift_gate_chaos.png',
    'fg_rift_chest': '/images/quests/fg_rift_chest.png',
    'fg_rift_merchant': '/images/quests/fg_rift_merchant.png',
    'fg_rift_door_basic': '/images/quests/fg_rift_door_basic.png',
    'fg_rift_door_iron': '/images/quests/fg_rift_door_iron.png',
    'fg_rift_door_boss': '/images/quests/fg_rift_door_boss.png',
    'fg_rift_well': '/images/quests/fg_rift_well.png',
    'fg_rift_spring': '/images/quests/fg_rift_spring.png',
    'fg_rift_trap_spears': '/images/quests/fg_rift_trap_spears.png',
    'fg_rift_pedestals': '/images/quests/fg_rift_pedestals.png',

    // 前景画像 (スプライト)
    'fg_demon_soldier': '/images/quests/fg_demon_soldier.png',
    'fg_chest_locked': '/images/quests/fg_chest_locked.png',
};

export function getAssetUrl(key: string): string {
    if (!key || typeof key !== 'string') return SCENARIO_ASSETS['default'];
    // UGC v2: 絶対URLはそのまま返す（ugc:// は事前にresolveUgcUrlで解決済み）
    if (key.startsWith('http')) return key;
    return SCENARIO_ASSETS[key] || SCENARIO_ASSETS['default'];
}
