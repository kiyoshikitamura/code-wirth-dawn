import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Adventurer, Card, Enemy, WorldState, Scenario, InventoryItem, UserProfile, BattleState, PartyMember } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { WORLD_ID } from '@/utils/constants';
import { buildBattleDeck, routeDamage, canAffordCard } from '@/lib/battleEngine';

// Dummy Data
/* const DUMMY_PARTY: Adventurer[] = [ ... ]; */

const DUMMY_ENEMY: Enemy = {
    id: 'e1', name: 'Shadow Wolf', level: 4, hp: 300, maxHp: 300,
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
    fetchUserProfile: () => Promise<void>;

    battleState: BattleState;

    // Global
    worldState: WorldState | null;
    fetchWorldState: () => Promise<void>;

    // Gold & Shopping
    gold: number;
    addGold: (amount: number) => void;
    spendGold: (amount: number) => boolean;

    // Actions
    initialize: () => void;
    initializeBattle: () => void; // Expose for testing
    selectedScenario: Scenario | null;
    selectScenario: (scenario: Scenario | null) => void;
    startBattle: (enemy: Enemy) => void;
    attackEnemy: (card?: Card) => Promise<void>;
    endTurn: () => Promise<void>;
    resetBattle: () => void;

    // Inventory
    inventory: InventoryItem[];
    fetchInventory: () => Promise<void>;
    toggleEquip: (itemId: string, currentEquip: boolean) => Promise<void>;

    // Hand Management
    deck: Card[];
    discardPile: Card[];
    hand: Card[];
    drawCards: (count: number) => void;
    discardCard: (index: number) => void;
    dealHand: () => void;
    useItem: (card: Card) => Promise<void>;
    processEnemyTurn: (damage: number) => Promise<void>;
    setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => void;
    fleeBattle: () => void;
    clearStorage: () => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // Initialize missing defaults
            userProfile: null,
            worldState: null,
            gold: 1000,
            selectedScenario: null,
            inventory: [],
            deck: [],
            discardPile: [],
            hand: [],

            battleState: {
                enemy: null,
                party: [],
                turn: 1,
                messages: [],
                isVictory: false,
                cooldowns: {},
                currentTactic: 'Aggressive'
            },

            initializeBattle: () => {
                // Delegate to startBattle for proper Deck Construction
                get().startBattle({
                    id: 'e1', name: 'Shadow Wolf', level: 4, hp: 300, maxHp: 300,
                });
            },

            initialize: () => get().initializeBattle(),

            startBattle: async (enemy: Enemy) => {
                // 1. Fetch Party from DB (party_members table)
                let partyMembers: PartyMember[] = [];
                try {
                    const { userProfile } = get();
                    if (userProfile?.id) {
                        const { data } = await supabase
                            .from('party_members')
                            .select('*')
                            .eq('owner_id', userProfile.id)
                            .eq('is_active', true);

                        if (data) partyMembers = data as PartyMember[];
                    }
                } catch (e) { console.error("Party fetch failed", e); }

                // 2. Build Deck
                const { inventory, worldState } = get();
                // Map inventory equipped items to Cards
                const equippedCards = (inventory || []).filter(i => i.is_equipped).map(i => ({
                    id: i.id, // Inventory ID as Card ID
                    name: i.name,
                    type: (i.is_skill ? 'Skill' : 'Item') as Card['type'],
                    description: i.description,
                    cost: 0,
                    power: i.power_value,
                    isEquipment: true,
                }));

                const initialDeck = buildBattleDeck(
                    equippedCards,
                    partyMembers,
                    (id) => CARD_POOL.find(c => c.id === id),
                    worldState?.status // Pass World State
                );

                // Shuffle Deck
                const shuffledDeck = initialDeck.sort(() => 0.5 - Math.random());

                set({
                    battleState: {
                        enemy,
                        party: partyMembers,
                        turn: 1,
                        messages: [`${enemy.name}が現れた！`],
                        isVictory: false,
                        cooldowns: {},
                        currentTactic: 'Aggressive'
                    },
                    deck: shuffledDeck,
                    discardPile: [],
                    hand: []
                });

                // Draw Initial Hand (e.g. 5 cards)
                get().dealHand();
            },

            endTurn: async () => {
                set((state) => ({
                    battleState: {
                        ...state.battleState,
                        turn: state.battleState.turn + 1,
                        messages: [...state.battleState.messages, "ターン終了"]
                    }
                }));
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

            addGold: (amount) => set((state) => ({ gold: state.gold + amount })),

            spendGold: (amount) => {
                const { gold } = get();
                if (gold >= amount) {
                    set({ gold: gold - amount });
                    return true;
                }
                return false;
            },

            dealHand: () => {
                const { deck, discardPile, hand } = get();
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
                    // Determine location to fetch
                    const { userProfile } = get();
                    const targetLocationName = userProfile?.locations?.name || '名もなき旅人の拠所';
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
                            id: WORLD_ID,
                            location_name: targetLocationName,
                            status: '繁栄', // Default per new schema
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
                    const res = await fetch('/api/profile', { cache: 'no-store' });
                    if (res.ok) {
                        const profile = await res.json();
                        set({ userProfile: profile, gold: profile.gold }); // Sync gold
                    }
                } catch (e) {
                    console.error("Failed to fetch profile", e);
                }
            },

            // --- Inventory Actions ---
            fetchInventory: async () => {
                try {
                    const res = await fetch('/api/inventory', { cache: 'no-store' });
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
                        i.id === itemId ? { ...i, is_equipped: !currentEquip } : i
                    );
                    set({ inventory: newInventory });

                    await fetch('/api/inventory', {
                        method: 'PATCH',
                        body: JSON.stringify({ inventory_id: itemId, is_equipped: !currentEquip }),
                        cache: 'no-store'
                    });
                } catch (e) {
                    console.error("Failed to toggle equip", e);
                    // Revert on error? For prototype, maybe skip
                }
            },

            attackEnemy: async (card?: Card) => {
                const { battleState, selectedScenario, hand, userProfile } = get(); // Get latest state
                if (!battleState.enemy || battleState.isVictory) return;

                // MP Check & Consumption
                // Cost Check (MP or Vitality)
                if (card) {
                    const { userProfile } = get();
                    const currentMp = userProfile?.mp ?? 0;
                    const currentVitality = userProfile?.vitality ?? 100;

                    if (!canAffordCard(card, currentMp, currentVitality)) {
                        set(state => ({
                            battleState: {
                                ...state.battleState,
                                messages: [...state.battleState.messages, "コストが足りない！"]
                            }
                        }));
                        return;
                    }

                    // Consume Resources
                    if (card.cost) { // MP
                        const newMp = currentMp - card.cost;
                        if (userProfile) set({ userProfile: { ...userProfile, mp: newMp } });
                        fetch('/api/profile/update-status', { method: 'POST', body: JSON.stringify({ mp: newMp }) }).catch(console.error);
                    }
                    // Vitality Cost (Future)
                }

                console.log("[Attack] Card used:", card);

                // Determine damage based on card or default
                let damage = Math.floor(Math.random() * 11) + 10;
                let logMsg = `旅人の攻撃！ ${damage} のダメージ！`;

                // 1. Check Blocking Cooldowns (Read from current state)
                if (card && card.type === 'Skill' && card.id) {
                    const currentCooldown = battleState.cooldowns?.[card.id] || 0;
                    if (currentCooldown > 0) {
                        console.log("[Attack] Blocked by cooldown:", currentCooldown);
                        return;
                    }
                }

                // Prepare next state variables
                let nextHand = [...hand];
                let nextCooldowns = { ...battleState.cooldowns };

                if (card) {
                    if (card.power) {
                        damage = card.power;
                        logMsg = `${card.name}を使用！ ${damage} のダメージ！`;
                    }

                    // 2. Handle Item Consumption
                    if (card.type === 'Item') {
                        // Remove from hand
                        nextHand = nextHand.filter(c => c.id !== card.id);

                        // API and Inventory Update
                        if (card.isEquipment) {
                            try {
                                fetch('/api/battle/use-item', {
                                    method: 'POST',
                                    body: JSON.stringify({ inventory_id: card.id }) // card.id is inventory.id
                                });
                                // Decrease quantity in local inventory store
                                const { inventory } = get();
                                const targetItem = inventory.find(i => i.id === card.id);
                                if (targetItem) {
                                    if (targetItem.quantity > 1) {
                                        const newInv = inventory.map(i => i.id === card.id ? { ...i, quantity: i.quantity - 1 } : i);
                                        set({ inventory: newInv });
                                    } else {
                                        set({ inventory: inventory.filter(i => i.id !== card.id) });
                                    }
                                }
                            } catch (e) { console.error(e); }
                        }
                    }

                    // 3. Apply New Skill Cooldown (Set to 3)
                    if (card.type === 'Skill' && card.id) {
                        nextCooldowns[card.id] = 3;
                    }
                }

                const newHp = Math.max(0, battleState.enemy.hp - damage);
                const isDead = newHp <= 0;

                const newMessages = [...battleState.messages, logMsg];

                // 4. Trace Cooldowns (End of Turn Decrement)
                // We decrement ALL cooldowns (including the one just set, effectively making it 2 turn wait if we count this turn as one tick)
                Object.keys(nextCooldowns).forEach(key => {
                    if (nextCooldowns[key] > 0) nextCooldowns[key]--;
                });

                if (isDead) {
                    newMessages.push('宿敵を打ち倒した！ 勝利！');
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

                        // Sync Global State immediately
                        await get().fetchWorldState();
                        await get().fetchUserProfile();

                        const partyCount = (get().battleState.party?.length || 0) + 1; // +1 for User
                        if (selectedScenario?.reward_gold) {
                            const reward = Math.floor(selectedScenario.reward_gold / partyCount);
                            get().addGold(reward);
                            newMessages.push(`報酬 金貨 ${selectedScenario.reward_gold} 枚を獲得。`);
                            if (partyCount > 1) newMessages.push(`(パーティ分配: 1人あたり ${reward} 枚)`);
                        } else {
                            const defaultGold = 50;
                            const reward = Math.floor(defaultGold / partyCount);
                            get().addGold(reward);
                            newMessages.push(`報酬 金貨 ${defaultGold} 枚を獲得。`);
                            if (partyCount > 1) newMessages.push(`(パーティ分配: 1人あたり ${reward} 枚)`);
                        }
                        // Sync Gold Persistence
                        fetch('/api/profile/update-status', {
                            method: 'POST',
                            body: JSON.stringify({ gold: get().gold })
                        }).catch(console.error);
                        newMessages.push('あなたの活躍が、世界の情勢に微かな変化をもたらしました。');
                    } catch (e) {
                        console.error(e);
                    }
                }

                // Final State Update
                set((state) => ({
                    hand: nextHand,
                    battleState: {
                        ...state.battleState,
                        enemy: state.battleState.enemy ? { ...state.battleState.enemy, hp: newHp } : null,
                        messages: newMessages,
                        isVictory: isDead,
                        cooldowns: nextCooldowns,
                        turn: state.battleState.turn + 1
                    }
                }));

                // Trigger Enemy Turn if not dead
                if (!isDead) {
                    setTimeout(() => {
                        const enemy = get().battleState.enemy;
                        const enemyAtk = enemy?.level ? enemy.level * 5 + 10 : 15;
                        get().processEnemyTurn(enemyAtk);
                    }, 800);
                }
            },

            processEnemyTurn: async (damage: number) => {
                const { battleState, userProfile } = get();
                // 1. Route Damage
                const result = routeDamage(battleState.party, damage);

                let newMessages = [...battleState.messages, result.message];
                let newParty = [...battleState.party];
                let newUserProfile = userProfile ? { ...userProfile } : null;

                // 2. Apply Damage to Target
                if (result.target === 'PartyMember' && result.targetId) {
                    newParty = newParty.map(p => {
                        if (p.id === result.targetId) {
                            const newDur = Math.max(0, p.durability - result.damage);
                            if (newDur <= 0) {
                                newMessages.push(`${p.name} は力尽きた... (LOST)`);
                                // Persistent Death
                                supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', p.id).then();
                            } else {
                                // Persistent Damage
                                supabase.from('party_members').update({ durability: newDur }).eq('id', p.id).then();
                            }
                            return { ...p, durability: newDur, is_active: newDur > 0 };
                        }
                        return p;
                    });
                } else {
                    // Player Hit
                    if (newUserProfile) {
                        const newHp = Math.max(0, (newUserProfile.hp || 100) - result.damage);
                        newUserProfile.hp = newHp;

                        // Sync HP
                        set({ userProfile: newUserProfile });
                        fetch('/api/profile/update-status', { method: 'POST', body: JSON.stringify({ hp: newHp }) }).catch(console.error);

                        if (newHp <= 0) {
                            newMessages.push("あなたは力尽きた... (運命の時は近い)");
                            // Handle Vitality Reduction logic here or in separate function
                        }
                    }
                }

                set((state) => ({
                    battleState: {
                        ...state.battleState,
                        party: newParty,
                        messages: newMessages,
                        // turn: state.battleState.turn + 1 // Optional explicit turn step
                    }
                }));
            },

            setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => {
                set((state) => ({
                    battleState: { ...state.battleState, currentTactic: tactic }
                }));
            },

            fleeBattle: () => {
                set((state) => ({
                    battleState: {
                        ...state.battleState,
                        messages: [...state.battleState.messages, "一行は逃げ出した..."],
                        isVictory: false
                    }
                }));
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
        }
        ),
        {
            name: 'game-storage',
            partialize: (state) => ({ gold: state.gold, inventory: state.inventory }),
        }
    )
);
