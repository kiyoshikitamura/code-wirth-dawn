import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { PartyService } from '@/services/partyService';
import { checkQuestLock } from '@/lib/questLock';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { memberIds } = body;

        if (!memberIds || !Array.isArray(memberIds)) {
            return NextResponse.json({ error: 'memberIds is required and must be an array' }, { status: 400 });
        }

        // 認証済みユーザーIDを取得
        const authClient = createAuthClient(req);
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // クエストロックの確認
        const lock = await checkQuestLock(user.id);
        if (lock.locked) {
            return NextResponse.json({ error: 'Forbidden: Cannot reorder party members during an active quest.' }, { status: 403 });
        }

        // 順序の更新を実行
        await PartyService.reorderPartyMembers(user.id, memberIds);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
