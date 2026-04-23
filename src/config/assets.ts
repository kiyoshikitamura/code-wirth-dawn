
// Static Asset Mapping for Scenario Engine
// Avoids dynamic AI generation at runtime.

export const SCENARIO_ASSETS: Record<string, string> = {
    // Dungeons
    'dungeon_sewer': '/backgrounds/dungeon/sewer.jpg',
    'dungeon_cave': '/backgrounds/dungeon/cave.jpg',
    'dungeon_ruins': '/backgrounds/dungeon/ruins.jpg',

    // Cities
    'city_slums': '/backgrounds/city/slums.jpg',
    'city_market': '/backgrounds/city/market.jpg',
    'city_castle': '/backgrounds/city/castle.jpg',
    'city_tavern': '/backgrounds/city/tavern.jpg',

    // Nature
    'nature_forest': '/backgrounds/nature/forest.jpg',
    'nature_mountain': '/backgrounds/nature/mountain.jpg',

    // Default Fallbacks
    'default': '/backgrounds/default.jpg',
    'bg_default': '/backgrounds/default.jpg',
    'battle_generic': '/backgrounds/battle_bg.png',
    'bg_battle': '/backgrounds/battle_bg.png',

    // ── クエスト用背景 (public/images/quests/) ──
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
    'bg_spot_roland_core': '/images/quests/bg_spot_roland_core.png',
    'bg_spot_roland_fire': '/images/quests/bg_spot_roland_fire.png',
    'bg_spot_roland_tomb': '/images/quests/bg_spot_roland_tomb.png',
    'bg_spot_markand_king': '/images/quests/bg_spot_markand_king.png',
    'bg_spot_markand_mirror': '/images/quests/bg_spot_markand_mirror.png',
    'bg_spot_markand_ruins': '/images/quests/bg_spot_markand_ruins.png',
};

export function getAssetUrl(key: string): string {
    return SCENARIO_ASSETS[key] || SCENARIO_ASSETS['default'];
}
