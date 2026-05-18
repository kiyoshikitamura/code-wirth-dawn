import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/billing/portal
 * Stripe Customer Portal Session を発行してURLを返す。
 * 有料プランユーザーがプランの変更・解約を行うためのリンク。
 * v27.0: JWT認証付き
 */
export async function POST(req: Request) {
    try {
        // JWT認証
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: '認証セッションが無効です' }, { status: 401 });
        }

        const userId = user.id;
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Stripe Customer を検索（email またはmetadata.user_id で特定）
        const customers = await stripe.customers.list({
            limit: 1,
            email: user.email || undefined,
        });

        let customerId: string | null = customers.data[0]?.id || null;

        // metadata検索のフォールバック
        if (!customerId) {
            const searchResult = await stripe.customers.search({
                query: `metadata["user_id"]:"${userId}"`,
                limit: 1,
            });
            customerId = searchResult.data[0]?.id || null;
        }

        if (!customerId) {
            return NextResponse.json(
                { error: 'Stripeの顧客情報が見つかりません。プランに加入後にお試しください。' },
                { status: 404 }
            );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/inn`,
        });

        return NextResponse.json({ url: portalSession.url });

    } catch (err: any) {
        console.error('[billing/portal] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
