import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { checkAndFireTrigger, buildShareData } from '@/lib/shareUtils';
import { processAging } from '@/services/questService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { target_location_name, target_location_slug, is_quest_travel } = await req.json();

        if (!target_location_name && !target_location_slug) {
            return NextResponse.json({ error: 'Target location is required' }, { status: 400 });
        }

        // 1. Get User Profile (JWT認証のみ - v27.0)
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer ') {
            return NextResponse.json({ error: "Login required for travel" }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Authentication failed: " + (authError?.message || "User not found") }, { status: 401 });
        }
        const targetUserId = user.id;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, current_location_id, gold, level, age, accumulated_days, max_vitality, vitality, atk, def, next_encounter_rate_mod, pass_expires_at')
            .eq('id', targetUserId)
            .single();

        if (profile) {
            console.log(`[Move] Profile: ${profile.id} | Loc: ${profile.current_location_id}`);
        } else {
            console.error(`[Move] Profile NOT FOUND for ID: ${targetUserId}`);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Explicitly fetch Current Location
        let currentLocation: any = null;
        if (profile.current_location_id) {
            const { data: loc } = await supabase.from('locations').select('id, name, slug, type, neighbors, nation_id, ruling_nation_id, prosperity_level').eq('id', profile.current_location_id).single();
            currentLocation = loc;
        }

        // Fetch reputation for current location once (used by both capital check and encounter check)
        let currentLocationRepScore = 0;
        if (currentLocation) {
            const { data: repData } = await supabase
                .from('reputations')
                .select('score')
                .eq('user_id', profile.id)
                .eq('location_name', currentLocation.name)
                .maybeSingle();
            currentLocationRepScore = repData?.score || 0;
        }

        // 2. Get Target Location
        let query = supabase.from('locations').select('id, name, slug, type, neighbors, nation_id, ruling_nation_id, prosperity_level');
        if (target_location_slug) {
            query = query.eq('slug', target_location_slug); // v11.1修正: slugカラムで正しく検索
        } else {
            query = query.eq('name', target_location_name);
        }

        const { data: targetData, error: targetError } = await query.single();

        if (targetError || !targetData) {
            return NextResponse.json({ error: 'Target location not found' }, { status: 404 });
        }

        // 2.3 首都入場制限チェック (spec_v16 §2)
        const targetNationId = targetData.nation_id as string;
        const isCapital = targetData.type?.toLowerCase() === 'capital';

        if (isCapital) {
            const passExpiresAt = (profile.pass_expires_at || {}) as Record<string, number>;
            const passExpiry = passExpiresAt[targetNationId] ?? 0;
            const currentAccumulatedDays = profile.accumulated_days || 0;

            if (passExpiry <= currentAccumulatedDays) {
                // 許可証なし or 期限切れ
                // 出発地の名声を確認（事前取得済み）
                const originRepScore = currentLocationRepScore;

                if (originRepScore < 0) {
                    // 悪党: 賄賂オプションあり
                    return NextResponse.json({
                        success: false,
                        error: `${targetData.name}への入場には通行許可証が必要です。`,
                        error_code: 'NEED_PASS_OR_BRIBE',
                        bribe_cost: ECONOMY_RULES.BRIBE_COST,
                        target_location_id: targetData.id,
                        message: '衛兵が行く手を塞いでいる。「許可証を見せろ。」...あるいは、見逃してもらう方法もあるが。'
                    }, { status: 403 });
                } else {
                    // 名声正常: 許可証購入のみ
                    return NextResponse.json({
                        success: false,
                        error: `${targetData.name}への入場には通行許可証が必要です。`,
                        error_code: 'NEED_PASS',
                        pass_price: ECONOMY_RULES.PASS_PRICE,
                        message: '衛兵が行く手を塞いでいる。「許可証を見せろ。」道具屋で許可証を購入してから出直すしかない。'
                    }, { status: 403 });
                }
            }
            // 有効な許可証あり → 通常移動処理へ
            console.log(`[Move] Valid pass for capital ${targetData.name}, expires at day ${passExpiry}`);
        }

        // 2.5 Calculate Days and Gold Cost using neighbors (moved before encounter check for v19 distance-based rate)
        let daysToTravel = 1;
        let goldCost = 0;
        if (currentLocation) {
            const neighbors = currentLocation.neighbors || {};
            const neighborData = neighbors[targetData.slug];
            if (neighborData) {
                daysToTravel = typeof neighborData === 'object' ? neighborData.days : Number(neighborData);
                goldCost = typeof neighborData === 'object' ? (neighborData.gold_cost ?? 0) : 0;
                console.log(`[Move] Valid route: ${currentLocation.slug} -> ${targetData.slug} (${daysToTravel} days, ${goldCost}G)`);
            } else if (currentLocation.slug === 'loc_hub' || targetData.type === 'Capital') {
                console.log(`[Move] Valid descent: Hub -> ${targetData.slug}`);
                daysToTravel = 1;
                goldCost = 0;
            } else {
                console.warn(`[Move] Invalid Route: ${currentLocation.slug} -> ${targetData.slug}. Neighbors:`, Object.keys(neighbors));
                return NextResponse.json({
                    error: 'Direct route not found between these locations.',
                    debug: {
                        current: currentLocation.slug,
                        target: targetData.slug,
                        neighbors: Object.keys(neighbors),
                        userId: profile.id
                    }
                }, { status: 400 });
            }
        }

        // 3. エンカウント判定 (spec_v16 §1, v19改善: 日数連動+レベルフィルタ)
        // ※首都チェック通過後、かつ通常フィールド移動時のみ実施（クエスト内移動はスキップ）
        if (currentLocation && !is_quest_travel) {
            const playerLevel = profile.level || 1;
            const repScore = currentLocationRepScore;

            // §1.2 賞金稼ぎ確定エンカウント（優先判定）
            if (repScore <= ECONOMY_RULES.BOUNTY_HUNTER_THRESHOLD) {
                const encounterEnemySlug = await pickEncounterEnemy(profile.current_location_id, 'bounty_hunter', playerLevel);
                console.log(`[Move] Bounty hunter ambush! Rep: ${repScore}, PlayerLv: ${playerLevel}`);
                return NextResponse.json({
                    success: false,
                    require_battle: 'bounty_hunter_ambush',
                    encounter_enemy_group_slug: encounterEnemySlug,
                    target_location_id: targetData.id,
                    origin_location_id: currentLocation.id,
                    travel_days: daysToTravel,
                    message: '賞金稼ぎの襲撃！ 悪名が響き渡り、移動前に賞金首として狙われました！'
                });
            }

            // §1.1 通常ランダムエンカウント (v19改善: 日数連動確率)
            // 基礎率 = 1 - (1 - ENCOUNTER_BASE_RATE_PER_DAY) ^ daysToTravel
            let adjustedEncounterRate = 1 - Math.pow(1 - ECONOMY_RULES.ENCOUNTER_BASE_RATE_PER_DAY, daysToTravel);

            // v5.2 & v25: パッシブ効果とインベントリパッシブを並列取得
            try {
                const [skillsResult, inventoryResult] = await Promise.all([
                    supabase.from('user_skills').select('card_id').eq('user_id', profile.id),
                    supabase.from('inventory').select('item_id, items:item_id(effect_data)').eq('user_id', profile.id).gt('quantity', 0)
                ]);

                // Skills passive
                if (skillsResult.data && skillsResult.data.length > 0) {
                    const { getTravelPassives } = await import('@/lib/passiveEffects');
                    const travelMods = getTravelPassives(skillsResult.data.map(s => String(s.card_id)));
                    if (travelMods.eventAvoidPct > 0) {
                        adjustedEncounterRate *= (1 - travelMods.eventAvoidPct / 100);
                    }
                }

                // Inventory passive
                if (inventoryResult.data) {
                    for (const inv of inventoryResult.data) {
                        const ed = (inv.items as any)?.effect_data;
                        if (ed?.encounter_avoid_pct) {
                            adjustedEncounterRate *= (1 - ed.encounter_avoid_pct / 100);
                        }
                    }
                }
            } catch (e) {
                console.warn('[Move] パッシブ効果取得失敗（続行）', e);
            }

            // v25: ワンショットバフ（松明 / 宝の地図）: next_encounter_rate_mod
            const nextMod = profile.next_encounter_rate_mod ?? 0;
            if (nextMod !== 0) {
                adjustedEncounterRate *= (1 + nextMod); // -0.5 → ×0.5, +0.5 → ×1.5
                adjustedEncounterRate = Math.max(0, Math.min(1, adjustedEncounterRate));
                // バフ消費: 使用後リセット
                await supabaseService.from('user_profiles')
                    .update({ next_encounter_rate_mod: 0 })
                    .eq('id', profile.id);
                console.log(`[Move] Encounter mod applied: ${nextMod > 0 ? '+' : ''}${(nextMod * 100).toFixed(0)}%`);
            }

            console.log(`[Move] Encounter rate: ${(adjustedEncounterRate * 100).toFixed(1)}% (${daysToTravel} days, Lv${playerLevel})`);
            if (Math.random() < adjustedEncounterRate) {
                const encounterEnemySlug = await pickEncounterEnemy(profile.current_location_id, 'random', playerLevel);
                console.log(`[Move] Random encounter triggered! Enemy: ${encounterEnemySlug}`);
                return NextResponse.json({
                    success: false,
                    require_battle: 'random_encounter',
                    encounter_enemy_group_slug: encounterEnemySlug,
                    target_location_id: targetData.id,
                    origin_location_id: currentLocation.id,
                    travel_days: daysToTravel,
                    message: '行く手を野盗に阻まれた！'
                });
            }
        }

        // 3.5 Gold Cost Validation
        if (goldCost > 0) {
            const currentGold = profile.gold ?? 0;
            if (currentGold < goldCost) {
                console.warn(`[Move] INSUFFICIENT_FUNDS: user ${profile.id} has ${currentGold}G but needs ${goldCost}G`);
                return NextResponse.json({
                    error: 'ゴールドが不足しています。',
                    error_code: 'INSUFFICIENT_FUNDS',
                    required: goldCost,
                    current: currentGold
                }, { status: 400 });
            }
        }

        // 4. Update Time & Age (統一加齢ロジック: VIT/ATK/DEF減少を含む)
        const { newAge, newAgeDays, decay } = processAging(
            profile.age || 20,
            profile.accumulated_days || 0,
            daysToTravel
        );

        // 5. Update DB
        const updatePayload: Record<string, any> = {
            current_location_id: targetData.id,
            accumulated_days: newAgeDays,
            age: newAge
        };
        if (goldCost > 0) {
            updatePayload.gold = (profile.gold ?? 0) - goldCost;
        }
        // 加齢によるステータス減少を適用
        if (decay.vit > 0 || decay.atk > 0 || decay.def > 0) {
            if (decay.vit > 0) {
                updatePayload.max_vitality = Math.max(0, (profile.max_vitality || 100) - decay.vit);
                updatePayload.vitality = Math.min(profile.vitality ?? 100, updatePayload.max_vitality);
            }
            if (decay.atk > 0) updatePayload.atk = Math.max(1, (profile.atk || 1) - decay.atk);
            if (decay.def > 0) updatePayload.def = Math.max(1, (profile.def || 1) - decay.def);
            console.log(`[Move] Aging decay: age=${newAge}, VIT-${decay.vit}, ATK-${decay.atk}, DEF-${decay.def}`);
        }
        const { error: updateProfileError } = await supabaseService
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', profile.id);

        if (updateProfileError) throw updateProfileError;

        // Ensure hub state is cleared upon moving to a new location
        await supabaseService
            .from('user_hub_states')
            .upsert({ user_id: profile.id, is_in_hub: false });

        // B. Update World State (Global Time synchronization - v27.0: アトミック更新)
        // 拠点ごとの total_days_passed を直接更新（RPC未定義時はread+writeフォールバック）
        try {
            const { error: rpcError } = await supabaseService.rpc('increment_world_days', {
                p_location_name: targetData.name,
                p_days: daysToTravel
            });
            if (rpcError) throw rpcError;
        } catch {
            // フォールバック: read-then-write（競合リスクあり、RPC推奨）
            const { data: globalState } = await supabase
                .from('world_states')
                .select('total_days_passed')
                .eq('location_name', targetData.name)
                .maybeSingle();
            const currentGlobalDays = globalState?.total_days_passed || 0;
            await supabaseService.from('world_states')
                .upsert({
                    location_name: targetData.name,
                    total_days_passed: currentGlobalDays + daysToTravel
                }, { onConflict: 'location_name' });
        }

        // #11 全拠点制覇 (世代1回)
        // 訪問記録をUPSERT
        let shareDataList: any[] = [];
        await supabaseService
            .from('user_visited_locations')
            .insert({ user_id: profile.id, location_id: targetData.id });

        const { count: visitedCount } = await supabaseService
            .from('user_visited_locations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

        if (visitedCount && visitedCount >= 20) {
            const fired = await checkAndFireTrigger(supabaseService, profile.id, 'all_locations', '');
            if (fired) {
                const sd = buildShareData('all_locations', {});
                if (sd) shareDataList.push(sd);
            }
        }

        return NextResponse.json({
            success: true,
            travel_days: daysToTravel,
            new_age: newAge,
            aging_decay: (decay.vit > 0 || decay.atk > 0 || decay.def > 0) ? decay : undefined,
            share_data_list: shareDataList,
            current_date: {
                total_days: newAgeDays,
                display: `World Year ${742 + Math.floor(newAgeDays / 365)}`
            }
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * 指定拠点に紐づくエンカウント用エネミーグループスラッグを抽選する。
 * location_encounters テーブルの weight に基づいた重み付き抽選。
 * v19改善: プレイヤーレベルによるフィルタを適用。
 * データがなければデフォルトとして 'bandit_group' を返す。
 */
async function pickEncounterEnemy(locationId: string, encounterType: 'random' | 'bounty_hunter', playerLevel: number): Promise<string> {
    const { data: rows } = await supabase
        .from('location_encounters')
        .select('enemy_group_slug, weight')
        .eq('location_id', locationId)
        .eq('encounter_type', encounterType)
        .lte('min_player_level', playerLevel)
        .gte('max_player_level', playerLevel);

    if (!rows || rows.length === 0) return 'bandit_group';

    // 重み付き抽選
    const totalWeight = rows.reduce((sum, r) => sum + (r.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (const row of rows) {
        rand -= row.weight || 1;
        if (rand <= 0) return row.enemy_group_slug;
    }
    return rows[rows.length - 1].enemy_group_slug;
}
