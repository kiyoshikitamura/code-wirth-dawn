

export interface CharacterStats {
    baseHp: number;
    baseCost: number;
    maxVitality: number;
    type: 'Late Bloomer' | 'Standard' | 'Veteran';
    description: string;
}

export const AGE_BOUNDS = {
    MIN_AGE: 16,
    MAX_AGE: 25,
};

export function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function getBaseStats(age: number): CharacterStats {
    if (age >= 16 && age <= 18) {
        return {
            baseHp: 16, // Low (15-18) -> Avg 16.5
            baseCost: 8, // Low (8)
            maxVitality: 190, // High (180-200) -> Avg 190
            type: 'Late Bloomer',
            description: '晩成型: 老化開始(40歳)まで20年以上の猶予がある。最も長くプレイ可能。'
        };
    } else if (age >= 19 && age <= 22) {
        return {
            baseHp: 20, // Mid (20)
            baseCost: 10, // Mid (10)
            maxVitality: 150, // Mid (140-160) -> Avg 150
            type: 'Standard',
            description: 'バランス型: 標準的なステータス。'
        };
    } else if (age >= 23 && age <= 25) {
        return {
            baseHp: 24, // High (22-25) -> Avg 23.5
            baseCost: 12, // High (12)
            maxVitality: 110, // Low (100-120) -> Avg 110
            type: 'Veteran',
            description: '即戦力型: 初期能力は高いが、老化までの猶予が短い。短期決戦向け。'
        };
    }

    // Fallback (should be validated before)
    return {
        baseHp: 20,
        baseCost: 10,
        maxVitality: 150,
        type: 'Standard',
        description: '標準'
    };
}

export function applyRandomVariance(stats: CharacterStats): CharacterStats & { hpVariance: number, costVariance: number, vitVariance: number } {
    // HP: -2 ~ +3
    const hpVariance = Math.floor(Math.random() * 6) - 2;

    // Deck Cost: 0 ~ +1
    const costVariance = Math.floor(Math.random() * 2);

    // Vitality: -10 ~ +10
    const vitVariance = Math.floor(Math.random() * 21) - 10;

    return {
        ...stats,
        baseHp: stats.baseHp + hpVariance,
        baseCost: stats.baseCost + costVariance,
        maxVitality: stats.maxVitality + vitVariance,
        hpVariance,
        costVariance,
        vitVariance
    };
}
