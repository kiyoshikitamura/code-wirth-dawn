import { SupabaseClient } from '@supabase/supabase-js';

export class LifeCycleService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Handles the death of a character.
     * 1. Sets is_alive = false
     * 2. Creates a historical snapshot (Graveyard data)
     * 3. Calculates legacy points for the next life
     * 4. (If Subscriber) Registers as a Heroic Shadow
     */
    async handleCharacterDeath(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Fetch current profile data
            const { data: profile, error: fetchError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError || !profile) throw new Error(fetchError?.message || 'Profile not found');

            // 2. Calculate Legacy Points
            // Formula: (Total Days * 10) + (Level * 100) + (Reputation Rank Bonus?)
            // Subscriber Bonus: x1.5
            let legacyPoints = (profile.accumulated_days * 10) + (profile.level * 100);
            if (profile.is_subscriber) {
                legacyPoints = Math.floor(legacyPoints * 1.5);
            }

            // 3. Create Snapshot Data
            const snapshotData = {
                final_level: profile.level,
                final_gold: profile.gold,
                stats: {
                    atk: profile.attack,
                    def: profile.defense,
                    hp: profile.max_hp
                },
                equipment: null, // To be implemented if equipment is detailed
                cause: 'Vitality Depletion'
            };

            // 4. Update Profile (Death & Points)
            const { error: updateError } = await this.supabase
                .from('user_profiles')
                .update({
                    is_alive: false,
                    legacy_points: legacyPoints,
                    vitality: 0
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 5. Create Historical Log
            const { error: logError } = await this.supabase
                .from('historical_logs')
                .insert({
                    user_id: userId,
                    data: snapshotData,
                    legacy_points: legacyPoints,
                    cause_of_death: '的老衰' // or logic for battle death
                });

            if (logError) throw logError;

            // 6. (Subscriber Only) Register as Heroic Shadow
            if (profile.is_subscriber) {
                // Logic to register to 'party_members' as 'shadow_heroic'
                // This would be a separate insert, available for hire.
                // For now, we just log it or implement if Spec V5 details exact table.
                // Assuming 'party_members' table handles available mercs? 
                // Wait, 'party_members' are HIRED members. 
                // We need a 'public_mercenaries' or just use 'user_profiles' as the source.
                // Spec V5 says: "party_members table origin_type". 
                // Ah, hire list comes from query active users. 
                // Heroic shadows might need a specific flag or be queryable even if dead.
                // For now, dead profiles with is_subscriber=true ARE the Heroic Shadows.
            }

            return { success: true };

        } catch (e: any) {
            console.error('Death Handler Error:', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Initializes a new character, applying valid inheritance.
     */
    async processInheritance(userId: string, newProfileData: any): Promise<any> {
        // Fetch previous legacy points if any (Need to track from previous life?)
        // Actually, user_id is the same. We are resetting the profile.
        // So we read 'legacy_points' FROM the current profile BEFORE resetting it?
        // Or we assume 'legacy_points' was stored in 'user_profiles' and we keep it during reset?

        // Spec V7: "Next character creation time".
        // If we are doing a "Reset" (UPDATE), we should read legacy_points first.

        const { data: oldProfile } = await this.supabase
            .from('user_profiles')
            .select('legacy_points, gold, is_subscriber')
            .eq('id', userId)
            .single();

        const legacyPoints = oldProfile?.legacy_points || 0;
        const isSubscriber = oldProfile?.is_subscriber || false;

        // Inheritance Logic
        // Free: 10% Gold. Subscriber: 50% Gold.
        const inheritanceRate = isSubscriber ? 0.5 : 0.1;
        const inheritedGold = Math.floor((oldProfile?.gold || 0) * inheritanceRate);

        // Prepare new data
        const finalData = {
            ...newProfileData,
            gold: (newProfileData.gold || 1000) + inheritedGold,
            legacy_points: 0, // Consumed? Or kept as score? Usually consumed or reset.
            is_alive: true,
            vitality: 100,
            accumulated_days: 0,
            age: 20
        };

        // If subscriber, maybe allow item inheritance (Not implemented yet)

        return finalData;
    }
}
