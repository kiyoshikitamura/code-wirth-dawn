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
    async handleCharacterDeath(userId: string, cause: string = 'Vitality Depletion'): Promise<{ success: boolean; error?: string }> {
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
                cause: cause
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
                // Check Slots (Default 1)
                const { count, error: countError } = await this.supabase
                    .from('party_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', userId)
                    .eq('origin_type', 'heroic');

                const maxSlots = 1;

                if ((count || 0) < maxSlots) {
                    // v5.1/v10.1: Heroic Deck Validation
                    // Fetch equipped cards and filter out consumables and vitality-cost cards
                    let heroicDeck: string[] = [];
                    const signatureDeck = profile.signature_deck;
                    if (signatureDeck && Array.isArray(signatureDeck) && signatureDeck.length > 0) {
                        // Fetch card details to validate
                        const { data: deckCards } = await this.supabase
                            .from('items')
                            .select('id, type, cost_type')
                            .in('id', signatureDeck);

                        if (deckCards) {
                            heroicDeck = deckCards
                                .filter((c: any) => c.type !== 'consumable' && c.cost_type !== 'vitality')
                                .map((c: any) => String(c.id));
                        }
                    } else {
                        // Fallback: try equipped inventory
                        const { data: equipped } = await this.supabase
                            .from('inventory')
                            .select('item_id, items(type, cost_type)')
                            .eq('user_id', userId)
                            .eq('is_equipped', true)
                            .limit(5);

                        if (equipped) {
                            heroicDeck = equipped
                                .filter((e: any) => {
                                    const item = e.items;
                                    return item && item.type !== 'consumable' && item.cost_type !== 'vitality';
                                })
                                .map((e: any) => String(e.item_id));
                        }
                    }

                    // Fallback: if no valid cards, use basic attack
                    if (heroicDeck.length === 0) {
                        heroicDeck = ['1001']; // 錆びた剣 (Basic Attack)
                    }

                    // Register
                    const heroicData = {
                        owner_id: userId,
                        name: profile.name || profile.title_name,
                        job_class: 'Hero',
                        level: profile.level,
                        hp: profile.max_hp,
                        max_hp: profile.max_hp,
                        atk: profile.attack,
                        def: profile.defense,
                        speed: 10,
                        cost: 10,
                        is_active: false,
                        origin_type: 'heroic',
                        image_url: profile.avatar_url,
                        contract_gold: 0,
                        loyalty: 100,
                        inject_cards: heroicDeck, // v10.1: Validated legacy deck
                        snapshot_data: {
                            level: profile.level,
                            atk: profile.attack,
                            def: profile.defense,
                            hp: profile.max_hp,
                            deck: heroicDeck,
                        },
                    };

                    await this.supabase.from('party_members').insert([heroicData]);
                    console.log("Heroic Spirit Registered:", heroicData.name, "Deck:", heroicDeck);
                } else {
                    console.log("Heroic Slots Full. Skipping registration.");
                }
            }

            return { success: true };

        } catch (e: any) {
            console.error('Death Handler Error:', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Initializes a new character, applying valid inheritance.
     * Spec v10: Gold, Reputation, Heirloom (Simplified)
     * No Recipe/Knowledge inheritance.
     */
    async processInheritance(userId: string, newProfileData: any, heirloomItemId?: string): Promise<any> {
        const { data: oldProfile } = await this.supabase
            .from('user_profiles')
            .select('legacy_points, gold, is_subscriber')
            .eq('id', userId)
            .single();

        const isSubscriber = oldProfile?.is_subscriber || false;

        // 1. Gold Inheritance
        // Free: 10%, Sub: 50%
        const goldRate = isSubscriber ? 0.5 : 0.1;
        const inheritedGold = Math.floor((oldProfile?.gold || 0) * goldRate);

        // 2. Reputation Inheritance (Sub Only: 10% of total score from reputations table)
        let inheritedRep = 0;
        if (isSubscriber) {
            const { data: repData } = await this.supabase
                .from('reputations')
                .select('score')
                .eq('user_id', userId);
            if (repData && repData.length > 0) {
                const totalScore = repData.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
                inheritedRep = Math.floor(totalScore * 0.1);
            }
        }

        // 3. Heirloom Inheritance (Sub Only: 1 Item)
        // Delete all inventory first (Reset)
        const { data: inventory } = await this.supabase
            .from('inventory')
            .select('*')
            .eq('user_id', userId);

        await this.supabase.from('inventory').delete().eq('user_id', userId);

        if (isSubscriber && inventory && inventory.length > 0) {
            // v10.1: Use specified heirloom_item_id if provided, otherwise pick random
            let heirloom = null;
            if (heirloomItemId) {
                heirloom = inventory.find((i: any) => String(i.item_id) === String(heirloomItemId));
            }
            if (!heirloom) {
                // Fallback: random item
                const randomIndex = Math.floor(Math.random() * inventory.length);
                heirloom = inventory[randomIndex];
            }

            if (heirloom) {
                await this.supabase.from('inventory').insert({
                    user_id: userId,
                    item_id: heirloom.item_id,
                    quantity: 1,
                    is_equipped: false
                });
                console.log("Heirloom inherited:", heirloom.item_id);
            }
        }

        // Prepare new data
        const finalData = {
            ...newProfileData,
            gold: (newProfileData.gold || 1000) + inheritedGold,
            legacy_points: 0,
            is_alive: true,
            vitality: newProfileData.max_vitality ?? 100, // Respect input or default
            accumulated_days: 0,
            age: newProfileData.age ?? 20,
            hp: newProfileData.max_hp ?? 100, // Respect input or default
            max_hp: newProfileData.max_hp ?? 100
        };

        return finalData;
    }
}
