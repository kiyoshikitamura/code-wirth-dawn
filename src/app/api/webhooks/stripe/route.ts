import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    const secretKey = process.env.STRIPE_SECRET_KEY || '';

    // Stripe APIキーの簡易フォーマットチェック
    if (!secretKey || secretKey === 'sk_test_dummy') {
        console.warn('[Stripe Webhook] STRIPE_SECRET_KEY is empty or using dummy fallback.');
    } else if (secretKey.startsWith('whsec_')) {
        console.error('[Stripe Webhook] CRITICAL ERROR: STRIPE_SECRET_KEY starts with "whsec_". It must be a Stripe Secret API Key (sk_...), not a Webhook Secret.');
        return NextResponse.json({ error: 'Server Configuration Error: Invalid Stripe API Key structure (whsec_ detected)' }, { status: 500 });
    } else if (!secretKey.startsWith('sk_')) {
        console.error('[Stripe Webhook] CRITICAL ERROR: STRIPE_SECRET_KEY does not start with "sk_". Prefix:', secretKey.substring(0, 5));
        return NextResponse.json({ error: 'Server Configuration Error: Invalid Stripe API Key structure' }, { status: 500 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
        console.error('[Stripe Webhook] CRITICAL ERROR: STRIPE_WEBHOOK_SECRET does not start with "whsec_". Current value prefix:', webhookSecret.substring(0, 5));
    }

    const stripe = new Stripe(secretKey || 'sk_test_dummy', {
        apiVersion: '2026-02-25.clover',
    });

    const PRICE_TO_TIER: Record<string, 'basic' | 'premium'> = {
        [process.env.STRIPE_PRICE_ID_BASIC ?? '']: 'basic',
        [process.env.STRIPE_PRICE_ID_PREMIUM ?? '']: 'premium',
    };
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
        const { data: existingEvent, error: checkErr } = await supabaseAdmin
            .from('stripe_webhook_events')
            .select('id')
            .eq('id', event.id)
            .maybeSingle();

        if (checkErr) {
            console.error('[webhooks/stripe] Idempotency check error:', checkErr);
            throw checkErr;
        }

        if (existingEvent) {
            console.log(`[webhooks/stripe] Event ${event.id} already processed. Skipping.`);
            return NextResponse.json({ received: true }); // すでに処理済みの場合は成功として返す
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id || session.metadata?.user_id;

                if (!userId) {
                    console.error('[webhooks/stripe] user_id が取得できません。', session.id);
                    break;
                }
                if (session.customer) {
                    try {
                        await stripe.customers.update(session.customer as string, {
                            metadata: { user_id: userId }
                        });
                        console.log(`[webhooks/stripe] Updated Stripe customer ${session.customer} with metadata.user_id = ${userId}`);
                    } catch (custErr) {
                        console.error('[webhooks/stripe] Failed to update Stripe customer metadata:', custErr);
                        // 決済成功自体の処理をブロックしないよう、エラーをスローしない
                    }
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

                    // StripeからSubscriptionを取得してトライアル等のステータスを確認
                    let subStatus = 'active';
                    if (session.subscription) {
                        try {
                            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                            subStatus = subscription.status; // 'trialing', 'active' など
                        } catch (subErr) {
                            console.error('[webhooks/stripe] Failed to retrieve subscription:', subErr);
                        }
                    }

                    const updateData: any = { 
                        subscription_tier: newTier,
                        subscription_status: subStatus
                    };

                    let shouldAwardBonus = false;
                    // If active, clear last_weekly_bonus_at to null so we can award it immediately
                    if (subStatus === 'active') {
                        updateData.last_weekly_bonus_at = null;
                        shouldAwardBonus = true;
                    }
                    // Mark trial as consumed if active or trialing
                    if (subStatus === 'active' || subStatus === 'trialing') {
                        updateData.has_used_trial = true;
                    }

                    const { error } = await supabaseAdmin
                        .from('user_profiles')
                        .update(updateData)
                        .eq('id', userId);

                    if (error) throw error;
                    console.log(`[webhooks/stripe] subscription_tier → ${newTier}, status → ${subStatus} for user ${userId}`);

                    if (shouldAwardBonus) {
                        const amount = newTier === 'premium' ? 5000 : 2000;
                        const { data: isSuccess, error: rpcErr } = await supabaseAdmin
                            .rpc('process_weekly_gold_bonus', { p_user_id: userId, p_amount: amount });
                        
                        if (rpcErr) {
                            console.error('[webhooks/stripe] Failed to award initial weekly gold bonus:', rpcErr);
                        } else {
                            console.log(`[webhooks/stripe] Awarded initial weekly bonus of ${amount}G to user ${userId} (success: ${isSuccess})`);
                        }
                    }

                    // Record payment log (Spec Dashboard Extensions)
                    const { error: payLogErr } = await supabaseAdmin
                        .from('payment_logs')
                        .insert({
                            id: session.id,
                            user_id: userId,
                            amount: session.amount_total ?? 0,
                            gold_amount: 0,
                            type: 'subscription'
                        });
                    if (payLogErr) {
                        console.error('[webhooks/stripe] Failed to write payment_logs for subscription:', payLogErr);
                    }

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

                        // Record payment log (Spec Dashboard Extensions)
                        const { error: payLogErr } = await supabaseAdmin
                            .from('payment_logs')
                            .insert({
                                id: session.id,
                                user_id: userId,
                                amount: session.amount_total ?? 0,
                                gold_amount: goldAmount,
                                type: 'gold_purchase'
                            });
                        if (payLogErr) {
                            console.error('[webhooks/stripe] Failed to write payment_logs for gold_purchase:', payLogErr);
                        }
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                // ─── サブスク更新（プラン変更やトライアル終了など） ───
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.user_id;

                if (!userId) {
                    console.error('[webhooks/stripe] updatedイベントで user_id が特定できません。subscriptionId:', subscription.id);
                    break;
                }

                const priceId = subscription.items.data[0]?.price?.id ?? '';
                const newTier = PRICE_TO_TIER[priceId] || 'free';
                const subStatus = subscription.status; // 'trialing', 'active', 'past_due' など

                // Fetch current profile to get previous status
                const { data: profile, error: profileErr } = await supabaseAdmin
                    .from('user_profiles')
                    .select('subscription_status, last_weekly_bonus_at')
                    .eq('id', userId)
                    .single();

                if (profileErr) {
                    console.error('[webhooks/stripe] Profile fetch error in subscription.updated:', profileErr);
                }

                const previousStatus = profile?.subscription_status || 'inactive';

                const updateData: any = { 
                    subscription_tier: newTier,
                    subscription_status: subStatus
                };

                let shouldAwardBonus = false;
                // If transitioning to active (from trial or inactive), or if last_weekly_bonus_at is null
                if (subStatus === 'active' && (previousStatus !== 'active' || !profile?.last_weekly_bonus_at)) {
                    updateData.last_weekly_bonus_at = null; // Clear it to ensure instant payout
                    shouldAwardBonus = true;
                }

                // Mark trial as consumed if active or trialing
                if (subStatus === 'active' || subStatus === 'trialing') {
                    updateData.has_used_trial = true;
                }

                const { error } = await supabaseAdmin
                    .from('user_profiles')
                    .update(updateData)
                    .eq('id', userId);

                if (error) throw error;
                console.log(`[webhooks/stripe] subscription.updated: tier → ${newTier}, status → ${subStatus} for user ${userId}`);

                if (shouldAwardBonus) {
                    const amount = newTier === 'premium' ? 5000 : 2000;
                    const { data: isSuccess, error: rpcErr } = await supabaseAdmin
                        .rpc('process_weekly_gold_bonus', { p_user_id: userId, p_amount: amount });
                    
                    if (rpcErr) {
                        console.error('[webhooks/stripe] Failed to award initial weekly gold bonus on update:', rpcErr);
                    } else {
                        console.log(`[webhooks/stripe] Awarded initial weekly bonus of ${amount}G to user ${userId} on update (success: ${isSuccess})`);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                // ─── サブスク解約・ダウングレード ───
                const subscription = event.data.object as Stripe.Subscription;

                // Bug-1修正: Subscriptionのメタデータから直接 user_id を取得する
                // (チェックアウト時に subscription_data.metadata に user_id を設定済み)
                const userId = subscription.metadata?.user_id;

                if (!userId) {
                    console.error('[webhooks/stripe] 解約イベントで user_id が特定できません。subscriptionId:', subscription.id);
                    break;
                }

                const { error } = await supabaseAdmin
                    .from('user_profiles')
                    .update({ 
                        subscription_tier: 'free',
                        subscription_status: 'inactive'
                    })
                    .eq('id', userId);

                if (error) throw error;
                console.log(`[webhooks/stripe] subscription_tier → free (解約) for user ${userId}`);
                break;
            }

            default:
                // 未対応イベントは無視
                break;
        }

        // ─── 処理成功後にイベントIDを登録 ───
        const { error: registerErr } = await supabaseAdmin
            .from('stripe_webhook_events')
            .insert({ id: event.id, type: event.type });

        if (registerErr) {
            console.error('[webhooks/stripe] Failed to register webhook event ID:', registerErr);
            throw registerErr;
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error('[webhooks/stripe] Processing error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
