/**
 * shopAuth.ts
 * ショップ系API共通の認証・プロフィール取得ユーティリティ
 * shop/route.ts, shop/sell/route.ts, shop/launder/route.ts で重複していた
 * getUserProfile ヘルパーを一元化。
 */

import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';
import { UserProfileDB } from '@/types/game';

/**
 * JWT認証を行い、認証済みユーザーのプロフィールを返す。
 * 認証失敗時はErrorをthrow（呼び出し元のtry/catchで処理）。
 */
export async function getAuthenticatedProfile(req: Request): Promise<UserProfileDB> {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || authHeader.trim() === '' || authHeader === 'Bearer' || authHeader === 'Bearer ') {
        throw new AuthError('Login required for shop usage.', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const res = await supabase.auth.getUser(token);
    const user = res?.data?.user;
    const error = res?.error;

    if (error || !user) {
        throw new AuthError('Authentication failed. JWT is required.', 401);
    }

    const { data: profile, error: profileError } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.error(`[ShopAuth] Profile NOT FOUND for ID: ${user.id}`);
        throw new AuthError('User profile not found', 404);
    }

    console.log(`[ShopAuth] Profile: ${profile.id} | Gold: ${profile.gold} | Loc: ${profile.current_location_id}`);
    return profile as UserProfileDB;
}

/**
 * 出禁（エンバーゴ）チェック。名声<0の場合はErrorをthrow。
 */
export async function checkEmbargo(profile: UserProfileDB): Promise<void> {
    if (!profile.current_location_id) return;

    const { data: locData } = await supabaseServer
        .from('locations')
        .select('name')
        .eq('id', profile.current_location_id)
        .maybeSingle();

    if (!locData?.name) return;

    const { data: repData } = await supabaseServer
        .from('reputations')
        .select('score')
        .eq('user_id', profile.id)
        .eq('location_name', locData.name)
        .maybeSingle();

    if (repData && (repData.score || 0) <= -300) {
        throw new AuthError('出禁状態: この拠点での名声が低すぎるため、取引を拒否されました。', 403);
    }
}

/**
 * インフレ乗数を取得（繁栄度→価格乗数マッピング）
 */
export async function getInflationMultiplier(locationId: string | undefined): Promise<{ multiplier: number; prosperityLevel: number }> {
    let prosperityLevel = 3;
    if (locationId) {
        const { data: loc } = await supabaseServer
            .from('locations')
            .select('prosperity_level')
            .eq('id', locationId)
            .maybeSingle();
        if (loc) prosperityLevel = loc.prosperity_level || 3;
    }
    const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
    return { multiplier: inflationMap[prosperityLevel] || 1.0, prosperityLevel };
}

/**
 * 認証エラー（ステータスコード付き）
 */
export class AuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'AuthError';
    }
}
