import { SupabaseClient } from '@supabase/supabase-js';
import { EconomyService } from './economyService';
import { Card } from '@/types/game';
import { ECONOMY_RULES } from '@/constants/game_rules';

export interface ShadowSummary {
    profile_id: string;
    name: string;
    epithet?: string;       // 称号（通り名）
    level: number;
    job_class: string;
    origin_type: 'shadow_active' | 'shadow_heroic' | 'system_mercenary';
    contract_fee: number;
    stats: { atk: number; def: number; hp: number };
    signature_deck_preview: string[];
    subscription_tier: 'free' | 'basic' | 'premium';
    icon_url?: string;
    image_url?: string;
    flavor_text?: string;   // NPCのフレーバーテキスト（台詞）
    npc_image_url?: string; // NPC専用イメージURL
}

// タスク1: 英霊（shadow_heroic）の契約金算出式
// 仕様: spec_v5_shadow_system.md §5.2
// 5,000G（BaseFee）+ Level × 1,000G（Modifier）
// 例: Lv10 → 15,000G / Lv30 → 35,000G / Lv50 → 55,000G
function calcHeroicContractFee(level: number): number {
    return ECONOMY_RULES.HIRE_HEROIC_BASE + Math.max(1, level) * ECONOMY_RULES.HIRE_HEROIC_PER_LEVEL;
}

// タスク2: ロイヤリティ分配率（英霊）
// 20% → 元プレイヤー（owner_id）へ / 残り80% → システム税（消滅）
const HEROIC_ROYALTY_RATE = 0.20;

// タスク1: ロイヤリティ日額上限
// 仕様: spec_v7_lifecycle_economy.md §5.1
// Lv1-10: 100G/日 / Lv11-20: 300G/日 / Lv21+: 50,000G/日
function getDailyRoyaltyCap(level: number): number {
    if (level <= 10) return 100;
    if (level <= 20) return 300;
    return 50000;
}

export class ShadowService {
    private economy: EconomyService;

    constructor(private supabase: SupabaseClient) {
        this.economy = new EconomyService(supabase);
    }

