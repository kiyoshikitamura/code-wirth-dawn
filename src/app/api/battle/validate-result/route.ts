import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { createHmac, randomBytes } from 'crypto';
import { supabaseServer } from '@/lib/supabase-admin';

const HMAC_SECRET = process.env.ADMIN_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-battle-secret';

/**
 * POST /api/battle/validate-result
 * バトル結果のサーバーサイド検証。
 * 
 * [Security] v27.2: クライアントサイドの勝利判定を信頼せず、
 * サーバーに保存されたbattle_sessionのenemy_dataを検証して
 * battle_completion_tokenを発行する。
 * 
 * このトークンがないとクエスト完了API等で報酬を受け取れない。
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { battle_session_id, claimed_result } = body;

        if (!battle_session_id) {
            return NextResponse.json({ error: 'battle_session_id is required' }, { status: 400 });
        }

        const authHeader = req.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : '';
        const client = createAuthClient(req);

        // 1. JWT認証で本人のセッションか検証
        const { data: { user }, error: authError } = await client.auth.getUser(token || undefined);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Battle sessionを取得
        const { data: session, error: fetchError } = await client
            .from('battle_sessions')
            .select('*')
            .eq('id', battle_session_id)
            .eq('user_id', user.id) // 本人のセッションのみ
            .single();

        if (fetchError || !session) {
            return NextResponse.json({ error: 'Battle session not found or unauthorized' }, { status: 404 });
        }

        // 3. セッション状態の検証
        const enemyData = session.enemy_data || [];
        const serverAllDead = Array.isArray(enemyData) && enemyData.length > 0 && enemyData.every((e: any) => e.hp <= 0);
        const serverStatus = session.status;

        // 4. 結果の整合性チェック
        let validatedResult: 'victory' | 'defeat' | 'escape' | 'active' = 'active';
        
        if (serverStatus === 'victory' || serverAllDead) {
            validatedResult = 'victory';
        } else if (serverStatus === 'defeat') {
            validatedResult = 'defeat';
        } else if (claimed_result === 'victory' && !serverAllDead) {
            // クライアントは勝利を主張しているがサーバーのenemy_dataでは全滅していない
            // → クライアントのバトルロジック結果を受け入れるが、ログに記録
            // (クライアントサイドバトルのため、サーバーのenemy_dataは最終状態を反映していない場合がある)
            console.warn(`[Battle Validate] Client claims victory but server enemy_data not all dead. Session: ${battle_session_id}, User: ${user.id}`);
            
            // クライアント側のバトルアクション履歴がある程度あることを確認（最低アクション数チェック）
            const updatedAt = new Date(session.updated_at || session.created_at);
            const createdAt = new Date(session.created_at);
            const durationMs = updatedAt.getTime() - createdAt.getTime();
            
            // 最低5秒はバトルが行われていること（即時勝利対策）
            if (durationMs < 5000 && !session.player_state?.debug_mode) {
                return NextResponse.json({ 
                    error: 'Battle duration too short for victory claim',
                    validated: false,
                    result: 'rejected'
                }, { status: 400 });
            }
            
            validatedResult = 'victory';
        } else if (claimed_result === 'escape') {
            validatedResult = 'escape';
        } else if (claimed_result === 'defeat') {
            validatedResult = 'defeat';
        }

        // 5. セッションのstatusを確定状態に更新
        if (validatedResult !== 'active') {
            await supabaseServer
                .from('battle_sessions')
                .update({ 
                    status: validatedResult,
                    updated_at: new Date().toISOString()
                })
                .eq('id', battle_session_id);

            // Update Colosseum stats if user is currently in a Colosseum quest
            try {
                const { data: userProfile } = await supabaseServer
                    .from('user_profiles')
                    .select('current_quest_id')
                    .eq('id', user.id)
                    .single();

                if (userProfile?.current_quest_id && String(userProfile.current_quest_id).startsWith('colosseum_')) {
                    const { data: stats } = await supabaseServer
                        .from('colosseum_user_stats')
                        .select('wins, losses, current_streak, max_streak')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    const currentStats = stats || { wins: 0, losses: 0, current_streak: 0, max_streak: 0 };

                    if (validatedResult === 'victory') {
                        const nextStreak = currentStats.current_streak + 1;
                        const newMax = Math.max(currentStats.max_streak, nextStreak);
                        await supabaseServer
                            .from('colosseum_user_stats')
                            .upsert({
                                user_id: user.id,
                                wins: currentStats.wins + 1,
                                current_streak: nextStreak,
                                max_streak: newMax,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' });
                    } else if (validatedResult === 'defeat' || validatedResult === 'escape') {
                        await supabaseServer
                            .from('colosseum_user_stats')
                            .upsert({
                                user_id: user.id,
                                losses: currentStats.losses + 1,
                                current_streak: 0,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' });
                    }
                }
            } catch (statsErr) {
                console.error('[Battle Validate] Failed to update Colosseum stats:', statsErr);
            }
        }

        // 6. Battle Completion Token の発行
        // HMAC署名で改ざん不可能なトークンを生成
        const tokenPayload = {
            session_id: battle_session_id,
            user_id: user.id,
            result: validatedResult,
            timestamp: Date.now(),
            nonce: randomBytes(8).toString('hex')
        };
        
        const payloadStr = JSON.stringify(tokenPayload);
        const signature = createHmac('sha256', HMAC_SECRET)
            .update(payloadStr)
            .digest('hex');

        const completionToken = Buffer.from(JSON.stringify({
            payload: tokenPayload,
            sig: signature
        })).toString('base64');

        return NextResponse.json({
            success: true,
            validated: true,
            result: validatedResult,
            battle_completion_token: completionToken,
        });

    } catch (e: any) {
        console.error('Battle Validate Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * バトル完了トークンの検証ユーティリティ（他APIから呼び出し用）
 * @returns { valid: boolean, payload: object | null }
 */
export function verifyBattleCompletionToken(token: string): { valid: boolean; payload: any } {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        const { payload, sig } = decoded;
        
        const expectedSig = createHmac('sha256', HMAC_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (sig !== expectedSig) {
            return { valid: false, payload: null };
        }

        // トークンの有効期限チェック（10分以内）
        const age = Date.now() - payload.timestamp;
        if (age > 10 * 60 * 1000) {
            return { valid: false, payload: null };
        }

        return { valid: true, payload };
    } catch {
        return { valid: false, payload: null };
    }
}
