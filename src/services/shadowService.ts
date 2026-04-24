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
     * 指定拠点で雇用可能な影（傭兵）を検索する。
     */
    async findShadowsAtLocation(locationId: string, currentUserId: string): Promise<ShadowSummary[]> {
        const results: ShadowSummary[] = [];

        // 0. 現在のパーティメンバーを取得（重複除外用）
        const { data: myParty } = await this.supabase
            .from('party_members')
            .select('source_user_id, name, origin_type')
            .eq('owner_id', currentUserId)
            .eq('is_active', true);

        const hiredSourceIds = new Set(myParty?.map(p => p.source_user_id).filter(Boolean));
        const hiredNames = new Set(myParty?.map(p => p.name));

        // 1. アクティブシャドウ（現在同じ拠点にいるプレイヤー）
        try {
            const { data: activeUsers } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('current_location_id', locationId)
                .neq('id', currentUserId)
                .eq('is_alive', true)
                .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .neq('name', null)
                .limit(20); // 候補を多めに取得してからランダム〆5体を選抜

            if (activeUsers && activeUsers.length > 0) {
                // v2.7: user_skillsテーブルから装備済みスキルを一括取得（gossip/route.tsと同様の正しい実装）
                // user_profiles.signature_deck はこのフィールドが存在しないため使用不可
                const activeUserIds = activeUsers.map((u: any) => u.id);
                const skillsByUser: Record<string, string[]> = {};
                if (activeUserIds.length > 0) {
                    const { data: equippedSkills } = await this.supabase
                        .from('user_skills')
                        .select('user_id, cards!inner(name)')
                        .in('user_id', activeUserIds)
                        .eq('is_equipped', true)
                        .limit(120); // 最大20ユーザー × 6スキル上限

                    if (equippedSkills) {
                        for (const s of equippedSkills) {
                            if (!skillsByUser[(s as any).user_id]) skillsByUser[(s as any).user_id] = [];
                            const cardName = (s as any).cards?.name;
                            if (cardName) skillsByUser[(s as any).user_id].push(cardName);
                        }
                    }
                }

                // 候補をランダムシャッフルして最大5体を選抜
                const shuffledUsers = [...activeUsers].sort(() => Math.random() - 0.5).slice(0, 5);

                for (const u of shuffledUsers) {
                    if (hiredSourceIds.has(u.id)) continue;

                    const fee = (u.level || 1) * ECONOMY_RULES.HIRE_ACTIVE_PER_LEVEL;
                    results.push({
                        profile_id: u.id,
                        name: u.name || 'Unknown Adventurer',
                        level: u.level,
                        job_class: u.title_name || 'Adventurer',
                        origin_type: 'shadow_active',
                        contract_fee: fee,
                        stats: { atk: u.attack || u.atk || 0, def: u.defense || u.def || 0, hp: u.max_hp },
                        signature_deck_preview: skillsByUser[u.id] || [],
                        subscription_tier: (u.subscription_tier ?? 'free') as 'free' | 'basic' | 'premium',
                        icon_url: u.avatar_url || undefined,
                    });
                }
            }
        } catch (e) {
            console.error("[ShadowService] アクティブユーザーの取得に失敗", e);
        }

        // 2. Heroic Shadows は除外（英霊は「影の記録」タブ専用、酒場リストには表示しない）
        // v2.9.3f: 英霊がFree/国家枠と混在して表示不整合を引き起こしていたため撤廃

        // 3. システム傭兵
        const systems = await this.generateSystemMercenaries(locationId, currentUserId);
        for (const sys of systems) {
            if (hiredNames.has(sys.name)) continue;
            results.push(sys);
        }

        // 4. 合計表示上限: active → mercenary の優先順で最大10体
        const MAX_DISPLAY = 10;
        let finalResults = results;
        if (results.length > MAX_DISPLAY) {
            const active   = results.filter(r => r.origin_type === 'shadow_active');
            const mercenary = results.filter(r => r.origin_type === 'system_mercenary');
            const capped: ShadowSummary[] = [];
            for (const bucket of [active, mercenary]) {
                for (const shadow of bucket) {
                    if (capped.length >= MAX_DISPLAY) break;
                    capped.push(shadow);
                }
                if (capped.length >= MAX_DISPLAY) break;
            }
            finalResults = capped;
        }

        return finalResults;
    }

    async generateSystemMercenaries(locationId: string, currentUserId?: string): Promise<ShadowSummary[]> {
        const results: ShadowSummary[] = [];
        try {
            // ロケーションコンテキストを取得（支配国、繁栄度）
            const { data: loc } = await this.supabase
                .from('locations')
                .select('ruling_nation_id, prosperity_level')
                .eq('id', locationId)
                .single();

            const rulingNation = loc?.ruling_nation_id?.toLowerCase() || 'unknown';
            const isCapital = loc?.prosperity_level && loc.prosperity_level >= 4;

            // v2.9.3e: originフィルタを撤廃（カラム未存在の環境対応）
            const { data: npcs } = await this.supabase
                .from('npcs')
                .select('*')
                .eq('is_hireable', true);

            if (npcs) {
                // 1. 支配国のネイティブNPCをフィルタ
                const nativeNpcs = rulingNation === 'unknown'
                    ? npcs
                    : npcs.filter(n => n.slug?.toLowerCase().includes(rulingNation));

                // 2. Free NPCs（全拠点で出現、1枠保証）
                // ※ guest NPCは特殊キャラのため候補から除外
                const freeNpcs = npcs.filter(n => n.slug?.toLowerCase().includes('free'));
                const nonGuestNpcs = [...nativeNpcs, ...freeNpcs].filter(n => !n.slug?.toLowerCase().includes('guest'));

                // 2.5 クエストクリア条件付きゲストNPCの酒場ランダム出現
                // ヴォルグ: main_ep13クリア後に50%の確率で酒場に出現
                if (currentUserId) {
                    const guestUnlockMap: Record<string, string> = {
                        'npc_guest_volg': 'main_ep13',
                    };
                    const guestSlugs = Object.keys(guestUnlockMap);
                    // guest NPCはis_hireable=falseの可能性があるため、slug指定で別途取得
                    const { data: guestNpcRows } = await this.supabase
                        .from('npcs')
                        .select('*')
                        .in('slug', guestSlugs);
                    const guestNpcs = guestNpcRows || [];
                    if (guestNpcs.length > 0) {
                        const requiredSlugs = [...new Set(guestNpcs.map(n => guestUnlockMap[n.slug!]))];
                        // scenariosテーブルからslug→idを解決
                        const { data: scenarios } = await this.supabase
                            .from('scenarios')
                            .select('id, slug')
                            .in('slug', requiredSlugs);
                        const slugToScenarioId: Record<string, string> = {};
                        if (scenarios) {
                            for (const s of scenarios) slugToScenarioId[s.slug] = String(s.id);
                        }
                        // ユーザーのクリア済みクエストを確認
                        const scenarioIds = Object.values(slugToScenarioId);
                        let clearedScenarioIds = new Set<string>();
                        if (scenarioIds.length > 0) {
                            const { data: cleared } = await this.supabase
                                .from('user_completed_quests')
                                .select('scenario_id')
                                .eq('user_id', currentUserId)
                                .in('scenario_id', scenarioIds);
                            clearedScenarioIds = new Set((cleared || []).map((c: any) => String(c.scenario_id)));
                        }
                        for (const npc of guestNpcs) {
                            const reqSlug = guestUnlockMap[npc.slug!];
                            const reqId = slugToScenarioId[reqSlug];
                            if (reqId && clearedScenarioIds.has(reqId) && Math.random() < 0.5) {
                                nonGuestNpcs.push(npc);
                            }
                        }
                    }
                }

                // 3. Free NPC 1枠保証 + 残り4枠をランダム選出
                const freeCandidates = nonGuestNpcs.filter(n => n.slug?.toLowerCase().includes('free'));
                const nonFreeCandidates = nonGuestNpcs.filter(n => !n.slug?.toLowerCase().includes('free'));
                const guaranteedFree = [...freeCandidates].sort(() => Math.random() - 0.5).slice(0, 1);
                const rest = [...nonFreeCandidates].sort(() => Math.random() - 0.5).slice(0, 4);
                const shuffledNpcs = [...guaranteedFree, ...rest].sort(() => Math.random() - 0.5);

                // 4. 選抜NPCのinject_cards（数値ID）を収集してcardsテーブルで一括名前解決
                const allCardIds: number[] = [];
                for (const npc of shuffledNpcs) {
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

                // 5. NPCごとにsignature_deck_previewをカード名に変換
                for (const npc of shuffledNpcs) {
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
                        contract_fee: npc.hire_cost || ((npc.level || 1) * ECONOMY_RULES.HIRE_MERCENARY_PER_LEVEL),
                        // npcsテーブルのHP: max_hpが各NPC個別の上限HP値。
                        // hp=50は固定デフォルト値、max_durability=100はDBデフォルト値のため両方使用不可
                        stats: { atk: npc.attack || npc.atk || 0, def: npc.defense || npc.def || 0, hp: npc.max_hp || 100 },
                        signature_deck_preview: deckNames,
                        subscription_tier: 'free' as const,
                        flavor_text: npc.introduction || npc.flavor_text || undefined,
                        // slugからイメージパスを自動生成
                        npc_image_url: npc.slug ? `/images/npcs/${npc.slug}.png` : undefined,
                    });
                }
            }
        } catch (e) {
            console.error("[ShadowService] システム傭兵の生成に失敗", e);
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
        // 1. 雇用者のプロフィールを取得
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
            // クエスト解放型ゲストNPC（npc_guest_*）はis_hireableがfalseの場合があるため、
            // まずis_hireable=trueで検索し、見つからなければslugで再検索
            let npcData: any = null;
            const { data: hireableNpc } = await this.supabase
                .from('npcs')
                .select('level, hire_cost, slug')
                .eq('id', shadow.profile_id)
                .eq('is_hireable', true)
                .maybeSingle();
            npcData = hireableNpc;

            if (!npcData) {
                // クエスト解放型ゲストNPCの場合はis_hireable条件なしで取得
                const { data: guestNpc } = await this.supabase
                    .from('npcs')
                    .select('level, hire_cost, slug')
                    .eq('id', shadow.profile_id)
                    .like('slug', 'npc_guest_%')
                    .maybeSingle();
                npcData = guestNpc;
            }
                
            if (!npcData) {
                return { success: false, error: '無効または現在雇用不可能な傭兵IDです。' };
            }
            finalContractFee = npcData.hire_cost || ((npcData.level || 1) * ECONOMY_RULES.HIRE_MERCENARY_PER_LEVEL);
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
                // 名前一致チェック
                if (m.name === shadow.name) return true;
                // source_user_id 一致チェック（プレイヤーシャドウ用）
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
                        `[英霊雇用] 契約金: ${finalContractFee}G | 日額上限: ${dailyCap}G | ロイヤリティ: ${effectiveRoyalty}G → ${heroicOwnerId} | システム税: ${taxed}G`
                    );
                }
            }
        } else if (shadow.origin_type === 'shadow_active') {
            // v13.0: shadow_active にも日額CAP を適用（spec_v6 §5A.4）
            // 自己雇用は分配なし
            if (shadow.profile_id === hirerId) {
                console.log(`[影雇用] 自己雇用を検出。ロイヤリティ分配なし。`);
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
                        `[影雇用] 契約金: ${finalContractFee}G | 日額上限: ${dailyCap}G | ロイヤリティ: ${effectiveRoyalty}G → ${shadow.profile_id} | システム税: ${taxed}G`
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
                .select('slug, epithet')
                .eq('id', shadow.profile_id)
                .single();
            if (npcInfo) {
                npcSlug = npcInfo.slug;
                npcEpithet = npcInfo.epithet || null;
                npcImageUrl = npcInfo.slug ? `/images/npcs/${npcInfo.slug}.png` : null;
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
