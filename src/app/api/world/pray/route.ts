import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { ECONOMY_RULES } from '@/constants/game_rules';

export async function POST(req: Request) {
    try {

        const body = await req.json();
        const { user_id, location_id, attribute, amount_tier } = body;

        if (!user_id || !location_id || !attribute || !amount_tier) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Calculate Cost & Impact
        // Tier 1=100, Tier 2=1000, Tier 3=10000
        let cost = 0;
        let impact = 0.0;

        switch (amount_tier) {
            case 1: cost = 100; impact = 0.1; break;
            case 2: cost = 1000; impact = 1.0; break;
            case 3: cost = 10000; impact = 10.0; break;
            default: return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        // 2. Validate User Gold
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('gold, prayer_count, blessing_data')
            .eq('id', user_id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (userData.gold < cost) {
            return NextResponse.json({ error: 'Insufficient gold' }, { status: 400 });
        }

        // 3. 首都判定 (spec_v16 §4): 首都での祈りは影響力 CAPITAL_PRAYER_MULTIPLIER 倍
        const { data: locData } = await supabase.from('locations').select('name, slug, type').eq('id', location_id).single();
        if (!locData) throw new Error('Location not found');

        // タスク2: 拠点の種類（首都）による効果値ボーナス計算
        const isCapital = locData.type?.toLowerCase() === 'capital';
        if (isCapital) {
            impact *= ECONOMY_RULES.CAPITAL_PRAYER_MULTIPLIER;
            console.log(`[Pray] Capital bonus applied at ${locData.slug}: impact x${ECONOMY_RULES.CAPITAL_PRAYER_MULTIPLIER}`);
        }

        // 4. Blessing バフ付与 (spec_v16 §4: 個人バフ)
        const blessingData = {
            hp_pct: ECONOMY_RULES.PRAYER_BUFF_HP_PCT,
            ap_bonus: ECONOMY_RULES.PRAYER_BUFF_AP,
            expires_after_battle: true
        };

        // 5. Deduct Gold & Update Blessing
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                gold: userData.gold - cost,
                prayer_count: (userData.prayer_count || 0) + 1,
                blessing_data: blessingData
            })
            .eq('id', user_id);

        if (updateError) throw updateError;

        // 6. Create Log
        await supabase.from('prayer_logs').insert({
            user_id,
            location_id,
            target_attribute: attribute,
            gold_spent: cost,
            impact_value: impact
        });

        // 7. Update World State Pool
        const attrCol = `${attribute.toLowerCase()}_score`;
        const dailyPoolCol = `daily_${attribute.toLowerCase()}_pool`;

        const { data: wsData } = await supabase.from('world_states').select(dailyPoolCol).eq('location_name', locData.name).single();
        const currentPool = wsData ? (wsData as any)[dailyPoolCol] || 0 : 0;

        await supabase.from('world_states')
            .update({ [dailyPoolCol]: currentPool + impact })
            .eq('location_name', locData.name);

        // 8. Return Response
        const visuals: Record<string, string> = {
            'Order': 'effect_pillar_gold',
            'Chaos': 'effect_fog_purple',
            'Justice': 'effect_cherry_blossom',
            'Evil': 'effect_lightning_red'
        };

        const messages: Record<string, string> = {
            'Order': '秩序の光が降り注ぎました。',
            'Chaos': '混沌の霧が立ち込めました。',
            'Justice': '正義の風が吹きました。',
            'Evil': '悪意の稲妻が落ちました。'
        };

        return NextResponse.json({
            success: true,
            new_gold: userData.gold - cost,
            impact_value: impact,
            is_capital_bonus: isCapital,
            blessing_granted: true,
            blessing_data: blessingData,
            visual_cue: visuals[attribute] || 'effect_default',
            message: messages[attribute] || '祈りが届きました。'
        });

    } catch (err: any) {
        console.error('Prayer Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
