import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Provide a fallback for build time. At runtime, real calls will fail if missing, but build will pass.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Stripe Price ID → subscription_tier マッピング
const PRICE_TO_TIER: Record<string, 'basic' | 'premium'> = {
    [process.env.STRIPE_PRICE_ID_BASIC ?? '']: 'basic',
    [process.env.STRIPE_PRICE_ID_PREMIUM ?? '']: 'premium',
};

/**
 * POST /api/webhooks/stripe
 * Stripe からのイベントを受信してDBを更新する。
 * 仕様: spec_v13_monetization_subscription.md §5.2
 *
 * 対応イベント:
 * - checkout.session.completed (subscription): subscription_tier を更新
 * - checkout.session.completed (payment):      gold を加算
 * - customer.subscription.deleted:             subscription_tier を 'free' にダウングレード
 */
export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error('[webhooks/stripe] Signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
        // ─── 冪等性（Idempotency）チェック ───
        const { error: idempotencyErr } = await supabaseAdmin
            .from('stripe_webhook_events')
            .insert({ id: event.id, type: event.type });

        if (idempotencyErr) {
            if (idempotencyErr.code === '23505') { // Postgres Unique Violation
                console.log(`[webhooks/stripe] Event ${event.id} already processed. Skipping.`);
                return NextResponse.json({ received: true }); // すでに処理済みの場合は成功として返す
            }
            throw idempotencyErr;
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id || session.metadata?.user_id;

                if (!userId) {
                    console.error('[webhooks/stripe] user_id が取得できません。', session.id);
                    break;
                }

                if (session.mode === 'subscription') {
                    // ─── サブスクリプション加入・更新 ───
                    // line_items から Price ID を取得
                    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                    const priceId = lineItems.data[0]?.price?.id ?? '';
                    const newTier = PRICE_TO_TIER[priceId];

                    if (!newTier) {
                        console.error('[webhooks/stripe] 不明な Price ID:', priceId);
                        break;
                    }

                    const { error } = await supabaseAdmin
                        .from('user_profiles')
                        .update({ subscription_tier: newTier })
                        .eq('id', userId);

                    if (error) throw error;
                    console.log(`[webhooks/stripe] subscription_tier → ${newTier} for user ${userId}`);

                } else if (session.mode === 'payment') {
                    // ─── ゴールド都度購入 ───
                    const goldAmount = Number(session.metadata?.gold_amount ?? 0);

                    if (goldAmount > 0) {
                        const { data: profile, error: fetchErr } = await supabaseAdmin
                            .from('user_profiles')
                            .select('gold')
                            .eq('id', userId)
                            .single();

                        if (fetchErr || !profile) throw fetchErr || new Error('Profile not found');

                        const { error: goldErr } = await supabaseAdmin
                            .rpc('increment_gold', { p_user_id: userId, p_amount: goldAmount });

                        if (goldErr) throw goldErr;
                        console.log(`[webhooks/stripe] +${goldAmount}G for user ${userId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                // ─── サブスク解約・ダウングレード ───
                const subscription = event.data.object as Stripe.Subscription;
                // customer から user_id を特定（Stripe Customer ID → user_id は metadata から引く）
                const customerId = subscription.customer as string;

                // Stripe Customer の metadata から user_id を取得
                const customer = await stripe.customers.retrieve(customerId);
                const userId = 'deleted' in customer ? null : customer.metadata?.user_id;

                if (!userId) {
                    console.error('[webhooks/stripe] 解約イベントで user_id が特定できません。customerId:', customerId);
                    break;
                }

                const { error } = await supabaseAdmin
                    .from('user_profiles')
                    .update({ subscription_tier: 'free' })
                    .eq('id', userId);

                if (error) throw error;
                console.log(`[webhooks/stripe] subscription_tier → free (解約) for user ${userId}`);
                break;
            }

            default:
                // 未対応イベントは無視
                break;
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error('[webhooks/stripe] Processing error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
