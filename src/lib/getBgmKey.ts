/**
 * getBgmKey — 拠点状態からBGMキーを決定するユーティリティ
 *
 * 優先順位:
 * 1. 名もなき旅人の拠所 → bgm_inn
 * 2. prosperity_level = 1（崩壊） → bgm_collapse
 * 3. controlling_nation に応じた国家テーマ
 * 4. その他（Neutral等） → bgm_field
 */
export function getBgmKey(
    locationName: string | null | undefined,
    controllingNation: string | null | undefined,
    prosperityLevel: number | null | undefined
): string {
    // 1. ハブ（名もなき旅人の拠所）は固定
    if (locationName === '名もなき旅人の拠所' || locationName === 'Hub') {
        return 'bgm_inn';
    }

    // 2. 崩壊状態（prosperity=1）は共通崩壊BGMを優先
    if ((prosperityLevel ?? 3) <= 1) {
        return 'bgm_collapse';
    }

    // 3. 国家テーマBGM
    const nationBgmMap: Record<string, string> = {
        Roland:  'bgm_roland',
        Markand: 'bgm_markand',
        Yato:    'bgm_yato',
        Karyu:   'bgm_karyu',
    };

    const nationKey = controllingNation ?? '';
    return nationBgmMap[nationKey] ?? 'bgm_field';
}
