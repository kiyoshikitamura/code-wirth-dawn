import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { processAging } from '@/services/questService';

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

        // 経過日数: Tier1=0日, Tier2=1日, Tier3=3日
        const PRAY_DAYS: Record<number, number> = { 1: 0, 2: 1, 3: 3 };
        const daysPassed = PRAY_DAYS[amount_tier] || 0;

        // 2. Validate User Gold
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('gold, prayer_count, blessing_data, age, accumulated_days, max_vitality, vitality, atk, def')
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
        // 既にBlessingが有効な場合は重複付与を防止
        if (userData.blessing_data) {
            return NextResponse.json({
                error: '既に祈りの加護が有効です。次の戦闘で消費された後に再度祈りを捧げてください。'
            }, { status: 400 });
        }

        const blessingData = {
            hp_pct: ECONOMY_RULES.PRAYER_BUFF_HP_PCT,
            ap_bonus: ECONOMY_RULES.PRAYER_BUFF_AP,
            expires_after_battle: true
        };

        // 5. Deduct Gold & Update Blessing & Apply Aging
        const updatePayload: Record<string, any> = {
            gold: userData.gold - cost,
            prayer_count: (userData.prayer_count || 0) + 1,
            blessing_data: blessingData
        };

        // 経過日数がある場合のみ加齢処理
        let newAge = userData.age || 20;
        let agingDecay: any = undefined;
        if (daysPassed > 0) {
            const aging = processAging(
                userData.age || 20,
                userData.accumulated_days || 0,
                daysPassed
            );
            newAge = aging.newAge;
            updatePayload.accumulated_days = aging.newAgeDays;
            updatePayload.age = aging.newAge;

            if (aging.decay.vit > 0 || aging.decay.atk > 0 || aging.decay.def > 0) {
                if (aging.decay.vit > 0) {
                    updatePayload.max_vitality = Math.max(0, (userData.max_vitality || 100) - aging.decay.vit);
                    updatePayload.vitality = Math.min(userData.vitality ?? 100, updatePayload.max_vitality);
                }
                if (aging.decay.atk > 0) updatePayload.atk = Math.max(1, (userData.atk || 1) - aging.decay.atk);
                if (aging.decay.def > 0) updatePayload.def = Math.max(1, (userData.def || 1) - aging.decay.def);
                agingDecay = aging.decay;
                console.log(`[Pray] Aging decay: age=${newAge}, VIT-${aging.decay.vit}, ATK-${aging.decay.atk}, DEF-${aging.decay.def}`);
            }
        }

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updatePayload)
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
            days_passed: daysPassed,
            new_age: newAge,
            aging_decay: agingDecay,
            visual_cue: visuals[attribute] || 'effect_default',
            message: messages[attribute] || '祈りが届きました。'
        });

    } catch (err: any) {
        console.error('Prayer Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
