process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
/**
 * worldStateReset.ts
 * 世界情勢アライメントスコアのリセットロジック（廃止・ダミー化）
 * 
 * ※ 20%減衰および月次リセットは world-simulation.ts 内に統合されました。
 * 互換性のためにダミーとして維持。
 */

/**
 * world_states のアライメントスコアリセット（廃止）
 * @returns 空の結果
 */
export async function resetStaleAlignmentScores(): Promise<{ resetCount: number; debug: string[] }> {
    return { 
        resetCount: 0, 
        debug: ['Deprecated: Alignment decay and reset are now managed inside updateWorldSimulation.'] 
    };
}
