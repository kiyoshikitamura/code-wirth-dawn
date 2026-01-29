import { supabase } from '@/lib/supabase';

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

interface Location {
    id: string;
    name: string;
    x: number;
    y: number;
    type: string;
    nation_id: string; // The original/start nation, mostly used to identify capitals
}

interface WorldState {
    id: string;
    location_name: string;
    controlling_nation: string;
    status: string;
    order_score: number;
    chaos_score: number;
    justice_score: number;
    evil_score: number;
}

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

        // 5. Update Ownership and Calculate Friction
        for (const loc of locations) {
            const newOwner = newAssignments[loc.id];
            const state = stateMap.get(loc.name);
            if (!state) continue;

            // Update Owner
            if (state.controlling_nation !== newOwner) {
                logs.push(`[Change] ${loc.name}: ${state.controlling_nation} -> ${newOwner}`);
                // DB Update to object
                state.controlling_nation = newOwner;
            }

            // Friction / Prosperity Logic
            // 5-Level Status
            const targetAttrField = NATION_ATTRIBUTE_MAP[newOwner] as keyof WorldState;
            const score = state[targetAttrField] as number;

            let currentRank = STATUS_RANK_MAP[state.status] ?? 3; // Default to Prosperous(3) if unknown

            // Rules
            // High Match (>= 60) -> Rank Up (restore/grow)
            // Low Match (< 40) -> Rank Down (friction)
            // Else -> No Change?

            // User: "Large divergence -> lower 1 rank. Match -> raise."
            // Assuming 80 is Init High, 20 is Init Low.

            let change = 0;
            if (score >= 60) change = 1;
            else if (score <= 40) change = -1;

            const oldRank = currentRank;
            currentRank += change;

            // Clamp 0-4
            if (currentRank > 4) currentRank = 4;
            if (currentRank < 0) currentRank = 0;

            const newStatus = RANK_STATUS_MAP[currentRank];

            if (state.status !== newStatus) {
                logs.push(`[Status] ${loc.name}: ${state.status} -> ${newStatus} (Score: ${score})`);
                state.status = newStatus;
            }

            // 6. DB Update
            const { error: updateError } = await supabase
                .from('world_states')
                .update({
                    controlling_nation: state.controlling_nation,
                    status: state.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', state.id);

            if (updateError) {
                logs.push(`Error updating ${loc.name}: ${updateError.message}`);
            }
        }

        logs.push('World update complete.');
        return { success: true, logs, hegemony: quotas };

    } catch (e: any) {
        console.error('World Simulation Failed', e);
        return { success: false, error: e.message, logs };
    }
}
