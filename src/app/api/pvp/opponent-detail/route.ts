import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get('user_id');

        if (!targetUserId) {
            return NextResponse.json({ error: 'ユーザーIDが指定されていません。' }, { status: 400 });
        }

        // ゴースト対戦相手のハンドリング
        if (targetUserId.startsWith('ghost_')) {
            return NextResponse.json({ error: 'ゴーストの詳細はローカル定義を参照してください。' }, { status: 400 });
        }

        // 特定ユーザーの防衛デッキスナップショットを1件取得
        const { data: defenseParty, error } = await supabaseServer
            .from('pvp_defense_parties')
            .select('snapshot_data')
            .eq('user_id', targetUserId)
            .maybeSingle();

        if (error || !defenseParty) {
            return NextResponse.json({ error: '防衛デッキ詳細が見つかりませんでした。' }, { status: 404 });
        }

        const party = defenseParty.snapshot_data || {};
        
        // 過去に登録された、装備スナップショットがパース漏れで空になってしまっているデータへの動的フォールバック
        if (party.party_members_snapshot && party.party_members_snapshot.length > 0) {
            const hasEmptyEquipment = party.party_members_snapshot.some((m: any) => 
                !m.equipped_items_snapshot || m.equipped_items_snapshot.length === 0
            );

            if (hasEmptyEquipment) {
                // 元の party_members レコードから直接英霊/NPCの装備情報を引いてパッチを当てる
                const { data: rawMembers } = await supabaseServer
                    .from('party_members')
                    .select('id, snapshot_data')
                    .eq('owner_id', targetUserId)
                    .eq('is_active', true);

                if (rawMembers && rawMembers.length > 0) {
                    const memberMap = new Map(rawMembers.map(rm => [String(rm.id), rm]));
                    
                    party.party_members_snapshot = party.party_members_snapshot.map((m: any) => {
                        const original = memberMap.get(String(m.id));
                        if (original) {
                            let originalSnap = original.snapshot_data;
                            if (typeof originalSnap === 'string') {
                                try {
                                    originalSnap = JSON.parse(originalSnap);
                                } catch (e) {
                                    originalSnap = null;
                                }
                            }
                            const originalEquipped = originalSnap?.equipped_items || [];
                            const currentEquipped = m.equipped_items_snapshot || [];
                            
                            return {
                                ...m,
                                equipped_items_snapshot: currentEquipped.length > 0 ? currentEquipped : originalEquipped
                            };
                        }
                        return m;
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            party
        }, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=120'
            }
        });
    } catch (e: any) {
        console.error('[pvp/opponent-detail] Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
