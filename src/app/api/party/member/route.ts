import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const context = searchParams.get('context');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        let data;

        if (context === 'guest') {
            let npcData, npcErr;
            // UUIDかどうかをチェック
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (isUuid) {
                const { data, error } = await supabase.from('npcs').select('*').eq('id', id).maybeSingle();
                npcData = data;
                npcErr = error;
            } else {
                // まずslugを試す
                let { data, error } = await supabase.from('npcs').select('*').eq('slug', id).maybeSingle();

                // 見つからず、IDが数値に見える場合はIDを試す
                if (!data && /^\d+$/.test(id)) {
                    const { data: dataById, error: errorById } = await supabase.from('npcs').select('*').eq('id', id).maybeSingle();
                    data = dataById;
                    if (errorById) error = errorById;
                }

                npcData = data;
                npcErr = error;
            }

            if (npcErr) {
                console.error("NPC Lookup Error:", npcErr);
                return NextResponse.json({ error: 'Failed to fetch guest data' }, { status: 500 });
            }

            if (!npcData) {
                return NextResponse.json({ error: 'Guest NPC not found in database' }, { status: 404 });
            }

            // PartyMember互換オブジェクトとして返す
            const guestMaxHp = npcData.max_hp || npcData.hp || 50;
            data = {
                id: npcData.id,
                slug: npcData.slug,
                name: npcData.name,
                epithet: npcData.epithet || '', // 通り名
                job_class: npcData.job_class || 'Guest',
                level: npcData.level || 1,
                hp: guestMaxHp,
                maxHp: guestMaxHp,
                atk: npcData.atk || npcData.attack || 10,
                def: npcData.def || npcData.defense || 5,
                // image: DBスキーマにカラムがないためデフォルトを使用
                image: '/assets/chara/guest_default.png',
                icon_url: npcData.icon_url || null,
                image_url: npcData.image_url || null,
                inject_cards: npcData.default_cards || [],
                is_active: true,
                durability: guestMaxHp,
                max_durability: guestMaxHp,
                introduction: npcData.introduction
            };
        } else {
            const { data: member, error: memberError } = await supabase
                .from('party_members')
                .select('*')
                .eq('id', id)
                .single();
            if (memberError) throw memberError;
            data = member;
        }

        if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('id');

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        // 認証済みユーザーIDを取得（RLSの代わりに明示的オーナー検証）
        const authClient = createAuthClient(req);
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // まずレコードのowner_idを確認（supabaseServerでRLSバイパス）
        const { supabaseServer } = await import('@/lib/supabase-admin');
        const { data: memberRecord, error: fetchError } = await supabaseServer
            .from('party_members')
            .select('id, owner_id, name')
            .eq('id', memberId)
            .maybeSingle();

        if (fetchError) {
            console.error('Party member fetch error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!memberRecord) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // オーナー検証（自分のパーティメンバーのみ削除可）
        if (memberRecord.owner_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: not your party member' }, { status: 403 });
        }

        // Service Role でRLSをバイパスして物理削除
        const { error: deleteError } = await supabaseServer
            .from('party_members')
            .delete()
            .eq('id', memberId);

        if (deleteError) {
            console.error('Party member delete failed:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, name: memberRecord.name });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

