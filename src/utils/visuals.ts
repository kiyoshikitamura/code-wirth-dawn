

export const VISUAL_MAPPING = {
    // World Backgrounds (Unsplash Source)
    BACKGROUNDS: {
        '至高の平穏': '/backgrounds/peace.jpg',
        '自由なる活気': '/backgrounds/vitality.jpg',
        '鉄の規律': '/backgrounds/discipline.jpg',
        '血塗られた混迷': '/backgrounds/chaos.jpg',
        'DEFAULT': '/backgrounds/default.jpg'
    } as Record<string, string>,
};

export function getBackgroundByAttribute(attribute: string): string {
    return VISUAL_MAPPING.BACKGROUNDS[attribute] || VISUAL_MAPPING.BACKGROUNDS['DEFAULT'];
}

