export const VISUAL_MAPPING = {
    // World Backgrounds (Unsplash Source)
    BACKGROUNDS: {
        '至高の平穏': '/backgrounds/peace.jpg',
        '自由なる活気': '/backgrounds/vitality.jpg',
        '鉄の規律': '/backgrounds/discipline.jpg',
        '血塗られた混迷': '/backgrounds/chaos.jpg',
        'DEFAULT': '/backgrounds/default.jpg'
    } as Record<string, string>,

    // User Avatars (Dummy avatars for now, maybe UI Avatars or RoboHash or Unsplash Portraits)
    // Using Unsplash Portraits for high quality
    AVATARS: {
        '名もなき旅人': '/avatars/adventurer.jpg',
        '光差す騎士': '/avatars/knight.jpg',
        '混沌の放浪者': '/avatars/wanderer.jpg',
        '冷徹なる執行者': '/avatars/enforcer.jpg',
        'DEFAULT': '/avatars/default.jpg'
    } as Record<string, string>
};

export function getBackgroundByAttribute(attribute: string): string {
    return VISUAL_MAPPING.BACKGROUNDS[attribute] || VISUAL_MAPPING.BACKGROUNDS['DEFAULT'];
}

export function getAvatarByTitle(title: string): string {
    return VISUAL_MAPPING.AVATARS[title] || VISUAL_MAPPING.AVATARS['DEFAULT'];
}
