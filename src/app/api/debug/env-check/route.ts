import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        STRIPE_PRICE_ID_GOLD_10K: process.env.STRIPE_PRICE_ID_GOLD_10K ? 'defined' : 'undefined',
        STRIPE_PRICE_ID_GOLD_30K: process.env.STRIPE_PRICE_ID_GOLD_30K ? 'defined' : 'undefined',
        STRIPE_PRICE_ID_GOLD_50K: process.env.STRIPE_PRICE_ID_GOLD_50K ? 'defined' : 'undefined',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'defined' : 'undefined',
        VERCEL_ENV: process.env.VERCEL_ENV || 'undefined',
        NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV || 'undefined'
    });
}
