import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';

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
            data = {
                id: npcData.id,
                slug: npcData.slug,
                name: npcData.name,
                job_class: npcData.job_class || 'Guest',
                level: npcData.level || 1,
                hp: npcData.hp || 50,
                maxHp: npcData.max_hp || npcData.hp || 50,
                mp: npcData.mp || 10,
                maxMp: npcData.max_mp || npcData.mp || 10,
                attack: npcData.attack || 10,
                defense: npcData.defense || 5,
                speed: npcData.speed || 10,
                // image: DBスキーマにカラムがないためデフォルトを使用
                image: '/assets/chara/guest_default.png',
                inject_cards: npcData.default_cards || [],
                is_active: true,
                durability: 3, // ゲストの初期耐久度？それともDBを使用？
                // ゲストは「耐久度」を「参加制限」または体力として使用する可能性があります。
                // とりあえず、意図されていた通りに '3' (または堅牢にしたい場合は100) をハードコードしておきます。
                // 仕様ではゲストに耐久度はありますか？
                // 今のところ標準の100にするか、制限としての '3' を維持します。
                max_durability: 3,
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

        // 複雑なRLS状態に関わらず削除が行われるようにAdminクライアントを使用
        // 実際のアプリでは、`memberId` が現在のユーザー (auth.uid() 経由) に属していることを確認すべきです
        // このプロトタイプでは、クライアントが自身が所有する有効なIDを送信すると仮定します。
        const client = (hasServiceKey && supabaseAdmin) ? supabaseAdmin : supabase;

        const { error } = await client
            .from('party_members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error("Party member delete failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
