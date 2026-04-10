import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Adventurer, Card, Enemy, WorldState, Scenario, InventoryItem, UserProfile, BattleState, PartyMember, UserHubState } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { WORLD_ID } from '@/utils/constants';
import { buildBattleDeck, routeDamage, canAffordCard, calculateDamage } from '@/lib/battleEngine';
import { resolveNpcTurn, determineRole, determineGrade, NpcAction, BattleContext } from '@/lib/npcAI';
import { StatusEffect, applyEffect, removeEffect, tickEffects, getBleedDamage, isStunned, hasEffect, StatusEffectId, getEffectName } from '@/lib/statusEffects';
import { validateCardUse, getDefaultTarget } from '@/lib/targeting';
import { getCardEffectInfo } from '@/lib/cardEffects';
import { getPassiveLabel, aggregateBattlePassives } from '@/lib/passiveEffects';
import { getEnemySkill } from '@/lib/enemySkills';
import { useQuestState } from './useQuestState';
import { GROWTH_RULES } from '@/constants/game_rules';
import { soundManager, CARD_EFFECT_SE_MAP } from '@/lib/soundManager';


const DUMMY_ENEMY: Enemy = {
    id: 'e1', name: 'Training Dummy', level: 1, hp: 50, maxHp: 50,
};

const CARD_POOL: Card[] = [
    { id: 'c1', name: 'Slash', type: 'Skill', description: 'Deals 20 dmg', cost: 5, power: 20 },
    { id: 'c2', name: 'Fireball', type: 'Skill', description: 'Deals 30 fire dmg', cost: 10, power: 30 },
    { id: 'c3', name: 'Heal Herb', type: 'Item', description: 'Restores 50 HP', cost: 0, power: 50 },
    { id: 'c4', name: 'Defend', type: 'Basic', description: 'Reduces dmg', cost: 0 },
    { id: 'c5', name: 'Brave Heart', type: 'Personality', description: 'Boosts Atk', cost: 3 },
    { id: 'c5', name: 'Brave Heart', type: 'Personality', description: 'Boosts Atk', cost: 3 },
    { id: 'c6', name: 'Calculation', type: 'Basic', description: 'Analyzes enemy (custom)', cost: 1 },
    // Spec v2.0 Noise Cards
    { id: 'card_noise', name: 'Noise', type: 'Basic', description: 'A distrubance in the mind.', cost: 1, power: 0 },
    { id: 'card_fear', name: 'Fear', type: 'Basic', description: 'Target is paralyzed with fear.', cost: 2, power: 0 },
    { id: 'c7', name: 'Attack', type: 'Basic', description: 'Basic attack', cost: 0, power: 10 },
];

interface GameState {
    // Profile
    userProfile: UserProfile | null;
    selectedProfileId: string | null; // v3.7: Explicit Tracking
    setSelectedProfileId: (id: string | null) => void;
    fetchUserProfile: () => Promise<void>;

    battleState: BattleState;

    // Global
    worldState: WorldState | null;
    fetchWorldState: () => Promise<void>;
    hubState: UserHubState | null;
    fetchHubState: () => Promise<void>;

    // Gold & Shopping
    gold: number;
    addGold: (amount: number) => Promise<void>;
    spendGold: (amount: number) => boolean;

    // Actions
    initialize: () => void;
    initializeBattle: () => void; // Expose for testing
    selectedScenario: Scenario | null;
    selectScenario: (scenario: Scenario | null) => void;
    startBattle: (enemy: Enemy | Enemy[]) => void;
    attackEnemy: (card?: Card, targetId?: string) => Promise<void>;
    waitTurn: () => Promise<void>;
    endTurn: () => Promise<void>;
    resetBattle: () => void;

    // Inventory
    inventory: InventoryItem[];
    fetchInventory: () => Promise<void>;
    toggleEquip: (itemId: string, currentEquip: boolean, bypassLock?: boolean) => Promise<void>;
    clearStorage: () => void;

    // UI State
    showStatus: boolean;
    setShowStatus: (show: boolean) => void;

    // Hand Management
    deck: Card[];
    discardPile: Card[];
    hand: Card[];
    drawCards: (count: number) => void;
    discardCard: (index: number) => void;
    dealHand: () => void;
    useItem: (card: Card) => Promise<void>;
    processPartyTurn: () => Promise<void>;
    processEnemyTurn: (damage?: number) => Promise<void>;

    setTarget: (enemyId: string) => void;
    setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => void;
    fleeBattle: () => void;

    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // Initialize missing defaults
            userProfile: null,
            selectedProfileId: null,
            setSelectedProfileId: (id) => set({ selectedProfileId: id }),
            worldState: null,
            hubState: null,
            gold: 1000,
            selectedScenario: null,
            inventory: [],
            deck: [],
            discardPile: [],
            hand: [],
            _hasHydrated: false,

            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

            showStatus: false,
            setShowStatus: (show) => set({ showStatus: show }),

            battleState: {
                enemy: null,
                enemies: [], // v3.5: Multi-enemy support
                party: [],
                turn: 1,
                current_ap: 5, // Initialize AP
                messages: [],
                isVictory: false,
                isDefeat: false,
                currentTactic: 'Aggressive',
                player_effects: [],
                enemy_effects: [],
                exhaustPile: [],
                consumedItems: [],
                activeSupportBuffs: [],
            },

            initializeBattle: () => {
                // Delegate to startBattle for proper Deck Construction
                get().startBattle({
                    id: 'e1', name: 'Shadow Wolf', level: 4, hp: 300, maxHp: 300,
                });
            },

            initialize: () => get().initializeBattle(),

