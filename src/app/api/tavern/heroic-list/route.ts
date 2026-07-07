process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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

        // ユーザーのプランを取得 (Premium割引判定のため)
        const { data: profile } = await client
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .maybeSingle();
        const tier = profile?.subscription_tier || 'free';
        const isPremium = tier === 'premium';

        // 1. 全登録英霊の総数を取得
        const { count, error: countErr } = await client
            .from('party_members')
            .select('id', { count: 'exact', head: true })
            .eq('origin_type', 'shadow_heroic')
            .eq('is_active', false);

        if (countErr) {
            return NextResponse.json({ error: countErr.message }, { status: 500 });
        }

        const totalCount = count || 0;
        let heroics = null;
        let selectError = null;

        if (totalCount > 0) {
            // ランダムな位置（オフセット）を設定して1体取得
            const randomOffset = Math.floor(Math.random() * totalCount);
            const { data, error: fetchErr } = await client
                .from('party_members')
                .select('id, name, epithet, level, job_class, atk, def, max_durability, durability, image_url, inject_cards, source_user_id, owner_id, created_at, last_hired_at, snapshot_data')
                .eq('origin_type', 'shadow_heroic')
                .eq('is_active', false)
                .range(randomOffset, randomOffset);
            
            heroics = data;
            selectError = fetchErr;
        }

        if (selectError) {
            return NextResponse.json({ error: selectError.message }, { status: 500 });
        }

        // ShadowSummary 形式に変換
        const heroicList = (heroics || []).map(h => {
            const snapshot = h.snapshot_data as any;
            const isOwn = h.owner_id === userId;
            const baseFee = 5000 + ((h.level || 1) * 1000); // HIRE_HEROIC_BASE + HIRE_HEROIC_PER_LEVEL
            const contractFee = (isPremium && isOwn) ? Math.floor(baseFee * 0.5) : baseFee;

            return {
                profile_id: h.id,
                name: h.name,
                epithet: h.epithet || '',
                level: h.level || 1,
                job_class: h.job_class || 'Adventurer',
                origin_type: 'shadow_heroic' as const,
                contract_fee: contractFee,
                stats: {
                    hp: h.max_durability || 100,
                    atk: h.atk || 0,
                    def: h.def || 0,
                },
                signature_deck_preview: [] as string[],
                subscription_tier: tier,
                icon_url: h.image_url,
                image_url: h.image_url,
                npc_image_url: h.image_url,
                source_user_id: h.source_user_id,
                is_own: isOwn || h.source_user_id === userId,
                equipped_items: snapshot?.equipped_items || [],
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
