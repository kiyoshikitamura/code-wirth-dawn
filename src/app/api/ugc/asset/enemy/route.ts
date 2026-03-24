import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── TP コスト定義（仕様: spec_v12_ugc_system.md §3.2） ───
const TP_COST = {
    hp_per_10: 1,    // HP +10 あたり 1TP
    atk_per_1: 2,    // ATK +1 あたり 2TP
    def_per_1: 2,    // DEF +1 あたり 2TP
    skill_aoe: 20,   // 全体攻撃スキル付与
    skill_drain_vit: 30, // drain_vit スキル付与
};

function calcTotalTP(level: number): number {
    return 10 + Math.max(1, Math.min(50, level)) * 5;
}

function calcUsedTP(stats: {
    hp?: number;
    atk?: number;
    def?: number;
    skills?: string[];
}): number {
    let used = 0;
    if (stats.hp) used += Math.ceil(stats.hp / 10) * TP_COST.hp_per_10;
    if (stats.atk) used += stats.atk * TP_COST.atk_per_1;
    if (stats.def) used += stats.def * TP_COST.def_per_1;
    if (stats.skills) {
        for (const skill of stats.skills) {
            if (skill === 'drain_vit') used += TP_COST.skill_drain_vit;
            else if (skill === 'aoe_attack') used += TP_COST.skill_aoe;
        }
    }
    return used;
}

/**
 * POST /api/ugc/asset/enemy
 * UGC カスタムエネミー / 同行NPC の保存。
 * サーバー側で TP バリデーションを行い、超過時は 400 を返す。
 *
 * Body:
 * {
 *   userId: string,
 *   name: string,
 *   level: number (1-50),
 *   stats: { hp: number, atk: number, def: number, skills?: string[] },
 *   image_url?: string,
 *   flavor_text?: string,
 *   asset_type?: 'enemy' | 'npc_companion'  // default: 'enemy'
 * }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // S1修正: JWT認証必須化
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: 有効な認証トークンが必要です' }, { status: 401 });
        }

        if (body.userId && body.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized: ユーザーIDが一致しません' }, { status: 401 });
        }

        const { name, level, stats, image_url, flavor_text, asset_type = 'enemy' } = body;

        if (!userId || !name || !level || !stats) {
            return NextResponse.json(
                { error: 'userId, name, level, stats は必須です。' },
                { status: 400 }
            );
        }

        const lvNum = Number(level);
        if (isNaN(lvNum) || lvNum < 1 || lvNum > 50) {
            return NextResponse.json(
                { error: 'level は 1〜50 の整数で指定してください。' },
                { status: 400 }
            );
        }

        // ─── TP バリデーション ───
        const totalTP = calcTotalTP(lvNum);
        const usedTP = calcUsedTP(stats);

        if (usedTP > totalTP) {
            return NextResponse.json({
                error: `TPが上限を超えています。使用: ${usedTP}TP / 上限: ${totalTP}TP (Lv${lvNum})`,
                total_tp: totalTP,
                used_tp: usedTP,
            }, { status: 400 });
        }

        // ─── enemies テーブルに INSERT ───
        const { data, error: insertError } = await supabase
            .from('enemies')
            .insert({
                name,
                level: lvNum,
                hp: stats.hp || 10,
                max_hp: stats.hp || 10,
                attack: stats.atk || 1,
                defense: stats.def || 1,
                image_url: image_url || null,
                flavor_text: flavor_text || null,
                is_ugc: true,
                creator_id: userId,
                asset_type,
                skills: stats.skills || [],
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[ugc/asset/enemy] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            total_tp: totalTP,
            used_tp: usedTP,
            remaining_tp: totalTP - usedTP,
        });

    } catch (err: any) {
        console.error('[ugc/asset/enemy] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
