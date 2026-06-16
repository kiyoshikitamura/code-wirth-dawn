import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseAdmin } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';
import { buildShareData } from '@/lib/shareUtils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, shadow } = body; // Hirer ID and Shadow Object

        if (!user_id || !shadow) {
            return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
        }

        // JWT認証でユーザーIDを検証
        const authHeader = req.headers.get('authorization');
        let authedUserId: string | null = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) authedUserId = user.id;
        }

        // 認証済みユーザーIDとリクエストのuser_idが一致しない場合は拒否
        if (authedUserId && authedUserId !== user_id) {
            return NextResponse.json({ error: 'Authentication mismatch' }, { status: 403 });
        }

        // Embargo チェック（anon clientで十分）
        const { data: profile } = await supabase.from('user_profiles').select('current_location_id').eq('id', user_id).single();
        if (profile?.current_location_id) {
            const { data: locData } = await supabase.from('locations').select('name').eq('id', profile.current_location_id).maybeSingle();
            if (locData?.name) {
                const { data: repData } = await supabase
                    .from('reputations')
                    .select('score')
                    .eq('user_id', user_id)
                    .eq('location_name', locData.name)
                    .maybeSingle();

                if (repData && (repData.score || 0) <= -300) {
                    return NextResponse.json({ error: '出禁状態: この拠点での名声が低すぎるため、酒場の利用を断られました。' }, { status: 403 });
                }
            }
        }

        // Service Roleクライアントを使用してRLSバイパス（gold操作・party_members書き込み）
        const shadowService = new ShadowService(supabaseAdmin);


        const result = await shadowService.hireShadow(user_id, shadow);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Collection: Record NPC encounter (system_mercenary only)
        if (shadow.slug && shadow.origin_type === 'system_mercenary') {
            try {
                await supabaseAdmin
                    .from('user_npc_encounters')
                    .insert({ user_id, npc_slug: shadow.slug });
            } catch (e) {
                console.warn('[Hire] NPC encounter recording failed (non-critical):', e);
            }
        }

        // #19 英霊雇用シェア (繰返)
        const heroName = shadow.name || '名もなき英霊';
        const shareData = buildShareData('heroic_hire', { name: heroName });

        return NextResponse.json({
            success: true,
            share_text: shareData?.text || null,
            share_data_list: shareData ? [shareData] : [],
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
