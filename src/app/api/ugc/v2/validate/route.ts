import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { parseTemplate } from '@/lib/ugc/ugcTemplateParser';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/validate
 *
 * テンプレートのバリデーション（ドライラン）。DBには保存しない。
 * クライアント側でインポート前のプレビュー用に使う。
 *
 * Body: { content: string, format?: 'json' | 'md' }
 */
export async function POST(request: Request) {
  try {
    if (!UGC_ENABLED) {
      return NextResponse.json({ error: 'UGC機能は現在無効です。' }, { status: 403 });
    }

    const client = createAuthClient(request);
    const { data: { user }, error: authErr } = await client.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { content, format } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'テンプレートの content が必要です。' }, { status: 400 });
    }

    const result = parseTemplate(content, format);

    return NextResponse.json({
      success: result.success,
      type: result.type,
      errors: result.errors,
      warnings: result.warnings,
      balance: result.balance,
    }, { status: result.success ? 200 : 422 });

  } catch (e: any) {
    console.error('[ugc/v2/validate] Error:', e);
    return NextResponse.json({ error: e.message || 'Validation failed' }, { status: 500 });
  }
}
