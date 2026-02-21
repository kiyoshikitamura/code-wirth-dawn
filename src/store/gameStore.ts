import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Adventurer, Card, Enemy, WorldState, Scenario, InventoryItem, UserProfile, BattleState, PartyMember, UserHubState } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { WORLD_ID } from '@/utils/constants';
import { buildBattleDeck, routeDamage, canAffordCard, calculateDamage } from '@/lib/battleEngine';
import { resolveNpcTurn, determineRole, determineGrade, NpcAction, BattleContext } from '@/lib/npcAI';
import { StatusEffect, applyEffect, tickEffects, getBleedDamage, isStunned, hasEffect, StatusEffectId } from '@/lib/statusEffects';
import { validateCardUse, getDefaultTarget } from '@/lib/targeting';
import { useQuestState } from './useQuestState';


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
    toggleEquip: (itemId: string, currentEquip: boolean) => Promise<void>;
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

                // 2. Build Deck
                const { inventory, worldState } = get();
                const equippedCards = (inventory || []).filter(i => i.is_equipped).map(i => ({
                    id: String(i.id),
                    name: i.name,
                    type: (i.is_skill ? 'Skill' : 'Item') as Card['type'],
                    description: i.effect_data?.description || '',
                    cost: 0,
                    power: i.effect_data?.power || 0,
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
                            name: c.name, // ... other fields mapped in original
                            type: c.type,
                            description: c.description,
                            cost: c.cost_val || c.cost || 0, // Handle cost_val from DB
                            power: c.effect_val || c.power || 0, // Fix: Map effect_val to power
                            ap_cost: c.ap_cost ?? 1,
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

                const initialDeck = buildBattleDeck(
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

                set({
                    battleState: {
                        enemy: firstEnemy, // Target first by default
                        enemies: enemies,
                        party: partyMembers,
                        turn: 1,
                        current_ap: 5,
                        messages: [`${enemies.map(e => e.name).join('と')}が現れた！`, `--- Turn 1 ---`],
                        isVictory: false,
                        isDefeat: false,
                        currentTactic: 'Aggressive',
                        player_effects: [],
                        enemy_effects: [],
                        exhaustPile: [],
                        consumedItems: [],
                        vitDamageTakenThisTurn: false,
                        battle_result: undefined,
                    },
                    deck: shuffledDeck,
                    discardPile: [],
                    hand: []
                });

                get().dealHand();
            },

            endTurn: async () => {
                const { battleState, userProfile } = get();
                if (battleState.isVictory || battleState.isDefeat) return;

                const nextTurn = battleState.turn + 1;

                if (nextTurn > 30) {
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
                    await supabase
                        .from('user_profiles')
                        .update({ gold: newGold })
                        .eq('id', userProfile.id);
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
                const { deck, discardPile, hand, battleState } = get();

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

                const drawCount = 5 - hand.length; // Draw up to 5
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

                    let targetLocationName = userProfile?.locations?.name || '名もなき旅人の拠所';

                    if (hubState?.is_in_hub) {
                        targetLocationName = '名もなき旅人の拠所';
                    }

                    console.log("Fetching World State for:", targetLocationName);

                    // New Scheme: Query by LOCATION_NAME
                    const { data, error } = await supabase
                        .from('world_states')
                        .select('*')
                        .eq('location_name', targetLocationName)
                        .maybeSingle(); // Use maybeSingle to avoid 406 error if missing

                    if (data && !error) {
                        set({ worldState: data as WorldState });
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
                                    set({ worldState: newData as WorldState });
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
                            controlling_nation: 'Neutral'
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

                    const res = await fetch(url, { cache: 'no-store' });
                    if (res.ok) {
                        const profile = await res.json();
                        set({ userProfile: profile, gold: profile.gold }); // Sync gold
                        // If we didn't have an ID but got one (e.g. from auth or fallback), store it?
                        // Actually, for consistency, let's keep selectedProfileId as the "Frontend Authority".
                        // If it's null, we accept whatever the API gives us, but maybe we shouldn't auto-set it 
                        // to avoid locking onto a potentially wrong "latest" profile unless we are sure.
                        // For now, only explicit set (like from TitlePage) drives this.
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
                    const headers: HeadersInit = {};
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

            toggleEquip: async (itemId: string, currentEquip: boolean) => {
                try {
                    // Optimistic update
                    const { inventory } = get();
                    const newInventory = inventory.map(i =>
                        String(i.id) === itemId ? { ...i, is_equipped: !currentEquip } : i
                    );
                    set({ inventory: newInventory });

                    const { userProfile } = get();
                    const headers: HeadersInit = { 'Content-Type': 'application/json' };
                    if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                    await fetch('/api/inventory', {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ inventory_id: itemId, is_equipped: !currentEquip }),
                        cache: 'no-store'
                    });
                } catch (e) {
                    console.error("Failed to toggle equip", e);
                    // Revert on error? For prototype, maybe skip
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
                }

                console.log("[Attack] Card used:", card);

                let nextHand = [...hand];
                let nextDiscardPile = [...get().discardPile];
                let logMsg = '';
                let damage = 0;

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

                    damage = card.power ?? 0;
                    if (damage > 0) {
                        const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic') || card.name.toLowerCase().includes('fire');
                        const playerAtk = userProfile?.atk || userProfile?.attack || 0;

                        damage = calculateDamage(
                            damage,
                            targetEnemy.def || 0,
                            battleState.player_effects as StatusEffect[],
                            targetEnemy.status_effects as StatusEffect[] || [], // v3.5
                            isMagic,
                            playerAtk
                        );
                        logMsg = `${targetEnemy.name}に${card.name}を使用！ ${damage} のダメージ！`;
                    } else {
                        logMsg = `${card.name}を使用！`;
                    }

                    // Card Cycle
                    nextHand = nextHand.filter(c => c.id !== card.id);
                    if (card.type === 'Item' && card.isEquipment) {
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

                    // Effect Application
                    if (card.effect_id) {
                        const effectId = card.effect_id as StatusEffectId;
                        const duration = card.effect_duration || 3;
                        const isSelfBuff = ['atk_up', 'def_up', 'regen'].includes(effectId);
                        if (isSelfBuff) {
                            const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectId, duration);
                            set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        }
                    }
                }

                // Apply Damage & Effects to Enemies Array
                let newEnemies = battleState.enemies.map(e => {
                    if (e.id === targetEnemyId) {
                        let newHp = Math.max(0, e.hp - damage);
                        let newEffects = (e.status_effects || []) as StatusEffect[];

                        if (card?.effect_id) {
                            const effectId = card.effect_id as StatusEffectId;
                            const isSelfBuff = ['atk_up', 'def_up', 'regen'].includes(effectId);
                            if (!isSelfBuff) {
                                newEffects = applyEffect(newEffects, effectId, card.effect_duration || 3);
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

                // v2.4: Use NPC AI Engine for each party member
                for (let i = 0; i < updatedParty.length; i++) {
                    const member = { ...updatedParty[i] };
                    if (!member.is_active || member.durability <= 0) continue;

                    const context: BattleContext = {
                        playerHp: userProfile?.hp || 0,
                        playerMaxHp: userProfile?.max_hp || 100,
                        enemyHp,
                        enemyDef,
                        partyMembers: updatedParty,
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

                        // v2.5: NPC buff/debuff action
                        if (action.type === 'buff' && action.effectId) {
                            const effectId = action.effectId as StatusEffectId;
                            const duration = action.effectDuration || 3;
                            const isSelfBuff = ['atk_up', 'def_up', 'regen'].includes(effectId);
                            if (isSelfBuff) {
                                // 味方バフ → player_effectsへ
                                const currentEffects = get().battleState.player_effects as StatusEffect[];
                                const newEffects = applyEffect(currentEffects, effectId, duration);
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                            } else {
                                // 敵デバフ → enemy_effectsへ
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

                // Update State with updated party (AP changes)
                set(state => ({
                    battleState: {
                        ...state.battleState,
                        enemy: state.battleState.enemy ? { ...state.battleState.enemy, hp: enemyHp } : null,
                        party: updatedParty,
                        messages: newMessages
                    }
                }));

                // Check Victory
                if (enemyHp <= 0) {
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

                let newMessages = [...battleState.messages];
                let newParty = [...battleState.party];
                let newUserProfile = userProfile ? { ...userProfile } : null;
                let vitDamageTaken = battleState.vitDamageTakenThisTurn;

                // Loop through all living enemies
                for (const enemy of activeEnemies) {
                    newMessages.push(`${enemy.name}の行動！`);

                    // Simple AI: Calculate Damage
                    // v3.5: Support 'vit_damage' or traits
                    const enemyAtk = enemy.level * 5 + 10;

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
                                    // Death logic...
                                    supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', p.id).then();
                                }
                                return { ...p, durability: newDur, is_active: newDur > 0 };
                            }
                            return p;
                        });
                    }

                    if (result.target === 'Player') {
                        // Player Hit
                        const def = newUserProfile?.def || 0;
                        const mitigated = Math.max(1, result.damage - def);
                        newMessages.push(`あなたに ${mitigated} のダメージ (DEF -${def})`);

                        if (newUserProfile) {
                            const newHp = Math.max(0, (newUserProfile.hp || 100) - mitigated);
                            newUserProfile.hp = newHp;

                            // Vit Damage Logic (v3.5)
                            // Use 'vit_damage' property from enemy if exists, otherwise check traits
                            const vitDmgVal = (enemy as any).vit_damage || 0;
                            const traits = enemy.traits || [];
                            const hasDrainVit = traits.includes('drain_vit') || vitDmgVal > 0;

                            if (mitigated > 0 && newHp > 0 && hasDrainVit && !vitDamageTaken) {
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
                        }
                    }
                }

                if (newUserProfile && (newUserProfile.hp ?? 0) <= 0) {
                    newMessages.push("あなたは力尽きた...");
                    set(state => ({ battleState: { ...state.battleState, isDefeat: true, messages: newMessages } }));
                } else {
                    // Ensure messages are updated even if not defeated
                    set(state => ({
                        userProfile: newUserProfile,
                        battleState: {
                            ...state.battleState,
                            enemy: state.battleState.enemy, // No change to enemy here?
                            enemies: enemies, // Should update enemies state if needed?
                            party: newParty,
                            messages: newMessages,
                            vitDamageTakenThisTurn: false // Reset for next turn
                        }
                    }));
                }

                // End of Enemy Turn
                // Player can now act.
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
