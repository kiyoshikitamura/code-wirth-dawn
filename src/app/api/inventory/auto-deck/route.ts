process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

// JWT認証ヘルパー
async function getAuthUserId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) return user.id;
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json({ error: '認証エラー。再度ログインしてください。' }, { status: 401 });
        }

        // 1. プロファイルから max_deck_cost を取得
        const { data: profile, error: profileErr } = await supabaseServer
            .from('user_profiles')
            .select('max_deck_cost')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'ユーザープロファイルが見つかりません。' }, { status: 404 });
        }

        const maxDeckCost = profile.max_deck_cost || 10;

        // 2. 所持している正規スキルとレガシースキルを並行取得
        const [skillsRes, legacyRes] = await Promise.all([
            supabaseServer
                .from('user_skills')
                .select('id, skills!inner(deck_cost, card_id)')
                .eq('user_id', userId),
            supabaseServer
                .from('inventory')
                .select('id, items!inner(effect_data)')
                .eq('user_id', userId)
                .eq('is_skill', true)
        ]);

        if (skillsRes.error) throw skillsRes.error;
        if (legacyRes.error) throw legacyRes.error;

        const allSkills: Array<{
            id: string | number;
            table: 'user_skills' | 'inventory';
            cost: number;
            card_id?: number | null;
        }> = [];

        // 正規スキルを追加
        for (const s of (skillsRes.data || [])) {
            const cost = (s as any).skills?.deck_cost ?? 0;
            const card_id = (s as any).skills?.card_id ?? null;
            allSkills.push({ id: s.id, table: 'user_skills', cost, card_id });
        }

        // レガシースキルを追加
        for (const s of (legacyRes.data || [])) {
            const ed = (s as any).items?.effect_data;
            const cost = ed?.deck_cost ?? ed?.cost ?? 0;
            allSkills.push({ id: s.id, table: 'inventory', cost });
        }

        // 3. 全スキルをコスト降順にソート
        allSkills.sort((a, b) => b.cost - a.cost);

        // 4. 一旦すべてのスキルの装備フラグをリセット
        await Promise.all([
            supabaseServer
                .from('user_skills')
                .update({ is_equipped: false })
                .eq('user_id', userId),
            supabaseServer
                .from('inventory')
                .update({ is_equipped: false })
                .eq('user_id', userId)
                .eq('is_skill', true)
        ]);

        // 5. 貪欲法による装備判定
        let currentCost = 0;
        const equipSkillIds: Array<string | number> = [];
        const equipLegacyIds: Array<string | number> = [];
        const equippedCardIds: number[] = [];

        for (const skill of allSkills) {
            if (currentCost + skill.cost <= maxDeckCost) {
                currentCost += skill.cost;
                if (skill.table === 'user_skills') {
                    equipSkillIds.push(skill.id);
                    if (skill.card_id) {
                        equippedCardIds.push(Number(skill.card_id));
                    }
                } else {
                    equipLegacyIds.push(skill.id);
                }
            }
        }

        // 6. 装備状態を一括更新
        const updatePromises: Array<Promise<any>> = [];
        if (equipSkillIds.length > 0) {
            updatePromises.push(
                supabaseServer
                    .from('user_skills')
                    .update({ is_equipped: true })
                    .in('id', equipSkillIds) as any
            );
        }
        if (equipLegacyIds.length > 0) {
            updatePromises.push(
                supabaseServer
                    .from('inventory')
                    .update({ is_equipped: true })
                    .in('id', equipLegacyIds) as any
            );
        }
        if (updatePromises.length > 0) {
            const results = await Promise.all(updatePromises);
            for (const r of results) {
                if (r.error) throw r.error;
            }
        }

        // 7. signature_deck（最大6枚）を更新
        const finalSignatureDeck = equippedCardIds.slice(0, 6);
        const { error: profileUpdateErr } = await supabaseServer
            .from('user_profiles')
            .update({ signature_deck: finalSignatureDeck })
            .eq('id', userId);

        if (profileUpdateErr) {
            console.warn('[Auto-Deck] signature_deck sync failed (non-fatal):', profileUpdateErr);
        }

        return NextResponse.json({
            success: true,
            current_deck_cost: currentCost,
            equipped_skills_count: equipSkillIds.length + equipLegacyIds.length
        });
    } catch (err: any) {
        console.error('[Auto-Deck Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
