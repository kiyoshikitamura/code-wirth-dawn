import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Provide a fallback for build time. At runtime, real calls will fail if missing, but build will pass.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
});

const PRICE_IDS: Record<string, string> = {
    basic: process.env.STRIPE_PRICE_ID_BASIC!,
    premium: process.env.STRIPE_PRICE_ID_PREMIUM!,
};

// ゴールドパッケージ定義（price_id → 付与G）
const GOLD_PACKAGES: Record<string, number> = {
    [process.env.STRIPE_PRICE_ID_GOLD_10K ?? 'gold_10k']: 10000,
    [process.env.STRIPE_PRICE_ID_GOLD_50K ?? 'gold_50k']: 50000,
};

/**
 * POST /api/billing/checkout
 * Stripe Checkout Session を発行してURLを返す。
 * 仕様: spec_v13_monetization_subscription.md §5.1
 *
 * Body:
 * {
 *   userId: string,
 *   mode: 'subscription' | 'payment',
 *   tier?: 'basic' | 'premium',      // mode='subscription' のとき
 *   priceId?: string,                 // mode='payment' (ゴールド購入) のとき
 * }
 */
export async function POST(req: Request) {
    try {
        const { userId, mode, tier, priceId } = await req.json();

        if (!userId || !mode) {
            return NextResponse.json({ error: 'userId と mode は必須です。' }, { status: 400 });
        }

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        if (mode === 'subscription') {
            // ─── サブスクリプション決済 ───
            if (!tier || !PRICE_IDS[tier]) {
                return NextResponse.json(
                    { error: `tier は 'basic' または 'premium' を指定してください。` },
                    { status: 400 }
                );
            }

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
                client_reference_id: userId,           // Webhook で user_id を特定するため必須
                metadata: { user_id: userId, tier },
                success_url: `${origin}/inn?billing=success&tier=${tier}`,
                cancel_url: `${origin}/inn?billing=cancel`,
            });

            return NextResponse.json({ url: session.url });

        } else if (mode === 'payment') {
            // ─── ゴールド都度購入 ───
            if (!priceId) {
                return NextResponse.json({ error: 'ゴールド購入には priceId が必要です。' }, { status: 400 });
            }

            const goldAmount = GOLD_PACKAGES[priceId] ?? 10000;

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [{ price: priceId, quantity: 1 }],
                client_reference_id: userId,
                metadata: { user_id: userId, gold_amount: String(goldAmount) },
                success_url: `${origin}/inn?billing=gold_success&amount=${goldAmount}`,
                cancel_url: `${origin}/inn?billing=cancel`,
            });

            return NextResponse.json({ url: session.url });

        } else {
            return NextResponse.json({ error: 'mode は "subscription" または "payment" のみ有効です。' }, { status: 400 });
        }

    } catch (err: any) {
        console.error('[billing/checkout] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
