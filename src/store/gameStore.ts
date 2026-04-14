/**
 * gameStore.ts — v15.0 リファクタリング済み
 *
 * 各ドメインのロジックはスライスに分割済み:
 *   - profileSlice  : プロフィール・ワールド・装備・ゴールド
 *   - battleSlice   : バトル全体（startBattle〜processEnemyTurn）
 *   - inventorySlice: インベントリ取得・装備トグル
 *   - questSlice    : クエスト・戦術・逃走
 *
 * このファイルは Zustand の `create()` と `persist()` の設定のみを担う。
 * `useGameStore()` の呼び出し方は一切変わらない。
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from './types';
import { createProfileSlice } from './slices/profileSlice';
import { createBattleSlice } from './slices/battleSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createQuestSlice } from './slices/questSlice';

// ─── 初期バトルステート ────────────────────────────────────────────────────────
const INITIAL_BATTLE_STATE: GameState['battleState'] = {
    enemy: null,
    enemies: [],
    party: [],
    turn: 1,
    current_ap: 5,
    messages: [],
    isVictory: false,
    isDefeat: false,
    currentTactic: 'Aggressive',
    player_effects: [],
    enemy_effects: [],
    exhaustPile: [],
    consumedItems: [],
    activeSupportBuffs: [],
    battleItems: [],
};

// ─── ストア本体 ───────────────────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // ── 初期値 ──────────────────────────────────────────────────
            userProfile: null,
            selectedProfileId: null,
            worldState: null,
            hubState: null,
            gold: 1000,
            selectedScenario: null,
            inventory: [],
            deck: [],
            discardPile: [],
            hand: [],
            _hasHydrated: false,
            equipBonus: { atk: 0, def: 0, hp: 0 },
            equippedItems: [],
            showStatus: false,
            battleState: INITIAL_BATTLE_STATE,

            // ── スライス展開 ─────────────────────────────────────────────
            ...createProfileSlice(set, get),
            ...createBattleSlice(set, get),
            ...createInventorySlice(set, get),
            ...createQuestSlice(set, get),
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
                userProfile: state.userProfile,
            }),
            storage: createJSONStorage(() =>
                typeof window !== 'undefined' ? window.localStorage : {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            ),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
