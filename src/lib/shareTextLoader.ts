import fs from 'fs';
import path from 'path';

/**
 * CSV駆動シェアテキストローダー
 * 
 * share_texts.csv からテンプレートを読み込み、テンプレート変数を置換して
 * 完成テキストを返す。サーバーサイド専用（fs依存）。
 * 
 * share_flavors.csv からフレーバーテキストを読み込む。
 */

interface ShareTemplate {
    id: number;
    slug: string;
    template: string;
    hashtags: string;
}

// In-memory cache（サーバーリクエスト間で再利用）
let _templates: Map<string, ShareTemplate> | null = null;
let _flavors: Map<string, string> | null = null;

function parseCsvRows(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        rows.push(trimmed.split(','));
    }
    return rows;
}

function loadTemplates(): Map<string, ShareTemplate> {
    if (_templates) return _templates;

    try {
        const csvPath = path.join(process.cwd(), 'src/data/csv/share_texts.csv');
        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const rows = parseCsvRows(csvText);

        _templates = new Map();
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 4) continue;
            const template: ShareTemplate = {
                id: parseInt(row[0], 10),
                slug: row[1],
                template: row[2],
                hashtags: row.slice(3).join(','), // hashtagsにカンマが含まれる場合を考慮
            };
            _templates.set(template.slug, template);
        }
    } catch (e) {
        console.error('[ShareTextLoader] Failed to load share_texts.csv:', e);
        _templates = new Map();
    }

    return _templates;
}

function loadFlavors(): Map<string, string> {
    if (_flavors) return _flavors;

    try {
        const csvPath = path.join(process.cwd(), 'src/data/csv/share_flavors.csv');
        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const rows = parseCsvRows(csvText);

        _flavors = new Map();
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 3) continue;
            const key = `${row[0]}:${row[1]}`;
            _flavors.set(key, row.slice(2).join(','));
        }
    } catch (e) {
        console.error('[ShareTextLoader] Failed to load share_flavors.csv:', e);
        _flavors = new Map();
    }

    return _flavors;
}

/**
 * テンプレート変数を展開してシェアテキストを生成
 * @param slug - trigger_slug (e.g. 'level_milestone')
 * @param vars - テンプレート変数 (e.g. { level: 10, flavor: '...' })
 * @returns 完成テキスト（テンプレート + ハッシュタグ）
 */
export function getShareText(slug: string, vars: Record<string, string | number> = {}): string {
    const templates = loadTemplates();
    const t = templates.get(slug);
    if (!t) return '';

    let text = t.template;
    for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
    }
    // 未置換の変数をクリーンアップ
    text = text.replace(/\{[^}]+\}/g, '');

    return `${text} ${t.hashtags}`.trim();
}

/**
 * フレーバーテキストを取得
 * @param type - フレーバー種別 (e.g. 'level', 'title_tier', 'category')
 * @param key - キー (e.g. '10', 'S', 'enemy')
 * @returns フレーバーテキスト
 */
export function getFlavor(type: string, key: string): string {
    const flavors = loadFlavors();
    return flavors.get(`${type}:${key}`) || '';
}

/**
 * CSVキャッシュをクリア（テスト用・ホットリロード用）
 */
export function clearShareTextCache(): void {
    _templates = null;
    _flavors = null;
}
