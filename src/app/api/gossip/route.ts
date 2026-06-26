import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { createAuthClient } from '@/lib/supabase-auth';
import { GossipService } from '@/services/gossipService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gossip
 * BBS掲示板タイムライン投稿を取得。
 * Query: limit (default 30), offset (default 0)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get('limit') || '30'), 100);
        const offset = Math.max(Number(searchParams.get('offset') || '0'), 0);

        // 1. 最上段ピン留め用の「最新システムメッセージ」を1件取得
        const { data: pinnedSystemPost, error: pinError } = await supabase
            .from('gossip_posts')
            .select('*')
            .eq('is_system', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (pinError) throw pinError;

        // 2. タイムライン投稿リストを取得
        const { data: posts, error: postsError } = await supabase
            .from('gossip_posts')
            .select('*, user_profiles(subscription_tier)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (postsError) throw postsError;

        // 3. 重複防止: もしタイムラインの最初の投稿がピン留めされた最新システムメッセージと同じ場合は、リストから除外
        let timelinePosts = posts || [];
        if (offset === 0 && pinnedSystemPost && timelinePosts.length > 0) {
            if (timelinePosts[0].id === pinnedSystemPost.id) {
                timelinePosts = timelinePosts.slice(1);
            }
        }

        return NextResponse.json({
            pinned_system_post: pinnedSystemPost || null,
            posts: timelinePosts
        });

    } catch (e: any) {
        console.error('[gossip GET] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * POST /api/gossip
 * 掲示板へ噂話を投稿する。
 * Body: { content: string }
 */
export async function POST(req: Request) {
    try {
        // 認証チェック
        const authHeader = req.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : '';
        const supabaseAuth = createAuthClient(req);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token || undefined);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const content = body.content || '';

        const gossipService = new GossipService(supabase);
        const res = await gossipService.postUserMessage(user.id, content);

        if (!res.success) {
            return NextResponse.json({ error: res.error }, { status: res.status || 400 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[gossip POST] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * DELETE /api/gossip
 * 自分の投稿を削除する。
 * Query: postId
 */
export async function DELETE(req: Request) {
    try {
        // 認証チェック
        const authHeader = req.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : '';
        const supabaseAuth = createAuthClient(req);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token || undefined);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // 投稿の所有者チェック
        const { data: post, error: fetchError } = await supabase
            .from('gossip_posts')
            .select('user_id')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.user_id !== user.id) {
            return NextResponse.json({ error: 'You can only delete your own posts.' }, { status: 403 });
        }

        // 削除実行
        const { error: deleteError } = await supabase
            .from('gossip_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[gossip DELETE] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
