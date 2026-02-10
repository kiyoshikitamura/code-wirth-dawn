
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
    'battle_generic': '/backgrounds/battle/generic.jpg'
};

export function getAssetUrl(key: string): string {
    return SCENARIO_ASSETS[key] || SCENARIO_ASSETS['default'];
}
