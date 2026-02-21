/**
 * 国家カラーユーティリティ
 * 各コンポーネントで重複していた getNationColor を共通化
 */

/** 背景+ボーダー（酒場・宿屋等のカードUI用） */
export function getNationBgColor(nationId: string | undefined): string {
    if (nationId === 'Roland') return 'bg-blue-950/80 border-blue-800';
    if (nationId === 'Markand') return 'bg-yellow-950/80 border-yellow-800';
    if (nationId === 'Karyu') return 'bg-red-950/80 border-red-800';
    if (nationId === 'Yato') return 'bg-purple-950/80 border-purple-800';
    return 'bg-gray-900/80 border-gray-700';
}

/** ボーダー+テキスト+シャドウ（ワールドマップのノード用） */
export function getNationNodeColor(nationId: string): string {
    switch (nationId) {
        case 'Roland': return 'border-blue-500 shadow-blue-500/50 text-blue-200';
        case 'Markand': return 'border-yellow-600 shadow-yellow-600/50 text-yellow-200';
        case 'Karyu': return 'border-emerald-600 shadow-emerald-500/50 text-emerald-200';
        case 'Yato': return 'border-purple-600 shadow-purple-500/50 text-purple-200';
        default: return 'border-gray-600 shadow-gray-500/50 text-gray-400';
    }
}