            startBattle: async (enemiesInput: Enemy | Enemy[]) => {
                const enemies = Array.isArray(enemiesInput) ? enemiesInput : [enemiesInput];
                // Initialize effects for enemies
                enemies.forEach(e => {
                    if (!e.status_effects) e.status_effects = [];
                });
                const firstEnemy = enemies[0];

                console.log("[GameStore] startBattle called with:", enemies.length, "enemies");
                // 1. Fetch Party from DB (party_members table)
                let partyMembers: PartyMember[] = [];
                const { userProfile } = get(); // Moved to top scope
                try {
                    if (userProfile?.id) {
                        const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.party) partyMembers = data.party as PartyMember[];
                        }
                    }
                } catch (e) { console.error("Party fetch failed", e); }

                // v3.4: Add Guest if exists
                const guest = useQuestState.getState().guest;
                if (guest) {
                    console.log("Guest joining battle:", guest.name);
                    partyMembers.push({ ...guest, is_active: true });
                }

                // spec_v5 §6.2: 共鳳ボーナスチェック
                // 現在拠点に過去1時間以内にアクティブな他プレイヤーがいる場合、ATK/DEF +10%
                let resonanceActive = false;
                const locationId = userProfile?.current_location_id;
                if (locationId) {
                    try {
                        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
                        const { count } = await supabase
                            .from('user_profiles')
                            .select('id', { count: 'exact', head: true })
                            .eq('current_location_id', locationId)
                            .eq('is_alive', true)
                            .neq('id', userProfile!.id)
                            .gt('updated_at', oneHourAgo);
                        if ((count ?? 0) > 0) {
                            resonanceActive = true;
                            console.log('[startBattle] 共鳳ボーナス発動！同拠点プレイヤー:', count, '人');
                        }
                    } catch (e) {
                        console.warn('[startBattle] 共鳳チェック失敗（続行）', e);
                    }
                }

                // 2. Build Deck
                const { inventory, worldState } = get();
                const equippedCards = (inventory || []).filter(i => i.is_equipped && (i.is_skill || i.item_type === 'skill_card')).map(i => ({
                    id: String(i.card_id || i.id),
                    name: i.name,
                    type: (i.effect_data?.type || i.effect_data?.card_type || 'Skill') as Card['type'], // v19: DBのtypeを引き継ぎ（Support等）
                    description: i.effect_data?.description || '',
                    cost: 0,
                    power: i.effect_data?.power || i.effect_data?.effect_val || 0,
                    ap_cost: i.effect_data?.ap_cost ?? 1,         // v8.2: APコストを引き継ぐ
                    effect_id: i.effect_data?.effect_id || undefined,   // v8.2: バフ/デバフIDを引き継ぐ
                    effect_duration: i.effect_data?.effect_duration || undefined,
                    image_url: i.effect_data?.image_url || i.image_url || undefined,
                    isEquipment: true,
                }));

                const neededCardIds = new Set<string>();
                partyMembers.forEach(p => {
                    p.inject_cards?.forEach(id => neededCardIds.add(String(id)));
                });

                let partyCardPool: Card[] = [];
                // Debug: Log needed cards
                console.log("[startBattle] Needed NPC Cards:", Array.from(neededCardIds));

                if (neededCardIds.size > 0) {
                    const { data: dbCards } = await supabase
                        .from('cards')
                        .select('*')
                        .in('id', Array.from(neededCardIds));

                    if (dbCards) {
                        partyCardPool = dbCards.map(c => ({
                            id: String(c.id),
                            name: c.name,
                            type: c.type,
                            description: c.description,
                            cost: c.cost_val || c.cost || 0,
                            power: c.effect_val || c.power || 0,
                            ap_cost: c.ap_cost ?? 1,
                            cost_type: c.cost_type || undefined, // item/mp/vitality等
                            effect_id: c.effect_id || undefined,
                            effect_duration: c.effect_duration || undefined,
                            animation_type: c.animation_type || undefined,
                        })) as Card[];
                    }
                }

                partyMembers = partyMembers.map(pm => {
                    const sigDeck = (pm.inject_cards || []).map(id => {
                        const found = partyCardPool.find(c => c.id === String(id));
                        if (found) return found;
                        return CARD_POOL.find(c => c.id === String(id));
                    }).filter(Boolean) as Card[];

                    return {
                        ...pm,
                        signature_deck: sigDeck,
                        ai_role: determineRole({ ...pm, signature_deck: sigDeck }),
                        ai_grade: determineGrade(pm),
                        current_ap: 5,
                        used_this_turn: [],
                    };
                });

                const { deck: initialDeck, didProtectFromNoise } = buildBattleDeck(
                    equippedCards,
                    partyMembers,
                    (id) => {
                        const fromPool = partyCardPool.find(c => c.id === String(id));
                        if (fromPool) return fromPool;
                        return CARD_POOL.find(c => c.id === String(id));
                    },
                    worldState?.status,
                    userProfile?.level || 1
                );

                const shuffledDeck = initialDeck.sort(() => 0.5 - Math.random());

                // 共鳳ボーナス: ATK/DEF +10% を userProfileに適用
                if (resonanceActive && userProfile) {
                    const boostedAtk = Math.ceil((userProfile.atk || 0) * 1.1);
                    const boostedDef = Math.ceil((userProfile.def || 0) * 1.1);
                    set(state => ({
                        userProfile: state.userProfile
                            ? { ...state.userProfile, atk: boostedAtk, def: boostedDef }
                            : null
                    }));
                }

                // 祈りの加護 (Blessing Data) の適用
                let initialAp = 5;
                let blessingActive = false;
                if (userProfile?.blessing_data) {
                    const blessing = userProfile.blessing_data as any;
                    blessingActive = true;
                    initialAp += (blessing.ap_bonus || 0);

                    if (blessing.hp_pct) {
                        const maxHpBonus = Math.floor((userProfile.max_hp || 100) * blessing.hp_pct);
                        set(state => ({
                            userProfile: state.userProfile
                                ? { 
                                    ...state.userProfile, 
                                    max_hp: (state.userProfile.max_hp || 100) + maxHpBonus,
                                    hp: (state.userProfile.hp || 0) + maxHpBonus 
                                  }
                                : null
                        }));
                    }
                }

                const startMessages = [
                    `${enemies.map(e => e.name).join('と')}が現れた！`,
                    ...(resonanceActive ? ['\u26a1 共鳳ボーナス発動！ (ATK/DEF +10%)'] : []),
                    ...(blessingActive ? ['✨ 祈りの加護が発動！(開始APアップ & HP回復)'] : []),
                    ...(didProtectFromNoise ? ['✨ 世界の意志の加護により、危険地帯の悪影響（ノイズ）から守られた。'] : []),
                    `--- Turn 1 ---`
                ];

                set({
                    battleState: {
                        enemy: firstEnemy,
                        enemies: enemies,
                        party: partyMembers,
                        turn: 1,
                        current_ap: initialAp,
                        messages: startMessages,
                        isVictory: false,
                        isDefeat: false,
                        currentTactic: 'Aggressive',
                        player_effects: [],
                        enemy_effects: [],
                        exhaustPile: [],
                        consumedItems: [],
                        vitDamageTakenThisTurn: false,
                        battle_result: undefined,
                        resonanceActive,
                        activeSupportBuffs: [], // v19: 使用済みSupportカードIDリスト
                    },
                    deck: shuffledDeck,
                    discardPile: [],
                    hand: []
                });

                get().dealHand();

                // サウンド: バトルBGM再生
                soundManager?.playBgm('bgm_battle');

                // --- Optimistic UI & Server Validation ---
                fetch('/api/battle/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enemies: enemies,
                        party: partyMembers,
                        initial_ap: initialAp,
                        resonance_active: resonanceActive,
                        player_stats: { hp: userProfile?.hp, max_hp: userProfile?.max_hp, atk: userProfile?.atk, def: userProfile?.def }
                    })
                }).then(res => res.json()).then(data => {
                    if (data.battle_session_id) {
                        set(state => ({ battleState: { ...state.battleState, battle_session_id: data.battle_session_id }}));
                    }
                }).catch(err => console.error("Server Battle Sync Error", err));
            },

            endTurn: async () => {
                const { battleState, userProfile } = get();
                if (battleState.isVictory || battleState.isDefeat) return;

                const nextTurn = battleState.turn + 1;

                if (nextTurn > 30) {
                    soundManager?.playSE('se_battle_lose');
                    set(state => ({
                        battleState: {
                            ...state.battleState,
                            isDefeat: true,
                            battle_result: 'time_over',
                            messages: [...state.battleState.messages, '--- 30ターン経過 --- 時間切れ… 撤退を余儀なくされた。']
                        }
                    }));
                    return;
                }

                let newAp = battleState.current_ap || 0;
                if (!isStunned(battleState.player_effects as StatusEffect[])) {
                    newAp = Math.min(10, newAp + 5);
                }

                const newMessages = [...battleState.messages, `--- ターン ${nextTurn} ---`];

                // 4. End Phase: Status Effect Tick
                let playerEffects = [...(battleState.player_effects || [])] as StatusEffect[];

                // Player tick
                const playerMaxHp = userProfile?.max_hp || 100;
                const playerTick = tickEffects(playerEffects, playerMaxHp, 'あなた');
                playerEffects = playerTick.newEffects;
                newMessages.push(...playerTick.messages);

                if (playerTick.hpDelta !== 0 && userProfile) {
                    const newHp = Math.max(0, Math.min(playerMaxHp, (userProfile.hp || 0) + playerTick.hpDelta));
                    set(state => ({
                        userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                    }));
                    const { selectedProfileId } = get();
                    fetch('/api/profile/update-status', {
                        method: 'POST',
                        body: JSON.stringify({ hp: newHp, profileId: selectedProfileId })
                    }).catch(console.error);
                }

                // Enemy tick (ALL Enemies)
                let updatedEnemies = [...battleState.enemies];
                let allEnemiesDead = true;

                updatedEnemies = updatedEnemies.map(enemy => {
                    if (enemy.hp <= 0) return enemy; // Already dead

                    let eEffects = [...(enemy.status_effects || [])] as StatusEffect[];
                    const eTick = tickEffects(eEffects, enemy.maxHp, enemy.name);

                    newMessages.push(...eTick.messages);
                    const newHp = Math.max(0, enemy.hp + eTick.hpDelta);

                    if (newHp > 0) allEnemiesDead = false;
                    return { ...enemy, hp: newHp, status_effects: eTick.newEffects };
                });

                // Update current target if dead
                let currentTarget = battleState.enemy;
                if (currentTarget) {
                    const updatedTarget = updatedEnemies.find(e => e.id === currentTarget!.id);
                    if (updatedTarget) currentTarget = updatedTarget;
                    // If target died and others exist, switch target?
                    if (currentTarget.hp <= 0 && !allEnemiesDead) {
                        const firstAlive = updatedEnemies.find(e => e.hp > 0);
                        if (firstAlive) {
                            currentTarget = firstAlive;
                            newMessages.push(`ターゲットを ${firstAlive.name} に切り替えた。`);
                        }
                    }
                }

                set(state => ({
                    battleState: {
                        ...state.battleState,
                        turn: nextTurn,
                        current_ap: newAp,
                        messages: newMessages,
                        player_effects: playerEffects,
                        enemies: updatedEnemies,
                        enemy: currentTarget,
                        vitDamageTakenThisTurn: false,
                    }
                }));

                if (allEnemiesDead) {
                    soundManager?.playSE('se_battle_win');
                    set(state => ({
                        battleState: { ...state.battleState, isVictory: true, battle_result: 'victory', messages: [...state.battleState.messages, '全ての敵を倒した！ 勝利！'] }
                    }));
                    return;
                }

                get().dealHand();

                setTimeout(() => {
                    get().processPartyTurn();
                }, 600);
            },

            resetBattle: () => get().initializeBattle(),

            drawCards: (count: number) => get().dealHand(),

            discardCard: (index: number) => {
                set((state) => {
                    const newHand = [...state.hand];
                    newHand.splice(index, 1);
                    return { hand: newHand };
                });
            },

            useItem: async (card: Card) => {
                get().attackEnemy(card);
            },

            selectScenario: (scenario) => set({ selectedScenario: scenario }),

            addGold: async (amount) => {
                const { gold, userProfile } = get();
                const newGold = gold + amount;
                set({ gold: newGold });

                if (userProfile?.id) {
                    try {
                        const res = await fetch('/api/debug/add-gold', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userProfile.id, amount })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            set({ gold: data.new_gold });
                        }
                    } catch (e) {
                        console.error('Failed to add gold via API', e);
                    }
                }
            },

            spendGold: (amount) => {
                const { gold } = get();
                if (gold >= amount) {
                    set({ gold: gold - amount });
                    return true;
                }
                return false;
            },

            dealHand: () => {
                const { deck, discardPile, hand, battleState, userProfile } = get();

                // v2.11 Struggle (あがき) — ドロー開始時に全カード0枚なら救済
                if (deck.length === 0 && discardPile.length === 0 && hand.length === 0) {
                    const struggleCard: Card = {
                        id: 'struggle',
                        name: 'あがき (Struggle)',
                        type: 'Skill',
                        description: '必死の一撃。敵に1ダメージ、自分にも1ダメージ。',
                        cost: 0,
                        ap_cost: 0,
                        power: 1,
                    };
                    set({
                        hand: [struggleCard],
                        battleState: {
                            ...battleState,
                            messages: [...battleState.messages, '手札も山札も尽きた…「あがき」が手に宿る！']
                        }
                    });
                    return;
                }

                // Phase 1.5: spec_v8準拠のレベル連動Hand Size
                // Lv1-9: 3枚 / Lv10-19: 4枚 / Lv20+: 5枚
                const level = userProfile?.level || 1;
                const handSizeRule = GROWTH_RULES.HAND_SIZE_BY_LEVEL.find(r => level >= r.minLevel);
                const maxHandSize = handSizeRule?.size ?? 3;

                const drawCount = maxHandSize - hand.length;
                if (drawCount <= 0) return;

                let currentDeck = [...deck];
                let currentDiscard = [...discardPile];
                const newHand = [...hand];

                for (let i = 0; i < drawCount; i++) {
                    if (currentDeck.length === 0) {
                        if (currentDiscard.length === 0) break; // No cards left
                        // Recycle Discard -> Deck
                        currentDeck = [...currentDiscard].sort(() => 0.5 - Math.random());
                        currentDiscard = [];
                    }
                    const card = currentDeck.pop();
                    if (card) newHand.push(card);
                }

                set({
                    deck: currentDeck,
                    discardPile: currentDiscard,
                    hand: newHand
                });
            },

            fetchWorldState: async () => {
                try {
                    // Update Hub State first to know context
                    await get().fetchHubState();
                    const { userProfile, hubState } = get();

                    // current_location_id からロケーション名を取得
                    // 帰還時（is_in_hub=true）は「名もなき旅人の拠所」をハブとして使い、
                    // current_location_id は直前の拠点を保持するため変更しない
                    let targetLocationName = '国境の町'; // フォールバック

                    if (hubState?.is_in_hub) {
                        // ハブ（名もなき旅人の拠所）にいる場合
                        targetLocationName = '名もなき旅人の拠所';
                    } else if (userProfile?.current_location_id) {
                        // current_location_idがある場合はDBから実際の拠点名を取得
                        if (userProfile.locations?.name) {
                            // JOINされたlocation情報がある場合はそれを優先
                            targetLocationName = userProfile.locations.name;
                        } else {
                            // JOINがない場合はlocationsテーブルから直接取得（ID or slug で検索）
                            const locId = userProfile.current_location_id;
                            const { data: locData } = await supabase
                                .from('locations')
                                .select('name')
                                .or(`id.eq.${locId},slug.eq.${locId}`)
                                .maybeSingle();
                            if (locData?.name) {
                                targetLocationName = locData.name;
                            }
                        }
                    } else if (userProfile?.locations?.name) {
                        targetLocationName = userProfile.locations.name;
                    }

                    console.log("Fetching World State for:", targetLocationName);

                    // New Scheme: Query by LOCATION_NAME
                    const { data, error } = await supabase
                        .from('world_states')
                        .select('*')
                        .eq('location_name', targetLocationName)
                        .maybeSingle(); // Use maybeSingle to avoid 406 error if missing

                    // --- New logic: Fetch Hegemony ---
                    let hegemonyData = [];
                    try {
                        const hegemonyRes = await fetch('/api/world/hegemony', { cache: 'no-store' });
                        if (hegemonyRes.ok) {
                            const hData = await hegemonyRes.json();
                            hegemonyData = hData.hegemony || [];
                        }
                    } catch (e) { console.error('Hegemony fetch error', e); }
                    // ---

                    if (data && !error) {
                        set({ worldState: { ...(data as WorldState), hegemony: hegemonyData } });
                    } else {
                        console.warn(`fetchWorldState failed for ${targetLocationName}, attempting auto-initialization...`);

                        // Attempt to initialize the missing row via our API
                        try {
                            const initRes = await fetch('/api/admin/update-world', {
                                method: 'POST',
                                headers: { 'Cache-Control': 'no-cache' },
                                body: JSON.stringify({ location_name: targetLocationName }),
                                cache: 'no-store'
                            });

                            if (initRes.ok) {
                                console.log("Auto-initialization successful. Refetching...");
                                const { data: newData } = await supabase
                                    .from('world_states')
                                    .select('*')
                                    .eq('location_name', targetLocationName)
                                    .maybeSingle();

                                if (newData) {
                                    set({ worldState: { ...(newData as WorldState), hegemony: hegemonyData } });
                                    return;
                                }
                            }
                        } catch (initErr) {
                            console.error("Auto-initialization API call failed", initErr);
                        }

                        // Fallback / Initial State if DB is empty or error and init failed
                        console.warn("Using fallback local state.");
                        const dummyState: WorldState = {
                            location_name: targetLocationName,
                            status: '繁栄', // Default per new schema
                            prosperity_level: 3,
                            order_score: 10,
                            chaos_score: 10,
                            justice_score: 10,
                            evil_score: 10,
                            attribute_name: '至高の平穏',
                            flavor_text: '新たな土地は静寂に包まれている。',
                            background_url: '/backgrounds/default.jpg',
                            total_days_passed: 0,
                            controlling_nation: 'Neutral',
                            hegemony: hegemonyData
                        };
                        set({ worldState: dummyState });
                    }
                } catch (e) {
                    console.error("Failed to fetch world state", e);
                }
            },

            fetchUserProfile: async () => {
                try {
                    const { selectedProfileId } = get();
                    const url = selectedProfileId
                        ? `/api/profile?profileId=${selectedProfileId}`
                        : '/api/profile';

                    // [Logic-Expert] Bearer\u30c8\u30fc\u30af\u30f3\u3092\u4ed8\u4e0e\u3057\u3066\u8a8d\u8a3c\u3092\u901a\u3059\u3002
                    // \u4fee\u6b63\u3057\u305f /api/profile \u306f JWT \u306a\u3057\u306e\u30ea\u30af\u30a8\u30b9\u30c8\u306b 401 \u3092\u8fd4\u3059\u305f\u3081\u3001
                    // Supabase \u30bb\u30c3\u30b7\u30e7\u30f3\u304b\u3089\u30c8\u30fc\u30af\u30f3\u3092\u53d6\u5f97\u3057\u3066\u5fc5\u305a\u9001\u4fe1\u3059\u308b\u3002
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    const headers: HeadersInit = { 'Cache-Control': 'no-store' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await fetch(url, { cache: 'no-store', headers });
                    if (res.ok) {
                        const profile = await res.json();
                        set({ userProfile: profile, gold: profile.gold });
                    }
                } catch (e) {
                    console.error("Failed to fetch profile", e);
                }
            },


            fetchHubState: async () => {
                try {
                    const { userProfile } = get();
                    if (!userProfile?.id) return;

                    const { data, error } = await supabase
                        .from('user_hub_states')
                        .select('*')
                        .eq('user_id', userProfile.id)
                        .maybeSingle();

                    if (data) {
                        set({ hubState: data as UserHubState });
                    } else if (!error) {
                        // Create default if missing (lazy create)
                        const { data: newData, error: insertError } = await supabase
                            .from('user_hub_states')
                            .insert([{ user_id: userProfile.id, is_in_hub: false }])
                            .select()
                            .single();

                        if (newData) set({ hubState: newData as UserHubState });
                        else console.warn("Failed to init hub state", insertError);
                    }
                } catch (e) {
                    console.error("Failed to fetch hub state", e);
                }
            },

            // --- Inventory Actions ---
            fetchInventory: async () => {
                try {
                    const { userProfile } = get();
                    const { data: { session } } = await supabase.auth.getSession();
                    const headers: HeadersInit = {};
                    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
                    if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                    const res = await fetch('/api/inventory', {
                        headers,
                        cache: 'no-store'
                    });
                    if (res.ok) {
                        const { inventory } = await res.json();
                        set({ inventory });
                    }
                } catch (e) {
                    console.error("Failed to fetch inventory", e);
                }
            },

            toggleEquip: async (itemId: string, currentEquip: boolean, bypassLock?: boolean) => {
                try {
                    // Optimistic update
                    const { inventory } = get();
                    const targetItem = inventory.find(i => String(i.id) === itemId);
                    const newInventory = inventory.map(i =>
                        String(i.id) === itemId ? { ...i, is_equipped: !currentEquip } : i
                    );
                    set({ inventory: newInventory });

                    const { userProfile } = get();
                    const { data: { session } } = await supabase.auth.getSession();
                    const headers: HeadersInit = { 'Content-Type': 'application/json' };
                    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
                    if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                    // v5.2: スキルかアイテムかを判定し、API に is_skill フラグを渡す
                    const isSkill = targetItem?.is_skill || targetItem?.item_type === 'skill_card';

                    await fetch('/api/inventory', {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({
                            inventory_id: itemId,
                            is_equipped: !currentEquip,
                            bypass_lock: bypassLock,
                            is_skill: isSkill,
                        }),
                        cache: 'no-store'
                    });
                } catch (e) {
                    console.error("Failed to toggle equip", e);
                }
            },

            attackEnemy: async (card?: Card, targetId?: string) => {
                const { battleState, selectedScenario, hand, userProfile } = get();

                // v3.5: Check if any enemy is alive
                const anyAlive = battleState.enemies?.some(e => e.hp > 0);
                if (!anyAlive || battleState.isVictory || battleState.isDefeat) return;

                // Resolve Target
                let targetEnemyId = targetId || battleState.enemy?.id;
                let targetEnemy = battleState.enemies.find(e => e.id === targetEnemyId);

                // Fallback to first living enemy if current target is dead/invalid
                if (!targetEnemy || targetEnemy.hp <= 0) {
                    targetEnemy = battleState.enemies.find(e => e.hp > 0);
                    targetEnemyId = targetEnemy?.id;
                }

                if (!targetEnemy) return;

                // v2.7: Validation
                if (card) {
                    const resolvedTargetId = targetId || getDefaultTarget(card, battleState);
                    const validation = validateCardUse(card, resolvedTargetId, battleState);
                    if (!validation.valid) {
                        set(state => ({ battleState: { ...state.battleState, messages: [...state.battleState.messages, validation.error || '行動できません'] } }));
                        return;
                    }
                    const apCost = card.ap_cost ?? 1;
                    set(state => ({ battleState: { ...state.battleState, current_ap: (battleState.current_ap || 0) - apCost } }));

                    // cost_type=item: 1バトル1回制限チェック
                    if (card.cost_type === 'item') {
                        const baseId = card.id.match(/^(\d+)/)?.[1] || card.id;
                        if (battleState.consumedItems?.some(cid => cid.startsWith(baseId))) {
                            // AP返却して使用ブロック
                            set(state => ({
                                battleState: {
                                    ...state.battleState,
                                    current_ap: (state.battleState.current_ap || 0) + apCost,
                                    messages: [...state.battleState.messages, `${card.name}の素材が尽きた！（1戦闘1回制限）`]
                                }
                            }));
                            return;
                        }
                    }
                }

                console.log("[Attack] Card used:", card);

                // --- Server Validation Call ---
                if (card && battleState.battle_session_id) {
                    fetch('/api/battle/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            battle_session_id: battleState.battle_session_id,
                            action_type: 'attack_enemy',
                            card: card,
                            target_id: targetEnemyId,
                            log_message: `Used ${card?.name}`
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.error) {
                            console.warn('Server validation failed:', data.error);
                            set(state => ({ battleState: { ...state.battleState, messages: [...state.battleState.messages, `[サーバー未承認] ${data.error}`] }}));
                        }
                    });
                }
                // ------------------------------

                let nextHand = [...hand];
                let nextDiscardPile = [...get().discardPile];
                let logMsg = '';
                let damage = 0;
                let isAoe = false;
                let effectInfo: ReturnType<typeof getCardEffectInfo> | undefined;

                // Noise logic (unchanged)
                if (card && (card.type === 'noise' || card.type === 'Basic' && card.name === 'Noise')) {
                    const purgeCost = card.discard_cost ?? 1;
                    nextHand = nextHand.filter(c => c.id !== card.id);
                    set(state => ({
                        battleState: {
                            ...state.battleState,
                            exhaustPile: [...state.battleState.exhaustPile, { id: card.id, name: card.name, type: card.type }],
                            messages: [...state.battleState.messages, `${card.name}を廃棄した！ (AP -${purgeCost})`]
                        },
                        hand: nextHand,
                    }));
                    return;
                }

                if (card) {
                    // Bleed logic (unchanged)
                    const bleedDmg = getBleedDamage(battleState.player_effects as StatusEffect[]);
                    if (bleedDmg > 0 && userProfile) {
                        const newHp = Math.max(0, (userProfile.hp || 0) - bleedDmg);
                        set(state => ({
                            userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                            battleState: { ...state.battleState, messages: [...state.battleState.messages, `出血ダメージ！ HP -${bleedDmg}`] }
                        }));
                    }

                    // Struggle logic (unchanged)
                    if (card.id === 'struggle' && userProfile) {
                        const selfDmg = 1;
                        const newHp = Math.max(0, (userProfile.hp || 0) - selfDmg);
                        set(state => ({
                            userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                            battleState: { ...state.battleState, messages: [...state.battleState.messages, `あがきの反動！ HP -${selfDmg}`] }
                        }));
                    }

                    // ─── カード効果分岐エンジン ───────────────────
                    effectInfo = getCardEffectInfo(card);

                    // サウンド: カードエフェクトに応じたSE再生
                    soundManager?.playSEForCardEffect(effectInfo.effectType);

                    switch (effectInfo.effectType) {
                        case 'heal': {
                            const healAmount = card.power || 0;
                            if (userProfile && healAmount > 0) {
                                const maxHp = userProfile.max_hp || 100;
                                const newHp = Math.min(maxHp, (userProfile.hp || 0) + healAmount);
                                set(state => ({
                                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                                }));
                                logMsg = `${card.name}で HP ${healAmount} 回復！`;
                                const { selectedProfileId } = get();
                                fetch('/api/profile/update-status', {
                                    method: 'POST',
                                    body: JSON.stringify({ hp: newHp, profileId: selectedProfileId })
                                }).catch(console.error);
                            } else {
                                logMsg = `${card.name}を使用！`;
                            }
                            // cure_poison: ヒールカードが毒も解除する場合はここで
                            // （将来拡張ポイント）
                            break;
                        }
                        case 'escape': {
                            nextHand = nextHand.filter(c => c.id !== card.id);
                            nextDiscardPile = [...nextDiscardPile, card];
                            logMsg = `${card.name}を使用！ 戦闘から離脱した！`;
                            soundManager?.playSE('se_escape');
                            set(state => ({
                                hand: nextHand,
                                discardPile: nextDiscardPile,
                                battleState: {
                                    ...state.battleState,
                                    isDefeat: true,
                                    battle_result: 'escape',
                                    messages: [...state.battleState.messages, logMsg]
                                }
                            }));
                            return; // 即座に終了
                        }
                        case 'buff_self': {
                            if (effectInfo.effectId) {
                                const newEffects = applyEffect(
                                    battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 3
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                                logMsg = `${card.name}を使用！ ${getEffectName(effectInfo.effectId)}を得た！`;
                            } else {
                                logMsg = `${card.name}を使用！`;
                            }
                            break;
                        }
                        case 'taunt': {
                            if (effectInfo.effectId) {
                                const newEffects = applyEffect(
                                    battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 2
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                            }
                            const sourceName = card.source?.replace('Party:', '') || 'パーティメンバー';
                            logMsg = `${sourceName}が${card.name}！ 敵の攻撃を引きつけた！`;
                            break;
                        }
                        case 'buff_party': {
                            if (effectInfo.effectId) {
                                const newEffects = applyEffect(
                                    battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 3
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                            }
                            logMsg = `${card.name}を展開！ パーティ全体が守られた！`;
                            break;
                        }
                        case 'aoe_attack': {
                            damage = card.power ?? 0;
                            if (damage > 0) {
                                const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic');
                                const playerAtk = userProfile?.atk || 0;
                                // AoEは最も硬い敵のDEFで計算（最低保証）
                                damage = calculateDamage(
                                    damage, 0,
                                    battleState.player_effects as StatusEffect[],
                                    [],
                                    isMagic,
                                    playerAtk
                                );
                            }
                            logMsg = `${card.name}で全体攻撃！ 各敵に ${damage} のダメージ！`;
                            isAoe = true;
                            break;
                        }
                        case 'debuff_enemy': {
                            // デバフ系: ダメージは0でも効果を付与
                            damage = card.power ?? 0;
                            if (damage > 0) {
                                const isMagic = true; // デバフは魔法扱い（DEF貫通）
                                const playerAtk = userProfile?.atk || 0;
                                damage = calculateDamage(
                                    damage, targetEnemy.def || 0,
                                    battleState.player_effects as StatusEffect[],
                                    targetEnemy.status_effects as StatusEffect[] || [],
                                    isMagic, playerAtk
                                );
                                logMsg = `${targetEnemy.name}に${card.name}！ ${damage} ダメージ！`;
                            } else {
                                const effectName = effectInfo.effectId ? getEffectName(effectInfo.effectId) : card.name;
                                logMsg = `${targetEnemy.name}に${card.name}を使用！ ${effectName}を付与！`;
                            }
                            break;
                        }
                        default: { // 'attack'
                            damage = card.power ?? 0;
                            if (damage > 0) {
                                const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic') || card.name.toLowerCase().includes('fire');
                                const playerAtk = userProfile?.atk || 0;
                                damage = calculateDamage(
                                    damage,
                                    targetEnemy.def || 0,
                                    battleState.player_effects as StatusEffect[],
                                    targetEnemy.status_effects as StatusEffect[] || [],
                                    isMagic,
                                    playerAtk
                                );
                                logMsg = `${targetEnemy.name}に${card.name}を使用！ ${damage} のダメージ！`;
                            } else {
                                logMsg = `${card.name}を使用！`;
                            }
                        }
                        case 'support_activate': {
                            // v19: Supportカード使用 → バトル内永続バフ付与
                            const passiveLabel = getPassiveLabel(card.id);
                            // activeSupportBuffs にカードIDを追加（重複防止）
                            const currentBuffs = get().battleState.activeSupportBuffs || [];
                            if (!currentBuffs.includes(card.id)) {
                                set(state => ({
                                    battleState: {
                                        ...state.battleState,
                                        activeSupportBuffs: [...(state.battleState.activeSupportBuffs || []), card.id],
                                    }
                                }));
                            }
                            logMsg = `✨ ${card.name}を発動！ ${passiveLabel}（バトル終了まで）`;
                            break;
                        }
                    }

                    // ─── Card Cycle ────────────────────────────
                    nextHand = nextHand.filter(c => c.id !== card.id);
                    if ((card.type === 'Item' && card.isEquipment) || card.cost_type === 'item' || card.type === 'Support') {
                        // 装備品カード / cost_type=item / Supportカード → exhaust（再利用不可）
                        set(state => ({
                            battleState: {
                                ...state.battleState,
                                exhaustPile: [...state.battleState.exhaustPile, { id: card.id, name: card.name, type: card.type }],
                                consumedItems: [...state.battleState.consumedItems, card.id],
                            }
                        }));
                    } else {
                        nextDiscardPile = [...nextDiscardPile, card];
                    }

                    // ─── Effect Application (effectInfo経由) ──
                    // buff_self/taunt/buff_party/heal は switch 内で処理済み
                    // attack/aoe_attack/debuff_enemy の場合のみ敵にeffect付与
                    if (!effectInfo.skipDamage && effectInfo.effectId) {
                        const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(effectInfo.effectId);
                        if (isSelfBuff) {
                            const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3);
                            set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        }
                    }
                    // card.effect_id（既存カードのeffect_id属性）も引き続きサポート
                    if (card.effect_id && !effectInfo.effectId) {
                        const effectId = card.effect_id as StatusEffectId;
                        const duration = card.effect_duration || 3;
                        const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(effectId);
                        if (isSelfBuff) {
                            const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectId, duration);
                            set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        }
                    }
                }

                // ─── Apply Damage & Effects to Enemies ────
                let newEnemies = battleState.enemies.map(e => {
                    // AoE: 全生存敵にダメージ
                    if (isAoe && e.hp > 0) {
                        let newHp = Math.max(0, e.hp - damage);
                        let newEffects = (e.status_effects || []) as StatusEffect[];
                        if (effectInfo?.effectId) {
                            const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(effectInfo.effectId);
                            if (!isSelfBuff) {
                                newEffects = applyEffect(newEffects, effectInfo.effectId, effectInfo?.effectDuration || 3);
                            }
                        }
                        return { ...e, hp: newHp, status_effects: newEffects };
                    }
                    // 単体ターゲット
                    if (e.id === targetEnemyId) {
                        let newHp = Math.max(0, e.hp - damage);
                        let newEffects = (e.status_effects || []) as StatusEffect[];
                        // effectInfo 経由のデバフ付与
                        const resolvedEffectId = effectInfo?.effectId || (card?.effect_id as StatusEffectId | undefined);
                        if (resolvedEffectId) {
                            const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(resolvedEffectId);
                            if (!isSelfBuff) {
                                newEffects = applyEffect(newEffects, resolvedEffectId, effectInfo?.effectDuration || card?.effect_duration || 3);
                            }
                        }
                        return { ...e, hp: newHp, status_effects: newEffects };
                    }
                    return e;
                });

                const updatedTargetEnemy = newEnemies.find(e => e.id === targetEnemyId);
                const isTargetDead = updatedTargetEnemy ? updatedTargetEnemy.hp <= 0 : false;
                const allDead = newEnemies.every(e => e.hp <= 0);

                const newMessages = [...battleState.messages, logMsg];
                if (isTargetDead) {
                    newMessages.push(`${targetEnemy.name}を倒した！`);

                    // Drop Check (v2.6)
                    if (updatedTargetEnemy?.drop_rate && updatedTargetEnemy.drop_item_slug && Math.random() * 100 < updatedTargetEnemy.drop_rate) {
                        newMessages.push(`${updatedTargetEnemy.name}が「${updatedTargetEnemy.drop_item_slug}」を落とした！`);

                        // Add to inventory via API
                        const dropSlug = updatedTargetEnemy.drop_item_slug;
                        const { userProfile } = get();
                        const headers: HeadersInit = { 'Content-Type': 'application/json' };
                        if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                        fetch('/api/inventory', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ item_slug: dropSlug, quantity: 1 })
                        }).then(res => {
                            if (res.ok) {
                                // Optionally refresh inventory locally if needed, but fetchInventory is called elsewhere usually
                                // usage: get().fetchInventory(); (if we want immediate update)
                            }
                        }).catch(err => console.error("Drop add failed", err));
                    }
                }

                if (allDead) {
                    newMessages.push('全ての敵を倒した！ 勝利！');
                    try {
                        const reportPayload = {
                            action: 'victory',
                            impacts: selectedScenario?.impacts,
                            scenario_id: selectedScenario?.id
                        };
                        fetch('/api/report-action', { method: 'POST', body: JSON.stringify(reportPayload) });
                        get().fetchWorldState();
                        get().fetchUserProfile();
                        // Gold reward...
                        const partyCount = (get().battleState.party?.length || 0) + 1;
                        const gold = selectedScenario?.reward_gold || 50;
                        get().addGold(Math.floor(gold / partyCount));

                        // Consumed items sync...
                        const consumed = get().battleState.consumedItems || [];
                        consumed.forEach(cid => fetch('/api/battle/use-item', { method: 'POST', body: JSON.stringify({ inventory_id: cid }) }));
                    } catch (e) { console.error(e); }
                }

                // Update State
                set((state) => ({
                    hand: nextHand,
                    discardPile: nextDiscardPile,
                    battleState: {
                        ...state.battleState,
                        enemies: newEnemies,
                        enemy: isTargetDead ? (newEnemies.find(e => e.hp > 0) || null) : updatedTargetEnemy || null, // Switch target if dead
                        messages: newMessages,
                        isVictory: allDead
                    }
                }));
            },

            processPartyTurn: async () => {
                const { battleState, userProfile } = get();
                if (battleState.isVictory || !battleState.enemy) return;

                const currentBattle = get().battleState;
                if (!currentBattle.enemy) return;

                let newMessages = [...currentBattle.messages];
                let enemyHp = currentBattle.enemy.hp;
                const enemyDef = currentBattle.enemy.def || 0;
                const updatedParty = [...currentBattle.party];

                for (let i = 0; i < updatedParty.length; i++) {
                    const member = { ...updatedParty[i] };
                    if (!member.is_active || member.durability <= 0) continue;

                    // v8.4: ターン開始時に使用済みカードの履歴をリセット
                    member.used_this_turn = [];

                    const context: BattleContext = {
                        playerHp: userProfile?.hp || 0,
                        playerMaxHp: userProfile?.max_hp || 100,
                        enemyHp,
                        enemyDef,
                        partyMembers: updatedParty,
                        playerEffects: currentBattle.player_effects,
                    };

                    const actions = resolveNpcTurn(member, context);

                    for (const action of actions) {
                        newMessages.push(action.message);

                        if (action.type === 'attack' && action.damage) {
                            enemyHp = Math.max(0, enemyHp - action.damage);
                        }

                        if (action.type === 'heal' && action.healAmount) {
                            if (action.targetName === 'あなた') {
                                const currentHp = userProfile?.hp || 0;
                                const maxHp = userProfile?.max_hp || 100;
                                const newHp = Math.min(maxHp, currentHp + action.healAmount);
                                set(state => ({
                                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                                }));
                                fetch('/api/profile/update-status', { method: 'POST', body: JSON.stringify({ hp: newHp }) }).catch(console.error);
                            }
                        }

                        // v2.5/v8.3: NPC buff/debuff action (attacks can also have effectId)
                        if (action.effectId) {
                            const effectId = action.effectId as StatusEffectId;
                            const duration = action.effectDuration || 3;
                            const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(effectId);
                            if (isSelfBuff) {
                                // 味方バフ → player_effectsへ (NPC自身にかかっているバフもplayer_effectsで一括管理)
                                const currentEffects = get().battleState.player_effects as StatusEffect[];
                                const newEffects = applyEffect(currentEffects, effectId, duration);
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                            } else {
                                // 敵デバフ → enemy_effectsへ (対象の敵固有ではなく全体デバフ配列、または現在のターゲットへ)
                                // 厳密には敵単体ですが、現在のV3仕様ではエンカウント全体(またはターゲット)として扱われるようにな設計です
                                const currentEffects = get().battleState.enemy_effects as StatusEffect[];
                                const newEffects = applyEffect(currentEffects, effectId, duration);
                                set(state => ({ battleState: { ...state.battleState, enemy_effects: newEffects } }));
                            }
                        }

                        if (enemyHp <= 0) break;
                    }

                    // Persist NPC AP state back
                    updatedParty[i] = member;

                    if (enemyHp <= 0) break;
                }

                // Update enemies array with the target's new HP
                let updatedEnemies = [...(get().battleState.enemies || [])].map(e => {
                    if (e.id === currentBattle.enemy?.id) {
                        return { ...e, hp: enemyHp };
                    }
                    return e;
                });

                const allEnemiesDead = updatedEnemies.every(e => e.hp <= 0);

                // If current target dead but others alive, switch target
                let nextTarget = currentBattle.enemy ? { ...currentBattle.enemy, hp: enemyHp } : null;
                if (enemyHp <= 0 && !allEnemiesDead) {
                    const firstAlive = updatedEnemies.find(e => e.hp > 0);
                    if (firstAlive) {
                        nextTarget = firstAlive;
                        newMessages.push(`ターゲットを ${firstAlive.name} に切り替えた。`);
                    }
                }

                // Update State with updated party (AP changes)
                set(state => ({
                    battleState: {
                        ...state.battleState,
                        enemy: nextTarget,
                        enemies: updatedEnemies,
                        party: updatedParty,
                        messages: newMessages
                    }
                }));

                // Check Victory — ALL enemies must be dead
                if (allEnemiesDead) {
                    const { selectedScenario } = get();
                    const finalMessages = [...newMessages, 'パーティの活躍により、宿敵を打ち倒した！ 勝利！'];

                    try {
                        const reportPayload = {
                            action: 'victory',
                            impacts: selectedScenario?.impacts,
                            scenario_id: selectedScenario?.id
                        };

                        await fetch('/api/report-action', {
                            method: 'POST',
                            body: JSON.stringify(reportPayload)
                        });

                        await get().fetchWorldState();
                        await get().fetchUserProfile();

                        const partyCount = (currentBattle.party.length || 0) + 1;
                        const rewardGold = selectedScenario?.reward_gold || 50;
                        const reward = Math.floor(rewardGold / partyCount);
                        get().addGold(reward);

                        finalMessages.push(`報酬 金貨 ${rewardGold} 枚を獲得。`);
                        if (partyCount > 1) finalMessages.push(`(パーティ分配: 1人あたり ${reward} 枚)`);

                        fetch('/api/profile/update-status', {
                            method: 'POST',
                            body: JSON.stringify({ gold: get().gold })
                        }).catch(console.error);

                        finalMessages.push('あなたの活躍が、世界の情勢に微かな変化をもたらしました。');

                    } catch (e) { console.error(e); }

                    set(state => ({
                        battleState: { ...state.battleState, isVictory: true, messages: finalMessages }
                    }));
                    return;
                }

                // Trigger Enemy Turn
                setTimeout(() => {
                    get().processEnemyTurn();
                }, 800);
            },

            processEnemyTurn: async (unusedDamage?: number) => {
                const { battleState, userProfile } = get();
                // Filter living enemies
                const enemies = battleState.enemies ? battleState.enemies.filter(e => e.hp > 0) : [];
                if (enemies.length === 0 && !battleState.enemy) return;

                // Fallback for old state if enemies array is missing matching enemy
                const activeEnemies = enemies.length > 0 ? enemies : (battleState.enemy ? [battleState.enemy] : []);
                // v20: 敵のHP変動をトラッキング（回復スキル等）
                let updatedEnemies = [...(battleState.enemies || [])];

                let newMessages = [...battleState.messages];
                let newParty = [...battleState.party];
                let newUserProfile = userProfile ? { ...userProfile } : null;
                let vitDamageTaken = battleState.vitDamageTakenThisTurn;

                // Loop through all living enemies
                for (const enemy of activeEnemies) {
                    newMessages.push(`${enemy.name}の行動！`);

                    // ─── v20: AI Action Pattern Engine ───────────────
                    const actions = (enemy as any).action_pattern || [];
                    let selectedSkillSlug: string | null = null;
                    let applyStun = false;
                    let isDrainVit = false;

                    if (actions.length > 0) {
                        // 1. Filter actions by condition
                        const validActions = actions.filter((a: any) => {
                            if (!a.condition) return true;
                            const parts = String(a.condition).split(':');
                            const condType = parts[0];
                            const condVal = Number(parts[1]) || 0;
                            switch (condType) {
                                case 'turn_mod':
                                    return battleState.turn > 0 && battleState.turn % condVal === 0;
                                case 'hp_under':
                                    return enemy.hp < enemy.maxHp * (condVal / 100);
                                default:
                                    return true;
                            }
                        });

                        // 2. Weighted random selection from valid actions
                        if (validActions.length > 0) {
                            const totalProb = validActions.reduce((sum: number, a: any) => sum + (a.prob || 0), 0);
                            let roll = Math.floor(Math.random() * totalProb);
                            for (const action of validActions) {
                                roll -= (action.prob || 0);
                                if (roll < 0) {
                                    selectedSkillSlug = action.skill;
                                    break;
                                }
                            }
                            // Safety: pick last if roll somehow didn't match
                            if (!selectedSkillSlug) selectedSkillSlug = validActions[validActions.length - 1].skill;
                        }
                    }

                    // 3. Resolve skill from dictionary
                    const skillDef = selectedSkillSlug ? getEnemySkill(selectedSkillSlug) : null;

                    // 4. Calculate action result
                    let enemyAtk = 0;

                    if (skillDef) {
                        // Skill-based action
                        const baseAtk = (enemy.level || 1) * 3 + 5;

                        switch (skillDef.effect_type) {
                            case 'damage': {
                                enemyAtk = Math.floor(baseAtk * skillDef.value);
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                                // Special: stun for boss_stun or god_purge
                                if (selectedSkillSlug === 'skill_god_purge' || selectedSkillSlug === 'skill_boss_stun') {
                                    applyStun = true;
                                }
                                break;
                            }
                            case 'heal': {
                                const healAmount = skillDef.value;
                                const oldHp = enemy.hp;
                                const newEnemyHp = Math.min(enemy.maxHp, oldHp + healAmount);
                                const actualHeal = newEnemyHp - oldHp;
                                // Update in the tracked enemies array
                                updatedEnemies = updatedEnemies.map(e =>
                                    e.id === enemy.id ? { ...e, hp: newEnemyHp } : e
                                );
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！ HP ${actualHeal} 回復！`);
                                continue; // Heal does not deal damage; skip to next enemy
                            }
                            case 'drain_vit': {
                                enemyAtk = Math.floor(baseAtk * skillDef.value);
                                isDrainVit = true;
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                                break;
                            }
                            case 'status_effect': {
                                // Currently status_effect = stun
                                applyStun = true;
                                enemyAtk = Math.floor(baseAtk * 0.5); // Light damage with status
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                                break;
                            }
                        }
                    } else {
                        // Fallback: no action_pattern or no valid actions → basic attack
                        enemyAtk = (enemy.level || 1) * 5 + 10;
                        newMessages.push(`${enemy.name}の攻撃！`);
                    }

                    // ─── Damage Application ─────────────────────────
                    if (enemyAtk <= 0) continue; // heal/no-damage actions already handled

                    // 1. Route Damage
                    const result = routeDamage(newParty, enemyAtk);

                    // 2. Apply Damage
                    if (result.target === 'PartyMember' && result.targetId) {
                        newParty = newParty.map(p => {
                            if (p.id === result.targetId) {
                                const def = p.def || 0;
                                const mitigated = Math.max(1, result.damage - def);
                                const newDur = Math.max(0, p.durability - mitigated);
                                if (result.isCovered) newMessages.push(`${p.name}がかばった！ ${mitigated}のダメージ`);
                                else newMessages.push(`${p.name}に${mitigated}のダメージ`);

                                if (newDur <= 0) {
                                    newMessages.push(`${p.name}は力尽きた...`);
                                    supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', p.id).then();
                                }
                                return { ...p, durability: newDur, is_active: newDur > 0 };
                            }
                            return p;
                        });
                    }

                    if (result.target === 'Player') {
                        const def = newUserProfile?.def || 0;
                        const mitigated = Math.max(1, result.damage - def);

                        if (newUserProfile) {
                            const prevHp = newUserProfile.hp || 0;
                            const newHp = Math.max(0, prevHp - mitigated);
                            const actualDamage = prevHp - newHp;
                            newUserProfile.hp = newHp;

                            if (actualDamage > 0) {
                                newMessages.push(`あなたに ${actualDamage} のダメージ${def > 0 ? ` (DEF -${def})` : ''}`);
                            } else {
                                newMessages.push(`あなたに攻撃！ しかしもう意識がない…`);
                            }

                            // v20: drain_vit — スキル経由での正確な判定（旧traits依存を廃止）
                            if (isDrainVit && actualDamage > 0 && newHp > 0 && !vitDamageTaken) {
                                const currentVit = newUserProfile.vitality ?? 100;
                                if (currentVit > 0) {
                                    newUserProfile.vitality = currentVit - 1;
                                    vitDamageTaken = true;
                                    newMessages.push(`生命力を奪われた！ (Vitality -1)`);
                                    const { selectedProfileId } = get();
                                    fetch('/api/profile/consume-vitality', {
                                        method: 'POST',
                                        body: JSON.stringify({ amount: 1, profileId: selectedProfileId })
                                    }).catch(console.error);
                                }
                            }

                            // Application of Stun
                            if (applyStun && actualDamage > 0) {
                                const playerEffects = battleState.player_effects as StatusEffect[] || [];
                                const hasStunImmunity = playerEffects.some(e => e.id === 'stun_immune' && e.duration > 0);
                                if (hasStunImmunity) {
                                    newMessages.push(`強靭な意志で気絶現象を弾き返した！`);
                                } else {
                                    newMessages.push(`凄まじい衝撃で気絶した！`);
                                    set((state) => {
                                        let currentEffects = [...(state.battleState.player_effects as StatusEffect[] || [])];
                                        currentEffects = applyEffect(currentEffects, 'stun', 1);
                                        currentEffects = applyEffect(currentEffects, 'stun_immune', 2);
                                        return { battleState: { ...state.battleState, player_effects: currentEffects } };
                                    });
                                }
                            }

                            // HP0なら残りの敵の攻撃をスキップ
                            if (newHp <= 0) break;
                        }
                    }
                }

                if (newUserProfile && (newUserProfile.hp ?? 0) <= 0) {
                    newMessages.push("あなたは力尽きた...");

                    // v20: Bounty敗北ペナルティ（URLパラメータ非依存）
                    const hasBountyEnemy = activeEnemies.some(e => e.spawn_type === 'bounty');
                    if (hasBountyEnemy && newUserProfile) {
                        const currentGold = newUserProfile.gold || 0;
                        const penalty = Math.ceil(currentGold / 2);
                        if (penalty > 0) {
                            newMessages.push(`賞金稼ぎに身包みを剥がされた… 所持金の半分（${penalty}G）を失った！`);
                            // spendGold は set 後に呼ぶ
                            setTimeout(() => {
                                get().spendGold(penalty);
                                fetch('/api/profile/update-status', {
                                    method: 'POST',
                                    body: JSON.stringify({ gold: Math.max(0, currentGold - penalty) })
                                }).catch(console.error);
                            }, 100);
                        }
                    }

                    soundManager?.playSE('se_battle_lose');
                    // v8.2: isDefeat時もuserProfileのHPを同期してHPバーに反映
                    set(state => ({ 
                        userProfile: newUserProfile,
                        battleState: { ...state.battleState, isDefeat: true, messages: newMessages } 
                    }));
                } else {
                    set(state => ({
                        userProfile: newUserProfile,
                        battleState: {
                            ...state.battleState,
                            enemy: state.battleState.enemy,
                            enemies: updatedEnemies.map(e => e.hp > 0 ? e : { ...e, hp: 0 }),
                            party: newParty,
                            messages: newMessages,
                            vitDamageTakenThisTurn: false
                        }
                    }));
                }
            },





            setTarget: (enemyId: string) => {
                const { battleState } = get();
                const target = battleState.enemies.find(e => e.id === enemyId);
                if (target) {
                    set(state => ({
                        battleState: { ...state.battleState, enemy: target }
                    }));
                }
            },

            setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => {
                set((state) => ({
                    battleState: { ...state.battleState, currentTactic: tactic }
                }));
            },

            fleeBattle: () => {
                const success = Math.random() < 0.5;

                if (success) {
                    set((state) => ({
                        battleState: {
                            ...state.battleState,
                            messages: [...state.battleState.messages, "一行は逃げ出した..."],
                            isDefeat: true,
                        }
                    }));
                } else {
                    set((state) => ({
                        battleState: {
                            ...state.battleState,
                            messages: [...state.battleState.messages, "逃走に失敗！ 敵の反撃を受ける！"]
                        }
                    }));
                    setTimeout(() => {
                        get().processEnemyTurn();
                    }, 500);
                }
            },

            waitTurn: async () => {
                const { battleState } = get();
                if (battleState.isVictory || battleState.isDefeat) return;

                // "様子を見る" = Skip action phase, preserve AP for next turn
                // AP is NOT consumed, and will gain +5 next turn (up to cap 10)
                const currentAp = battleState.current_ap || 0;
                const newMessages = [...battleState.messages, `様子を見ている... (残AP: ${currentAp} → 次ターンに持ち越し)`];

                set({
                    battleState: {
                        ...battleState,
                        messages: newMessages
                    }
                });

                // Trigger end of turn (Energy Phase + Enemy Turn)
                await get().endTurn();
            },

            clearStorage: () => {
                try {
                    localStorage.removeItem('game-storage');
                    console.log("Storage cleared");
                    window.location.reload();
                } catch (e) {
                    console.error("Failed to clear storage", e);
                }
            }
        }),
        {
            name: 'game-storage',
            partialize: (state) => ({
                gold: state.gold,
                inventory: state.inventory,
                battleState: state.battleState,
                deck: state.deck,
                hand: state.hand,
                discardPile: state.discardPile,
                selectedScenario: state.selectedScenario,
                userProfile: state.userProfile
            }),
            storage: createJSONStorage(() => typeof window !== 'undefined' ? window.localStorage : {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
