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

        // 0. Fetch Current Party to Exclude
        const { data: myParty } = await this.supabase
            .from('party_members')
            .select('source_user_id, name, origin_type')
            .eq('owner_id', currentUserId)
            .eq('is_active', true);

        const hiredSourceIds = new Set(myParty?.map(p => p.source_user_id).filter(Boolean));
        const hiredNames = new Set(myParty?.map(p => p.name));

        // 1. Fetch Active Shadows (Players currently here)
        try {
            const { data: activeUsers } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('current_location_id', locationId)
                .neq('id', currentUserId)
                .eq('is_alive', true)
                .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(10);

            if (activeUsers) {
                for (const u of activeUsers) {
                    if (hiredSourceIds.has(u.id)) continue; // Already hired

                    const fee = (u.level || 1) * 100;
                    results.push({
                        profile_id: u.id,
                        name: u.name || u.title_name || 'Unknown Adventurer',
                        level: u.level,
                        job_class: u.title_name || 'Adventurer',
                        origin_type: 'shadow_active',
                        contract_fee: fee,
                        stats: { atk: u.attack, def: u.defense, hp: u.max_hp },
                        signature_deck_preview: u.signature_deck || [],
                        is_subscriber: u.is_subscriber
                    });
                }
            }
        } catch (e) {
            console.error("ShadowService: Failed to fetch active users", e);
        }

        // 2. Fetch Heroic Shadows
        try {
            const { data: heroicLogs } = await this.supabase
                .from('historical_logs')
                .select('*')
                .order('death_date', { ascending: false })
                .limit(5);

            if (heroicLogs) {
                for (const log of heroicLogs) {
                    if (hiredSourceIds.has(log.user_id)) continue; // Already hired

                    const d = log.data;
                    results.push({
                        profile_id: log.user_id,
                        name: `Ghost of ${d.name || 'Unknown'}`,
                        level: d.final_level,
                        job_class: 'Heroic Spirit',
                        origin_type: 'shadow_heroic',
                        contract_fee: (d.final_level * 200),
                        stats: d.stats,
                        signature_deck_preview: [],
                        is_subscriber: true
                    });
                }
            }
        } catch (e) {
            console.error("ShadowService: Failed to fetch heroic shadows", e);
        }

        // 3. System Mercenaries (Always add active ones if not hired)
        const systems = this.generateSystemMercenaries();
        for (const sys of systems) {
            if (hiredNames.has(sys.name)) continue; // Already hired by name
            results.push(sys);
        }

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

        // 1.5 Check Party Size (Max 4)
        const { count, error: countError } = await this.supabase
            .from('party_members')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', hirerId)
            .eq('is_active', true);

        if (countError) return { success: false, error: 'Failed to check party size' };
        if (count !== null && count >= 4) {
            return { success: false, error: 'Party is full (Max 4 members)' };
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

        // 3.5 Resolve Card IDs from Names
        let cardIds: number[] = [];
        if (shadow.signature_deck_preview && shadow.signature_deck_preview.length > 0) {
            const { data: cards } = await this.supabase
                .from('cards')
                .select('id, name')
                .in('name', shadow.signature_deck_preview);

            if (cards) {
                cardIds = cards.map(c => c.id);
            }
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
                inject_cards: cardIds, // Use resolved IDs
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
