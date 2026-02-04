import { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface RoyaltyTransaction {
    sourceUserId: string; // The Mercenary (Receiver)
    targetUserId: string; // The Hirer (Payer)
    amount: number;
}

export class EconomyService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Distributes royalty to the mercenary's owner.
     * Includes Anti-Fraud checks (v7).
     */
    async distributeRoyalty(tx: RoyaltyTransaction): Promise<{ success: boolean; error?: string }> {
        const { sourceUserId, targetUserId, amount } = tx;

        // 0. Deduplication Check (Anti-Fraud)
        // Check if target has already paid source in the last 24h
        const { data: existingLogs } = await this.supabase
            .from('royalty_logs')
            .select('created_at')
            .eq('source_user_id', sourceUserId)
            .eq('target_user_id', targetUserId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

        if (existingLogs && existingLogs.length > 0) {
            console.warn(`Royalty skipped: Abuse prevention (Duplicate payment in 24h).`);
            return { success: false, error: 'Duplicate payment' };
        }

        // 1. Daily Cap Check (Anti-Fraud)
        // Calculate total earned today
        const { data: dailyTotal } = await this.supabase
            .from('royalty_logs')
            .select('amount')
            .eq('source_user_id', sourceUserId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const currentDailySum = dailyTotal?.reduce((sum, log) => sum + log.amount, 0) || 0;

        // Fetch User Level for Cap Calculation
        // Formula: Level * 1000 Gold
        const { data: userProfile } = await this.supabase
            .from('user_profiles')
            .select('level')
            .eq('id', sourceUserId)
            .single();

        const dailyCap = (userProfile?.level || 1) * 1000;

        if (currentDailySum >= dailyCap) {
            console.warn(`Royalty skipped: Daily Cap Reached (${currentDailySum}/${dailyCap}).`);
            return { success: false, error: 'Daily Cap Reached' };
        }

        // 2. Perform Transaction
        // Update Logs & Add Gold to Source
        // Use RPC or separate calls. For secure money, RPC is better, but here separate.

        // A. Log
        const { error: logError } = await this.supabase
            .from('royalty_logs')
            .insert({
                source_user_id: sourceUserId,
                target_user_id: targetUserId,
                amount: amount
            });

        if (logError) return { success: false, error: logError.message };

        // B. Add Gold
        // Note: Needs strict SQL or Rpc to avoid race conditions in real prod.
        const { error: goldError } = await this.supabase.rpc('increment_gold', {
            row_id: sourceUserId,
            amount: amount
        });

        // Fallback if RPC not exists (Prototype mode)
        if (goldError) {
            // Manual update
            const { error: manualError } = await this.supabase
                .from('user_profiles')
                .update({
                    gold: (userProfile as any)?.gold + amount, // Need fresh fetch ideally
                    total_royalty_earned: (userProfile as any)?.total_royalty_earned + amount
                })
                .eq('id', sourceUserId);
        }

        return { success: true };
    }

    /**
     * Fetches shop items with dynamic price/availability logic (Spec v6).
     */
    async getShopItems(locationName: string, userId: string) {
        // 1. Fetch Location Context (Prosperity, Nation)
        const { data: worldState } = await this.supabase
            .from('world_states')
            .select('status, controlling_nation, prosperity_level')
            .eq('location_name', locationName)
            .single();

        // 2. Fetch User Context (Reputation, Alignment)
        // Mocking alignment for now if not in DB

        // 3. Definition of Inflation
        // 5(Zenith)=1.0, 4=1.0, 3=1.2, 2=1.5, 1=Ruined(N/A)
        let priceMultiplier = 1.0;
        const prosperity = worldState?.prosperity_level || 4;

        if (prosperity === 3) priceMultiplier = 1.2;
        if (prosperity === 2) priceMultiplier = 1.5;
        if (prosperity === 1) priceMultiplier = 3.0; // Black Market pricing

        // 4. Fetch Items
        const { data: items } = await this.supabase
            .from('items')
            .select('*');

        if (!items) return [];

        // 5. Filter & Calculate
        return items.map(item => {
            // Nation Filter? (Mock)
            // Alignment Filter? (Mock)

            return {
                ...item,
                current_price: Math.ceil(item.base_price * priceMultiplier),
                is_inflated: priceMultiplier > 1.0
            };
        });
    }
}
