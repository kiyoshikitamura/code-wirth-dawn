import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-cards
 *
 * cards.csv を読み込んで cards テーブルに upsert する。
 * 併せて skills テーブルの card_id マッピングも更新する。
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=65: 特定IDのみ同期
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const dryRun = url.searchParams.get('dry_run') === 'true';
    const filterId = url.searchParams.get('id');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    // CSV読み込み
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'cards.csv');
    let csvContent: string;
    try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'cards.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvContent.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        // CSV行をパース（簡易: カンマ区切り、最後のdescriptionフィールドにカンマを含む可能性）
        const parts = row.split(',');
        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue; // IDなし行はスキップ（装備品等）
        if (filterId && String(id) !== filterId) continue;

        const slug = parts[1]?.trim();
        const name = parts[2]?.trim();
        const type = parts[3]?.trim();
        const ap_cost = parseInt(parts[4], 10) || 1;
        const cost_type = parts[5]?.trim() || null;
        const cost_val = parseInt(parts[6], 10) || 0;
        const effect_val = parseInt(parts[7], 10) || 0;
        const target_type = parts[8]?.trim() || null;
        const effect_id = parts[9]?.trim() || null;
        const image_url = parts[10]?.trim() || null;
        // description は残りの全フィールドを結合
        const description = parts.slice(11).join(',').trim() || null;

        const cardData = {
            id,
            slug,
            name,
            type,
            ap_cost,
            cost_type,
            cost_val,
            effect_val,
            target_type: target_type || null,
            effect_id: effect_id || null,
            image_url: image_url || null,
            description
        };

        if (dryRun) {
            results.push({ action: 'dry_run', id, name, data: cardData });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('cards')
            .upsert(cardData, { onConflict: 'id' });

        if (error) {
            results.push({ action: 'error', id, name, error: error.message });
            errorCount++;
        } else {
            results.push({ action: 'upserted', id, name });
            successCount++;
        }
    }

    // skills テーブルの card_id マッピング更新
    // items.csv の skill タイプアイテムと cards の紐づけ
    const skillCardMappings: Record<string, number> = {
        'grimoire_fire': 65,
        'grimoire_ice': 66,
        'grimoire_thunder': 67,
        'book_iron_sword': 1,    // 教本:鉄の剣 → 強打
        'book_dagger': 3,        // 教本:護身短剣 → 突き
        'book_axe': 2,           // 教本:樵の斧 → 斬撃
        'book_heal_s': 5,        // 聖書:癒やしの祈り → 応急手当
        'scroll_holy_smite': 12, // 巻物:聖なる一撃 → 裁き
        'book_scimitar': 18,     // 教本:曲刀術 → 毒刃
        'book_katana': 25,       // 奥義書:居合 → 居合切り
        'scroll_shikigami': 22,  // 巻物:式神使役 → クナイ投げ
        'book_kungfu': 29,       // 教本:少林拳 → 連撃
        'scroll_chi_blast': 30,  // 巻物:気功砲 → 飛刀
        'manual_assassination': 58, // 教本:暗殺術 → 即死攻撃
        'item_forbidden_scroll': 63, // 禁術:血の契約書 → 血の契約
        'skill_provoke': 9,      // 教本:挑発 → 挑発
        'skill_first_aid': 5,    // 教本:応急手当 → 応急手当
        'skill_berserk': 59,     // 教本:狂戦士 → 狂戦士の薬
        'item_poison_manual': 62, // 教本:調毒 → 調毒
        'skill_barrier_all': 15, // 聖書:広域防壁 → 聖壁
        'skill_vital_strike': 1, // 奥義書:命削り → 強打(仮)
        'manual_dim_mak': 58,    // 秘伝:点穴 → 即死攻撃
        'skill_iron_skin': 28,   // 教本:鋼鉄の肌 → 鉄布衫
        'skill_lion_roar': 45,   // 奥義:獅子吼 → 岩砕き
        'skill_pressure_point': 30, // 教本:経絡秘孔 → 飛刀(DEF無視)
        'skill_zen': 4,          // 教本:禅 → 防御
        'skill_bribe': 9,        // 教本:賄賂術 → 挑発(仮)
        'skill_survival': 5,     // 教本:サバイバル → 応急手当(仮)
        'skill_meditation': 7,   // 教本:瞑想 → 集中
        'skill_necromancy': 60,  // 禁書:死体操作 → 魂の生贄
        'skill_cannibalism': 56, // 禁忌:人食い → 吸血
        'spot_desert_curse': 74, // 砂塵の支配 → 砂塵の支配
    };

    const skillResults: any[] = [];
    if (!dryRun) {
        for (const [slug, cardId] of Object.entries(skillCardMappings)) {
            const { error } = await supabase
                .from('skills')
                .update({ card_id: cardId })
                .eq('slug', slug);

            if (error) {
                skillResults.push({ slug, card_id: cardId, error: error.message });
            } else {
                skillResults.push({ slug, card_id: cardId, action: 'updated' });
            }
        }
    }

    return NextResponse.json({
        success: true,
        dry_run: dryRun,
        cards: { total: successCount + errorCount, success: successCount, errors: errorCount },
        card_results: results,
        skill_mappings: dryRun ? Object.entries(skillCardMappings).map(([s, c]) => ({ slug: s, card_id: c })) : skillResults,
    });
}
