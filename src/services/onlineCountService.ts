import { supabaseServer } from '@/lib/supabase-admin';

/**
 * 同時接続数（過去5分間にアクションがあったユーザー）を測定し、
 * games-alchemist.com のポータルAPIに送信します。
 * 送信は VERCEL_ENV === 'production' の本番環境からのみ実行されます。
 */
export async function reportOnlineCount(): Promise<{
    success: boolean;
    count: number;
    skipped?: boolean;
    response?: any;
    error?: string;
}> {
    try {
        // 1. 直近5分間に更新のあったアクティブユーザー数を集計
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count, error } = await supabaseServer
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .gt('updated_at', fiveMinutesAgo);

        if (error) {
            console.error('[OnlineCount] Active users query error:', error);
            throw error;
        }

        const onlineCount = count || 0;
        const vercelEnv = process.env.VERCEL_ENV || 'development';
        const isProduction = vercelEnv === 'production';

        // 2. 本番環境以外では送信をスキップ（ユーザー指示に基づき、検証ログのみ出力）
        if (!isProduction) {
            console.log(`[OnlineCount] Non-production environment (${vercelEnv}). Skip reporting. Measured count: ${onlineCount}`);
            return {
                success: true,
                count: onlineCount,
                skipped: true,
                response: { message: 'Skipped sending because it is a non-production environment.' }
            };
        }

        // 3. APIキーとゲームキーの設定（環境変数優先、未設定時はデフォルト）
        const gameKey = process.env.PORTAL_GAME_KEY || 'code-wirth-dawn';
        const apiKey = process.env.PORTAL_API_KEY || '6ce53c7ff16b8a5d9c7c6f7813e9c45a';
        
        const portalUrl = `https://games-alchemist.com/api/portal/online-count/?game_key=${encodeURIComponent(gameKey)}&api_key=${encodeURIComponent(apiKey)}&online_count=${onlineCount}`;

        console.log(`[OnlineCount] Sending online count of ${onlineCount} to portal API.`);

        const response = await fetch(portalUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[OnlineCount] Portal API error: ${response.status} ${response.statusText} - ${text}`);
            return {
                success: false,
                count: onlineCount,
                error: `Portal API returned status ${response.status}: ${text}`
            };
        }

        let responseData: any = null;
        try {
            responseData = await response.json();
        } catch {
            responseData = { message: 'Success (response not JSON)' };
        }

        console.log('[OnlineCount] Portal API response:', responseData);
        return {
            success: true,
            count: onlineCount,
            response: responseData
        };
    } catch (e: any) {
        console.error('[OnlineCount] Exception during reporting:', e);
        return {
            success: false,
            count: 0,
            error: e.message || 'Unknown exception'
        };
    }
}
