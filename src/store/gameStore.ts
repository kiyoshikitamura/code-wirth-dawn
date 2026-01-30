import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Adventurer, Card, Enemy, WorldState, Scenario, InventoryItem, UserProfile, BattleState } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { WORLD_ID } from '@/utils/constants';

// Dummy Data
const DUMMY_PARTY: Adventurer[] = [
    {
        id: 'p1', name: 'Alphen', age: 24, class: 'Swordsman', level: 5, hp: 120, maxHp: 120, mp: 40, maxMp: 40,
        coupons: [],
    },
    {
        id: 'p2', name: 'Sill', age: 19, class: 'Healer', level: 5, hp: 80, maxHp: 80, mp: 100, maxMp: 100,
        coupons: [],
    }
];

const DUMMY_ENEMY: Enemy = {
    id: 'e1', name: 'Shadow Wolf', level: 4, hp: 300, maxHp: 300,
};

const CARD_POOL: Card[] = [
    { id: 'c1', name: 'Slash', type: 'Skill', description: 'Deals 20 dmg', cost: 5, power: 20 },
    { id: 'c2', name: 'Fireball', type: 'Skill', description: 'Deals 30 fire dmg', cost: 10, power: 30 },
    { id: 'c3', name: 'Heal Herb', type: 'Item', description: 'Restores 50 HP', cost: 0, power: 50 },
    { id: 'c4', name: 'Defend', type: 'Basic', description: 'Reduces dmg', cost: 0 },
    { id: 'c5', name: 'Brave Heart', type: 'Personality', description: 'Boosts Atk', cost: 3 },
    { id: 'c6', name: 'Calculation', type: 'Basic', description: 'Analyzes enemy (custom)', cost: 1 },
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
    hand: Card[];
    drawCards: (count: number) => void;
    discardCard: (index: number) => void;
    dealHand: () => void;
    useItem: (card: Card) => Promise<void>;
    processNpcTurn: () => Promise<void>;
    setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => void;
    fleeBattle: () => void;
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
                set({
                    battleState: {
                        enemy: { ...DUMMY_ENEMY },
                        party: [...DUMMY_PARTY],
                        turn: 1,
                        messages: ['Battle Start!'],
                        isVictory: false,
                        currentTactic: 'Aggressive'
                    },
                    hand: [],
                });
                get().dealHand();
            },

            initialize: () => get().initializeBattle(),

            startBattle: async (enemy: Enemy) => {
                // Fetch Party logic
                let partyMembers: Adventurer[] = [...DUMMY_PARTY]; // Fallback
                try {
                    const { data: userParty } = await supabase.from('npcs').select('*').eq('hired_by_user_id', get().userProfile?.id);
                    if (userParty && userParty.length > 0) {
                        partyMembers = userParty.map((n: any) => ({
                            id: n.id, name: n.name, class: n.job_class, level: n.level,
                            hp: n.hp, maxHp: n.max_hp, mp: n.mp, maxMp: n.max_mp,
                            coupons: [], // logic simplification
                            image: n.avatar_url,
                            ...n // Keep other props
                        }));
                    } else {
                        partyMembers = []; // Solo if no NPCs
                    }
                } catch (e) { console.error("Party fetch failed", e); }

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
                    hand: []
                });
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
                const { inventory } = get();

                const skills = CARD_POOL.filter(c => c.type === 'Skill');
                const items = CARD_POOL.filter(c => c.type === 'Item');
                const basics = CARD_POOL.filter(c => c.type === 'Basic');
                const personalities = CARD_POOL.filter(c => c.type === 'Personality');

                const getRandom = (arr: Card[], count: number) => {
                    const shuffled = [...arr].sort(() => 0.5 - Math.random());
                    return shuffled.slice(0, count);
                };

                // Convert equipped inventory items to Cards
                const equippedItems = (inventory || []).filter(i => i.is_equipped).map(i => ({
                    id: i.id, // Use unique inventory ID for card ID (or maybe compound?)
                    name: i.name,
                    type: (i.is_skill ? 'Skill' : 'Item') as Card['type'],
                    description: i.description,
                    cost: 0,
                    power: i.power_value,
                    isEquipment: true, // Mark as equipped item/skill
                    // For skills, we might want to map cost if available? For now 0.
                }));

                const newHand = [
                    ...getRandom(skills, 2),
                    ...getRandom(items, 1),
                    ...getRandom(basics, 1),
                    ...getRandom(personalities, 1),
                    ...equippedItems // Add user's equipped items
                ];

                set((state) => ({
                    ...state,
                    hand: newHand,
                }));
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
                const { battleState, selectedScenario, hand } = get(); // Get latest state
                if (!battleState.enemy || battleState.isVictory) return;

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
            },

            processNpcTurn: async () => {
                const { battleState } = get();
                if (!battleState.enemy || battleState.isVictory) return;

                let newMessages = [...battleState.messages];
                let currentEnemyHp = battleState.enemy.hp;
                let newParty = [...battleState.party];

                // Process each party member
                for (let i = 0; i < newParty.length; i++) {
                    const member = newParty[i];
                    const tactic = battleState.currentTactic || 'Aggressive';
                    let actionLog = '';
                    let damage = 0;

                    // Simple Logic based on Tactic
                    if (tactic === 'Standby') {
                        actionLog = `${member.name} は様子を伺っている...`;
                    } else if (tactic === 'Defensive') {
                        // Heal if needed
                        if (member.hp < member.maxHp * 0.5) {
                            const heal = Math.floor(member.maxHp * 0.3);
                            newParty[i] = { ...member, hp: Math.min(member.maxHp, member.hp + heal) };
                            actionLog = `${member.name} は傷の手当てをした (+${heal})`;
                        } else {
                            // Light Guard or Attack
                            damage = Math.floor((member.attack || 5) * 0.5);
                            actionLog = `${member.name} は慎重に攻撃した！ (${damage})`;
                        }
                    } else { // Aggressive
                        damage = Math.floor((member.attack || 10) * (1.0 + Math.random() * 0.2));
                        // Critical chance?
                        actionLog = `${member.name} の攻撃！ ${damage} のダメージ！`;
                    }

                    if (damage > 0) {
                        currentEnemyHp -= damage;
                    }
                    if (actionLog) newMessages.push(actionLog);
                }

                // Check Victory after NPC attacks
                const isVictory = currentEnemyHp <= 0;
                if (isVictory) {
                    currentEnemyHp = 0;
                    newMessages.push(`${battleState.enemy.name} を倒した！(NPC)`);
                    try {
                        const { selectedScenario, fetchWorldState, fetchUserProfile, addGold } = get();
                        const reportPayload = {
                            action: 'victory',
                            impacts: selectedScenario?.impacts,
                            scenario_id: selectedScenario?.id
                        };

                        await fetch('/api/report-action', {
                            method: 'POST',
                            body: JSON.stringify(reportPayload)
                        });

                        // Sync Global State
                        await fetchWorldState();
                        await fetchUserProfile();

                        const partyCount = (newParty.length || 0) + 1;
                        const rewardBase = selectedScenario?.reward_gold || 50;
                        const reward = Math.floor(rewardBase / partyCount);
                        addGold(reward);
                        newMessages.push(`報酬 金貨 ${rewardBase} 枚を獲得。`);
                    } catch (e) { console.error(e); }
                }

                set((state) => ({
                    battleState: {
                        ...state.battleState,
                        party: newParty,
                        enemy: state.battleState.enemy ? { ...state.battleState.enemy, hp: currentEnemyHp } : null,
                        messages: newMessages,
                        isVictory: isVictory
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
            }
        }
        ),
        {
            name: 'game-storage',
            partialize: (state) => ({ gold: state.gold, inventory: state.inventory }),
        }
    )
);
