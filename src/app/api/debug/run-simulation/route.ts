import { NextResponse } from 'next/server';
import { updateWorldSimulation } from '@/lib/world-simulation';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log('[デバッグ] 世界変換シミュレーションを手動実行中...');
        const result = await updateWorldSimulation();

        return NextResponse.json({
            success: result.success,
            message: '世界変換シミュレーションを実行しました。',
            logs: result.logs,
            hegemony: result.hegemony
        });
    } catch (e: any) {
        console.error('[デバッグ] 世界変換エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
