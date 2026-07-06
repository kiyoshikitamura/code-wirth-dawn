process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

/**
 * GET /api/tavern/my-heroic?user_id={userId}
 * 自分のキャラクターが英霊（shadow_heroic）として登録されているか確認する。
 * historical_logs テーブルから自分のレコードを取得し UI に返す。
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        const client = supabaseServer;

        // サブスクリプション tier を取得
        const { data: profile } = await client
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .maybeSingle();

        const tier = profile?.subscription_tier || 'free';
        const maxSlots = tier === 'premium' ? 10 : tier === 'basic' ? 3 : 1;

        // party_members から自身の英霊レコードを取得
        const { data: heroics, error } = await client
            .from('party_members')
            .select('id, name, epithet, level, job_class, atk, def, max_durability, durability, image_url, inject_cards, owner_id, created_at, snapshot_data')
            .eq('origin_type', 'shadow_heroic')
            .eq('owner_id', userId)
            .eq('is_active', false)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const isPremium = tier === 'premium';

        // ShadowSummary 形式に変換
        const heroicList = (heroics || []).map(h => {
            const baseFee = 5000 + ((h.level || 1) * 1000); // Base: 5000 + level * 1000
            const contractFee = isPremium ? Math.floor(baseFee * 0.5) : baseFee;
            const snapshot = h.snapshot_data as any;

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
                source_user_id: userId,
                is_own: true,
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

        return NextResponse.json({ heroics: heroicList, subscription_tier: tier, max_slots: maxSlots });

    } catch (e: any) {
        console.error('[tavern/my-heroic] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
