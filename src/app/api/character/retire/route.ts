import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';
import { LifeCycleService } from '@/services/lifeCycleService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cause, heirloom_item_id, heirloom_item_ids, paid_gold_for_slots } = body;

        // Authentication & Profile Fetch (Active Profile)
        const { data: profiles, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (fetchError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        const profile = profiles[0];

        if (!profile.is_alive) {
            return NextResponse.json({ error: 'Character is already dead/retired' }, { status: 400 });
        }

        const client = createAuthClient(req);

        // タスク1: 形見スロット数の算出（仕様: spec_v10_retirement_heroic.md §4.3）
        // 50,000G以上 → 2枠 / 200,000G以上 → 3枠 / それ以外 → 1枠（基本）
        const paidGold = (typeof paid_gold_for_slots === 'number' && paid_gold_for_slots > 0)
            ? paid_gold_for_slots
            : 0;

        let allowedSlots = 1;
        if (paidGold >= 200000) {
            allowedSlots = 3;
        } else if (paidGold >= 50000) {
            allowedSlots = 2;
        }

        // 形見アイテムIDの配列を確定
        let finalHeirlooms: string[] = heirloom_item_ids || [];
        if (heirloom_item_id && finalHeirlooms.length === 0) finalHeirlooms.push(heirloom_item_id);

        // タスク1: 枚数バリデーション — スロット数を超えるアイテム指定は拒否
        if (finalHeirlooms.length > allowedSlots) {
            return NextResponse.json({
                error: `形見スロット不足: 指定されたスロット数（${allowedSlots}枠）に対してアイテムが多すぎます（${finalHeirlooms.length}個）。`,
                allowed_slots: allowedSlots,
                required_gold: allowedSlots >= 3 ? 200000 : allowedSlots >= 2 ? 50000 : 0
            }, { status: 400 });
        }

        // タスク1: ゴールド残高チェック（支払い額が設定されている場合）
        if (paidGold > 0) {
            if (profile.gold < paidGold) {
                return NextResponse.json({
                    error: `ゴールドが不足しています。（必要: ${paidGold.toLocaleString()} G / 所持: ${profile.gold.toLocaleString()} G）`,
                    required: paidGold,
                    current_gold: profile.gold
                }, { status: 400 });
            }
            // タスク1: ゴールドをシステム回収（消滅）
            await client.rpc('increment_gold', { p_user_id: profile.id, p_amount: -paidGold });
        }

        // ─── タスク5: 英霊（Heroic Shadow）FIFO登録ロジック ───
        // 仕様: spec_v13_monetization_subscription.md §4.1
        // FIFO・Tier判定（free/basic/premium）・上限チェックはすべて
        // LifeCycleService.handleCharacterDeath() 内部で処理される。
        // （lifeCycleService.ts §83-180 参照）
        // ここでは追加処理不要。

        // Delegate to LifeCycleService
        const lifeSync = new LifeCycleService(client);
        const deathCause = cause === 'voluntary' ? 'Voluntary Retirement' : (cause || 'Unknown');

        // タスク2: 形見情報をoptionsとして渡し、historical_logsのスナップショットに含める
        const result = await lifeSync.handleCharacterDeath(profile.id, deathCause, {
            heirloomItemIds: finalHeirlooms,
            allowedSlots,
            paidGold,
        });

        if (!result.success) {
            throw new Error(result.error || 'Retirement failed');
        }

        const shareText = `我が名は${profile.name || profile.title_name}。${profile.age}歳の若さでこの世を去り、英霊として酒場に名を残す。誰か、私の残影を雇ってくれ。 #Wirth_Dawn #英雄の最期`;

        return NextResponse.json({
            success: true,
            message: 'Character retired successfully.',
            heirloom_item_ids: finalHeirlooms,
            allowed_slots: allowedSlots,
            paid_gold: paidGold,
            share_text: shareText
        });

    } catch (e: any) {
        console.error("Retire Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
