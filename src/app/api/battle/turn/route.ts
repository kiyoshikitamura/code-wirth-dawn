import { NextResponse } from 'next/server';
// import { supabaseServer as supabase } from '@/lib/supabase-admin'; // 将来の権威サーバー移行時に有効化

/**
 * POST /api/battle/turn
 * Process Enemy Turn (AI, Injection, Damage)
 *
 * [v14.0 ARCHIVED - デッドコード]
 * =====================================
 * このAPIは現在フロントエンドから呼ばれていない。
 * バトルロジックは全て gameStore.processEnemyTurn() (クライアントサイド) で処理中。
 *
 * 将来の「権威サーバー移行」（不正防止・マルチプレイヤー対応）のための受け皿として
 * ファイルを保持する。再活性化時はクライアントの processEnemyTurn() を段階的に
 * このサーバー実装に移行すること。
 *
 * 参考: spec_v2_battle_parameters.md §9
 * 旧実装: git 履歴を参照（v12.0以前）
 */
export async function POST(_req: Request) {
    // v14.0: アーカイブ済み — フロントエンド呼び出し元なし
    return NextResponse.json(
        { error: 'This endpoint is archived. Battle is handled client-side via gameStore.processEnemyTurn().' },
        { status: 501 }
    );
}
