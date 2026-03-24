import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── デッキコスト自動算定（仕様: spec_v12_ugc_system.md §3.2） ───
// power_score = effect_value / max(ap_cost, 1)
// cost_val    = clamp(round(power_score * 2), 1, 20)
function calcCostVal(effectValue: number, apCost: number): number {
    const powerScore = effectValue / Math.max(apCost, 1);
    return Math.min(20, Math.max(1, Math.round(powerScore * 2)));
}

/**
 * POST /api/ugc/asset/item
 * UGC カスタムスキルカード / アイテムの保存。
 * デッキコスト（cost_val）をサーバー側で自動算定する。
 * is_ugc: true, base_price: 1 を強制付与。
 *
 * Body:
 * {
 *   userId: string,
 *   name: string,
 *   description?: string,
 *   effect_value: number,     // ダメージ量・回復量など効果の強さ
 *   ap_cost: number,          // バトル中の消費AP（プレイヤー希望値）
 *   effect_type?: string,     // 'damage' | 'heal' | 'buff' | ...
 *   image_url?: string,
 *   flavor_text?: string,
 * }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // S1修正: JWT認証必須化
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: 有効な認証トークンが必要です' }, { status: 401 });
        }

        if (body.userId && body.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized: ユーザーIDが一致しません' }, { status: 401 });
        }

        const {
            name,
            description,
            effect_value,
            ap_cost,
            effect_type = 'damage',
            image_url,
            flavor_text,
        } = body;

        if (!userId || !name || effect_value === undefined || ap_cost === undefined) {
            return NextResponse.json(
                { error: 'userId, name, effect_value, ap_cost は必須です。' },
                { status: 400 }
            );
        }

        const effVal = Number(effect_value);
        const apCostNum = Number(ap_cost);

        if (isNaN(effVal) || effVal < 0) {
            return NextResponse.json({ error: 'effect_value は 0 以上の数値です。' }, { status: 400 });
        }
        if (isNaN(apCostNum) || apCostNum < 0) {
            return NextResponse.json({ error: 'ap_cost は 0 以上の数値です。' }, { status: 400 });
        }

        // ─── デッキコスト自動算定 ───
        const costVal = calcCostVal(effVal, apCostNum);

        // ─── cards テーブルに INSERT ───
        // cost_val, is_ugc, base_price は強制値で上書き
        const { data, error: insertError } = await supabase
            .from('cards')
            .insert({
                name,
                description: description || flavor_text || '',
                effect_type,
                effect_value: effVal,
                ap_cost: apCostNum,
                cost_val: costVal,       // 自動算定
                base_price: 1,           // レプリカ固定
                is_ugc: true,            // UGC フラグ強制
                image_url: image_url || null,
                creator_id: userId,
                type: 'skill',           // UGCカードは常にskill扱い
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[ugc/asset/item] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            cost_val: costVal,
            base_price: 1,
            is_ugc: true,
            // 算定の根拠を返して透明性を確保
            calc: {
                effect_value: effVal,
                ap_cost: apCostNum,
                power_score: +(effVal / Math.max(apCostNum, 1)).toFixed(2),
            },
        });

    } catch (err: any) {
        console.error('[ugc/asset/item] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
