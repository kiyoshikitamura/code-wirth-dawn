import { SupabaseClient } from '@supabase/supabase-js';
import { EconomyService } from './economyService';
import { Card } from '@/types/game';

export interface ShadowSummary {
    profile_id: string; // The original user id (or historical log id for Heroic?)
    name: string;
    level: number;
    job_class: string;
    origin_type: 'shadow_active' | 'shadow_heroic' | 'system_mercenary';
    contract_fee: number;
    stats: { atk: number; def: number; hp: number };
    signature_deck_preview: string[]; // List of card names or IDs
    is_subscriber: boolean;
}

export class ShadowService {
    private economy: EconomyService;

    constructor(private supabase: SupabaseClient) {
        this.economy = new EconomyService(supabase);
    }

    /**
     * Finds available shadows (mercenaries) at the specific location.
     * Consists of:
     * 1. Active Users currently at this location (excluding self).
     * 2. Heroic Shadows (Dead Subscribers) associated with this location (or global random?).
     */
    async findShadowsAtLocation(locationId: string, currentUserId: string): Promise<ShadowSummary[]> {
        const results: ShadowSummary[] = [];

        // 1. Fetch Active Shadows (Players currently here)
        // Spec v5: "Directly 24h active snapshot".
        // We query user_profiles where current_location_id = locationId AND updated_at > 24h ago
        const { data: activeUsers } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('current_location_id', locationId)
            .neq('id', currentUserId)
            .eq('is_alive', true) // Only living players
            .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(10);

        if (activeUsers) {
            for (const u of activeUsers) {
                // Calculate Contract Fee: Level * 100
                const fee = (u.level || 1) * 100;
                results.push({
                    profile_id: u.id,
                    name: u.name,
                    level: u.level,
                    job_class: 'Adventurer', // Placeholder
                    origin_type: 'shadow_active',
                    contract_fee: fee,
                    stats: { atk: u.attack, def: u.defense, hp: u.max_hp },
                    signature_deck_preview: u.signature_deck || [],
                    is_subscriber: u.is_subscriber
                });
            }
        }

        // 2. Fetch Heroic Shadows (From Historical Logs of Subscribers)
        // For now, let's just pick random recent deaths of subscribers?
        // Or maybe Spec v5 says "Shadow Heroic" is a permanent record.
        // We'll query historical_logs where legacy_points > threshold OR user was subscriber.
        // Since we don't have location binding for dead people, we might randomize or show global heroes.
        // Let's keep it empty or simple for now.
        const { data: heroicLogs } = await this.supabase
            .from('historical_logs')
            .select('*')
            .order('death_date', { ascending: false })
            .limit(5);

        // We need to check if they were subscribers. Log data might contain it or we check profile.
        // Spec v7 says "Subscriber: Automatically shadow_heroic".
        // Let's assume we can use them.

        if (heroicLogs) {
            for (const log of heroicLogs) {
                const d = log.data;
                // Filter logic: Check if source user was subscriber?
                // For MVP, include all "Graveyard" ghosts as cheap mercenaries or elite ones.
                results.push({
                    profile_id: log.user_id, // Map to original user ID, but we might need unique ID for hire
                    name: `Ghost of ${d.name || 'Unknown'}`,
                    level: d.final_level,
                    job_class: 'Heroic Spirit',
                    origin_type: 'shadow_heroic',
                    contract_fee: (d.final_level * 200), // Expensive
                    stats: d.stats,
                    signature_deck_preview: [], // Need to extract from log data
                    is_subscriber: true // Assume heroic
                });
            }
        }

        // 3. System Mercenaries (NPCs)
        const systems = this.generateSystemMercenaries();
        results.push(...systems);

        return results;
    }

    private generateSystemMercenaries(): ShadowSummary[] {
        return [
            {
                profile_id: 'sys_warrior',
                name: '歴戦の傭兵ヴォルフ',
                level: 5,
                job_class: 'Warrior',
                origin_type: 'system_mercenary',
                contract_fee: 500,
                stats: { atk: 18, def: 8, hp: 150 },
                signature_deck_preview: ['Heavy Slash', 'Guard'],
                is_subscriber: false
            },
            {
                profile_id: 'sys_mage',
                name: '放浪魔術師エレナ',
                level: 4,
                job_class: 'Mage',
                origin_type: 'system_mercenary',
                contract_fee: 600,
                stats: { atk: 22, def: 3, hp: 90 },
                signature_deck_preview: ['Fireball', 'Meditate'],
                is_subscriber: false
            }
        ];
    }

    /**
     * Hires a shadow.
     * 1. Check Gold.
     * 2. Deduct Gold (Hirer).
     * 3. Distribute Royalty (Source).
     * 4. Create Party Member.
     */
    async hireShadow(hirerId: string, shadow: ShadowSummary): Promise<{ success: boolean; error?: string }> {
        // 1. Fetch Hirer Profile
        const { data: hirer } = await this.supabase
            .from('user_profiles')
            .select('gold')
            .eq('id', hirerId)
            .single();

        if (!hirer || hirer.gold < shadow.contract_fee) {
            return { success: false, error: 'Not enough gold' };
        }

        // 2. Deduct Gold (Simple Update for MVP, use RPC in prod)
        await this.supabase
            .from('user_profiles')
            .update({ gold: hirer.gold - shadow.contract_fee })
            .eq('id', hirerId);

        // 3. Distribute Royalty
        // Royalty Rate: Free=10%, Sub=30%
        const rate = shadow.is_subscriber ? 0.3 : 0.1;
        const royaltyAmount = Math.floor(shadow.contract_fee * rate);

        // Use Economy Service for Anti-Fraud logic
        // Only for active shadows. Heroic shadows might go to system or legacy fund?
        if (shadow.origin_type === 'shadow_active') {
            await this.economy.distributeRoyalty({
                sourceUserId: shadow.profile_id,
                targetUserId: hirerId,
                amount: royaltyAmount
            });
        }

        // 4. Create Party Member
        const { error: insertError } = await this.supabase
            .from('party_members')
            .insert({
                owner_id: hirerId,
                name: shadow.name,
                source_user_id: shadow.origin_type === 'system_mercenary' ? null : shadow.profile_id,
                origin_type: shadow.origin_type,
                durability: 100, // Default durability
                inject_cards: shadow.signature_deck_preview, // Should be IDs
                royalty_rate: shadow.origin_type === 'shadow_active' ? percentageToInteger(rate) : 0,
                is_active: true
            });

        if (insertError) return { success: false, error: insertError.message };

        return { success: true };
    }
}

function percentageToInteger(rate: number): number {
    return Math.floor(rate * 100);
}
