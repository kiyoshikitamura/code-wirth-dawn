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
 * POST /api/billing/checkout
 * Stripe Checkout Session を発行してURLを返す。
 * 仕様: spec_v13_monetization_subscription.md §5.1
 * v27.0: JWT認証を追加。トークンからuser_idを検証。
 */
export async function POST(req: Request) {
    try {
        const secretKey = process.env.STRIPE_SECRET_KEY || '';

        // Stripe APIキーの簡易フォーマットチェック
        if (!secretKey || secretKey === 'sk_test_dummy') {
            console.warn('[Stripe Checkout] STRIPE_SECRET_KEY is empty or using dummy fallback.');
        } else if (secretKey.startsWith('whsec_')) {
            console.error('[Stripe Checkout] CRITICAL ERROR: STRIPE_SECRET_KEY starts with "whsec_". It must be a Stripe Secret API Key (sk_...), not a Webhook Secret.');
            return NextResponse.json({ error: 'Server Configuration Error: Invalid Stripe API Key structure (whsec_ detected)' }, { status: 500 });
        } else if (!secretKey.startsWith('sk_')) {
            console.error('[Stripe Checkout] CRITICAL ERROR: STRIPE_SECRET_KEY does not start with "sk_". Prefix:', secretKey.substring(0, 5));
            return NextResponse.json({ error: 'Server Configuration Error: Invalid Stripe API Key structure' }, { status: 500 });
        }

        // Stripe などの初期化をリクエスト時に動的評価（Vercel環境変数のキャッシュ・ビルド時評価バグ対策）
        const stripe = new Stripe(secretKey || 'sk_test_dummy', {
            apiVersion: '2026-02-25.clover',
        });

        const PRICE_IDS: Record<string, string> = {
            basic: process.env.STRIPE_PRICE_ID_BASIC || '',
            premium: process.env.STRIPE_PRICE_ID_PREMIUM || '',
        };

        const GOLD_PACKAGES: Record<string, { priceId: string; goldAmount: number }> = {
            gold_10k: {
                priceId: process.env.STRIPE_PRICE_ID_GOLD_10K || '',
                goldAmount: 10000,
            },
            gold_30k: {
                priceId: process.env.STRIPE_PRICE_ID_GOLD_30K || '',
                goldAmount: 30000,
            },
            gold_50k: {
                priceId: process.env.STRIPE_PRICE_ID_GOLD_50K || '',
                goldAmount: 50000,
            },
        };

        console.log('[billing/checkout] Triggered. PRICE_IDS:', PRICE_IDS);

        // v27.0: JWT認証
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
        const { mode, tier, packageKey } = await req.json();

        if (!mode) {
            return NextResponse.json({ error: 'mode は必須です。' }, { status: 400 });
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

            // Fetch has_used_trial from user_profiles
            const { data: profile, error: profileErr } = await supabaseAdmin
                .from('user_profiles')
                .select('has_used_trial')
                .eq('id', userId)
                .single();

            if (profileErr) {
                console.error('[checkout] Profile fetch error:', profileErr);
                return NextResponse.json({ error: 'ユーザープロファイルが見つかりません。' }, { status: 400 });
            }

            const hasUsedTrial = profile?.has_used_trial === true;

            const subscriptionData: any = {
                metadata: { user_id: userId },      // Bug-1修正: 解約Webhookでuser_idを取得できるようにSubscriptionにmetadataを設定
            };

            if (!hasUsedTrial) {
                subscriptionData.trial_period_days = 7; // 最初の1週間無料トライアル
            }

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
                client_reference_id: userId,           // Webhook で user_id を特定するため必須
                customer_email: user.email || undefined, // Stripe Customer のメールアドレスを統一
                metadata: { user_id: userId, tier },
                subscription_data: subscriptionData,
                success_url: `${origin}/inn?billing=success&tier=${tier}`,
                cancel_url: `${origin}/inn?billing=cancel`,
            });

            return NextResponse.json({ url: session.url });

        } else if (mode === 'payment') {
            // ─── ゴールド都度購入 ───
            const pkg = packageKey ? GOLD_PACKAGES[packageKey] : null;
            if (!pkg) {
                return NextResponse.json(
                    { error: `packageKey は 'gold_10k', 'gold_30k', または 'gold_50k' を指定してください。` },
                    { status: 400 }
                );
            }

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [{ price: pkg.priceId, quantity: 1 }],
                client_reference_id: userId,
                customer_email: user.email || undefined, // Stripe Customer のメールアドレスを統一
                metadata: { user_id: userId, gold_amount: String(pkg.goldAmount) },
                success_url: `${origin}/inn?billing=gold_success&amount=${pkg.goldAmount}`,
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
