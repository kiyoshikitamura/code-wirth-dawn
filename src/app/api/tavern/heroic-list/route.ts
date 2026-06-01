import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

/**
 * GET /api/tavern/heroic-list?location_id={locationId}&user_id={userId}
 * v4.1: 英霊の間 — 現在の拠点に紐づく英霊リストを取得
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const locationId = searchParams.get('location_id');
        const userId = searchParams.get('user_id');

        if (!locationId || !userId) {
            return NextResponse.json({ error: 'Missing location_id or user_id' }, { status: 400 });
        }

        const client = supabaseServer;

        // party_members から shadow_heroic で is_active = true のレコードを取得
        const { data: heroics, error } = await client
            .from('party_members')
            .select('id, name, epithet, level, job_class, atk, def, max_durability, durability, image_url, inject_cards, source_user_id, owner_id, created_at, last_hired_at')
            .eq('origin_type', 'shadow_heroic')
            .eq('is_active', false)
            .order('level', { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // ShadowSummary 形式に変換
        const heroicList = (heroics || []).map(h => {
            // カード名は inject_cards から取得できないため、IDのみ返す
            return {
                profile_id: h.id,
                name: h.name,
                epithet: h.epithet || '',
                level: h.level || 1,
                job_class: h.job_class || 'Adventurer',
                origin_type: 'shadow_heroic' as const,
                contract_fee: 5000 + ((h.level || 1) * 1000), // HIRE_HEROIC_BASE + HIRE_HEROIC_PER_LEVEL
                stats: {
                    hp: h.max_durability || 100,
                    atk: h.atk || 0,
                    def: h.def || 0,
                },
                signature_deck_preview: [] as string[],
                subscription_tier: 'free',
                icon_url: h.image_url,
                image_url: h.image_url,
                npc_image_url: h.image_url,
                source_user_id: h.source_user_id,
                is_own: h.owner_id === userId || h.source_user_id === userId,
            };
        });

        // カード名を解決
        const allCardIds = (heroics || []).flatMap(h => h.inject_cards || []);
        if (allCardIds.length > 0) {
            const uniqueIds = [...new Set(allCardIds)];
            const { data: cards } = await client
                .from('cards')
                .select('id, name')
                .in('id', uniqueIds);

            if (cards) {
                const cardMap = new Map(cards.map(c => [c.id, c.name]));
                heroicList.forEach((h, i) => {
                    const original = (heroics || [])[i];
                    h.signature_deck_preview = (original.inject_cards || [])
                        .map((id: number) => cardMap.get(id))
                        .filter(Boolean) as string[];
                });
            }
        }

        return NextResponse.json({ heroics: heroicList });

    } catch (e: any) {
        console.error('[tavern/heroic-list] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
