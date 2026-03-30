import { supabase } from '@/lib/supabase';
import { Location, WorldState } from '@/types/game';
import { ECONOMY_RULES } from '@/constants/game_rules';

// Status Constants
export const LOC_STATUS = {
    ZENITH: 'Zenith',        // 絶頂
    PROSPEROUS: 'Prosperous', // 繁栄
    STAGNANT: 'Stagnant',    // 停滞
    DECLINING: 'Declining',  // 衰退
    RUINED: 'Ruined'         // 崩壊
};

const STATUS_RANK_MAP: Record<string, number> = {
    [LOC_STATUS.ZENITH]: 4,
    [LOC_STATUS.PROSPEROUS]: 3,
    [LOC_STATUS.STAGNANT]: 2,
    [LOC_STATUS.DECLINING]: 1,
    [LOC_STATUS.RUINED]: 0
};

const RANK_STATUS_MAP: Record<number, string> = {
    4: LOC_STATUS.ZENITH,
    3: LOC_STATUS.PROSPEROUS,
    2: LOC_STATUS.STAGNANT,
    1: LOC_STATUS.DECLINING,
    0: LOC_STATUS.RUINED
};

// Nation Constants and Mapping
const NATIONS = {
    ROLAND: 'Roland',
    MARKAND: 'Markand',
    YATO: 'Yato',
    KARYU: 'Karyu'
};

const NATION_ATTRIBUTE_MAP: Record<string, string> = {
    [NATIONS.ROLAND]: 'order_score',
    [NATIONS.MARKAND]: 'chaos_score',
    [NATIONS.YATO]: 'justice_score',
    [NATIONS.KARYU]: 'evil_score'
};

// Location and WorldState types imported from '@/types/game'

/**
 * Main function to update world hegemony and location status.
 * Intended to be run daily via Cron.
 */
