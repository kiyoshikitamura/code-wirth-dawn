/**
 * useQuestState.ts
 * Zustand store for quest-in-progress state management (Spec v3.3 → v4.0)
 *
 * Manages Persistence Rules:
 * - HP carry-over (player & NPC)
 * - NPC death tracking
 * - Loot pool (risk: lost on failure)
 * - Consumed items tracking
 * - Quest-local flags (v4.0: curse count, correct answers, etc.)
 * - Escort mission failure detection (v4.0)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PartyMember } from '@/types/game';

export interface LootItem {
    itemId: string;
    itemName: string;
    quantity: number;
}

interface QuestProgressState {
    // Core
    isInQuest: boolean;
    questId: string | null;
    questType: 'normal' | 'special' | null;

    // HP Persistence (carry-over between battles)
    playerHp: number;
    playerMaxHp: number;
    partyHp: Record<string, number>;  // npc_id -> current HP

    // NPC Death
    deadNpcs: string[];

    // v3.4 Expansion
    guest: PartyMember | null;
    currentLocationId: string | null;
    elapsedDays: number;

    // v4.0 Expansion: Quest-local flags & escort
    questFlags: Record<string, number>;  // key -> value (curse count, correct answers, etc.)
    isEscortMission: boolean;            // true when guest has is_escort_target flag

    // Loot Pool (at-risk items)
    lootPool: LootItem[];

    // Consumed items during quest
    consumedItems: string[];

    // Actions
    startQuest: (params: {
        questId: string;
        questType: 'normal' | 'special';
        playerHp: number;
        playerMaxHp: number;
        partyHp: Record<string, number>;
        currentLocationId?: string;
    }) => void;

    updateAfterBattle: (result: {
        playerHp: number;
        partyHp: Record<string, number>;
        deadNpcIds: string[];
        droppedItems: LootItem[];
        usedConsumables: string[];
    }) => void;

    finalizeQuest: (result: 'success' | 'failure') => {
        loot: LootItem[];
        deadNpcs: string[];
        consumedItems: string[];
    };

    resetQuest: () => void;

    // v3.4 Actions
    travelTo: (destId: string, days: number) => void;
    addGuest: (guest: PartyMember) => void;
    healParty: (percentage: number) => void;
    resumeQuest: (savedState: any) => void;

    // v4.0 Actions
    removeGuest: () => void;
    setFlag: (key: string, delta: number) => void;
    getFlag: (key: string) => number;
    applyTrapDamage: (params: { hp_percent?: number; hp_flat?: number }) => void;
    checkEscortFailure: () => boolean;
    setEscortMission: (value: boolean) => void;
}

const initialState = {
    isInQuest: false,
    questId: null as string | null,
    questType: null as 'normal' | 'special' | null,
    playerHp: 0,
    playerMaxHp: 0,
    partyHp: {} as Record<string, number>,
    deadNpcs: [] as string[],
    lootPool: [] as LootItem[],
    consumedItems: [] as string[],
    guest: null as PartyMember | null,
    currentLocationId: null as string | null,
    elapsedDays: 0,
    // v4.0
    questFlags: {} as Record<string, number>,
    isEscortMission: false,
};

export const useQuestState = create<QuestProgressState>()(persist((set, get) => ({
    ...initialState,

    startQuest: ({ questId, questType, playerHp, playerMaxHp, partyHp, currentLocationId }) => {
        set({
            isInQuest: true,
            questId,
            questType,
            playerHp,
            playerMaxHp,
            partyHp,
            guest: null,
            currentLocationId: currentLocationId || null,
            elapsedDays: 0,
            deadNpcs: [],
            lootPool: [],
            consumedItems: [],
            // v4.0: クエスト開始時にフラグとエスコートをリセット
            questFlags: {},
            isEscortMission: false,
        });
    },

    updateAfterBattle: (result) => {
        const state = get();

        // Update HP (carry-over)
        const updatedPartyHp = { ...state.partyHp, ...result.partyHp };

        // Process NPC deaths: remove dead NPCs from partyHp
        const newDeadNpcs = [...state.deadNpcs];
        for (const npcId of result.deadNpcIds) {
            if (!newDeadNpcs.includes(npcId)) {
                newDeadNpcs.push(npcId);
            }
            delete updatedPartyHp[npcId]; // Remove from active party
        }

        // Accumulate loot
        const updatedLoot = [...state.lootPool, ...result.droppedItems];

        // Track consumed items
        const updatedConsumed = [...state.consumedItems, ...result.usedConsumables];

        set({
            playerHp: result.playerHp,
            partyHp: updatedPartyHp,
            deadNpcs: newDeadNpcs,
            lootPool: updatedLoot,
            consumedItems: updatedConsumed,
        });
    },

    finalizeQuest: (result) => {
        const state = get();

        if (result === 'success') {
            const finalResult = {
                loot: state.lootPool,
                deadNpcs: state.deadNpcs,
                consumedItems: state.consumedItems,
            };
            set(initialState);
            return finalResult;
        } else {
            // FAILURE: loot is LOST
            const finalResult = {
                loot: [], // All loot destroyed
                deadNpcs: state.deadNpcs,
                consumedItems: state.consumedItems,
            };
            set(initialState);
            return finalResult;
        }
    },

    resetQuest: () => {
        set(initialState);
    },

    travelTo: (destId, days) => {
        set((state) => ({
            currentLocationId: destId,
            elapsedDays: state.elapsedDays + days,
        }));
    },

    addGuest: (guest) => {
        set({ guest });
    },

    healParty: (percentage) => {
        const state = get();
        const newPlayerHp = Math.min(state.playerMaxHp, Math.floor(state.playerHp + state.playerMaxHp * percentage));
        set({ playerHp: newPlayerHp });
    },

    resumeQuest: (savedState) => {
        if (!savedState) return;
        set({
            ...initialState,
            isInQuest: true,
            questId: savedState.questId,
            questType: savedState.questType,
            playerHp: savedState.playerHp,
            playerMaxHp: savedState.playerMaxHp,
            partyHp: savedState.partyHp || {},
            deadNpcs: savedState.deadNpcs || [],
            lootPool: savedState.lootPool || [],
            consumedItems: savedState.consumedItems || [],
            guest: savedState.guest || null,
            currentLocationId: savedState.currentLocationId || null,
            elapsedDays: savedState.elapsedDays || 0,
            // v4.0
            questFlags: savedState.questFlags || {},
            isEscortMission: savedState.isEscortMission || false,
        });
    },

    // --- v4.0 新規アクション ---

    removeGuest: () => {
        set({ guest: null, isEscortMission: false });
    },

    setFlag: (key: string, delta: number) => {
        set((state) => ({
            questFlags: {
                ...state.questFlags,
                [key]: (state.questFlags[key] || 0) + delta,
            },
        }));
    },

    getFlag: (key: string) => {
        return get().questFlags[key] || 0;
    },

    applyTrapDamage: (params: { hp_percent?: number; hp_flat?: number }) => {
        const state = get();
        let damage = 0;
        if (params.hp_percent) {
            damage = Math.floor(state.playerMaxHp * (params.hp_percent / 100));
        }
        if (params.hp_flat) {
            damage += params.hp_flat;
        }
        const newHp = Math.max(1, state.playerHp - damage); // 最低1HPを保証（即死防止）
        set({ playerHp: newHp });
    },

    checkEscortFailure: () => {
        const state = get();
        if (!state.isEscortMission || !state.guest) return false;
        // ゲストが deadNpcs に含まれていれば護衛失敗
        const guestId = (state.guest as any).id || (state.guest as any).slug;
        return state.deadNpcs.includes(guestId);
    },

    setEscortMission: (value: boolean) => {
        set({ isEscortMission: value });
    },
}),
    {
        name: 'quest-storage',
    }
));
