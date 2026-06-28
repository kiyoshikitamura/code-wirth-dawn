process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { parseTemplate, type ParseResult } from '@/lib/ugc/ugcTemplateParser';
import { checkRateLimit } from '@/lib/ugc/ugcRateLimit';
import { UGC_ENABLED, UGC_ASSET_LIMITS, type SubscriptionTier } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/import
 *
 * テンプレートファイル（JSON/MD）をインポートし、バリデーション後にugc_scenariosへ保存する。
 * 仕様: spec_v12_ugc_system_v2.md §5.3
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

    // ── Tier取得
    const { data: profile } = await client
      .from('user_profiles')
      .select('subscription_tier, ugc_extra_drafts, ugc_extra_daily_import')
      .eq('id', user.id)
      .single();
    const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) ?? 'free';
    const extraDailyImport = profile?.ugc_extra_daily_import || 0;

    // ── レートリミット（extra daily importを加算）
    const rl = await checkRateLimit(client, user.id, 'import', tier, true); // dryRun
    const effectiveImportLimit = rl.limit + extraDailyImport;
    if (rl.limit !== -1 && rl.current >= effectiveImportLimit) {
      return NextResponse.json({
        error: `インポートの1日あたりの上限（${effectiveImportLimit}回）に達しています。`,
        rate_limit: { ...rl, limit: effectiveImportLimit },
      }, { status: 429 });
    }
    // レートリミット記録（dryRunだったので手動挿入）
    if (rl.limit !== -1) {
      await checkRateLimit(client, user.id, 'import', tier, false);
    }

    // ── パース＋バリデーション
    const result: ParseResult = parseTemplate(content, format);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        errors: result.errors,
        warnings: result.warnings,
        balance: result.balance,
      }, { status: 422 });
    }

    // ── クエストの場合: ugc_scenarios + 関連テーブルに保存
    if (result.type === 'quest' && result.data?.type === 'quest') {
      const quest = result.data;

      // ドラフト枠チェック（extra枠を加算）
      const baseDraftLimit = UGC_ASSET_LIMITS[tier].drafts;
      const extraDrafts = profile?.ugc_extra_drafts || 0;
      const draftLimit = baseDraftLimit + extraDrafts;
      if (baseDraftLimit !== -1) {
        const { count } = await client
          .from('ugc_scenarios')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', user.id)
          .eq('status', 'draft');

        if ((count ?? 0) >= draftLimit) {
          return NextResponse.json({
            error: `ドラフト枠の上限（${draftLimit}件）に達しています。`,
          }, { status: 403 });
        }
      }

      const slug = `ugc_${user.id.substring(0, 8)}_${Date.now()}`;

      // シナリオ保存
      const { data: scenario, error: insertErr } = await client
        .from('ugc_scenarios')
        .insert({
          slug,
          creator_id: user.id,
          title: quest.title,
          short_description: quest.short_description,
          full_description: quest.full_description || '',
          client_name: quest.client_name,
          scenario_type: quest.scenario_type,
          difficulty: quest.difficulty,
          rec_level: quest.rec_level,
          days_success: quest.days_success,
          days_failure: quest.days_failure,
          conditions: quest.conditions || {},
          rewards: quest.rewards || {},
          flow_nodes: quest.nodes,
          status: 'draft',
          template_version: quest.version,
          source_format: format || 'json',
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('[ugc/v2/import] insert error:', insertErr);
        throw new Error(insertErr.message);
      }

      // エネミー・NPC・アイテム・カードを関連テーブルに保存
      const scenarioId = scenario.id;

      // バトルノードからエネミーを抽出
      for (const node of quest.nodes) {
        if (node.type === 'battle' && node.enemyData) {
          const tpResult = result.balance?.enemies?.find(e => e.nodeId === node.id);
          await client.from('ugc_enemies').insert({
            creator_id: user.id,
            scenario_id: scenarioId,
            name: node.enemyData.name,
            level: node.enemyData.level,
            hp: node.enemyData.hp,
            atk: node.enemyData.atk,
            def: node.enemyData.def,
            skills: node.enemyData.skills,
            action_pattern: node.enemyData.action_pattern || [],
            image_url: node.enemyData.image_url || null,
            flavor_text: node.enemyData.flavor_text || null,
            asset_type: node.enemyData.asset_type || 'enemy',
            tp_total: tpResult?.result.total_points ?? null,
            tp_consumed: tpResult?.result.consumed_points ?? null,
          });
        }

        // NPC加入ノードからNPCを抽出
        if (node.type === 'npc_join' && node.npcData) {
          const npResult = result.balance?.npcs?.find(n => n.nodeId === node.id);
          await client.from('ugc_npcs').insert({
            creator_id: user.id,
            scenario_id: scenarioId,
            name: node.npcData.name,
            level: node.npcData.level,
            atk: node.npcData.atk,
            def: node.npcData.def,
            durability: node.npcData.durability,
            cover_rate: node.npcData.cover_rate,
            ai_role: node.npcData.ai_role,
            ai_grade: 'random',
            signature_skills: node.npcData.signature_skills,
            image_url: node.npcData.image_url || null,
            flavor_text: node.npcData.flavor_text || null,
            np_total: npResult?.result.total_points ?? null,
            np_consumed: npResult?.result.consumed_points ?? null,
          });
        }
      }

      // 報酬アイテム
      if (quest.rewards?.items) {
        for (const item of quest.rewards.items) {
          await client.from('ugc_items').insert({
            creator_id: user.id,
            scenario_id: scenarioId,
            name: item.name,
            type: item.type,
            base_price: item.base_price ?? 1,
            effect_data: item.effect_data || null,
            description: item.description || '',
            rarity: item.rarity,
            use_timing: item.use_timing || null,
            image_url: item.image_url || null,
          });
        }
      }

      // 報酬スキルカード
      if (quest.rewards?.skill_card) {
        const card = quest.rewards.skill_card;
        await client.from('ugc_cards').insert({
          creator_id: user.id,
          scenario_id: scenarioId,
          name: card.name,
          type: 'Skill',
          power: card.power,
          ap_cost: card.ap_cost,
          target_type: card.target_type,
          effect_id: card.effect_id,
          effect_duration: card.effect_duration,
          description: card.description || '',
          image_url: card.image_url || null,
        });
      }

      return NextResponse.json({
        success: true,
        scenario_id: scenarioId,
        warnings: result.warnings,
        balance: result.balance,
      });
    }

    // ── 個別アセット（enemy/item/skill_card/npc）の場合
    return NextResponse.json({
      success: true,
      type: result.type,
      data: result.data,
      warnings: result.warnings,
    });

  } catch (e: any) {
    console.error('[ugc/v2/import] Error:', e);
    return NextResponse.json({ error: e.message || 'Import failed' }, { status: 500 });
  }
}
