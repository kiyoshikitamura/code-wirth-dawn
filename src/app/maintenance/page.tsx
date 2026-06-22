/* eslint-disable @next/next/no-html-link-for-pages */
import React from 'react';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
    let endTimeStr = '未定（作業が完了次第、順次再開いたします）';

    try {
        const { data } = await supabaseServer
            .from('system_settings')
            .select('value')
            .eq('key', 'maintenance')
            .maybeSingle();

        const settings = data?.value as {
            force_maintenance: boolean;
            start_at: string | null;
            end_at: string | null;
        } | null;

        if (settings?.end_at) {
            const endDate = new Date(settings.end_at);
            // 日本時間 (JST: UTC+9) にフォーマット
            const jstOffset = 9 * 60 * 60 * 1000;
            const jstDate = new Date(endDate.getTime() + jstOffset);
            const year = jstDate.getUTCFullYear();
            const month = jstDate.getUTCMonth() + 1;
            const date = jstDate.getUTCDate();
            const hours = String(jstDate.getUTCHours()).padStart(2, '0');
            const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0');

            endTimeStr = `${year}年${month}月${date}日 ${hours}:${minutes} 頃 (予定)`;
        }
    } catch (e) {
        console.error('[MaintenancePage] Failed to fetch settings:', e);
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0c0a0a',
            backgroundImage: 'linear-gradient(to top, rgba(12, 10, 10, 0.95), rgba(12, 10, 10, 0.4) 40%, rgba(12, 10, 10, 0.7)), url("/backgrounds/key_visual/cozy_inn.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#e4e4e7',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            padding: '24px',
        }}>
            <div style={{
                maxWidth: '520px',
                width: '100%',
                backgroundColor: 'rgba(20, 20, 25, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '40px 32px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
            }}>
                {/* メンテナンスを示すクリーンなアイコングラフィック */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    fontSize: '28px',
                    marginBottom: '24px',
                    fontWeight: 'bold',
                }}>
                    !
                </div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: '16px',
                    letterSpacing: '-0.025em',
                }}>
                    只今メンテナンス中です
                </h1>

                <p style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#a1a1aa',
                    marginBottom: '32px',
                }}>
                    より快適なサービスを提供するため、現在システムメンテナンスを実施しております。
                    お客様にはご不便をおかけいたしますが、ご理解とご協力のほどよろしくお願い申し上げます。
                </p>



                {/* アクションボタン */}
                <div>
                    <style>{`
                        .maintenance-btn {
                            display: inline-block;
                            background-color: #e4e4e7;
                            color: #18181b;
                            font-size: 14px;
                            font-weight: 600;
                            padding: 12px 32px;
                            border-radius: 8px;
                            text-decoration: none;
                            transition: background-color 0.2s, transform 0.1s;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }
                        .maintenance-btn:hover {
                            background-color: #ffffff;
                        }
                    `}</style>
                    <a 
                        href="/" 
                        className="maintenance-btn"
                    >
                        再読み込み
                    </a>
                </div>
            </div>
        </div>
    );
}
