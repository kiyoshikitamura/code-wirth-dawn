import { SupabaseClient } from '@supabase/supabase-js';

// Cooldown duration in seconds
const COOLDOWN_SECONDS = 10;

// Excluded Kitamu account
const EXCLUDED_KITAMU_USER_ID = 'c1cf67dd-527a-497e-bf88-ce10c2cb516f';

// Gemstone avatar for system account
const SYSTEM_AVATAR_URL = '/images/icons/observer_gem.png';
const SYSTEM_NAME = '世界の観測者';

// Forbidden words for censor/block list
const FORBIDDEN_WORDS = [
    '死ね', '殺す', 'ころす', '馬鹿', 'ばか', 'バカ', 'アホ', 'あほ', 'カス', 'かす', 'ゴミ', 'ごみ', 
    'ハゲ', 'はげ', 'デブ', 'でぶ', 'ブス', 'ぶす', 'キチガイ', 'きちがい'
];

export class GossipService {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Posts an automated system message to the gossip board under the name '世界の観測者'
     */
    async postSystemMessage(
        content: string,
        locationId: string | null,
        targetUserId?: string | null,
        createdAt?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Exclude production Kitamu account from system notifications
            if (targetUserId === EXCLUDED_KITAMU_USER_ID) {
                console.log(`[GossipService] Excluded Kitamu user ${targetUserId} from system post.`);
                return { success: true };
            }

            // Resolve location name if locationId is provided
            let locationName: string | null = null;
            if (locationId) {
                const { data: loc } = await this.supabase
                    .from('locations')
                    .select('name')
                    .eq('id', locationId)
                    .maybeSingle();
                locationName = loc?.name || null;
            }

            const insertPayload: any = {
                user_id: null,
                name: SYSTEM_NAME,
                epithet: null,
                avatar_url: SYSTEM_AVATAR_URL,
                content: content.slice(0, 140),
                location_id: locationId,
                location_name: locationName,
                is_system: true
            };

            if (createdAt) {
                insertPayload.created_at = createdAt;
            }

            const { error } = await this.supabase
                .from('gossip_posts')
                .insert(insertPayload);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('[GossipService] Failed to post system message:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Posts a user message to the gossip board after verifying validations
     */
    async postUserMessage(
        userId: string,
        content: string
    ): Promise<{ success: boolean; error?: string; status?: number }> {
        try {
            // 1. Validation: Max length
            if (!content || content.trim().length === 0) {
                return { success: false, error: '本文を入力してください。', status: 400 };
            }
            if (content.length > 140) {
                return { success: false, error: '噂話は140文字以内で入力してください。', status: 400 };
            }

            // 2. Validation: Forbidden words
            const hasForbidden = FORBIDDEN_WORDS.some(word => content.includes(word));
            if (hasForbidden) {
                return { success: false, error: '不適切な表現が含まれているため、投稿できません。', status: 400 };
            }

            // 3. Fetch user profile
            const { data: profile, error: profileErr } = await this.supabase
                .from('user_profiles')
                .select('name, title_name, avatar_url, current_location_id, locations:locations!fk_current_location(name)')
                .eq('id', userId)
                .single();

            if (profileErr || !profile) {
                return { success: false, error: 'ユーザー情報が見つかりません。', status: 404 };
            }

            // 4. Cooldown check (30 seconds)
            const { data: latestPost } = await this.supabase
                .from('gossip_posts')
                .select('created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestPost) {
                const elapsedSeconds = (Date.now() - new Date(latestPost.created_at).getTime()) / 1000;
                if (elapsedSeconds < COOLDOWN_SECONDS) {
                    return { 
                        success: false, 
                        error: '連続投稿は禁止となります', 
                        status: 429 
                    };
                }
            }

            // 5. Insert post
            const locationName = (profile as any).locations?.name || null;
            const { error: insertErr } = await this.supabase
                .from('gossip_posts')
                .insert({
                    user_id: userId,
                    name: profile.name || '名もなき旅人',
                    epithet: profile.title_name || null,
                    avatar_url: profile.avatar_url || null,
                    content: content.trim(),
                    location_id: profile.current_location_id,
                    location_name: locationName,
                    is_system: false
                });

            if (insertErr) throw insertErr;
            return { success: true };
        } catch (err: any) {
            console.error('[GossipService] Failed to post user message:', err);
            return { success: false, error: err.message, status: 500 };
        }
    }
}
