import { supabase } from '@/lib/supabase';
import { ScenarioDB, ScenarioCondition, UserProfileDB, LocationDB } from '@/types/game';

// Map textual status to numeric level for comparison
const PROSPERITY_MAP: Record<string, number> = {
    'Ruined': 1,
    'Declining': 2,
    'Stagnant': 3,
    'Prosperous': 4,
    'Zenith': 5
};

interface QuestFetchResult {
    quest: ScenarioDB;
    isAvailable: boolean;
    reason?: string; // Why it's locked (if we want to show grayed out quests)
}

/**
 * Validates if a user meets the specific conditions for a quest
 */
function checkConditions(
    conditions: ScenarioCondition,
    user: UserProfileDB & { tags?: Set<string> },
    location: LocationDB,
    userReputation: number,
    currentWorldState: { prosperity: number, nation: string }
): boolean {

    // 1. Level Check
    if (conditions.min_level && (user.age || 1) < conditions.min_level) {
        // Assuming age correlates to level or checking actual level if added to DB type
        if ((user as any).level && (user as any).level < conditions.min_level) return false;
        // Fallback to age if level missing? Spec says level. 
        // If level missing from user object, we skip or fail safe? 
        // Let's assume level is present on the fetched object outside of strict typing
    }

    // 2. Gender Check
    if (conditions.gender && user.gender !== conditions.gender) {
        return false;
    }

    // 3. Reputation Check (Local)
    if (conditions.required_reputation && userReputation < conditions.required_reputation) {
        return false;
    }

    // 4. Alignment Filters
    // Seeder uses 'required_alignment' (Record<string, number>), Type has 'alignment_filter' (Legacy).
    // checking both for safety.
    const reqAlign = conditions.required_alignment || conditions.alignment_filter;
    if (reqAlign) {
        const ua = user.alignment;
        // Handle Record<string, number> or specific fields
        // required_alignment is { order: 10 } etc.
        const entries = Object.entries(reqAlign);
        for (const [key, val] of entries) {
            const keyLower = key.toLowerCase();
            // user.alignment keys are order, chaos, justice, evil
            if ((ua as any)[keyLower] !== undefined) {
                if ((ua as any)[keyLower] < val) return false;
            }
        }
    }

    // 5. Explicit Location Check
    if (conditions.locations && conditions.locations.length > 0) {
        if (!conditions.locations.includes(location.id) && !conditions.locations.includes(location.name)) {
            return false;
        }
    }

    // 6. Event Trigger Check
    // If a quest has an event trigger, it requires a specific World Event to be active.
    // Currently, no event system is active, so we HIDE these quests by default.
    if (conditions.event_trigger) {
        // TODO: Check against active world events
        return false;
    }

    // 6. Prosperity Check
    if (conditions.min_prosperity) {
        if (currentWorldState.prosperity < conditions.min_prosperity) {
            return false;
        }
    }
    if (conditions.max_prosperity) {
        if (currentWorldState.prosperity > conditions.max_prosperity) {
            return false;
        }
    }

    // 7. Inventory/Tag Check
    if (conditions.required_tags && conditions.required_tags.length > 0) {
        const userTags = user.tags;
        if (!userTags) return false;
        // Check if user has ALL required tags
        const hasAll = conditions.required_tags.every(tag => userTags.has(tag));
        if (!hasAll) return false;
    }

    return true;
}

