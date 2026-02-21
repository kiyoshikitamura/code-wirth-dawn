
export const WORLD_LOCATIONS: Record<string, { name: string; map_x: number; map_y: number }> = {
    'loc_regalia': { name: '王都レガリア', map_x: 50, map_y: 80 },  // Center Bottom (Start)
    'loc_white_fort': { name: '白亜の砦', map_x: 65, map_y: 60 },   // Mid Right
    'loc_iron_mine': { name: '鉄の鉱山', map_x: 40, map_y: 40 },    // Mid Left
    'loc_charon': { name: '帝都カロン', map_x: 50, map_y: 15 },     // Top Center (Goal)
    // Additional placeholders to prevent map crashes if they exist
    'loc_hometown': { name: '故郷の村', map_x: 45, map_y: 85 },
    'loc_port_city': { name: '港町', map_x: 20, map_y: 70 },
};

export const TRAVEL_ROUTES: { from: string; to: string; days: number }[] = [
    { from: 'loc_regalia', to: 'loc_white_fort', days: 3 },
    { from: 'loc_white_fort', to: 'loc_iron_mine', days: 4 },
    { from: 'loc_iron_mine', to: 'loc_charon', days: 5 },
    // Reverse routes handled by utility, but we can define explicit overrides if needed.
];
