export const MAX_NATURAL_CP = 5;
export const MAX_OVERFLOW_CP = 16;
export const CP_RECOVERY_INTERVAL_MS = 60 * 60 * 1000; // 1時間 (3600000ms)

/**
 * 経過時間から現在のCP値と次の回復までの残り時間をオンデマンドで算出するヘルパー関数
 */
export function calculateCurrentCP(
    dbCP: number,
    lastRecoveredAtStr: string | Date
): { currentCP: number; nextRecoveryTimeMs: number | null; recoveredPoints: number } {
    let timeStr = typeof lastRecoveredAtStr === 'string' ? lastRecoveredAtStr : lastRecoveredAtStr.toISOString();
    if (typeof lastRecoveredAtStr === 'string' && !timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-')) {
        timeStr = timeStr.replace(' ', 'T') + 'Z';
    }
    const lastTime = new Date(timeStr).getTime();
    const now = Date.now();
    const elapsed = now - lastTime;

    // すでに自然回復上限に達している、または超過している場合は回復しない
    if (dbCP >= MAX_NATURAL_CP) {
        return {
            currentCP: dbCP,
            nextRecoveryTimeMs: null,
            recoveredPoints: 0
        };
    }

    const recoveredPoints = Math.floor(elapsed / CP_RECOVERY_INTERVAL_MS);
    const currentCP = Math.min(MAX_NATURAL_CP, dbCP + recoveredPoints);

    let nextRecoveryTimeMs = null;
    if (currentCP < MAX_NATURAL_CP) {
        const nextRecoveryTimestamp = lastTime + (recoveredPoints + 1) * CP_RECOVERY_INTERVAL_MS;
        nextRecoveryTimeMs = Math.max(0, nextRecoveryTimestamp - now);
    }

    return {
        currentCP,
        nextRecoveryTimeMs,
        recoveredPoints
    };
}