    /**
     * Finds available shadows (mercenaries) at the specific location.
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
                .neq('name', null)
                .limit(10);

            if (activeUsers && activeUsers.length > 0) {
                // アクティブ残影のスキルIDを一括収集してcard名に解決
                const allActiveCardIds: number[] = [];
                for (const u of activeUsers) {
                    const deck = u.signature_deck || [];
                    for (const id of deck) {
                        const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                        if (!isNaN(numId) && !allActiveCardIds.includes(numId)) allActiveCardIds.push(numId);
                    }
                }
                const activeCardNameMap: Record<number, string> = {};
                if (allActiveCardIds.length > 0) {
                    const { data: activeCards } = await this.supabase
                        .from('cards')
                        .select('id, name')
                        .in('id', allActiveCardIds);
                    if (activeCards) {
                        for (const c of activeCards) activeCardNameMap[c.id] = c.name;
                    }
                }

                for (const u of activeUsers) {
                    if (hiredSourceIds.has(u.id)) continue;

                    const fee = (u.level || 1) * ECONOMY_RULES.HIRE_ACTIVE_PER_LEVEL;
                    const rawDeck: (number | string)[] = u.signature_deck || [];
                    const deckNames = rawDeck.map(id => {
                        const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                        return activeCardNameMap[numId] || `スキル#${numId}`;
                    });
                    results.push({
                        profile_id: u.id,
                        name: u.name || 'Unknown Adventurer',
                        level: u.level,
                        job_class: u.title_name || 'Adventurer',
                        origin_type: 'shadow_active',
                        contract_fee: fee,
                        stats: { atk: u.attack, def: u.defense, hp: u.max_hp },
                        signature_deck_preview: deckNames,
                        subscription_tier: (u.subscription_tier ?? 'free') as 'free' | 'basic' | 'premium',
                        icon_url: u.avatar_url || undefined,
                    });
                }
            }
        } catch (e) {
            console.error("ShadowService: Failed to fetch active users", e);
        }

        // 2. Fetch Heroic Shadows from historical_logs
        try {
            const { data: heroicLogs } = await this.supabase
                .from('historical_logs')
                .select('*')
                .order('death_date', { ascending: false })
                .limit(5);

            if (heroicLogs) {
                for (const log of heroicLogs) {
                    if (hiredSourceIds.has(log.user_id)) continue;

                    const d = log.data;
                    const level = d.final_level || 1;
                    results.push({
                        profile_id: log.user_id,
                        name: `Ghost of ${d.name || 'Unknown'}`,
                        level,
                        job_class: 'Heroic Spirit',
                        origin_type: 'shadow_heroic',
                        // タスク1: 5,000G + Level × 1,000G の算出式を適用
                        contract_fee: calcHeroicContractFee(level),
                        stats: d.stats,
                        signature_deck_preview: [],
                        subscription_tier: 'basic' as const
                    });
                }
            }
        } catch (e) {
            console.error("ShadowService: Failed to fetch heroic shadows", e);
        }

        // 3. System Mercenaries
        const systems = await this.generateSystemMercenaries(locationId);
        for (const sys of systems) {
            if (hiredNames.has(sys.name)) continue;
            results.push(sys);
        }

        return results;
    }

    async generateSystemMercenaries(locationId: string): Promise<ShadowSummary[]> {
        const results: ShadowSummary[] = [];
        try {
            // Get location context (ruling nation, prosperity)
            const { data: loc } = await this.supabase
                .from('locations')
                .select('ruling_nation_id, prosperity_level')
                .eq('id', locationId)
                .single();

            const rulingNation = loc?.ruling_nation_id?.toLowerCase() || 'unknown';
            const isCapital = loc?.prosperity_level && loc.prosperity_level >= 4;

            const { data: npcs } = await this.supabase
                .from('npcs')
                .select('*')
                .eq('is_hireable', true)
                .eq('origin', 'system_mercenary');

            if (npcs) {
                // 1. Filter native NPCs
                const nativeNpcs = rulingNation === 'unknown'
                    ? npcs
                    : npcs.filter(n => n.slug?.toLowerCase().includes(rulingNation));

                // 2. Freelance / Hero NPCs rotation (capitals only)
                const freelanceNpcs = npcs.filter(n => n.slug?.toLowerCase().includes('free'));
                const targetNpcs = [...nativeNpcs];

                if (isCapital && freelanceNpcs.length > 0) {
                    const todaySeed = Math.floor(Date.now() / 86400000);
                    const locationHash = Array.from(locationId).reduce((acc, char) => acc + char.charCodeAt(0), todaySeed);
                    const index1 = locationHash % freelanceNpcs.length;
                    const index2 = (locationHash + 7) % freelanceNpcs.length;
                    targetNpcs.push(freelanceNpcs[index1]);
                    if (index1 !== index2) targetNpcs.push(freelanceNpcs[index2]);
                }

                // 3. 全NPCのinject_cards（数値ID）を収集してcardsテーブルで一括名前解決
                const allCardIds: number[] = [];
                for (const npc of targetNpcs) {
                    const ids = npc.inject_cards || npc.default_cards || [];
                    for (const id of ids) {
                        const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                        if (!isNaN(numId) && !allCardIds.includes(numId)) allCardIds.push(numId);
                    }
                }

                // cardsテーブルからカード名をbatch取得
                const cardNameMap: Record<number, string> = {};
                if (allCardIds.length > 0) {
                    const { data: cards } = await this.supabase
                        .from('cards')
                        .select('id, name')
                        .in('id', allCardIds);
                    if (cards) {
                        for (const card of cards) {
                            cardNameMap[card.id] = card.name;
                        }
                    }
                }

                // 4. NPCごとにsignature_deck_previewをカード名に変換
                for (const npc of targetNpcs) {
                    const rawIds: (number | string)[] = npc.inject_cards || npc.default_cards || [];
                    const deckNames = rawIds.map(id => {
                        const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                        return cardNameMap[numId] || `スキル#${numId}`;
                    });
                    results.push({
                        profile_id: npc.id,
                        name: npc.name,
                        epithet: npc.epithet || undefined,
                        level: npc.level || 1,
                        job_class: npc.job_class || 'Mercenary',
                        origin_type: 'system_mercenary',
                        contract_fee: (npc.level || 1) * ECONOMY_RULES.HIRE_MERCENARY_PER_LEVEL,
                        // npcsテーブルのHP: max_durabilityが正しい最大HP値。
                        // hpは50固定のデフォルト値のため使用しない
                        stats: { atk: npc.attack || npc.atk || 0, def: npc.defense || npc.def || 0, hp: npc.max_durability || npc.durability || npc.max_hp || 100 },
                        signature_deck_preview: deckNames,
                        subscription_tier: 'free' as const,
                        flavor_text: npc.introduction || npc.flavor_text || undefined,
                        // DBにimage_urlがない場合はslugからパスを自動生成
                        npc_image_url: npc.image_url || (npc.slug ? `/images/npcs/${npc.slug}.png` : undefined),
                    });
                }
            }
        } catch (e) {
            console.error("ShadowService: Failed to fetch system mercenaries", e);
        }
        return results;
    }

    /**
     * Hires a shadow.
     * 仕様: spec_v5_shadow_system.md §5.2
     *
     * shadow_heroic の場合:
     *   - contract_fee はサーバー側で再計算（クライアント改ざん防止）
     *   - 20% → owner_id（元プレイヤー=英霊の作成者）へロイヤリティ付与
     *   - 80% → システム税として消滅（誰にも渡さない）
     *
     * shadow_active の場合（既存ロジック維持）:
     *   - Free=10%, Sub=30% のロイヤリティを source_user_id へ付与
     */
    async hireShadow(hirerId: string, shadow: ShadowSummary): Promise<{ success: boolean; error?: string }> {
        // 1. Fetch Hirer Profile
        const { data: hirer } = await this.supabase
            .from('user_profiles')
            .select('gold, current_location_id')
            .eq('id', hirerId)
            .single();

        if (!hirer) {
            return { success: false, error: 'ユーザー情報が取得できませんでした。' };
        }

        // タスク1 & 2.5: サーバ側で contract_fee と雇用対象の正当性を検証・再計算（改ざん防止）
        let finalContractFee = shadow.contract_fee;
        let heroicOwnerId: string | null = null;

        if (shadow.origin_type === 'shadow_heroic') {
            // historical_logs から level を取得して再計算
            const { data: logData } = await this.supabase
                .from('historical_logs')
                .select('data, user_id')
                .eq('user_id', shadow.profile_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!logData) return { success: false, error: '無効な英霊IDです。' };

            const level = logData.data?.final_level || shadow.level || 1;
            finalContractFee = calcHeroicContractFee(level);
            heroicOwnerId = logData.user_id;
            
        } else if (shadow.origin_type === 'shadow_active') {
            // user_profiles から level/atk/def/hp/job_class を取得して再計算および所在地チェック
            const { data: userProfile } = await this.supabase
                .from('user_profiles')
                .select('level, is_alive, current_location_id, atk, def, max_hp, job_class')
                .eq('id', shadow.profile_id)
                .single();
                
            if (!userProfile || !userProfile.is_alive) {
                return { success: false, error: '対象のプレイヤーは現在雇用できません（死亡または存在しません）。' };
            }
            if (userProfile.current_location_id !== hirer.current_location_id) {
                return { success: false, error: '対象のプレイヤーは既に別の地点に移動しました。' };
            }
            
            finalContractFee = (userProfile.level || 1) * ECONOMY_RULES.HIRE_ACTIVE_PER_LEVEL;

            // v25: スナップショット取得
            shadow.stats = {
                atk: userProfile.atk || 0,
                def: userProfile.def || 0,
                hp: userProfile.max_hp || 100,
            };
            shadow.level = userProfile.level || 1;
            (shadow as any).snapshot_job_class = userProfile.job_class || 'Adventurer';

            // v25: 装備中スキルID取得 → inject_cards に
            const { data: equippedSkills } = await this.supabase
                .from('user_skills')
                .select('skill_id, cards!inner(id, name)')
                .eq('user_id', shadow.profile_id)
                .eq('is_equipped', true)
                .limit(6);

            if (equippedSkills && equippedSkills.length > 0) {
                // signature_deck_preview をカード名で埋める
                shadow.signature_deck_preview = equippedSkills.map((s: any) => s.cards?.name).filter(Boolean);
                // inject_cards 用 cardIds を直接セット
                (shadow as any)._resolved_card_ids = equippedSkills.map((s: any) => s.cards?.id).filter(Boolean);
            }

        } else if (shadow.origin_type === 'system_mercenary') {
            // npcs から level を取得して再計算
            const { data: npcData } = await this.supabase
                .from('npcs')
                .select('level')
                .eq('id', shadow.profile_id)
                .eq('origin', 'system_mercenary')
                .eq('is_hireable', true)
                .single();
                
            if (!npcData) {
                return { success: false, error: '無効または現在雇用不可能な傭兵IDです。' };
            }
            finalContractFee = (npcData.level || 1) * ECONOMY_RULES.HIRE_MERCENARY_PER_LEVEL;
        }

        // 2. ゴールド残高チェック
        if (hirer.gold < finalContractFee) {
            return {
                success: false,
                error: `金貨が足りません。（必要: ${finalContractFee.toLocaleString()} G / 所持: ${hirer.gold.toLocaleString()} G）`
            };
        }

        // 3. Embargo チェック
        if (hirer.current_location_id) {
            const { data: locData } = await this.supabase.from('locations').select('name').eq('id', hirer.current_location_id).maybeSingle();
            if (locData?.name) {
                const { data: repData } = await this.supabase
                    .from('reputations')
                    .select('score')
                    .eq('user_id', hirerId)
                    .eq('location_name', locData.name)
                    .maybeSingle();

                if (repData && (repData.score || 0) < 0) {
                    return { success: false, error: '出禁状態: この拠点での名声が低すぎるため、誰も契約に応じてくれません。' };
                }
            }
        }

        // 4. 重複雇用チェック（同名 or 同一source_user_id のメンバーが既にパーティにいる場合は拒否）
        const { data: existingMembers } = await this.supabase
            .from('party_members')
            .select('id, name, source_user_id')
            .eq('owner_id', hirerId)
            .eq('is_active', true);

        if (existingMembers && existingMembers.length > 0) {
            const isDuplicate = existingMembers.some((m: any) => {
                // Name match
                if (m.name === shadow.name) return true;
                // source_user_id match (for player shadows)
                if (shadow.profile_id && m.source_user_id && m.source_user_id === shadow.profile_id) return true;
                return false;
            });
            if (isDuplicate) {
                return { success: false, error: 'この冒険者は既に契約済みです。' };
            }
        }

        // 5. パーティ上限チェック（最大4名）
        const partyCount = existingMembers?.length || 0;
        if (partyCount >= 4) {
            return { success: false, error: 'パーティが満員です（最大4名）。' };
        }

        // 5. 雇用者のゴールドを全額減算（contract_fee を徴収）
        const { error: goldError } = await this.supabase
            .rpc('increment_gold', { p_user_id: hirerId, p_amount: -finalContractFee });

        if (goldError) return { success: false, error: goldError.message };

        // 6. タスク2: ロイヤリティ分配とシステム税
        if (shadow.origin_type === 'shadow_heroic' && heroicOwnerId) {
            // 英霊: 20% → 元プレイヤーへ / 80% → システム税（消滅）
            const royaltyAmount = Math.floor(finalContractFee * HEROIC_ROYALTY_RATE);
            // システム税 = finalContractFee - royaltyAmount（消滅: 誰にも渡さない）

            if (royaltyAmount > 0 && heroicOwnerId !== hirerId) {
                const { data: ownerProfile } = await this.supabase
                    .from('user_profiles')
                    .select('gold, level')
                    .eq('id', heroicOwnerId)
                    .single();

                if (ownerProfile) {
                    // 日額上限チェック (spec_v7 §5.1)
                    const ownerLevel = ownerProfile.level || 1;
                    const dailyCap = getDailyRoyaltyCap(ownerLevel);
                    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

                    // 当日の累積ロイヤリティを取得 or 0
                    const { data: logRow } = await this.supabase
                        .from('royalty_daily_log')
                        .select('total_gold')
                        .eq('user_id', heroicOwnerId)
                        .eq('log_date', today)
                        .maybeSingle();

                    const todayTotal = logRow?.total_gold || 0;
                    const remaining = Math.max(0, dailyCap - todayTotal);
                    const effectiveRoyalty = Math.min(royaltyAmount, remaining);

                    if (effectiveRoyalty > 0) {
                        await this.supabase
                            .rpc('increment_gold', { p_user_id: heroicOwnerId, p_amount: effectiveRoyalty });

                        // 日額ログを upsert
                        await this.supabase
                            .from('royalty_daily_log')
                            .upsert(
                                { user_id: heroicOwnerId, log_date: today, total_gold: todayTotal + effectiveRoyalty },
                                { onConflict: 'user_id,log_date' }
                            );
                    }

                    const taxed = finalContractFee - effectiveRoyalty;
                    console.log(
                        `[HeroicHire] Fee: ${finalContractFee}G | Cap: ${dailyCap}G | Royalty: ${effectiveRoyalty}G → ${heroicOwnerId} | Tax: ${taxed}G → System`
                    );
                }
            }
        } else if (shadow.origin_type === 'shadow_active') {
            // v13.0: shadow_active にも日額CAP を適用（spec_v6 §5A.4）
            // 自己雇用は分配なし
            if (shadow.profile_id === hirerId) {
                console.log(`[ActiveHire] Self-hire detected. No royalty paid.`);
            } else {
                const rate = shadow.subscription_tier === 'premium' ? 0.5
                    : (shadow.subscription_tier === 'basic' ? 0.3 : 0.1);
                const royaltyAmount = Math.floor(finalContractFee * rate);

                if (royaltyAmount > 0) {
                    const { data: ownerProfile } = await this.supabase
                        .from('user_profiles')
                        .select('level')
                        .eq('id', shadow.profile_id)
                        .single();

                    const ownerLevel = ownerProfile?.level || 1;
                    const dailyCap = getDailyRoyaltyCap(ownerLevel);
                    const today = new Date().toISOString().slice(0, 10);

                    const { data: logRow } = await this.supabase
                        .from('royalty_daily_log')
                        .select('total_gold')
                        .eq('user_id', shadow.profile_id)
                        .eq('log_date', today)
                        .maybeSingle();

                    const todayTotal = logRow?.total_gold || 0;
                    const remaining = Math.max(0, dailyCap - todayTotal);
                    const effectiveRoyalty = Math.min(royaltyAmount, remaining);

                    if (effectiveRoyalty > 0) {
                        await this.economy.distributeRoyalty({
                            sourceUserId: shadow.profile_id,
                            targetUserId: hirerId,
                            amount: effectiveRoyalty
                        });

                        await this.supabase
                            .from('royalty_daily_log')
                            .upsert(
                                { user_id: shadow.profile_id, log_date: today, total_gold: todayTotal + effectiveRoyalty },
                                { onConflict: 'user_id,log_date' }
                            );
                    }

                    const taxed = finalContractFee - effectiveRoyalty;
                    console.log(
                        `[ActiveHire] Fee: ${finalContractFee}G | Cap: ${dailyCap}G | Royalty: ${effectiveRoyalty}G → ${shadow.profile_id} | Tax: ${taxed}G → System`
                    );
                }
            }
        }

        // 7. カードIDの解決
        let cardIds: number[] = [];
        // v25: active_shadow は _resolved_card_ids が事前にセットされている場合はそちらを優先
        if ((shadow as any)._resolved_card_ids && (shadow as any)._resolved_card_ids.length > 0) {
            cardIds = (shadow as any)._resolved_card_ids;
        } else if (shadow.signature_deck_preview && shadow.signature_deck_preview.length > 0) {
            const { data: cards } = await this.supabase
                .from('cards')
                .select('id, name')
                .in('name', shadow.signature_deck_preview);

            if (cards) {
                cardIds = cards.map(c => c.id);
            }
        }

        // 8. パーティメンバーを作成
        // slugを省略名から推定（system_mercenaryの場合はprofile_idが内部UUIDなのでnpcテーブルから取得）
        // ※ RLSバイパスのためsupabaseAdminを使う
        let npcSlug: string | null = null;
        let npcEpithet: string | null = null;
        let npcImageUrl: string | null = null;
        if (shadow.origin_type === 'system_mercenary') {
            // dynamic importで循環依存を避けつつsupabaseAdminを使用
            const { supabaseServer: adminClient } = await import('@/lib/supabase-admin');
            const { data: npcInfo } = await adminClient
                .from('npcs')
                .select('slug, epithet, image_url')
                .eq('id', shadow.profile_id)
                .single();
            if (npcInfo) {
                npcSlug = npcInfo.slug;
                npcEpithet = npcInfo.epithet || null;
                npcImageUrl = npcInfo.image_url || (npcInfo.slug ? `/images/npcs/${npcInfo.slug}.png` : null);
            }
        } else {
            // shadow_active / shadow_heroic: ShadowSummaryから取得
            npcEpithet = shadow.epithet || null;
            npcImageUrl = shadow.npc_image_url || shadow.icon_url || shadow.image_url || null;
        }


        const snapshotHp = shadow.stats?.hp || 100;
        const { error: insertError } = await this.supabase
            .from('party_members')
            .insert({
                owner_id: hirerId,
                name: shadow.name,
                slug: npcSlug,
                epithet: npcEpithet,
                image_url: npcImageUrl,
                source_user_id: shadow.origin_type === 'system_mercenary' ? null : shadow.profile_id,
                origin_type: shadow.origin_type,
                durability: snapshotHp,
                max_durability: snapshotHp, // v25: 正しいmax_durabilityを保存
                // v25: active_shadow のスナップショットステータス
                ...(shadow.origin_type === 'shadow_active' ? {
                    level: shadow.level || 1,
                    atk: shadow.stats?.atk || 0,
                    def: shadow.stats?.def || 0,
                } : {}),
                inject_cards: cardIds,
                royalty_rate: shadow.origin_type === 'shadow_heroic'
                    ? percentageToInteger(HEROIC_ROYALTY_RATE)
                    : shadow.origin_type === 'shadow_active'
                        ? percentageToInteger(shadow.subscription_tier === 'premium' ? 0.5 : (shadow.subscription_tier === 'basic' ? 0.3 : 0.1))
                        : 0,
                is_active: true
            });

        if (insertError) return { success: false, error: insertError.message };

        return { success: true };
    }
}

function percentageToInteger(rate: number): number {
    return Math.floor(rate * 100);
}
