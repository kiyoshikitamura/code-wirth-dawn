process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const idsParam = searchParams.get('ids');

        if (!idsParam) {
            return NextResponse.json({ cards: [] });
        }

        const ids = idsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));

        if (ids.length === 0) {
            return NextResponse.json({ cards: [] });
        }

        const { data, error } = await supabaseServer
            .from('cards')
            .select('id, slug, name, type, cost_type, cost_val, effect_val, ap_cost, target_type, effect_id, image_url, description')
            .in('id', ids);

        if (error) {
            console.error('[Cards API] DB Error:', error);
            throw error;
        }

        // 市民の支援やノイズカード等は含まないように除外
        const filteredCards = (data || []).filter(c => {
            const isNoise = c.type === 'noise' || c.name === 'Noise' || c.slug === 'card_noise';
            const isCivicSupport = c.name === '市民の支援' || c.slug === 'card_civic_support';
            return !isNoise && !isCivicSupport;
        });

        return NextResponse.json({ cards: filteredCards });
    } catch (e: any) {
        console.error('[Cards API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
