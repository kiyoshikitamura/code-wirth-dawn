import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inventory_id, use_context } = body; // use_context: 'battle' | 'field'

        if (!inventory_id) {
            return NextResponse.json({ error: 'inventory_id は必須です。' }, { status: 400 });
        }

        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        // インベントリアイテムを取得
        const { data: invItem, error: fetchError } = await client
            .from('inventory')
            .select('id, quantity, item_id, items:item_id(id, slug, name, type, effect_data)')
            .eq('id', inventory_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (fetchError || !invItem) {
            return NextResponse.json({ error: 'アイテムが見つかりません。' }, { status: 404 });
        }

        if ((invItem.quantity || 0) <= 0) {
            return NextResponse.json({ error: 'このアイテムの所持数がありません。' }, { status: 400 });
        }

        // use_timing の整合性チェック
        const effectData = (invItem.items as any)?.effect_data || {};
        const itemTiming = effectData.use_timing || 'field';

        if (use_context === 'battle' && itemTiming !== 'battle') {
            return NextResponse.json(
                { error: 'このアイテムはバトル外でのみ使用できます。' },
                { status: 400 }
            );
        }
        if (use_context === 'field' && itemTiming === 'battle') {
            return NextResponse.json(
                { error: 'このアイテムはバトル中にのみ使用できます。' },
                { status: 400 }
            );
        }

        // 数量をデクリメント
        const newQuantity = (invItem.quantity || 1) - 1;

        if (newQuantity <= 0) {
            const { error: deleteError } = await client
                .from('inventory')
                .delete()
                .eq('id', inventory_id)
                .eq('user_id', user.id);
            if (deleteError) throw deleteError;
        } else {
            const { error: updateError } = await client
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', inventory_id)
                .eq('user_id', user.id);
            if (updateError) throw updateError;
        }

        // ■ フィールドアイテムの効果適用（サーバー側）
        const appliedEffects: string[] = [];
        // [D3 v27.3] DB更新後のHP/VIT値をレスポンスに含める
        let updatedProfile: { hp?: number; max_hp?: number; vitality?: number; max_vitality?: number } | null = null;
        const itemName = (invItem.items as any)?.name || 'アイテム';

        if (use_context === 'field' && supabaseServer) {
            // プロフィール取得
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('hp, max_hp, vitality, max_vitality')
                .eq('id', user.id)
                .single();

            if (profile) {
                const updates: Record<string, any> = {};

                // HP回復（固定値）
                if (effectData.heal != null && effectData.heal > 0) {
                    const maxHp = profile.max_hp || 100;
                    const currentHp = profile.hp ?? maxHp;
                    const newHp = Math.min(currentHp + effectData.heal, maxHp);
                    if (newHp > currentHp) {
                        updates.hp = newHp;
                        appliedEffects.push(`HP +${newHp - currentHp} 回復 (${currentHp} → ${newHp})`);
                    }
                }

                // HP回復（割合）
                if (effectData.heal_pct != null && effectData.heal_pct > 0) {
                    const maxHp = profile.max_hp || 100;
                    const currentHp = profile.hp ?? maxHp;
                    const healAmount = Math.floor(maxHp * effectData.heal_pct);
                    const newHp = Math.min(currentHp + healAmount, maxHp);
                    if (newHp > currentHp) {
                        updates.hp = newHp;
                        appliedEffects.push(`HP +${newHp - currentHp} 回復 (${currentHp} → ${newHp})`);
                    }
                }

                // HP全回復
                if (effectData.heal_full === true) {
                    const maxHp = profile.max_hp || 100;
                    updates.hp = maxHp;
                    appliedEffects.push(`HP 全回復 (→ ${maxHp})`);
                }

                // Vitality回復（竜血専用）
                if (effectData.vit_restore != null && effectData.vit_restore > 0) {
                    const maxVit = profile.max_vitality || 100;
                    const currentVit = profile.vitality ?? maxVit;
                    const newVit = Math.min(currentVit + effectData.vit_restore, maxVit);
                    if (newVit > currentVit) {
                        updates.vitality = newVit;
                        appliedEffects.push(`Vitality +${newVit - currentVit} 回復 (${currentVit} → ${newVit})`);
                    }
                }

                // DB更新
                if (Object.keys(updates).length > 0) {
                    const { error: updateError } = await supabaseServer
                        .from('user_profiles')
                        .update(updates)
                        .eq('id', user.id);

                    if (updateError) {
                        console.error('[POST /api/item/use] Effect apply error:', updateError);
                    }
                }

                // [D3 v27.3] DB更新後のプロフィールを再取得（レスポンス用）
                const { data: refreshedProfile } = await supabaseServer
                    .from('user_profiles')
                    .select('hp, max_hp, vitality, max_vitality')
                    .eq('id', user.id)
                    .single();
                if (refreshedProfile) updatedProfile = refreshedProfile;
            }

            // ■ reputation_reset（帳簿の改竄: 全国の名声をリセット）
            if (effectData.effect === 'reputation_reset') {
                const { error: repError } = await supabaseServer
                    .from('reputations')
                    .delete()
                    .eq('user_id', user.id);

                if (repError) {
                    console.error('[POST /api/item/use] Reputation reset error:', repError);
                } else {
                    appliedEffects.push('全国の名声がリセットされた');
                }
            }

            // ■ reputation_boost（王家の勅令書: 現在拠点の名声を加算）
            if (effectData.effect === 'reputation_boost' && effectData.reputation_amount) {
                const { data: currentProfile } = await supabaseServer
                    .from('user_profiles')
                    .select('current_location_id')
                    .eq('id', user.id)
                    .single();

                if (currentProfile?.current_location_id) {
                    // 拠点名を取得
                    const { data: locData } = await supabaseServer
                        .from('locations')
                        .select('name')
                        .eq('id', currentProfile.current_location_id)
                        .single();

                    if (locData?.name) {
                        const repAmount = effectData.reputation_amount;
                        // upsert: 既存ならスコア加算、なければ新規作成
                        const { data: existingRep } = await supabaseServer
                            .from('reputations')
                            .select('score')
                            .eq('user_id', user.id)
                            .eq('location_name', locData.name)
                            .maybeSingle();

                        if (existingRep) {
                            await supabaseServer
                                .from('reputations')
                                .update({ score: (existingRep.score || 0) + repAmount })
                                .eq('user_id', user.id)
                                .eq('location_name', locData.name);
                        } else {
                            await supabaseServer
                                .from('reputations')
                                .insert({ user_id: user.id, location_name: locData.name, score: repAmount });
                        }
                        appliedEffects.push(`${locData.name}での名声が${repAmount}上昇した`);
                    }
                } else {
                    appliedEffects.push('拠点外では勅令書の効果がない');
                }
            }

            // ■ encounter_mod（松明/宝の地図: 次回移動のエンカウント率を増減）
            if (effectData.effect === 'encounter_mod' && effectData.encounter_rate_mod != null) {
                const mod = effectData.encounter_rate_mod; // -0.5 = 50%減少, +0.5 = 50%増加
                await supabaseServer
                    .from('user_profiles')
                    .update({ next_encounter_rate_mod: mod })
                    .eq('id', user.id);

                if (mod < 0) {
                    appliedEffects.push(`次の移動時のエンカウント率が${Math.abs(mod * 100)}%減少する`);
                } else {
                    appliedEffects.push(`次の移動時のエンカウント率が${mod * 100}%上昇する`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            new_quantity: newQuantity,
            item_name: itemName,
            effects: appliedEffects.length > 0 ? appliedEffects : undefined,
            message: appliedEffects.length > 0
                ? `${itemName}を使用。${appliedEffects.join('、')}`
                : undefined,
            // [D3 v27.3] 更新後のHP/VIT値をクライアントに返却（状態同期用）
            updated_profile: updatedProfile || undefined,
        });

    } catch (err: any) {
        console.error('[POST /api/item/use] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
