/**
 * NGワードフィルタ — ユーザー名バリデーション用
 *
 * チェック対象:
 *   1. 完全一致（正規化後）
 *   2. 部分一致（名前に含まれている場合）
 *   3. 正規表現パターン（記号置換による回避防止）
 */

// 禁止ワード（部分一致でブロック）
const NG_WORDS: string[] = [
    // 差別・侮蔑表現
    '死ね', '殺す', 'ころす', 'しね', 'くたばれ',
    'ガイジ', 'がいじ', '池沼', 'きちがい', 'キチガイ',
    // 性的表現
    'セックス', 'せっくす', 'ちんこ', 'まんこ', 'おっぱい',
    // 運営なりすまし防止
    '運営', '管理者', 'admin', 'Admin', 'ADMIN',
    'GM', 'gm', 'moderator',
    '公式', 'official', 'Official',
    // システム予約語
    'system', 'System', 'SYSTEM',
    'null', 'undefined', 'NaN',
    // ゲーム内NPC名なりすまし防止（主要NPC）
    '名もなき旅人',
];

// 正規表現パターン（記号挿入による回避を防止）
const NG_PATTERNS: RegExp[] = [
    /[a@][d][m][i1][n]/i,           // admin の変形
    /[s\$][y][s\$][t][e3][m]/i,     // system の変形
];

/**
 * NGワードチェック
 * @returns 違反があった場合はブロック理由を返す。問題なければ null。
 */
export function checkNgWord(name: string): string | null {
    const normalized = name.toLowerCase().trim();

    // 空文字チェック
    if (normalized.length === 0) {
        return '名前を入力してください。';
    }

    // 長さチェック
    if (normalized.length > 16) {
        return '名前は16文字以内で入力してください。';
    }

    // 空白のみチェック
    if (/^\s+$/.test(name)) {
        return '空白のみの名前は使用できません。';
    }

    // NGワード部分一致チェック
    for (const word of NG_WORDS) {
        if (normalized.includes(word.toLowerCase())) {
            return 'この名前には使用できない単語が含まれています。';
        }
    }

    // 正規表現パターンチェック
    for (const pattern of NG_PATTERNS) {
        if (pattern.test(name)) {
            return 'この名前には使用できない表現が含まれています。';
        }
    }

    return null;
}
