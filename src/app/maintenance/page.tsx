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
            // 日本時間にフォーマット (JST)
            const year = endDate.getFullYear();
            const month = endDate.getMonth() + 1;
            const date = endDate.getDate();
            const hours = String(endDate.getHours()).padStart(2, '0');
            const minutes = String(endDate.getMinutes()).padStart(2, '0');

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
            backgroundColor: '#0a0a0c',
            backgroundImage: 'radial-gradient(circle at center, #16161a 0%, #0a0a0c 100%)',
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

                {/* 予定時刻表示エリア (可読性重視の高コントラスト設計) */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '20px 16px',
                    marginBottom: '32px',
                }}>
                    <span style={{
                        display: 'block',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#71717a',
                        marginBottom: '6px',
                    }}>
                        メンテナンス終了予定
                    </span>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#f4f4f5',
                    }}>
                        {endTimeStr}
                    </span>
                </div>

                {/* アクションボタン */}
                <div>
                    <a 
                        href="/" 
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#e4e4e7',
                            color: '#18181b',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '12px 32px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            transition: 'background-color 0.2s, transform 0.1s',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#e4e4e7';
                        }}
                    >
                        再読み込み
                    </a>
                </div>
            </div>
        </div>
    );
}
