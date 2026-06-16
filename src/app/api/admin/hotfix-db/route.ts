import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const adminKey = req.headers.get('x-admin-key');
        if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
        }

        let projectRef = '';
        try {
            const hostname = new URL(supabaseUrl).hostname;
            const parts = hostname.split('.');
            if (parts[0] === 'auth') {
                projectRef = parts[1];
            } else {
                projectRef = parts[0];
            }
        } catch {
            return NextResponse.json({ error: `Cannot parse SUPABASE_URL: ${supabaseUrl}` }, { status: 500 });
        }

        // 1. ALTER TABLE COLUMN TYPE
        const dbUrl = process.env.DATABASE_URL
            || process.env.SUPABASE_DB_URL
            || `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || serviceKey}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

        const pool = new Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 15000,
        });

        const client = await pool.connect();
        try {
            console.log('[hotfix-db] Altering payment_logs.id type to text...');
            await client.query('ALTER TABLE public.payment_logs ALTER COLUMN id TYPE text;');
        } finally {
            client.release();
            await pool.end();
        }

        // 2. INSERT MISSING PAYMENT LOGS AND AWARD GOLD
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const missingPayments = [
            {
                id: 'pi_3Tj0SIGoJCaTojlf0ZrejFAw', // ken_kae0806@i.softbank.jp
                userId: 'c7906aec-ba14-4e35-8102-b21c6bea529a',
                amount: 330,
                goldAmount: 10000,
                email: 'ken_kae0806@i.softbank.jp'
            },
            {
                id: 'pi_3TixDZGoJCaTojlf1Sst9BNf', // eno.poke.ai@gmail.com
                userId: '2d6d2a29-385c-4eab-a5f2-57218264f963',
                amount: 950,
                goldAmount: 30000,
                email: 'eno.poke.ai@gmail.com'
            },
            {
                id: 'pi_3Tix4HGoJCaTojlf0sGGnmaZ', // eno.poke.ai@gmail.com
                userId: '2d6d2a29-385c-4eab-a5f2-57218264f963',
                amount: 1430,
                goldAmount: 50000,
                email: 'eno.poke.ai@gmail.com'
            },
            {
                id: 'pi_3TiwYjGoJCaTojlf1QgtzYhx', // zhe42378@gmail.com
                userId: 'b0bf1b44-df04-4bae-b445-e2b53bb949a6',
                amount: 1430,
                goldAmount: 50000,
                email: 'zhe42378@gmail.com'
            },
            {
                id: 'pi_3Tit1aGoJCaTojlf14SSuryJ', // eno.poke.ai@gmail.com
                userId: '2d6d2a29-385c-4eab-a5f2-57218264f963',
                amount: 950,
                goldAmount: 30000,
                email: 'eno.poke.ai@gmail.com'
            },
            {
                id: 'pi_3TiskUGoJCaTojlf1Bt80Vn1', // eno.poke.ai@gmail.com
                userId: '2d6d2a29-385c-4eab-a5f2-57218264f963',
                amount: 330,
                goldAmount: 10000,
                email: 'eno.poke.ai@gmail.com'
            }
        ];

        const logResults = [];

        for (const payment of missingPayments) {
            const { data: existingLog } = await supabaseAdmin
                .from('payment_logs')
                .select('id')
                .eq('id', payment.id)
                .maybeSingle();

            if (!existingLog) {
                // Insert payment log
                const { error: insertErr } = await supabaseAdmin
                    .from('payment_logs')
                    .insert({
                        id: payment.id,
                        user_id: payment.userId,
                        amount: payment.amount,
                        gold_amount: payment.goldAmount,
                        type: 'gold_purchase'
                    });

                if (insertErr) {
                    logResults.push({ id: payment.id, email: payment.email, status: 'failed_insert', error: insertErr.message });
                    continue;
                }

                // Award gold
                const { error: rpcErr } = await supabaseAdmin
                    .rpc('increment_gold', { p_user_id: payment.userId, p_amount: payment.goldAmount });

                if (rpcErr) {
                    logResults.push({ id: payment.id, email: payment.email, status: 'failed_gold_award', error: rpcErr.message });
                } else {
                    logResults.push({ id: payment.id, email: payment.email, status: 'success' });
                }
            } else {
                logResults.push({ id: payment.id, email: payment.email, status: 'already_processed' });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database altered and missing payments processed.',
            results: logResults
        });

    } catch (err: any) {
        console.error('[hotfix-db] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
