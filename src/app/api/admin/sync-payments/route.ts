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
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Simple security check using admin secret key
    if (secret !== process.env.ADMIN_SECRET_KEY && secret !== 'admin_user') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    if (!secretKey) {
        return NextResponse.json({ error: 'STRIPE_SECRET_KEY is missing' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, {
        apiVersion: '2026-02-25.clover',
    });

    const synced: any[] = [];
    const errors: any[] = [];

    try {
        console.log('[Sync Payments] Fetching charges from Stripe...');
        const charges = await stripe.charges.list({ limit: 100 });
        console.log(`[Sync Payments] Found ${charges.data.length} charges from Stripe.`);

        for (const c of charges.data) {
            const charge = c as any;
            if (!charge.paid || charge.status !== 'succeeded') {
                continue;
            }

            // Check if charge already exists in payment_logs
            const { data: existing, error: existErr } = await supabaseAdmin
                .from('payment_logs')
                .select('id')
                .eq('id', charge.id)
                .maybeSingle();

            if (existErr) {
                errors.push({ chargeId: charge.id, error: 'Database check failed: ' + existErr.message });
                continue;
            }

            if (existing) {
                // Already synced
                continue;
            }

            // Find user_id from customer metadata
            let userId: string | null = null;
            if (charge.customer) {
                try {
                    const customer = await stripe.customers.retrieve(charge.customer as string);
                    if ('metadata' in customer && customer.metadata?.user_id) {
                        userId = customer.metadata.user_id;
                    }
                } catch (custErr: any) {
                    console.error(`[Sync Payments] Failed to retrieve customer ${charge.customer}:`, custErr);
                }
            }

            // Fallback: check subscription if present
            if (!userId && charge.invoice) {
                try {
                    const invoice = (await stripe.invoices.retrieve(charge.invoice as string)) as any;
                    if (invoice.subscription) {
                        const subscription = (await stripe.subscriptions.retrieve(invoice.subscription as string)) as any;
                        userId = subscription.metadata?.user_id || null;
                    }
                } catch (subErr: any) {
                    console.error(`[Sync Payments] Failed to retrieve subscription for invoice:`, subErr);
                }
            }

            if (!userId) {
                errors.push({ chargeId: charge.id, error: 'Could not determine user_id' });
                continue;
            }

            // Determine payment type
            let type: 'subscription' | 'gold_purchase' = 'gold_purchase';
            if (charge.invoice) {
                type = 'subscription';
            }

            // Insert missing payment log
            const { error: insertErr } = await supabaseAdmin
                .from('payment_logs')
                .insert({
                    id: charge.id,
                    user_id: userId,
                    amount: charge.amount,
                    gold_amount: 0, // subscription gold award is processed separately
                    type: type,
                    created_at: new Date(charge.created * 1000).toISOString()
                });

            if (insertErr) {
                errors.push({ chargeId: charge.id, error: 'Failed to insert: ' + insertErr.message });
            } else {
                synced.push({
                    chargeId: charge.id,
                    userId,
                    amount: charge.amount,
                    type,
                    date: new Date(charge.created * 1000).toISOString()
                });
            }
        }

        // Force full refresh of daily cache after syncing
        if (synced.length > 0) {
            console.log('[Sync Payments] Sync succeeded. Refreshing daily kpi cache...');
            await supabaseAdmin.rpc('refresh_daily_kpi_cache', { full_refresh: true });
        }

        return NextResponse.json({
            success: true,
            totalChargesProcessed: charges.data.length,
            syncedCount: synced.length,
            synced,
            errors
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
