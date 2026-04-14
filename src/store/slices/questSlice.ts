import type { GameState } from '../types';

export type QuestSliceActions = Pick<
    GameState,
    'selectScenario' | 'setTactic' | 'setTarget' | 'fleeBattle' | 'waitTurn'
>;

export const createQuestSlice = (
    set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
    get: () => GameState
): QuestSliceActions => ({

    selectScenario: (scenario) => set({ selectedScenario: scenario }),

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
        set(state => ({
            battleState: { ...state.battleState, currentTactic: tactic }
        }));
    },

    fleeBattle: () => {
        const success = Math.random() < 0.5;

        if (success) {
            set(state => ({
                battleState: {
                    ...state.battleState,
                    messages: [...state.battleState.messages, '一行は逃げ出した...'],
                    isDefeat: true,
                    battlePhase: 'player',
                }
            }));
        } else {
            set(state => ({
                battleState: {
                    ...state.battleState,
                    messages: [...state.battleState.messages, '逃走に失敗！ 敵の反撃を受ける！'],
                    battlePhase: 'npc_done',
                }
            }));
            // v15.0: setTimeout を使って非同期に敵フェーズ実行
            setTimeout(() => { get().processEnemyTurn(false); }, 300);
        }
    },

    waitTurn: async () => {
        const { battleState } = get();
        if (battleState.isVictory || battleState.isDefeat) return;

        const currentAp = battleState.current_ap || 0;
        const newMessages = [...battleState.messages, `様子を見ている... (残AP: ${currentAp} → 次ターンに持ち越し)`];

        set({
            battleState: { ...battleState, messages: newMessages }
        });

        await get().runNpcPhase();
    },
});
