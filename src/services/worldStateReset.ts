/**
 * worldStateReset.ts
 * 世界情勢アライメントスコアの6時間リセットロジック
 * 
 * 元は /api/location/quests に副作用として組み込まれていたが、
 * Cron呼び出しまたは任意のAPIから独立して実行できるように分離。
 */

import { supabaseServer } from '@/lib/supabase-admin';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * 6時間以上更新されていないworld_statesのアライメントスコアをリセット
 * @returns リセットされた拠点数
 */
export async function resetStaleAlignmentScores(): Promise<{ resetCount: number; debug: string[] }> {
    const debug: string[] = [];

    const { data: allWorldStates, error } = await supabaseServer
        .from('world_states')
        .select('id, order_score, chaos_score, justice_score, evil_score, updated_at');

    if (error || !allWorldStates) {
        debug.push(`world_states fetch error: ${error?.message || 'no data'}`);
        return { resetCount: 0, debug };
    }

    let resetCount = 0;
    for (const ws of allWorldStates) {
        const lastUpdate = new Date((ws as any).updated_at).getTime();
        if (Date.now() - lastUpdate > SIX_HOURS_MS) {
            await supabaseServer.from('world_states')
                .update({
                    order_score: 0, chaos_score: 0,
                    justice_score: 0, evil_score: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', (ws as any).id);
            resetCount++;
            debug.push(`world_state ${(ws as any).id} reset (6h elapsed)`);
        }
    }

    return { resetCount, debug };
}