export async function updateWorldSimulation() {
    console.log('[WorldSim] Starting daily update...');
    const logs: string[] = [];

    try {
        // 1. Fetch Data
        const { data: locations, error: locError } = await supabase.from('locations').select('*');
        if (locError) throw locError;

        const { data: states, error: stateError } = await supabase.from('world_states').select('*');
        if (stateError) throw stateError;

        if (!locations || !states) throw new Error('No data found');

        // Map states by location name for easy access
        const stateMap = new Map<string, WorldState>();
        states.forEach(s => stateMap.set(s.location_name, s));

        // 2. Calculate Global Scores (Hegemony)
        let totalOrder = 0;
        let totalChaos = 0;
        let totalJustice = 0;
        let totalEvil = 0;

        states.forEach(s => {
            totalOrder += s.order_score || 0;
            totalChaos += s.chaos_score || 0;
            totalJustice += s.justice_score || 0;
            totalEvil += s.evil_score || 0;
        });

        const grandTotal = totalOrder + totalChaos + totalJustice + totalEvil;
        if (grandTotal === 0) {
            logs.push('Grand total score is 0, skipping hegemony update.');
            return { success: false, logs };
        }

        logs.push(`Global Scores - Order: ${totalOrder}, Chaos: ${totalChaos}, Justice: ${totalJustice}, Evil: ${totalEvil}`);

        // 3. Calculate Target Quotas (Share of 20 locations)
        const totalLocs = locations.length; // Should be 20

        // Simple ratios
        const rawQuota = {
            [NATIONS.ROLAND]: (totalOrder / grandTotal) * totalLocs,
            [NATIONS.MARKAND]: (totalChaos / grandTotal) * totalLocs,
            [NATIONS.YATO]: (totalJustice / grandTotal) * totalLocs,
            [NATIONS.KARYU]: (totalEvil / grandTotal) * totalLocs
        };

        // Round and Adjust (Largest Remainder Method simplified or just greedy fix)
        // We start with floor, then distribute remainder
        let quotas = {
            [NATIONS.ROLAND]: Math.floor(rawQuota[NATIONS.ROLAND]),
            [NATIONS.MARKAND]: Math.floor(rawQuota[NATIONS.MARKAND]),
            [NATIONS.YATO]: Math.floor(rawQuota[NATIONS.YATO]),
            [NATIONS.KARYU]: Math.floor(rawQuota[NATIONS.KARYU])
        };

        let assignedCount = Object.values(quotas).reduce((a, b) => a + b, 0);
        let remainder = totalLocs - assignedCount;

        // Give remainder to nations with largest decimal parts (simplified: just give to highest score for now or random)
        // To be fair, let's sort by decimal part.
        const remainders = [
            { nation: NATIONS.ROLAND, val: rawQuota[NATIONS.ROLAND] - quotas[NATIONS.ROLAND] },
            { nation: NATIONS.MARKAND, val: rawQuota[NATIONS.MARKAND] - quotas[NATIONS.MARKAND] },
            { nation: NATIONS.YATO, val: rawQuota[NATIONS.YATO] - quotas[NATIONS.YATO] },
            { nation: NATIONS.KARYU, val: rawQuota[NATIONS.KARYU] - quotas[NATIONS.KARYU] }
        ].sort((a, b) => b.val - a.val);

        for (let i = 0; i < remainder; i++) {
            quotas[remainders[i].nation as keyof typeof quotas]++;
        }

        logs.push(`Quotas: ${JSON.stringify(quotas)}`);

        // 4. Assign Territories (Distance Field)

        // Find Capitals
        const capitals: Record<string, Location> = {};
        // Note: nation_id in locations table seems to be the "Founding Nation". 
        // We assume Capitals don't change location, just ownership could theoretically change but usually Capital ownership is sticky?
        // Actually, the user says "From each country's capital, closest...". 
        // We assume the Capital Locations themselves are the anchors.

        // Helper: Find capital node for a nation
        const findCapital = (nationId: string) => locations.find(l => l.type === 'Capital' && l.nation_id === nationId);

        capitals[NATIONS.ROLAND] = findCapital(NATIONS.ROLAND)!;
        capitals[NATIONS.MARKAND] = findCapital(NATIONS.MARKAND)!;
        capitals[NATIONS.YATO] = findCapital(NATIONS.YATO)!;
        capitals[NATIONS.KARYU] = findCapital(NATIONS.KARYU)!;

        // Algorithm:
        // We need to assign every location to a nation such that counts match quotas.
        // Priority: Highest Quota/Strength nation picks first?
        // User said: "From each capital, rewrite... closer order".
        // Let's use a "Draft" system. 
        // Sort nations by Strength (Quota). 
        // Nation A picks closest available node. Nation B picks closest available. 
        // Repeat until quotas filled?
        // Issue: This might result in scattered territories.
        // Better: Concurrent Dijkstra / Voronoi? 
        // Simplified Logic:
        // 1. Calculate distance from every location to every capital.
        // 2. Create a list of "Claims": { nation, location, distance }.
        // 3. Sort Claims by distance (ascending).
        // 4. Iterate Claims:
        //    If location is free AND Nation has quota left -> Assign.
        //    Else skip.
        // This ensures the closest pairings happen first globally.

        const claims: { nation: string, locationId: string, dist: number }[] = [];

        locations.forEach(loc => {
            Object.keys(NATIONS).forEach(nationKey => {
                const nation = NATIONS[nationKey as keyof typeof NATIONS];
                const cap = capitals[nation];
                if (cap) {
                    const dist = Math.sqrt(Math.pow(loc.x - cap.x, 2) + Math.pow(loc.y - cap.y, 2));
                    claims.push({ nation, locationId: loc.id, dist });
                }
            });
        });

        claims.sort((a, b) => a.dist - b.dist);

        const newAssignments: Record<string, string> = {}; // locId -> nation
        const currentCounts = { ...quotas }; // Track remaining slots. Actually we want to decrement.

        // Reset quotas to track filled
        const filledCounts = {
            [NATIONS.ROLAND]: 0,
            [NATIONS.MARKAND]: 0,
            [NATIONS.YATO]: 0,
            [NATIONS.KARYU]: 0
        };

        const locsAssigned = new Set<string>();

        for (const claim of claims) {
            if (locsAssigned.has(claim.locationId)) continue;

            if (filledCounts[claim.nation as keyof typeof filledCounts] < quotas[claim.nation as keyof typeof quotas]) {
                // Assign
                newAssignments[claim.locationId] = claim.nation;
                filledCounts[claim.nation as keyof typeof filledCounts]++;
                locsAssigned.add(claim.locationId);
            }
        }

        // Failsafe: Any unassigned? (Shouldn't happen if sum quotas = total locs and graph is complete)
        // If unassigned, assign to nearest capital regardless of quota? Or random.
        // With the logic above, since we iterate *all* pairs, eventually everyone gets picked unless a nation runs out of quota.
        // Since sum(quota) == totalLocs, it should match exactly.

        // 5. Update Ownership and Calculate Friction (V4)
        const historyLogs: any[] = [];

        for (const loc of locations) {
            // Retrieve latest state to be sure
            const state = stateMap.get(loc.name);
            const newOwner = newAssignments[loc.id];
            if (!state) continue;

            // Updated Owner logic (from previous step 4)
            if (state.controlling_nation !== newOwner) {
                logs.push(`[Change] ${loc.name}: ${state.controlling_nation} -> ${newOwner}`);
                historyLogs.push({
                    location_id: loc.id,
                    event_type: 'alignment_change',
                    old_value: state.controlling_nation || 'Unknown',
                    new_value: newOwner,
                    message: `「『${loc.name}』が${newOwner}の手に落ちた。私はその歴史の転換点に立ち会っている。」`
                });
                state.controlling_nation = newOwner;
            }

            // --- V4 Friction & Prosperity Logic ---
            // 1. Determine Target Attribute Value (The ideal ideology)
            // Each Nation has an Ideal Alignment Profile.
            // Roland: Order=100
            // Markand: Chaos=100
            // Karyu: Evil=100
            // Yato: Justice=100
            // *Wait, Spec V4 says: "Friction = abs(Nation.attributeValue - Location.currentAttributeValue)"
            // *It implies we look at the PRIMARY attribute of the nation.

            const NATION_TARGETS: Record<string, { key: keyof WorldState, ideal: number }> = {
                [NATIONS.ROLAND]: { key: 'order_score', ideal: 100 },
                [NATIONS.MARKAND]: { key: 'chaos_score', ideal: 100 },
                [NATIONS.YATO]: { key: 'justice_score', ideal: 100 }, // Spec V1: Yato=Mystic/Justice? Re-check. 
                // Spec V1 says Yato is Justice(Iron Discipline)? Wait. 
                // setup_v2.sql says Yato=Justice(20), Evil(80). Karyu=Justice(20), Evil(80). 
                // Let's re-read setup_v2.sql carefully.
                // Roland: Order 80, Justice 80.
                // Markand: Chaos 80, Justice 80.
                // Karyu: Order 80, Evil 80... wait.
                // Let's stick to the PRIMARY attribute logic defined in simulation previously:
                // Roland->Order, Markand->Chaos, Yato->Justice, Karyu->Evil.
                [NATIONS.KARYU]: { key: 'evil_score', ideal: 100 }
            };

            const target = NATION_TARGETS[newOwner];
            if (!target) {
                // Neutral or unknown
                continue;
            }

            const currentVal = (state[target.key] as number) || 0;
            const friction = Math.abs(target.ideal - currentVal);
            // Default max friction is 100 (if current is 0).

            // 2. Determine Trend
            // Friction 0-20:  Trend towards Zenith (Lv5)
            // Friction 21-50: Trend towards Prosperous (Lv4)
            // Friction 51-80: Trend towards Declining (Lv2)
            // Friction 81+:   Trend towards Ruined (Lv1)

            let targetLevel = 3; // Stagnant default
            if (friction <= 20) targetLevel = 5;
            else if (friction <= 50) targetLevel = 4;
            else if (friction <= 80) targetLevel = 2;
            else targetLevel = 1;

            // 3. Update Prosperity Level (Slow moving average or Direct?)
            // Spec says: "24h batch... Recovery/Collapse conditions".
            // Implementation: Move 1 step towards target level per day.

            // Get current level (default 4 if new col is null)
            let currentLevel = (state as any).prosperity_level ?? 4;

            const oldLevel = currentLevel;

            if (currentLevel < targetLevel) currentLevel++;
            else if (currentLevel > targetLevel) currentLevel--;

            // 4. Determine Text Status (Legacy Support)
            // Map Level 1-5 back to Text Status for UI compatibility
            const LEVEL_STATUS_MAP: Record<number, string> = {
                5: LOC_STATUS.ZENITH,     // 絶頂
                4: LOC_STATUS.PROSPEROUS, // 繁栄
                3: LOC_STATUS.STAGNANT,   // 停滞
                2: LOC_STATUS.DECLINING,  // 衰退
                1: LOC_STATUS.RUINED      // 崩壊
            };
            const newStatusText = LEVEL_STATUS_MAP[currentLevel] || LOC_STATUS.PROSPEROUS;

            // Log changes
            if (oldLevel !== currentLevel) {
                logs.push(`[Prosperity] ${loc.name}: Lv${oldLevel} -> Lv${currentLevel} (Friction: ${friction})`);

                const isUp = currentLevel > oldLevel;
                let msg = '';
                if (currentLevel === 1) {
                    msg = `「ついに『${loc.name}』が崩壊の時を迎えた。黒煙が街を覆っている…。」`;
                } else if (isUp) {
                    msg = `「私が滞在する『${loc.name}』に活気が戻ってきた。この街の行く末を見届けよう。」`;
                } else {
                    msg = `「私が滞在する『${loc.name}』に暗い影が落ち始めている…。」`;
                }

                historyLogs.push({
                    location_id: loc.id,
                    event_type: 'prosperity_change',
                    old_value: String(oldLevel),
                    new_value: String(currentLevel),
                    message: msg
                });
            }

            // 5. DB Update
            const { error: updateError } = await supabase
                .from('world_states')
                .update({
                    controlling_nation: newOwner,
                    status: newStatusText,
                    prosperity_level: currentLevel,   // New V4 Field
                    last_friction_score: friction,    // New V4 Field
                    updated_at: new Date().toISOString()
                })
                .eq('id', state.id);

            if (updateError) {
                logs.push(`Error updating ${loc.name}: ${updateError.message}`);
            }
        }

        // 5.5 Insert History Logs
        if (historyLogs.length > 0) {
            const { error: histError } = await supabase.from('world_states_history').insert(historyLogs);
            if (histError) {
                logs.push(`Error saving history logs: ${histError.message}`);
            } else {
                logs.push(`[History] Inserted ${historyLogs.length} state change events.`);
            }
        }

        // 6. 清掃バッチ: 30日未使用の英霊を論理削除
        // 仕様: spec_v5_shadow_system.md §7 — 英霊データの负荷軽減
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: staleHeroics, error: staleError } = await supabase
                .from('party_members')
                .select('id, name')
                .eq('origin_type', 'shadow_heroic')
                .is('owner_id', null)          // 未雇用状態
                .lt('hired_at', thirtyDaysAgo)
                .eq('is_active', true);

            if (!staleError && staleHeroics && staleHeroics.length > 0) {
                const ids = staleHeroics.map(r => r.id);
                await supabase
                    .from('party_members')
                    .update({ is_active: false })
                    .in('id', ids);
                logs.push(`[Cleanup] ${staleHeroics.length}件の英霊の契約を解除: ${staleHeroics.map(r => r.name).join(', ')}`);
            } else if (!staleError) {
                logs.push('[Cleanup] 解除対象なし');
            } else {
                logs.push(`[Cleanup] エラー: ${staleError.message}`);
            }
        } catch (cleanupErr: any) {
            logs.push(`[Cleanup] 例外: ${cleanupErr.message}`);
        }

        logs.push('World update complete.');

        // 7. 名声の自然減少 (spec_v16 §5.1: Reputation Decay)
        try {
            // REP_DECAY_THRESHOLD を超えている reputation レコードを全取得
            const { data: highReps, error: repFetchError } = await supabase
                .from('reputations')
                .select('id, score')
                .gt('score', ECONOMY_RULES.REP_DECAY_THRESHOLD);

            if (repFetchError) {
                logs.push(`[RepDecay] 取得エラー: ${repFetchError.message}`);
            } else if (highReps && highReps.length > 0) {
                // 各レコードの score を REP_DECAY_AMOUNT 分減少させる
                let decayCount = 0;
                for (const rep of highReps) {
                    const newScore = rep.score + ECONOMY_RULES.REP_DECAY_AMOUNT; // REP_DECAY_AMOUNT は負数
                    // 閾値以下にはしない（閾値ちょうどで止める）
                    const clampedScore = Math.max(ECONOMY_RULES.REP_DECAY_THRESHOLD, newScore);
                    if (clampedScore !== rep.score) {
                        await supabase
                            .from('reputations')
                            .update({ score: clampedScore })
                            .eq('id', rep.id);
                        decayCount++;
                    }
                }
                logs.push(`[RepDecay] ${decayCount}件の名声を ${ECONOMY_RULES.REP_DECAY_AMOUNT} 減少させました。`);
            } else {
                logs.push('[RepDecay] Decay対象なし');
            }
        } catch (decayErr: any) {
            logs.push(`[RepDecay] 例外: ${decayErr.message}`);
        }

        return { success: true, logs, hegemony: quotas };

    } catch (e: any) {
        console.error('World Simulation Failed', e);
        return { success: false, error: e.message, logs };
    }
}
