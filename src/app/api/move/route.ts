import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ECONOMY_RULES } from '@/constants/game_rules';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { target_location_name, target_location_slug, is_quest_travel } = await req.json();

        if (!target_location_name && !target_location_slug) {
            return NextResponse.json({ error: 'Target location is required' }, { status: 400 });
        }

        // 1. Get User Profile (Secure)
        let targetUserId: string | null = null;

        const authHeader = req.headers.get('authorization');
        const xUserId = req.headers.get('x-user-id');

        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                if (xUserId) {
                    targetUserId = xUserId;
                } else {
                    return NextResponse.json({ error: "Authentication failed: " + (error?.message || "User not found") }, { status: 401 });
                }
            } else {
                targetUserId = user.id;
                if (xUserId && xUserId !== targetUserId) {
                    targetUserId = xUserId;
                }
            }
        } else if (xUserId) {
            targetUserId = xUserId;
        } else {
            return NextResponse.json({ error: "Login required for travel" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
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
            const { data: loc } = await supabase.from('locations').select('*').eq('id', profile.current_location_id).single();
            currentLocation = loc;
        }

        // 2. Get Target Location
        let query = supabase.from('locations').select('*');
        if (target_location_slug) {
            query = query.eq('slug', target_location_slug);
        } else {
            query = query.eq('name', target_location_name);
        }

        const { data: targetData, error: targetError } = await query.single();

        if (targetError || !targetData) {
            return NextResponse.json({ error: 'Target location not found' }, { status: 404 });
        }

        // 2.3 首都入場制限チェック (spec_v16 §2)
        const targetSlug = targetData.slug as string;
        const isCapital = targetData.type?.toLowerCase() === 'capital';

        if (isCapital) {
            const passExpiresAt = (profile.pass_expires_at || {}) as Record<string, number>;
            const passExpiry = passExpiresAt[targetSlug] ?? 0;
            const currentAccumulatedDays = profile.accumulated_days || 0;

            if (passExpiry <= currentAccumulatedDays) {
                // 許可証なし or 期限切れ
                // 出発地の名声を確認
                let originRepScore = 0;
                if (currentLocation) {
                    const { data: repData } = await supabase
                        .from('reputations')
                        .select('reputation_score')
                        .eq('user_id', profile.id)
                        .eq('location_id', currentLocation.id)
                        .maybeSingle();
                    originRepScore = repData?.reputation_score || 0;
                }

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
            console.log(`[Move] Valid pass for capital ${targetSlug}, expires at day ${passExpiry}`);
        }

        // 2.5 エンカウント判定 (spec_v16 §1)
        // ※首都チェック通過後、かつ通常フィールド移動時のみ実施（クエスト内移動はスキップ）
        if (currentLocation && !is_quest_travel) {
            const { data: repData } = await supabase
                .from('reputations')
                .select('reputation_score')
                .eq('user_id', profile.id)
                .eq('location_id', currentLocation.id)
                .maybeSingle();
            const repScore = repData?.reputation_score || 0;

            // §1.2 賞金稼ぎ確定エンカウント（優先判定）
            if (repScore <= ECONOMY_RULES.BOUNTY_HUNTER_THRESHOLD) {
                // 賞金稼ぎ用エネミーを取得
                const encounterEnemySlug = await pickEncounterEnemy(profile.current_location_id, 'bounty_hunter');
                console.log(`[Move] Bounty hunter ambush! Rep: ${repScore}`);
                return NextResponse.json({
                    success: false,
                    require_battle: 'bounty_hunter_ambush',
                    encounter_enemy_group_slug: encounterEnemySlug,
                    target_location_id: targetData.id,
                    origin_location_id: currentLocation.id,
                    message: '賞金稼ぎの襲撃！ 悪名が響き渡り、移動前に賞金首として狙われました！'
                });
            }

            // §1.1 通常ランダムエンカウント
            if (Math.random() < ECONOMY_RULES.RANDOM_ENCOUNTER_RATE) {
                const encounterEnemySlug = await pickEncounterEnemy(profile.current_location_id, 'random');
                console.log(`[Move] Random encounter triggered!`);
                return NextResponse.json({
                    success: false,
                    require_battle: 'random_encounter',
                    encounter_enemy_group_slug: encounterEnemySlug,
                    target_location_id: targetData.id,
                    origin_location_id: currentLocation.id,
                    message: '行く手を野盗に阻まれた！'
                });
            }
        }

        // 3. Calculate Days and Gold Cost using neighbors
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

        // 4. Update Time & Age
        let newTotalDays = (profile.accumulated_days || 0) + daysToTravel;
        let newAge = profile.age || 20;

        if (newTotalDays >= 365) {
            const yearsPassed = Math.floor(newTotalDays / 365);
            newAge += yearsPassed;
            newTotalDays = newTotalDays % 365;
        }

        // 5. Update DB
        const updatePayload: Record<string, any> = {
            current_location_id: targetData.id,
            accumulated_days: newTotalDays,
            age: newAge
        };
        if (goldCost > 0) {
            updatePayload.gold = (profile.gold ?? 0) - goldCost;
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

        // B. Update World State (Global Time synchronization)
        const { data: globalState } = await supabase
            .from('world_states')
            .select('total_days_passed')
            .order('total_days_passed', { ascending: false })
            .limit(1);

        const currentGlobalDays = globalState?.[0]?.total_days_passed || 0;
        const newGlobalDays = currentGlobalDays + daysToTravel;

        await supabaseService
            .from('world_states')
            .upsert({
                location_name: targetData.name,
                total_days_passed: newGlobalDays
            }, { onConflict: 'location_name' });

        return NextResponse.json({
            success: true,
            travel_days: daysToTravel,
            new_age: newAge,
            current_date: {
                total_days: newGlobalDays,
                display: `World Year ${100 + Math.floor(newGlobalDays / 365)}`
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
 * データがなければデフォルトとして 'goblin_squad' を返す。
 */
async function pickEncounterEnemy(locationId: string, encounterType: 'random' | 'bounty_hunter'): Promise<string> {
    const { data: rows } = await supabase
        .from('location_encounters')
        .select('enemy_group_slug, weight')
        .eq('location_id', locationId)
        .eq('encounter_type', encounterType);

    if (!rows || rows.length === 0) return 'goblin_squad';

    // 重み付き抽選
    const totalWeight = rows.reduce((sum, r) => sum + (r.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (const row of rows) {
        rand -= row.weight || 1;
        if (rand <= 0) return row.enemy_group_slug;
    }
    return rows[rows.length - 1].enemy_group_slug;
}
