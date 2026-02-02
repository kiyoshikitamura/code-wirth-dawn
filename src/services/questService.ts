import { supabase } from '@/lib/supabase';
import { ScenarioDB, ScenarioCondition, UserProfileDB, LocationDB } from '@/types/database';

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
    if (conditions.alignment_filter) {
        const ua = user.alignment;
        const req = conditions.alignment_filter;
        if (req.order && ua.order < req.order) return false;
        if (req.chaos && ua.chaos < req.chaos) return false;
        if (req.justice && ua.justice < req.justice) return false;
        if (req.evil && ua.evil < req.evil) return false;
    }

    // 5. Explicit Location Check (if Array provided)
    if (conditions.locations && conditions.locations.length > 0) {
        if (!conditions.locations.includes(location.id) && !conditions.locations.includes(location.name)) {
            return false;
        }
    }

    // 6. Inventory/Tag Check
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

        const { data: scenarios, error: scenError } = await supabase
            .from('scenarios')
            .select('*')
            .or(`location_id.is.null,location_id.eq.${locationId}`)
            .or(`ruling_nation_id.is.null,ruling_nation_id.eq.${currentNation}`);

        if (scenError) throw scenError;
        if (!scenarios) return [];

        // 4. Fine-grained Filter (In-Memory)
        const validQuests = scenarios.filter((quest: any) => {
            // Check Conditions JSON
            const conditions = quest.conditions as ScenarioCondition;
            if (!conditions) return true; // No conditions = open to all

            const userWithTags = { ...user, tags: userTags };

            return checkConditions(
                conditions,
                userWithTags as any, // Cast to match extended type
                locData as unknown as LocationDB,
                currentReputation,
                { prosperity: prosperityLevel, nation: currentNation }
            );
        });

        return validQuests as ScenarioDB[];
    }
};
