import { NextResponse } from 'next/server';
import { updateWorldSimulation } from '@/lib/world-simulation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const result = await updateWorldSimulation();

        if (!result.success) {
            return NextResponse.json({ success: false, logs: result.logs, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, logs: result.logs, hegemony: result.hegemony });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