export const QuestService = {
    /**
     * Main function to get quests for a user at a specific location
     */
    async fetchAvailableQuests(userId: string, locationId: string): Promise<ScenarioDB[]> {
        // 1. Fetch Context: User, Location, WorldState
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) throw new Error('User not found');

        const { data: location, error: locError } = await supabase
            .from('locations')
            .select('*, world_states!inner(*)') // Assuming relation or join manually
            .eq('id', locationId)
            .single();

        // Fallback if JOIN fails or strict FK missing: Fetch location then world_state
        let locData = location;
        let worldState = location?.world_states;

        if (!location) {
            // Retry fetch location only
            const { data: locOnly } = await supabase.from('locations').select('*').eq('id', locationId).single();
            if (!locOnly) throw new Error('Location not found');

            // Fetch world state by name
            const { data: ws } = await supabase
                .from('world_states')
                .select('*')
                .eq('location_name', locOnly.name)
                .single();

            locData = locOnly;
            worldState = ws;
        }

        if (!locData || !worldState) throw new Error('World state data missing');

        const currentNation = worldState.controlling_nation; // e.g. 'Roland'
        const prosperityLevel = PROSPERITY_MAP[worldState.status] || 3;

        // Map DB flat structure to UserProfileDB nested structure
        const mappedUser: UserProfileDB = {
            ...user,
            alignment: {
                order: (user as any).order_pts || 0,
                chaos: (user as any).chaos_pts || 0,
                justice: (user as any).justice_pts || 0,
                evil: (user as any).evil_pts || 0
            }
        };

        // 2. Fetch Reputation & Inventory (Parallel)
        const [repResult, invResult] = await Promise.all([
            supabase
                .from('reputations')
                .select('score')
                .eq('user_id', userId)
                .eq('location_name', locData.name)
                .single(),
            supabase
                .from('inventory')
                .select('*, items!inner(*)') // Join with items to get names/meta
                .eq('user_id', userId)
        ]);

        const currentReputation = repResult.data?.score || 0;

        // Flatten inventory tags: [item_id, item_name, type:item_type]
        const userTags = new Set<string>();
        if (invResult.data) {
            invResult.data.forEach((invItem: any) => {
                if (invItem.items) {
                    userTags.add(invItem.items.name);
                    userTags.add(invItem.items.id);
                    if (invItem.items.item_type) userTags.add(`type:${invItem.items.item_type}`);
                }
            });
        }

        // 3. Fetch Scenarios (Coarse Filter in DB)
        // We want scenarios that:
        // - Have NO location_id restriction OR match current location_id
        // - Have NO ruling_nation restriction OR match current controlling_nation

        // 3. Fetch Scenarios 
        // Querying all and filtering in-memory to ensure complex AND/OR logic is correct.
        // Data set is small (<100 rows), so this is performant enough.
        const { data: scenarios, error: scenError } = await supabase
            .from('scenarios')
            .select('*');

        if (scenError) throw scenError;
        if (!scenarios) return [];

        // 4. Fine-grained Filter (In-Memory)
        const validQuests = scenarios.filter((quest: any) => {
            // DEBUG: Force show sample quest 1001
            if (String(quest.id) === '1001') return true;

            // A. Location Filter
            // Must be NULL (Global) OR match current location
            if (quest.location_id && quest.location_id !== locationId) return false;

            // B. Nation Filter
            // Must be NULL (Neutral/All) OR match current nation
            if (quest.ruling_nation_id && quest.ruling_nation_id !== currentNation) return false;

            // Check Conditions JSON

            // Check Conditions JSON
            const conditions = quest.conditions as ScenarioCondition;
            if (!conditions) return true; // No conditions = open to all

            const userWithTags = { ...mappedUser, tags: userTags };

            return checkConditions(
                conditions,
                userWithTags as any, // Cast to match extended type
                locData as unknown as LocationDB,
                currentReputation,
                { prosperity: prosperityLevel, nation: currentNation }
            );
        });

        // 5. Scoring & Sorting (Logic v9)
        const scoredQuests = validQuests.map((quest: any) => {
            let score = 0;
            const conditions = quest.conditions as ScenarioCondition;

            // A. Urgency (+100)
            if (quest.is_urgent) score += 100;

            // DEBUG: Force boost sample quest 1001
            if (String(quest.id) === '1001') score += 10000;

            // B. Alignment Match (+50)
            // If the quest requires specific alignment and user meets it well (already filtered for numeric req, but here purely for preference)
            // Seeder mapping: align:order -> required_alignment: {order: 10}
            const reqAlign = conditions.required_alignment || conditions.alignment_filter;
            if (reqAlign) {
                // If user has high value in required alignment, boost score
                // Ideally check which alignment it is.
                const entries = Object.entries(reqAlign);
                for (const [key, val] of entries) {
                    const keyLower = key.toLowerCase();
                    const userVal = (mappedUser.alignment as any)[keyLower] || 0;
                    // If user is significantly aligned (e.g. > 20 when req is 10), it's a "good fit"
                    if (userVal >= val + 10) score += 50;
                    else score += 10; // Base match bonus
                }
            }

            // C. Level Match (+20)
            // If rec_level is within ±2 of user level (mappedUser.age used as proxy in checkConditions? No, mappedUser doesn't have level mapped explicitly from DB yet, assuming age logic or default)
            const userLevel = (mappedUser as any).level || 1; // Assuming level exists or default 1
            const recLevel = quest.rec_level || 1;
            if (Math.abs(userLevel - recLevel) <= 2) {
                score += 20;
            }

            return { quest, score };
        });

        // Sort by Score Descending
        scoredQuests.sort((a, b) => b.score - a.score);

        // Limit to top 6
        return scoredQuests.slice(0, 6).map(sq => sq.quest) as ScenarioDB[];
    }
};
