process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { UGC_ASSET_LIMITS, UGC_RATE_LIMITS, UGC_GOLD_COSTS, UGC_STORAGE_LIMITS, type SubscriptionTier } from '@/lib/ugc/ugcConfig';
import { checkRateLimit } from '@/lib/ugc/ugcRateLimit';

/**
 * GET /api/ugc/v2/usage
 *
 * ユーザーの UGC 使用状況（枠・レートリミット・ゴールド）を返す。
 * 仕様: spec_v12_ugc_system_v2.md §6
 */
export async function GET(request: Request) {
    try {
        const client = createAuthClient(request);
        const { data: { user }, error: authErr } = await client.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        // Get user profile
        const { data: profile } = await client
            .from('user_profiles')
            .select('subscription_tier, gold, ugc_extra_drafts, ugc_extra_published, ugc_extra_daily_import')
            .eq('id', userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
        const limits = UGC_ASSET_LIMITS[tier];
        const rateLimits = UGC_RATE_LIMITS[tier];
        const extraDrafts = profile.ugc_extra_drafts || 0;
        const extraPublished = profile.ugc_extra_published || 0;
        const extraDailyImport = profile.ugc_extra_daily_import || 0;

        // Promise.all を用いた非同期クエリの並列実行による高速化
        const [draftRes, publishedRes, importRL, publishRL, saveRL] = await Promise.all([
            client
                .from('ugc_scenarios')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', userId)
                .in('status', ['draft', 'pending_review', 'rejected']),
            client
                .from('ugc_scenarios')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', userId)
                .eq('status', 'published'),
            checkRateLimit(client, userId, 'import', tier, true),
            checkRateLimit(client, userId, 'publish', tier, true),
            checkRateLimit(client, userId, 'save', tier, true),
        ]);

        const draftCount = draftRes.count;
        const publishedCount = publishedRes.count;

        // Max extra slots = tier base limit × 2
        const maxExtraDrafts = limits.drafts * 2;
        const maxExtraPublished = limits.published * 2;

        // Calculate storage usage
        let usedStorage = 0;
        try {
            const [imgFiles, audioFiles] = await Promise.all([
                supabaseServer.storage.from('ugc-images').list('', { search: userId, limit: 200 }),
                supabaseServer.storage.from('ugc-audio').list('', { search: userId, limit: 200 })
            ]);

            if (imgFiles.data) {
                for (const f of imgFiles.data) {
                    if (f.name.startsWith(`${userId}_`)) {
                        usedStorage += f.metadata?.size || 0;
                    }
                }
            }
            if (audioFiles.data) {
                for (const f of audioFiles.data) {
                    if (f.name.startsWith(`${userId}_`)) {
                        usedStorage += f.metadata?.size || 0;
                    }
                }
            }
        } catch (e) {
            console.error('[UGC Usage API] Failed to calculate storage size:', e);
        }

        const limitStorage = UGC_STORAGE_LIMITS[tier] || UGC_STORAGE_LIMITS.free;

        return NextResponse.json({
            tier,
            gold: profile.gold || 0,
            storage: {
                used: usedStorage,
                limit: limitStorage
            },
            drafts: {
                used: draftCount || 0,
                base_limit: limits.drafts,
                extra: extraDrafts,
                limit: limits.drafts + extraDrafts,
                max_extra: maxExtraDrafts,
            },
            published: {
                used: publishedCount || 0,
                base_limit: limits.published,
                extra: extraPublished,
                limit: limits.published + extraPublished,
                max_extra: maxExtraPublished,
            },
            daily_import: {
                used: importRL.current,
                base_limit: rateLimits.import,
                extra: extraDailyImport,
                limit: rateLimits.import + extraDailyImport,
                resets_at: importRL.resets_at,
            },
            daily_publish: {
                used: publishRL.current,
                limit: rateLimits.publish,
                resets_at: publishRL.resets_at,
            },
            daily_save: {
                used: saveRL.current,
                limit: rateLimits.save,
                resets_at: saveRL.resets_at,
            },
            gold_costs: UGC_GOLD_COSTS,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        console.error('[UGC Usage API]', e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
