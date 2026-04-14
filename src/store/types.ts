import { Adventurer, Card, Enemy, WorldState, Scenario, InventoryItem, UserProfile, BattleState, PartyMember, UserHubState } from '@/types/game';

/**
 * Zustand store の完全な状態型定義
 * gameStore.ts の `interface GameState` から抽出
 */
export interface GameState {
    // Profile
    userProfile: UserProfile | null;
    selectedProfileId: string | null;
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
    selectedScenario: Scenario | null;
    selectScenario: (scenario: Scenario | null) => void;
    startBattle: (enemy: Enemy | Enemy[]) => void;
    attackEnemy: (card?: Card, targetId?: string) => Promise<void>;
    waitTurn: () => Promise<void>;
    endTurn: () => Promise<void>;
    runNpcPhase: () => Promise<void>;
    runEnemyPhase: () => Promise<void>;
    advanceTurn: () => void;
    resetBattle: () => void;

    // Inventory
    inventory: InventoryItem[];
    fetchInventory: () => Promise<void>;
    toggleEquip: (itemId: string, currentEquip: boolean, bypassLock?: boolean) => Promise<void>;
    clearStorage: () => void;

    // Equipment Bonus
    equipBonus: { atk: number; def: number; hp: number };
    equippedItems: any[];
    fetchEquipment: () => Promise<void>;

    // UI State
    showStatus: boolean;
    setShowStatus: (show: boolean) => void;

    // Hand Management
    deck: Card[];
    discardPile: Card[];
    hand: Card[];
    discardCard: (index: number) => void;
    dealHand: () => void;
    useItem: (card: Card) => Promise<void>;
    useBattleItem: (item: InventoryItem) => Promise<void>;
    processPartyTurn: () => Promise<void>;
    processEnemyTurn: (shouldAdvanceTurn?: boolean) => Promise<void>;

    setTarget: (enemyId: string) => void;
    setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => void;
    fleeBattle: () => void;

    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}
