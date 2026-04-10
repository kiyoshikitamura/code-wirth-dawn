import { SupabaseClient } from '@supabase/supabase-js';

interface DeathOptions {
    heirloomItemIds?: string[];
    allowedSlots?: number;
    paidGold?: number;
}

export class LifeCycleService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Handles the death of a character.
     * 1. Sets is_alive = false
     * 2. Creates a historical snapshot (Graveyard data) — form見情報を含む
     * 3. Calculates legacy points for the next life
     * 4. (If Subscriber) Registers as a Heroic Shadow (shadow_heroic)
     *    - Deck: skill type only (consumables strictly excluded)
     */
    async handleCharacterDeath(
        userId: string,
        cause: string = 'Vitality Depletion',
        options?: DeathOptions
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Fetch current profile data
            const { data: profile, error: fetchError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError || !profile) throw new Error(fetchError?.message || 'Profile not found');

            // 2. Calculate Legacy Points
            let legacyPoints = (profile.accumulated_days * 10) + (profile.level * 100);
            const tier = profile.subscription_tier ?? 'free';
            if (tier !== 'free') {
                legacyPoints = Math.floor(legacyPoints * 1.5);
            }

            // 3. Create Snapshot Data（タスク2: 形見情報をスナップショットに含める）
            const snapshotData = {
                final_level: profile.level,
                final_gold: profile.gold,
                stats: {
                    atk: profile.attack,
                    def: profile.defense,
                    hp: profile.max_hp
                },
                equipment: null,
                cause: cause,
                // タスク2: 形見情報をhistorical_logsに永続化（次世代のprocessInheritance()で読み込む）
                heirloom_item_ids: options?.heirloomItemIds || [],
                allowed_slots: options?.allowedSlots || 1,
                paid_gold_for_slots: options?.paidGold || 0
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
                    cause_of_death: cause
                });

            if (logError) throw logError;

            // 5.5 Insert into retired_characters (Graveyard Archive UI)
            const { count: questsCount } = await this.supabase
                .from('user_completed_quests')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            const { error: retiredError } = await this.supabase
                .from('retired_characters')
                .insert({
                    user_id: userId,
                    name: profile.name || profile.title_name || 'Unknown',
                    age_days: profile.accumulated_days || 0,
                    cause_of_death: cause,
                    final_location_id: profile.current_location_id,
                    completed_quests_count: questsCount || 0,
                    snapshot: snapshotData
                });

            if (retiredError) {
                console.warn('Failed to save to retired_characters graveyard:', retiredError.message);
                // Non-fatal, keep going
            }

            // 6. 英霊登録（仕様: spec_v13 §4, spec_v10 §3.2）
            //    free:不可 / basic:最大3体 / premium:最大10体
            //    上限到達時はFIFO（最古の英霊を削除して新規登録）
            const herTier = profile.subscription_tier ?? 'free';
            const heroicLimit = herTier === 'premium' ? 10 : herTier === 'basic' ? 3 : 0;

            if (heroicLimit > 0) {
                const { count, data: existingHeroics } = await this.supabase
                    .from('party_members')
                    .select('id, created_at', { count: 'exact' })
                    .eq('owner_id', userId)
                    .eq('origin_type', 'shadow_heroic')
                    .order('created_at', { ascending: true });

                const currentCount = count || 0;

                // FIFO: 上限に達している、または上限を超えている場合、最古の英霊から順に削除して空きを作る
                if (currentCount >= heroicLimit && existingHeroics) {
                    // 何体削除する必要があるか計算 (新規追加する1体分も考慮)
                    const excessCount = currentCount - heroicLimit + 1;
                    const oldestMembers = existingHeroics.slice(0, excessCount);
                    
                    for (const member of oldestMembers) {
                        await this.supabase.from('party_members').delete().eq('id', member.id);
                        console.log('Heroic FIFO: deleted heroic', member.id);
                    }
                }
                // v18: デッキバリデーション — user_skills から装備中スキルを取得
                let heroicDeck: string[] = [];
                const signatureDeck = profile.signature_deck;

                if (signatureDeck && Array.isArray(signatureDeck) && signatureDeck.length > 0) {
                    // signature_deck がある場合はそのまま使用（cards.id の配列）
                    heroicDeck = signatureDeck.map((id: any) => String(id));
                } else {
                    // Fallback: user_skills から装備中スキルを取得
                    const { data: equippedSkills } = await this.supabase
                        .from('user_skills')
                        .select('skill_id, skills(card_id)')
                        .eq('user_id', userId)
                        .eq('is_equipped', true)
                        .limit(5);

                    if (equippedSkills) {
                        heroicDeck = equippedSkills
                            .filter((e: any) => e.skills?.card_id)
                            .map((e: any) => String(e.skills.card_id));
                    }
                }

                // 有効カードが0枚の場合は基本アタックをフォールバック
                if (heroicDeck.length === 0) {
                    heroicDeck = ['1001']; // 錆びた剣 (Basic Attack)
                }

                // FIFO または空き枠がある場合は新規登録
                // タスク3-A: origin_type を 'shadow_heroic' で登録（仕様に合致）
                const heroicData = {
                    owner_id: userId,
                    name: profile.name || profile.title_name,
                    job_class: 'Hero',
                    level: profile.level,
                    durability: profile.max_hp ?? 100,
                    max_durability: profile.max_hp ?? 100,
                    atk: profile.atk ?? profile.attack ?? 0,  // v8.1: 正しいフィールド名を使用
                    def: profile.def ?? profile.defense ?? 0,
                    cover_rate: 20,
                    loyalty: 100,
                    is_active: false,
                    origin: 'ghost',
                    origin_type: 'shadow_heroic',
                    image_url: profile.avatar_url,
                    inject_cards: heroicDeck,
                    snapshot_data: {
                        level: profile.level,
                        atk: profile.atk ?? profile.attack ?? 0,
                        def: profile.def ?? profile.defense ?? 0,
                        hp: profile.max_hp,
                        deck: heroicDeck,
                    },
                };

                await this.supabase.from('party_members').insert([heroicData]);
                console.log('Heroic Spirit Registered:', heroicData.name, 'Tier:', herTier);
            } else {
                console.log('Free Tier: Heroic Shadow registration skipped.');
            }

            return { success: true };

        } catch (e: any) {
            console.error('Death Handler Error:', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Initializes a new character, applying valid inheritance.
     * Spec v10: Gold, Reputation, Heirloom
     * タスク2: historical_logs から heirloom_item_ids を読み込み inventory に INSERT する。
     */
    async processInheritance(userId: string, newProfileData: any, heirloomItemIds?: string[]): Promise<any> {
        const { data: oldProfile } = await this.supabase
            .from('user_profiles')
            .select('legacy_points, gold, subscription_tier')
            .eq('id', userId)
            .single();

        const oldTier = oldProfile?.subscription_tier ?? 'free';
        const isSubscriber = oldTier !== 'free';

        // 1. Gold Inheritance
        const goldRate = isSubscriber ? 0.5 : 0.1;
        // Q2: 継承ゴールド上限 50,000G（spec_v7 §3.1）
        const inheritedGold = Math.min(50000, Math.floor((oldProfile?.gold || 0) * goldRate));

        // 2. Reputation Inheritance (Sub Only: 10% of each location's score)
        // Q3: 名声継承を reputations テーブルに書き戻す（spec_v10 §4.2）
        let inheritedRep = 0;
        if (isSubscriber) {
            const { data: repData } = await this.supabase
                .from('reputations')
                .select('id, location_name, score')
                .eq('user_id', userId);
            if (repData && repData.length > 0) {
                const totalScore = repData.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
                inheritedRep = Math.floor(totalScore * 0.1);

                // Q3: 各拠点の名声を展開して書き戻す（10%を各拠点に分配）
                for (const rep of repData) {
                    const inheritedForLocation = Math.floor((rep.score || 0) * 0.1);
                    if (inheritedForLocation !== 0) {
                        await this.supabase
                            .from('reputations')
                            .upsert({
                                user_id: userId,
                                location_name: rep.location_name,
                                score: inheritedForLocation
                            }, { onConflict: 'user_id,location_name' });
                    }
                }
                console.log(`[Inheritance] Reputation inherited: ${inheritedRep} (across ${repData.length} locations)`);
            }
        }

        // 3. タスク2: 形見引き継ぎ — historical_logs から heirloom_item_ids を取得
        // まず前世代スナップショットから形見情報を読み込む
        let resolvedHeirloomIds: string[] = heirloomItemIds || [];
        if (resolvedHeirloomIds.length === 0) {
            const { data: lastLog } = await this.supabase
                .from('historical_logs')
                .select('data')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (lastLog?.data?.heirloom_item_ids && Array.isArray(lastLog.data.heirloom_item_ids)) {
                resolvedHeirloomIds = lastLog.data.heirloom_item_ids;
            }
        }

        // インベントリをリセット（前世代の全アイテムを削除）
        const { data: inventory } = await this.supabase
            .from('inventory')
            .select('*')
            .eq('user_id', userId);

        await this.supabase.from('inventory').delete().eq('user_id', userId);

        // タスク2: 形見アイテムを inventory に実際に INSERT
        if (resolvedHeirloomIds.length > 0) {
            let heirloomsToKeep: any[] = [];

            if (inventory && inventory.length > 0) {
                resolvedHeirloomIds.forEach(id => {
                    const found = inventory.find((i: any) => String(i.item_id) === String(id));
                    if (found) heirloomsToKeep.push(found);
                });
            }

            // フォールバック: item_id直接指定でスロットがある場合
            if (heirloomsToKeep.length === 0 && resolvedHeirloomIds.length > 0) {
                heirloomsToKeep = resolvedHeirloomIds.map(id => ({ item_id: id }));
            }

            if (heirloomsToKeep.length > 0) {
                const inserts = heirloomsToKeep.map(h => ({
                    user_id: userId,
                    item_id: h.item_id,
                    quantity: 1,
                    is_equipped: false
                }));
                await this.supabase.from('inventory').insert(inserts);
                console.log("Heirlooms inherited:", inserts.map(i => i.item_id));
            }
        }

        // Prepare new data
        const finalData = {
            ...newProfileData,
            gold: (newProfileData.gold || 1000) + inheritedGold,
            legacy_points: 0,
            is_alive: true,
            vitality: newProfileData.max_vitality ?? 100,
            accumulated_days: 0,
            age: newProfileData.age ?? 20,
            hp: newProfileData.max_hp ?? 100,
            max_hp: newProfileData.max_hp ?? 100
        };

        return finalData;
    }
}
