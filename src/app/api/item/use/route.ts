process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { getSkillRarity } from '@/lib/rarity';

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
                .select('hp, max_hp, vitality, max_vitality, accumulated_days, pass_expires_at')
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

                // ■ capital_pass（各首都通行許可証: 指定された首都の通行可能期限を延長）
                if (effectData.effect === 'capital_pass' && effectData.nation) {
                    const nationMap: Record<string, string> = {
                        roland: 'Roland',
                        karyu: 'Karyu',
                        yato: 'Yato',
                        markand: 'Markand'
                    };
                    const nationKey = nationMap[effectData.nation.toLowerCase()];
                    if (nationKey) {
                        const currentDays = profile.accumulated_days || 0;
                        const duration = effectData.duration_days || 365;
                        const updatedPasses = { ...(profile.pass_expires_at || {}) } as Record<string, number>;
                        
                        const currentExpiry = updatedPasses[nationKey] || 0;
                        const baseDays = Math.max(currentExpiry, currentDays);
                        updatedPasses[nationKey] = baseDays + duration;

                        const { error: passUpdateError } = await supabaseServer
                            .from('user_profiles')
                            .update({ pass_expires_at: updatedPasses })
                            .eq('id', user.id);

                        if (passUpdateError) {
                            console.error('[POST /api/item/use] Capital pass apply error:', passUpdateError);
                        } else {
                            const jpNationName = nationKey === 'Roland' ? 'ローランド聖王国' :
                                                 nationKey === 'Karyu' ? '華龍神朝' :
                                                 nationKey === 'Yato' ? '夜刀神国' : '砂塵の王国マルカンド';
                            appliedEffects.push(`${jpNationName}の通行許可が ${duration} 日間有効になった（経過日数 ${updatedPasses[nationKey]}日目まで）`);
                        }
                    }
                }

                // ■ 旧首都通行許可証 (capital_pass) のフォールバック処理
                if (effectData.is_pass === true) {
                    const currentDays = profile.accumulated_days || 0;
                    const duration = 30; // 30日
                    const updatedPasses = { ...(profile.pass_expires_at || {}) } as Record<string, number>;
                    const capitals = ['Roland', 'Markand', 'Karyu', 'Yato'];
                    for (const cap of capitals) {
                        const currentExpiry = updatedPasses[cap] || 0;
                        const baseDays = Math.max(currentExpiry, currentDays);
                        updatedPasses[cap] = baseDays + duration;
                    }

                    const { error: passUpdateError } = await supabaseServer
                        .from('user_profiles')
                        .update({ pass_expires_at: updatedPasses })
                        .eq('id', user.id);

                    if (passUpdateError) {
                        console.error('[POST /api/item/use] Fallback capital pass apply error:', passUpdateError);
                    } else {
                        appliedEffects.push(`全首都共通の通行許可が ${duration} 日間有効になった（経過日数 ${currentDays + duration}日目まで）`);
                    }
                }
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

            // ■ open_pack（鍵アイテム使用によるパック開封効果）
            if (effectData.effect === 'open_pack' && effectData.pack_series) {
                const packSeries = effectData.pack_series === 'basic' ? 'basic' : 'chaos_and_rebellion';
                
                // プール定義
                const ACADEMY_POOLS = {
                    SR: [3101, 3116, 3119],
                    R: [3107, 3109, 3112, 3113, 3124, 3125, 3139],
                    U: [3102, 3103, 3105, 3110, 3114, 3115, 3118, 3120, 3126, 3131],
                    C: [3104, 3106, 3108, 3111, 3117, 3122, 3123, 3127, 3128, 3130, 3133, 3134, 3135, 3136, 3137, 3138, 3140]
                };

                const BASIC_POOLS = {
                    SR: [3021, 3022, 3035, 3041, 3042, 3043, 3045],
                    R: [3023, 3024, 3025, 3029, 3031, 3037, 3039, 3044],
                    U: [3027, 3028, 3030, 3032, 3033, 3034, 3036, 3038, 3040, 3062, 3065, 3066, 3067],
                    C: [3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020, 3026, 3061]
                };

                const config = packSeries === 'basic' ? {
                    pools: BASIC_POOLS,
                    refund: 300,
                    log_series: 'basic'
                } : {
                    pools: ACADEMY_POOLS,
                    refund: 500,
                    log_series: 'chaos_and_rebellion'
                };

                // 確率ロールヘルパー
                const rollCard = (guaranteed: boolean, pools: typeof ACADEMY_POOLS) => {
                    const rand = Math.random() * 100;
                    let rarity: 'SR' | 'R' | 'U' | 'C' = 'C';
                    if (guaranteed) {
                        rarity = rand < 20 ? 'SR' : 'R';
                    } else {
                        if (rand < 3) rarity = 'SR';
                        else if (rand < 15) rarity = 'R';
                        else if (rand < 40) rarity = 'U';
                        else rarity = 'C';
                    }
                    const pool = pools[rarity];
                    return { rarity, skillId: pool[Math.floor(Math.random() * pool.length)] };
                };

                // 所持済みスキル取得
                const { data: ownedSkillsResult } = await supabaseServer
                    .from('user_skills')
                    .select('skill_id')
                    .eq('user_id', user.id);
                const ownedSkillIdsSet = new Set<number>((ownedSkillsResult || []).map(s => Number(s.skill_id)));

                // ロール
                const rolled: { rarity: 'SR' | 'R' | 'U' | 'C'; skillId: number }[] = [];
                for (let i = 0; i < 4; i++) {
                    rolled.push(rollCard(false, config.pools));
                }
                rolled.push(rollCard(true, config.pools));

                const trackingSet = new Set<number>(ownedSkillIdsSet);
                let refundGold = 0;
                const insertSkillIds: number[] = [];

                const results = rolled.map(roll => {
                    const isDuplicate = trackingSet.has(roll.skillId);
                    if (isDuplicate) {
                        refundGold += config.refund;
                    } else {
                        trackingSet.add(roll.skillId);
                        insertSkillIds.push(roll.skillId);
                    }
                    return roll.skillId;
                });

                // ゴールドキャッシュバックの反映（消費は0G、重複時のみゴールド加算）
                if (refundGold > 0) {
                    await supabaseServer
                        .rpc('increment_gold', { p_user_id: user.id, p_amount: refundGold });
                }

                // スキル登録
                if (insertSkillIds.length > 0) {
                    const inserts = insertSkillIds.map(sid => ({
                        user_id: user.id,
                        skill_id: sid,
                        is_equipped: false
                    }));
                    await supabaseServer
                        .from('user_skills')
                        .insert(inserts);
                }

                // ログ記録
                try {
                    await supabaseServer
                        .from('academy_pack_logs')
                        .insert({
                            user_id: user.id,
                            pack_series: config.log_series,
                            gold_spent: 0,
                            refund_gold: refundGold
                        });
                } catch (e) {
                    console.error('Failed to log pack opening via item use:', e);
                }

                // 詳細取得
                const { data: skillDetails } = await supabaseServer
                    .from('skills')
                    .select('id, name')
                    .in('id', results);
                const nameMap = new Map<number, string>((skillDetails || []).map(s => [Number(s.id), s.name]));

                const names = results.map(rid => nameMap.get(rid) || '未知の教本');
                appliedEffects.push(`パックを開封しました！獲得カード: ${names.join(', ')}`);
                if (refundGold > 0) {
                    appliedEffects.push(`重複キャッシュバックで ${refundGold} G 獲得しました`);
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
