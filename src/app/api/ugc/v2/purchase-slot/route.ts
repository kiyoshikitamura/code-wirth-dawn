import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ASSET_LIMITS, UGC_GOLD_COSTS, type SubscriptionTier } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/purchase-slot
 *
 * ゴールドで UGC 枠を追加購入する。
 * Body: { slot_type: 'draft' | 'published' | 'daily_import' }
 * 仕様: spec_v12_ugc_system_v2.md §6.2
 */
export async function POST(request: Request) {
    try {
        const client = createAuthClient(request);
        const { data: { user }, error: authErr } = await client.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;
        const body = await request.json();
        const { slot_type } = body;

        if (!['draft', 'published', 'daily_import'].includes(slot_type)) {
            return NextResponse.json({ error: 'Invalid slot_type' }, { status: 400 });
        }

        // Get profile
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

        // Determine cost and current extra
        let goldCost: number;
        let currentExtra: number;
        let maxExtra: number;
        let columnName: string;
        let addAmount: number;
        let label: string;

        switch (slot_type) {
            case 'draft':
                goldCost = UGC_GOLD_COSTS.extra_draft_slot;
                currentExtra = profile.ugc_extra_drafts || 0;
                maxExtra = limits.drafts * 2;
                columnName = 'ugc_extra_drafts';
                addAmount = 1;
                label = '下書き枠';
                break;
            case 'published':
                goldCost = UGC_GOLD_COSTS.extra_published_slot;
                currentExtra = profile.ugc_extra_published || 0;
                maxExtra = limits.published * 2;
                columnName = 'ugc_extra_published';
                addAmount = 1;
                label = '公開枠';
                break;
            case 'daily_import':
                goldCost = UGC_GOLD_COSTS.extra_daily_import;
                currentExtra = profile.ugc_extra_daily_import || 0;
                maxExtra = 999; // No hard cap for daily extras (resets daily)
                columnName = 'ugc_extra_daily_import';
                addAmount = 5; // +5 per purchase
                label = 'インポート回数 +5';
                break;
            default:
                return NextResponse.json({ error: 'Invalid slot_type' }, { status: 400 });
        }

        // Check extra limit
        if (currentExtra >= maxExtra) {
            return NextResponse.json({
                error: `${label}の追加上限（${maxExtra}枠）に達しています。`,
                current_extra: currentExtra,
                max_extra: maxExtra,
            }, { status: 403 });
        }

        // Check gold balance
        if ((profile.gold || 0) < goldCost) {
            return NextResponse.json({
                error: `ゴールドが不足しています。必要: ${goldCost.toLocaleString()} G（所持金: ${(profile.gold || 0).toLocaleString()} G）`,
                required: goldCost,
                current_gold: profile.gold || 0,
            }, { status: 400 });
        }

        // Deduct gold
        const { error: goldErr } = await client
            .rpc('increment_gold', { p_user_id: userId, p_amount: -goldCost });
        if (goldErr) throw goldErr;

        // Increment extra slot
        const { error: updateErr } = await client
            .from('user_profiles')
            .update({ [columnName]: currentExtra + addAmount })
            .eq('id', userId);

        if (updateErr) {
            // Rollback gold on failure
            await client.rpc('increment_gold', { p_user_id: userId, p_amount: goldCost });
            throw updateErr;
        }

        return NextResponse.json({
            success: true,
            slot_type,
            new_extra: currentExtra + addAmount,
            gold_spent: goldCost,
            new_gold: (profile.gold || 0) - goldCost,
            label,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        console.error('[UGC Purchase Slot API]', e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
