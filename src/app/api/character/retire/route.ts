process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';
import { LifeCycleService } from '@/services/lifeCycleService';
import { buildShareData } from '@/lib/shareUtils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cause, heirloom_item_ids } = body;

        const client = createAuthClient(req);
        const { data: { user: jwtUser } } = await client.auth.getUser();

        if (!jwtUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = jwtUser.id;

        // Authentication & Profile Fetch (Active Profile)
        const { data: profile, error: fetchError } = await client
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (!profile.is_alive) {
            return NextResponse.json({ error: 'Character is already dead/retired' }, { status: 400 });
        }

        // 形見スロット数の算出（仕様: Free: 10, Basic: 30, Premium: 50）
        const tier = profile.subscription_tier ?? 'free';
        const allowedSlots = tier === 'premium' ? 50 : (tier === 'basic' ? 30 : 10);

        // 形見アイテムIDの配列を確定
        const finalHeirlooms: string[] = heirloom_item_ids || [];

        // 枚数バリデーション — スロット数を超えるアイテム指定は拒否
        if (finalHeirlooms.length > allowedSlots) {
            return NextResponse.json({
                error: `形見スロット不足: 指定されたスロット数（${allowedSlots}枠）に対してアイテムが多すぎます（${finalHeirlooms.length}個）。`,
                allowed_slots: allowedSlots
            }, { status: 400 });
        }

        // Delegate to LifeCycleService
        const lifeSync = new LifeCycleService(client);
        const deathCause = cause === 'voluntary' ? 'Voluntary Retirement' : (cause || 'Unknown');

        // 形見情報をoptionsとして渡し、historical_logsのスナップショットに含める
        const result = await lifeSync.handleCharacterDeath(profile.id, deathCause, {
            heirloomItemIds: finalHeirlooms,
            allowedSlots,
            paidGold: 0,
        });

        if (!result.success) {
            throw new Error(result.error || 'Retirement failed');
        }

        // #12 英霊化シェア (繰返、CSV駆動)
        const ageAtDeath = (profile.age || 18) + Math.floor((profile.accumulated_days || 0) / 365);
        const shareData = buildShareData('heroic_death', {
            name: profile.name || profile.title_name || '名もなき旅人',
            age: ageAtDeath,
        });
        const shareText = shareData?.text || '';

        return NextResponse.json({
            success: true,
            message: 'Character retired successfully.',
            heirloom_item_ids: finalHeirlooms,
            allowed_slots: allowedSlots,
            paid_gold: 0,
            share_text: shareText,
            share_data_list: shareData ? [shareData] : [],
        });

    } catch (e: any) {
        console.error("Retire Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
