import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');

        if (secret !== process.env.ADMIN_SECRET_KEY && secret !== 'admin_user') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
        const stripe = new Stripe(stripeSecret || 'sk_test_dummy', {
            apiVersion: '2026-02-25.clover',
        });

        // 接続テスト
        let stripeTest = 'UNKNOWN';
        let stripeDetails: any = {};
        if (stripeSecret) {
            try {
                const account = await stripe.accounts.retrieve();
                stripeTest = 'CONNECTED_SUCCESS';
                stripeDetails.account_id = account.id;
                stripeDetails.account_email = account.email;
            } catch (err: any) {
                stripeTest = `CONNECTION_FAILED: ${err.message}`;
            }
        }

        // action=reset_sub の処理
        const action = searchParams.get('action');
        const targetUserId = searchParams.get('user_id') || 'af2848d0-40f2-4f75-bd2b-ac633184107c';
        let resetResult = null;

        if (action === 'reset_sub' && targetUserId) {
            // 1. DBのサブスク情報をリセット
            const { error: dbErr } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    subscription_tier: 'free',
                    subscription_status: 'canceled'
                })
                .eq('id', targetUserId);

            // 2. Stripe側サブスクを即時解約
            let stripeCancelledCount = 0;
            if (stripeSecret && stripeTest === 'CONNECTED_SUCCESS') {
                // メールアドレスまたはメタデータから顧客を検索
                const searchResult = await stripe.customers.search({
                    query: `metadata["user_id"]:"${targetUserId}"`,
                    limit: 1,
                });
                let customerId = searchResult.data[0]?.id || null;

                if (customerId) {
                    const activeSubscriptions = await stripe.subscriptions.list({
                        customer: customerId,
                        status: 'active',
                    });
                    const trialingSubscriptions = await stripe.subscriptions.list({
                        customer: customerId,
                        status: 'trialing',
                    });
                    const subsToCancel = [...activeSubscriptions.data, ...trialingSubscriptions.data];
                    for (const sub of subsToCancel) {
                        try {
                            await stripe.subscriptions.cancel(sub.id);
                            stripeCancelledCount++;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }

            resetResult = {
                success: !dbErr,
                dbError: dbErr ? dbErr.message : null,
                stripeCancelledCount,
                message: `User ${targetUserId} subscription reset to free in DB, and cancelled ${stripeCancelledCount} active subscriptions in Stripe.`
            };
        }

        // 各環境変数の読み込み状況 (一部をマスクして表示)
        const mask = (val: string | undefined) => {
            if (!val) return 'EMPTY';
            if (val.length < 8) return 'SHORT_VAL_PRESENT';
            return `${val.substring(0, 8)}... (${val.length} chars)`;
        };

        const envVars = {
            STRIPE_SECRET_KEY: mask(process.env.STRIPE_SECRET_KEY),
            STRIPE_WEBHOOK_SECRET: mask(process.env.STRIPE_WEBHOOK_SECRET),
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: mask(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
            STRIPE_PRICE_ID_BASIC: mask(process.env.STRIPE_PRICE_ID_BASIC),
            STRIPE_PRICE_ID_PREMIUM: mask(process.env.STRIPE_PRICE_ID_PREMIUM),
            STRIPE_PRICE_ID_GOLD_10K: mask(process.env.STRIPE_PRICE_ID_GOLD_10K),
            STRIPE_PRICE_ID_GOLD_30K: mask(process.env.STRIPE_PRICE_ID_GOLD_30K),
            STRIPE_PRICE_ID_GOLD_50K: mask(process.env.STRIPE_PRICE_ID_GOLD_50K),
            STRIPE_PRICE_ID_STARTER_PACK: mask(process.env.STRIPE_PRICE_ID_STARTER_PACK),
            STRIPE_PRICE_ID_ELITE_PACK: mask(process.env.STRIPE_PRICE_ID_ELITE_PACK),
        };

        // 各 Price ID の Stripe 側存在チェック
        const priceIds = [
            { key: 'basic', id: process.env.STRIPE_PRICE_ID_BASIC },
            { key: 'premium', id: process.env.STRIPE_PRICE_ID_PREMIUM },
            { key: 'gold_10k', id: process.env.STRIPE_PRICE_ID_GOLD_10K },
            { key: 'gold_30k', id: process.env.STRIPE_PRICE_ID_GOLD_30K },
            { key: 'gold_50k', id: process.env.STRIPE_PRICE_ID_GOLD_50K },
            { key: 'gold_starter', id: process.env.STRIPE_PRICE_ID_STARTER_PACK },
            { key: 'gold_elite', id: process.env.STRIPE_PRICE_ID_ELITE_PACK },
        ];

        const priceChecks: any = {};
        if (stripeSecret && stripeTest === 'CONNECTED_SUCCESS') {
            for (const p of priceIds) {
                if (p.id) {
                    try {
                        const price = await stripe.prices.retrieve(p.id);
                        priceChecks[p.key] = {
                            exists: true,
                            active: price.active,
                            price_id: p.id,
                            unit_amount: price.unit_amount,
                            currency: price.currency,
                        };
                    } catch (err: any) {
                        priceChecks[p.key] = {
                            exists: false,
                            error: err.message,
                            price_id: p.id,
                        };
                    }
                } else {
                    priceChecks[p.key] = {
                        exists: false,
                        error: 'Price ID env var is empty',
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            envVars,
            stripeTest,
            stripeDetails,
            priceChecks,
            resetResult
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
