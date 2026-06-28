process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { calcEnemyTp, calcNpcNp, calcQuestPb } from '@/lib/ugc/ugcBalanceCalc';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';
import { createAuthClient } from '@/lib/supabase-auth';

/**
 * POST /api/ugc/v2/calculate
 *
 * バランス計算ツールAPI。
 * エネミーTP / NPC NP / クエスト報酬PB を個別に計算する。
 * 仕様: spec_v12_ugc_system_v2.md §8.8
 *
 * Body: { mode: 'enemy' | 'npc' | 'quest_reward', params: {...} }
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
    const { mode, params } = body;

    if (!mode || !params) {
      return NextResponse.json({ error: 'mode と params が必要です。' }, { status: 400 });
    }

    switch (mode) {
      case 'enemy': {
        const { level, hp, atk, def, skills } = params;
        if (typeof level !== 'number' || typeof hp !== 'number') {
          return NextResponse.json({ error: 'level, hp は必須です。' }, { status: 400 });
        }
        const result = calcEnemyTp({
          level,
          hp: hp ?? 0,
          atk: atk ?? 0,
          def: def ?? 0,
          skills: skills ?? [],
        });
        return NextResponse.json({ mode: 'enemy', result });
      }

      case 'npc': {
        const { level, atk, def, durability, cover_rate, skills } = params;
        if (typeof level !== 'number') {
          return NextResponse.json({ error: 'level は必須です。' }, { status: 400 });
        }
        const result = calcNpcNp({
          level,
          atk: atk ?? 0,
          def: def ?? 0,
          durability: durability ?? 100,
          cover_rate: cover_rate ?? 10,
          skills: skills ?? [],
        });
        return NextResponse.json({ mode: 'npc', result });
      }

      case 'quest_reward': {
        const { rec_level, battle_count, node_count, items, skill_card } = params;
        if (typeof rec_level !== 'number') {
          return NextResponse.json({ error: 'rec_level は必須です。' }, { status: 400 });
        }
        const result = calcQuestPb({
          rec_level,
          battle_count: battle_count ?? 0,
          node_count: node_count ?? 1,
          items: items ?? [],
          skill_card: skill_card ?? null,
        });
        return NextResponse.json({ mode: 'quest_reward', result });
      }

      default:
        return NextResponse.json(
          { error: `不明なmode: ${mode}。enemy / npc / quest_reward のいずれかを指定してください。` },
          { status: 400 }
        );
    }

  } catch (e: any) {
    console.error('[ugc/v2/calculate] Error:', e);
    return NextResponse.json({ error: e.message || 'Calculation failed' }, { status: 500 });
  }
}
