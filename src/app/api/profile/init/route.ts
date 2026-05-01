import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { LifeCycleService } from '@/services/lifeCycleService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title_name, gender, age, gold, current_location_id, birth_date, max_hp, max_vitality, max_deck_cost, heirloom_item_ids, atk, def, avatar_url } = body;

        const { user_id } = body; // クライアントから明示的に渡される場合

        // JWT指向の認証クライアントを生成（RLS を必ず通る）
        const client = createAuthClient(req);

        // JWT Bearer からユーザー ID を補完取得する
        const { data: { user: jwtUser } } = await client.auth.getUser();
        const resolvedUserId: string | null = user_id || jwtUser?.id || null;

        if (!resolvedUserId) {
            // [Logic-Expert] 旧仕様の「.limit(1)フォールバック」を廃止。
            // user_id なし・ JWT なしの場合は安全に 401 で正す。
            console.error('[POST /api/profile/init] ユーザー ID を特定できません。告み および JWT の両方が未提供です。');
            return NextResponse.json(
                { error: 'ユーザー ID が特定できません。再度ログインしてください。' },
                { status: 401 }
            );
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('[Init Profile] resolvedUserId:', resolvedUserId);
            console.log('[Init Profile] Age Input:', age, typeof age);
        }

        // プロファイルを検索（再誕フローの場合は既存プロファイルがあることがある）
        let profileId: string | null = null;

        const { data: existingProfile } = await client
            .from('user_profiles')
            .select('id')
            .eq('id', resolvedUserId)
            .maybeSingle();

        if (existingProfile) profileId = existingProfile.id;

        let updates: any = {
            name: title_name, // User Input -> Name
            title_name: '名もなき旅人', // Default Title/Rank
            gender,
            age: age ?? 20,
            birth_date: birth_date || null, // V9.2
            accumulated_days: 0,
            // gold: gold || 1000, // Determined by processInheritance below
            vitality: max_vitality ?? 100, // Ensure defaults or use calculated
            max_vitality: max_vitality ?? 100,
            hp: max_hp ?? 100,
            max_hp: max_hp ?? 100,
            initial_hp: max_hp ?? 100, // Added for Spec v8.2 scaling
            max_deck_cost: max_deck_cost ?? 12,
            atk: atk ?? 1,  // v9.3: 基礎攻撃力（年齢連動）
            def: def ?? 1,  // v9.3: 基礎防御力（年齢連動）
            is_alive: true, // Resurrect
            updated_at: new Date().toISOString()
        };

        if (current_location_id) updates.current_location_id = current_location_id;
        if (avatar_url) updates.avatar_url = avatar_url;

        // 匿名ユーザー（テストプレイ）フラグ＆失効日時を設定
        const isAnonymous = jwtUser?.is_anonymous ?? false;
        updates.is_anonymous = isAnonymous;
        if (isAnonymous) {
            // テストプレイは7日間のみ有効（日次 cron で失効データを自動削除）
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            updates.expires_at = expiresAt.toISOString();
        }

        // Inheritance Logic
        const lifeSync = new LifeCycleService(client);

        // v15.0: calculate-stats API から渡された gold を優先（フォールバックは v15.0 最低値の 800G）
        const FRESH_START_GOLD_DEFAULT = 800; // spec_v10: 800 + randInt(100,400) の最低値
        const requestedGold = typeof gold === 'number' && gold > 0 ? gold : FRESH_START_GOLD_DEFAULT;

        if (profileId) {
            // Apply Inheritance if profile exists (Reincarnation flow)
            const result = await lifeSync.processInheritance(profileId, { ...updates, gold: requestedGold }, heirloom_item_ids);
            if (result) {
                updates = { ...updates, ...result };
            }
        } else {
            updates.gold = requestedGold; // v15.0: ランダム初期Gold を使用
        }

        if (!profileId) {
            // INSERT モード（Service Role を使用して RLS をバイパス）
            console.log('[Init Profile] プロファイルが存在しないため新規作成します... ID:', resolvedUserId);
            // resolvedUserId で必ず登録する（auth.users.idと連携させる）
            updates.id = resolvedUserId;

            const { data: newProfile, error: insertError } = await supabaseServer
                .from('user_profiles')
                .insert([updates])
                .select('id')
                .single();

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, id: newProfile.id });
        } else {
            // UPDATE Mode
            const { error } = await client
                .from('user_profiles')
                .update(updates)
                .eq('id', profileId);

            if (error) throw error;
            return NextResponse.json({ success: true, id: profileId });
        }

    } catch (err: any) {
        console.error("Profile Init Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
