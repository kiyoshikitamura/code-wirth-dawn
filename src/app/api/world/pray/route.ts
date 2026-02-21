import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';

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
            .select('gold, prayer_count')
            .eq('id', user_id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (userData.gold < cost) {
            return NextResponse.json({ error: 'Insufficient gold' }, { status: 400 });
        }

        // 3. Transaction (RPC would be better, but doing sequential ops for now with checks)
        // Ideally use RPC for atomicity. For now, we update.

        // Deduct Gold
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                gold: userData.gold - cost,
                prayer_count: (userData.prayer_count || 0) + 1 // Optional stats
            })
            .eq('id', user_id);

        if (updateError) throw updateError;

        // Create Log
        await supabase.from('prayer_logs').insert({
            user_id,
            location_id,
            target_attribute: attribute,
            gold_spent: cost,
            impact_value: impact
        });

        // Update Location Attribute
        // Need to fetch current attributes? 
        // We can use RPC increment if available, or fetch-update.
        // Assuming location has columns `order_score` etc?
        // Wait, setup_v2 schema says `locations` table only has basic info.
        // `world_states` table has `order_score` etc referenced by `location_name`.
        // The Prompt said: "locations テーブルの指定属性値を加算 (order_value += impact)".
        // BUT schema (setup_v2) shows `world_states` holds the scores! `locations` does NOT hold scores.
        // I must update `world_states` linked to this location.
        // I need to find the `location_name` from `location_id` first?
        // Or does `world_states` have `location_id`? Schema says `location_name TEXT REFERENCES locations(name)`.
        // So: Fetch Location Name -> Update World State.

        const { data: locData } = await supabase.from('locations').select('name').eq('id', location_id).single();
        if (!locData) throw new Error('Location not found');

        // Column mapping
        const attrCol = `${attribute.toLowerCase()}_score`; // order_score, chaos_score...
        // Note: score is Integer in schema, impact is Float.
        // Maybe I should assume impact adds to Float pool? Or rounds?
        // The prompt says "world_states: Daily pools (daily_order_pool)".
        // And "locations (order_value += impact)". 
        // If schema `world_states` has integer scores, adding 0.1 float won't work well unless I update the *Daily Pool* primarily?
        // Prompt says: 
        // "locations テーブルの指定属性値を加算 (order_value += impact)" -> Conflicting with schema.
        // "world_states テーブルのグローバルプールを加算"
        // I will update `world_states` pools (`daily_order_pool` etc) AND try to increment the integer score if impact >= 1?
        // Or store it nicely.
        // Given spec: "impact calculation: 100g = 0.1 pt".
        // Updating integer score by 0.1 is impossible.
        // I will update `daily_order_pool` (Float) in `world_states`.
        // And maybe trigger a periodic job (cron) to flush pools to scores?
        // For now, I will update `daily_{attr}_pool`.

        const dailyPoolCol = `daily_${attribute.toLowerCase()}_pool`;

        /* 
           Using RPC to increment atomic float? 
           For this MVP, simple fetch-update or just increment via raw SQL if possible?
           Supabase JS doesn't support convenient `increment` for dynamic columns easily without RPC.
           I'll do fetch-update for the pool log.
        */

        const { data: wsData } = await supabase.from('world_states').select(dailyPoolCol).eq('location_name', locData.name).single();
        const currentPool = wsData ? (wsData as any)[dailyPoolCol] || 0 : 0;

        await supabase.from('world_states')
            .update({ [dailyPoolCol]: currentPool + impact })
            .eq('location_name', locData.name);


        // 4. Return Response
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
            visual_cue: visuals[attribute] || 'effect_default',
            message: messages[attribute] || '祈りが届きました。'
        });

    } catch (err: any) {
        console.error('Prayer Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
