'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeLocalStorage } from '@/lib/safeStorage';
import { Users, Coins, Sword, ArrowLeft, CreditCard, Activity, Trophy, Compass, Download, RefreshCw, Calendar, Clock } from 'lucide-react';

interface KPISummary {
    totalUsers: number;
    totalGold: number;
    avgGold: number;
    maxGold: number;
    avgLevel: number;
    totalBattles: number;
    winRate: number;
    pendingReports: number;
    dau: number;
    mau: number;
    anonMau?: number;
    authMau?: number;
    totalQuests: number;
    anonUsers?: number;
    authUsers?: number;

    // Payments & Subscriptions
    totalRevenue: number;
    subscriptionRevenue: number;
    subscriptionCount: number;
    goldPurchaseRevenue: number;
    goldPurchaseCount: number;
    totalGoldCharged: number;
    dpu: number;
    mpu: number;
}

interface LevelDistribution {
    '1': number;
    '2-5': number;
    '6-10': number;
    '11-15': number;
    '16+': number;
}

interface SubscriptionDistribution {
    free: number;
    basic: number;
    premium: number;
}

interface QuestRanking {
    id: number | string;
    title: string;
    count: number;
}

interface QuestStats {
    id: number | string;
    title: string;
    quest_type: string;
    startCount: number;
    completeCount: number;
    abandonCount: number;
    clearRate: number;
}

interface DailyKPI {
    date: string;
    newUsers: number;
    newUsersRegistered: number;
    newUsersGuest: number;
    totalBattles: number;
    victories: number;
    defeats: number;
    fleds: number;
    winRate: number;
    dau: number;
    mau: number;
    anonMau?: number;
    authMau?: number;
    revenue: number;
    pu: number;
    dpu: number;
    mpu: number;
}

interface MonthlyKPI {
    month: string;
    revenue: number;
    mau: number;
    mpu: number;
    newUsersRegistered: number;
    newUsersGuest: number;
}

interface ColosseumSummary {
    totalPlayers: number;
    totalBattles: number;
    winRate: number;
    maxStreak: number;
    totalGoldSpent: number;
}

interface ColosseumDaily {
    date: string;
    starts: { easy: number; normal: number; hard: number };
    completes: { easy: number; normal: number; hard: number };
    abandons: { easy: number; normal: number; hard: number };
    goldSpent: number;
}

interface ColosseumMonthly {
    month: string;
    starts: { easy: number; normal: number; hard: number };
    completes: { easy: number; normal: number; hard: number };
    abandons: { easy: number; normal: number; hard: number };
    goldSpent: number;
}

interface AcademySummary {
    totalPlayers: number;
    totalPacks: number;
    totalGoldSpent: number;
    totalRefundGold: number;
}

interface AcademyDaily {
    date: string;
    packs: Record<string, number>;
    goldSpent: Record<string, number>;
    refundGold: Record<string, number>;
}

interface AcademyMonthly {
    month: string;
    packs: Record<string, number>;
    goldSpent: Record<string, number>;
    refundGold: Record<string, number>;
}

interface KPIData {
    summary: KPISummary;
    levelDistribution: LevelDistribution;
    subscriptionDistribution: SubscriptionDistribution;
    questRanking: QuestRanking[];
    questStats: QuestStats[];
    dailyKPI: DailyKPI[];
    monthlyKPI: MonthlyKPI[];
    colosseum?: {
        summary: ColosseumSummary;
        daily: ColosseumDaily[];
        monthly: ColosseumMonthly[];
    };
    academy?: {
        summary: AcademySummary;
        daily: AcademyDaily[];
        monthly: AcademyMonthly[];
    };
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [parentTab, setParentTab] = useState<'daily' | 'monthly'>('daily');
    const [childTab, setChildTab] = useState<'kpi' | 'colosseum' | 'academy'>('kpi');
    const [daysRange, setDaysRange] = useState<number>(30);

    // CSVエクスポート処理 (現在のタブに応じて出力)
    const exportCsv = () => {
        if (!data) return;

        let headers: string[] = [];
        let rows: any[][] = [];
        let filename = '';

        if (parentTab === 'daily') {
            if (childTab === 'kpi') {
                headers = ['日付', '課金額(円)', 'DAU', 'PU', 'PUR(%)', 'ARPPU(円)', 'ARPU(円)', '登録ユーザー数合計', '本登録数', 'ゲスト数'];
                rows = data.dailyKPI.map(d => [
                    d.date,
                    d.revenue,
                    d.dau,
                    d.pu,
                    d.dau > 0 ? ((d.pu / d.dau) * 100).toFixed(2) : '0.00',
                    d.pu > 0 ? Math.round(d.revenue / d.pu) : 0,
                    d.dau > 0 ? Math.round(d.revenue / d.dau) : 0,
                    d.newUsersRegistered + d.newUsersGuest,
                    d.newUsersRegistered,
                    d.newUsersGuest
                ]);
                filename = `daily_kpi_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (childTab === 'colosseum') {
                headers = ['日付', '総挑戦数', 'Easy挑戦数', 'Normal挑戦数', 'Hard挑戦数', '総制覇数', 'Easy制覇数', 'Normal制覇数', 'Hard制覇数', '総放棄数', 'Easy放棄数', 'Normal放棄数', 'Hard放棄数', '回収ゴールド(G)'];
                rows = (data.colosseum?.daily || []).map(d => [
                    d.date,
                    d.starts.easy + d.starts.normal + d.starts.hard,
                    d.starts.easy,
                    d.starts.normal,
                    d.starts.hard,
                    d.completes.easy + d.completes.normal + d.completes.hard,
                    d.completes.easy,
                    d.completes.normal,
                    d.completes.hard,
                    d.abandons.easy + d.abandons.normal + d.abandons.hard,
                    d.abandons.easy,
                    d.abandons.normal,
                    d.abandons.hard,
                    d.goldSpent
                ]);
                filename = `daily_colosseum_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (childTab === 'academy') {
                headers = ['日付', 'パック開封数(混沌と反逆)', '消費ゴールド(G)', '返還ゴールド(G)', '実質消費ゴールド(G)'];
                rows = (data.academy?.daily || []).map(d => {
                    const packs = d.packs.chaos_and_rebellion || 0;
                    const goldSpent = d.goldSpent.chaos_and_rebellion || 0;
                    const refundGold = d.refundGold.chaos_and_rebellion || 0;
                    return [
                        d.date,
                        packs,
                        goldSpent + refundGold,
                        refundGold,
                        goldSpent
                    ];
                });
                filename = `daily_academy_${new Date().toISOString().split('T')[0]}.csv`;
            }
        } else { // monthly
            if (childTab === 'kpi') {
                headers = ['対象月', '課金額(円)', 'MAU', 'MPU', 'MPUR(%)', 'MARPPU(円)', 'MARPU(円)', '登録ユーザー数合計', '本登録数', 'ゲスト数'];
                rows = (data.monthlyKPI || []).map(m => [
                    m.month,
                    m.revenue,
                    m.mau,
                    m.mpu,
                    m.mau > 0 ? ((m.mpu / m.mau) * 100).toFixed(2) : '0.00',
                    m.mpu > 0 ? Math.round(m.revenue / m.mpu) : 0,
                    m.mau > 0 ? Math.round(m.revenue / m.mau) : 0,
                    m.newUsersRegistered + m.newUsersGuest,
                    m.newUsersRegistered,
                    m.newUsersGuest
                ]);
                filename = `monthly_kpi_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (childTab === 'colosseum') {
                headers = ['対象月', '総挑戦数', 'Easy挑戦数', 'Normal挑戦数', 'Hard挑戦数', '総制覇数', 'Easy制覇数', 'Normal制覇数', 'Hard制覇数', '総放棄数', 'Easy放棄数', 'Normal放棄数', 'Hard放棄数', '回収ゴールド(G)'];
                rows = (data.colosseum?.monthly || []).map(m => [
                    m.month,
                    m.starts.easy + m.starts.normal + m.starts.hard,
                    m.starts.easy,
                    m.starts.normal,
                    m.starts.hard,
                    m.completes.easy + m.completes.normal + m.completes.hard,
                    m.completes.easy,
                    m.completes.normal,
                    m.completes.hard,
                    m.abandons.easy + m.abandons.normal + m.abandons.hard,
                    m.abandons.easy,
                    m.abandons.normal,
                    m.abandons.hard,
                    m.goldSpent
                ]);
                filename = `monthly_colosseum_${new Date().toISOString().split('T')[0]}.csv`;
            } else if (childTab === 'academy') {
                headers = ['対象月', 'パック開封数(混沌と反逆)', '消費ゴールド(G)', '返還ゴールド(G)', '実質消費ゴールド(G)'];
                rows = (data.academy?.monthly || []).map(m => {
                    const packs = m.packs.chaos_and_rebellion || 0;
                    const goldSpent = m.goldSpent.chaos_and_rebellion || 0;
                    const refundGold = m.refundGold.chaos_and_rebellion || 0;
                    return [
                        m.month,
                        packs,
                        goldSpent + refundGold,
                        refundGold,
                        goldSpent
                    ];
                });
                filename = `monthly_academy_${new Date().toISOString().split('T')[0]}.csv`;
            }
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSVエクスポート処理 (全クエスト統計)
    const exportQuestStatsCsv = () => {
        if (!data || !data.questStats) return;
        
        const headers = ['クエストID', 'クエスト名', '種別', '総実行数', 'クリア数', '放棄数', 'クリア率(%)'];
        
        const rows = data.questStats.map(q => {
            let typeLabel = 'メイン';
            if (q.quest_type === 'sub') typeLabel = 'サブ';
            else if (q.quest_type === 'ugc') typeLabel = 'UGC';
            else if (q.quest_type === 'event') typeLabel = 'イベント';
            else if (q.quest_type === 'colosseum') typeLabel = '闘技場';

            return [
                q.id,
                q.title,
                typeLabel,
                q.startCount,
                q.completeCount,
                q.abandonCount,
                `${q.clearRate}%`
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `quest_statistics_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const router = useRouter();

    const fetchData = useCallback(async () => {
        const adminKey = safeLocalStorage.getItem('adminKey');
        if (!adminKey) {
            router.push('/admin/login');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/kpi?days=${daysRange}`, {
                headers: { 'x-admin-key': adminKey }
            });

            if (res.status === 401) {
                safeLocalStorage.removeItem('adminKey');
                router.push('/admin/login');
                return;
            }

            if (!res.ok) throw new Error('データの取得に失敗しました');

            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || '接続エラーが発生しました');
        } finally {
            setLoading(false);
        }
    }, [router, daysRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => {
        safeLocalStorage.removeItem('adminKey');
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#070d19] text-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-400">KPIデータを分析中...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#070d19] text-gray-100">
                <div className="max-w-md p-6 bg-red-950/20 border border-red-800/40 rounded-2xl text-center">
                    <p className="text-red-400 font-semibold mb-4">{error || 'データの読み込みに失敗しました'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-900/60 hover:bg-red-800 rounded-lg text-sm text-white transition-all"
                    >
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    const { summary, levelDistribution, subscriptionDistribution, colosseum, academy } = data;

    const getAcademySeriesList = () => {
        if (!data || !data.academy) return [];
        const summaryMap: Record<string, { series: string; packs: number; goldSpent: number; refundGold: number; }> = {};
        const source = (parentTab === 'daily' ? data.academy?.daily : data.academy?.monthly) || [];
        source.forEach(d => {
            Object.keys(d.packs || {}).forEach(series => {
                if (!summaryMap[series]) {
                    summaryMap[series] = { series, packs: 0, goldSpent: 0, refundGold: 0 };
                }
                summaryMap[series].packs += d.packs[series] || 0;
                summaryMap[series].goldSpent += d.goldSpent[series] || 0;
                summaryMap[series].refundGold += d.refundGold[series] || 0;
            });
        });
        return Object.values(summaryMap);
    };

    const academySeriesList = getAcademySeriesList();

    const getSeriesDisplayName = (series: string) => {
        switch (series) {
            case 'chaos_and_rebellion': return '混沌と反逆 (Chaos & Rebellion)';
            default: return series;
        }
    };

    return (
        <div className="min-h-screen bg-[#070d19] text-gray-100 font-sans p-6 relative">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-800 pb-5 max-w-7xl mx-auto gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/title" className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Code: Wirth-Dawn — Admin Dashboard
                        </h1>
                        <p className="text-xs text-gray-500">ゲームKPI・運営指標のリアルタイム監視</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={fetchData} disabled={loading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/40 text-blue-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        データの更新
                    </button>
                    <button onClick={handleLogout} className="flex-1 sm:flex-none px-4 py-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-xs font-semibold rounded-lg transition-all">
                        ログアウト
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl group hover:border-blue-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">登録ユーザー</span>
                            <div className="p-1.5 bg-blue-950/40 rounded-lg text-blue-400 border border-blue-900/30"><Users size={16} /></div>
                        </div>
                        <div className="text-xl font-bold text-blue-400 tracking-tight">{summary.totalUsers} 名</div>
                        <p className="text-[10px] text-gray-500 mt-1">本登録: {summary.authUsers || 0} / ゲスト: {summary.anonUsers || 0}</p>
                    </div>
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl group hover:border-emerald-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">MAU</span>
                            <div className="p-1.5 bg-emerald-950/40 rounded-lg text-emerald-400 border border-emerald-900/30"><Activity size={16} /></div>
                        </div>
                        <div className="text-xl font-bold text-emerald-400 tracking-tight">{summary.mau} 名</div>
                        <p className="text-[10px] text-gray-500 mt-1">アクティビティ率: {((summary.mau / Math.max(1, summary.totalUsers)) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl group hover:border-yellow-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">MPU</span>
                            <div className="p-1.5 bg-yellow-950/40 rounded-lg text-yellow-400 border border-yellow-900/30"><CreditCard size={16} /></div>
                        </div>
                        <div className="text-xl font-bold text-yellow-400 tracking-tight">{summary.mpu} 名</div>
                        <p className="text-[10px] text-gray-500 mt-1">課金転換率: {((summary.mpu / Math.max(1, summary.mau)) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl group hover:border-indigo-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">総クエスト</span>
                            <div className="p-1.5 bg-indigo-950/40 rounded-lg text-indigo-400 border border-indigo-900/30"><Activity size={16} /></div>
                        </div>
                        <div className="text-xl font-bold text-indigo-400 tracking-tight">{summary.totalQuests || 0} 回</div>
                        <p className="text-[10px] text-gray-500 mt-1">開始された全クエスト数</p>
                    </div>
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl group hover:border-purple-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">戦闘回数</span>
                            <div className="p-1.5 bg-purple-950/40 rounded-lg text-purple-400 border border-purple-900/30"><Sword size={16} /></div>
                        </div>
                        <div className="text-xl font-bold text-purple-400 tracking-tight">{summary.totalBattles} 回</div>
                        <p className="text-[10px] text-gray-500 mt-1">勝率: {summary.winRate}%</p>
                    </div>
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl group hover:border-red-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">ゴールド流通</span>
                            <div className="p-1.5 bg-red-950/40 rounded-lg text-red-400 border border-red-900/30"><Coins size={16} /></div>
                        </div>
                        <div className="text-xl font-bold text-red-400 tracking-tight">{summary.totalGold.toLocaleString()} G</div>
                        <p className="text-[10px] text-gray-500 mt-1">平均: {summary.avgGold.toLocaleString()} G</p>
                    </div>
                </div>

                {/* メインテーブル領域 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左・中: テーブルカード */}
                    <div className="lg:col-span-2 p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col min-h-[500px]">
                        
                        {/* 1階層目親タブ: 日次 / 月次 */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 mb-4 gap-3">
                            <div className="flex bg-[#070d19] border border-gray-800 rounded-lg p-0.5 text-xs">
                                <button
                                    onClick={() => setParentTab('daily')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold transition-all ${parentTab === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Clock size={14} />
                                    日次統計
                                </button>
                                <button
                                    onClick={() => setParentTab('monthly')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold transition-all ${parentTab === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Calendar size={14} />
                                    月次統計
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                {parentTab === 'daily' && childTab === 'kpi' && (
                                    <select
                                        value={daysRange}
                                        onChange={(e) => setDaysRange(Number(e.target.value))}
                                        className="bg-[#070d19] border border-gray-800 text-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all hover:border-gray-700"
                                    >
                                        <option value={30}>直近 30 日間</option>
                                        <option value={60}>直近 60 日間</option>
                                        <option value={90}>直近 90 日間</option>
                                    </select>
                                )}
                                <button
                                    onClick={exportCsv}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#070d19] hover:bg-gray-800 border border-gray-800 text-xs font-semibold rounded-lg transition-all text-gray-300 hover:text-white"
                                >
                                    <Download size={14} />
                                    CSV出力
                                </button>
                            </div>
                        </div>

                        {/* 2階層目子タブ: 基本KPI / コロシアム / 魔術学院 */}
                        <div className="flex border-b border-gray-800 pb-3 mb-5 text-xs gap-2">
                            <button
                                onClick={() => setChildTab('kpi')}
                                className={`px-4 py-1.5 rounded-full font-semibold border transition-all ${childTab === 'kpi' ? 'bg-blue-950/60 border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white bg-transparent'}`}
                            >
                                基本KPI
                            </button>
                            <button
                                onClick={() => setChildTab('colosseum')}
                                className={`px-4 py-1.5 rounded-full font-semibold border transition-all ${childTab === 'colosseum' ? 'bg-amber-950/60 border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white bg-transparent'}`}
                            >
                                コロシアム
                            </button>
                            <button
                                onClick={() => setChildTab('academy')}
                                className={`px-4 py-1.5 rounded-full font-semibold border transition-all ${childTab === 'academy' ? 'bg-indigo-950/60 border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white bg-transparent'}`}
                            >
                                魔術学院
                            </button>
                        </div>

                        {/* コロシアム総合サマリー */}
                        {childTab === 'colosseum' && colosseum && (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 bg-[#070d19]/40 p-4 border border-gray-800/80 rounded-2xl">
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">挑戦プレイヤー数</div>
                                    <div className="text-sm font-bold text-amber-400">{colosseum.summary.totalPlayers} UU</div>
                                </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">総挑戦数</div>
                                    <div className="text-sm font-bold text-blue-400">{colosseum.summary.totalBattles} 回</div>
                               </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">制覇率</div>
                                    <div className="text-sm font-bold text-emerald-400">{colosseum.summary.winRate} %</div>
                                </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">最高連勝</div>
                                    <div className="text-sm font-bold text-pink-400">{colosseum.summary.maxStreak} 連勝</div>
                                </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">累計回収ゴールド</div>
                                    <div className="text-sm font-bold text-yellow-500">{colosseum.summary.totalGoldSpent.toLocaleString()} G</div>
                                </div>
                            </div>
                        )}

                        {/* 魔術学院総合サマリー */}
                        {childTab === 'academy' && academy && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-[#070d19]/40 p-4 border border-gray-800/80 rounded-2xl">
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">購入プレイヤー数</div>
                                    <div className="text-sm font-bold text-indigo-400">{academy.summary.totalPlayers} UU</div>
                                </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">総パック購入数</div>
                                    <div className="text-sm font-bold text-blue-400">{academy.summary.totalPacks} パック</div>
                                </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">累計回収ゴールド</div>
                                    <div className="text-sm font-bold text-emerald-400">{academy.summary.totalGoldSpent.toLocaleString()} G</div>
                                </div>
                                <div className="p-3 bg-[#070d19]/80 border border-gray-800/60 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-semibold mb-1">累計返還ゴールド</div>
                                    <div className="text-sm font-bold text-yellow-500">{academy.summary.totalRefundGold.toLocaleString()} G</div>
                                </div>
                            </div>
                        )}

                        {/* データテーブル */}
                        <div className="overflow-x-auto flex-1 max-h-[550px] custom-scrollbar">
                                {/* 1. 日次統計テーブル */}
                                {parentTab === 'daily' && childTab === 'kpi' && (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                                <th className="py-3 px-4 font-semibold text-left">日付</th>
                                                <th className="py-3 px-4 font-semibold text-right">課金額</th>
                                                <th className="py-3 px-4 font-semibold text-right">DAU</th>
                                                <th className="py-3 px-4 font-semibold text-right">PU</th>
                                                <th className="py-3 px-4 font-semibold text-right">PUR (課金率)</th>
                                                <th className="py-3 px-4 font-semibold text-right">ARPPU</th>
                                                <th className="py-3 px-4 font-semibold text-right">ARPU</th>
                                                <th className="py-3 px-4 font-semibold text-right">新規登録ユーザー数内訳</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-850">
                                            {(data.dailyKPI || []).slice().reverse().map(d => {
                                                const pur = d.dau > 0 ? ((d.pu / d.dau) * 100).toFixed(2) + '%' : '0.00%';
                                                const arppu = d.pu > 0 ? Math.round(d.revenue / d.pu).toLocaleString() + ' 円' : '0 円';
                                                const arpu = d.dau > 0 ? Math.round(d.revenue / d.dau).toLocaleString() + ' 円' : '0 円';
                                                const totalNew = d.newUsersRegistered + d.newUsersGuest;
                                                return (
                                                    <tr key={d.date} className="hover:bg-gray-800/20 text-gray-300">
                                                        <td className="py-3 px-4 text-left font-mono font-semibold">{d.date}</td>
                                                        <td className="py-3 px-4 text-right text-yellow-400 font-bold">{d.revenue.toLocaleString()} 円</td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{d.dau.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-right text-amber-500 font-semibold">{d.pu.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-right text-indigo-400 font-semibold">{pur}</td>
                                                        <td className="py-3 px-4 text-right font-medium">{arppu}</td>
                                                        <td className="py-3 px-4 text-right font-medium">{arpu}</td>
                                                        <td className="py-3 px-4 text-right text-gray-400">
                                                            <span className="font-bold text-gray-250">{totalNew} 名</span>
                                                            <span className="text-[10px] text-gray-500 block">(本登録: {d.newUsersRegistered} / ゲスト: {d.newUsersGuest})</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {parentTab === 'daily' && childTab === 'colosseum' && colosseum && (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                                <th className="py-3 px-4 font-semibold text-left">日付</th>
                                                <th className="py-3 px-4 font-semibold text-right">総挑戦数 (Easy/Norm/Hard)</th>
                                                <th className="py-3 px-4 font-semibold text-right">総制覇数 (Easy/Norm/Hard)</th>
                                                <th className="py-3 px-4 font-semibold text-right">総放棄数 (Easy/Norm/Hard)</th>
                                                <th className="py-3 px-4 font-semibold text-right">回収ゴールド</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-850">
                                            {(colosseum?.daily || []).slice().reverse().map(d => {
                                                const totalStarts = (d.starts?.easy || 0) + (d.starts?.normal || 0) + (d.starts?.hard || 0);
                                                const totalCompletes = (d.completes?.easy || 0) + (d.completes?.normal || 0) + (d.completes?.hard || 0);
                                                const totalAbandons = (d.abandons?.easy || 0) + (d.abandons?.normal || 0) + (d.abandons?.hard || 0);
                                                return (
                                                    <tr key={d.date} className="hover:bg-gray-800/20 text-gray-300">
                                                        <td className="py-3 px-4 text-left font-mono font-semibold">{d.date}</td>
                                                        <td className="py-3 px-4 text-right text-blue-400 font-bold">
                                                            {totalStarts.toLocaleString()} 回
                                                            <span className="text-[10px] text-gray-500 block">({d.starts.easy} / {d.starts.normal} / {d.starts.hard})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                                                            {totalCompletes.toLocaleString()} 回
                                                            <span className="text-[10px] text-gray-500 block">({d.completes.easy} / {d.completes.normal} / {d.completes.hard})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-red-400 font-bold">
                                                            {totalAbandons.toLocaleString()} 回
                                                            <span className="text-[10px] text-gray-500 block">({d.abandons.easy} / {d.abandons.normal} / {d.abandons.hard})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-yellow-500 font-bold">{d.goldSpent.toLocaleString()} G</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {parentTab === 'daily' && childTab === 'academy' && academy && (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                                <th className="py-3 px-4 font-semibold text-left">日付</th>
                                                <th className="py-3 px-4 font-semibold text-right">パック開封数 (混沌と反逆)</th>
                                                <th className="py-3 px-4 font-semibold text-right">消費ゴールド</th>
                                                <th className="py-3 px-4 font-semibold text-right">返還ゴールド</th>
                                                <th className="py-3 px-4 font-semibold text-right">実質消費ゴールド</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-850">
                                            {(academy?.daily || []).slice().reverse().map(d => {
                                                const packs = d.packs?.chaos_and_rebellion || 0;
                                                const goldSpent = d.goldSpent?.chaos_and_rebellion || 0;
                                                const refundGold = d.refundGold?.chaos_and_rebellion || 0;
                                                const netSpent = goldSpent;
                                                const grossSpent = goldSpent + refundGold;
                                                return (
                                                    <tr key={d.date} className="hover:bg-gray-800/20 text-gray-300">
                                                        <td className="py-3 px-4 text-left font-mono font-semibold">{d.date}</td>
                                                        <td className="py-3 px-4 text-right text-indigo-400 font-bold">{packs.toLocaleString()} パック</td>
                                                        <td className="py-3 px-4 text-right font-medium">{grossSpent.toLocaleString()} G</td>
                                                        <td className="py-3 px-4 text-right text-yellow-500 font-semibold">{refundGold.toLocaleString()} G</td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-bold">{netSpent.toLocaleString()} G</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}

                                {/* 2. 月次統計テーブル */}
                                {parentTab === 'monthly' && childTab === 'kpi' && (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                                <th className="py-3 px-4 font-semibold text-left">対象月</th>
                                                <th className="py-3 px-4 font-semibold text-right">課金額</th>
                                                <th className="py-3 px-4 font-semibold text-right">MAU</th>
                                                <th className="py-3 px-4 font-semibold text-right">MPU</th>
                                                <th className="py-3 px-4 font-semibold text-right">MPUR (課金率)</th>
                                                <th className="py-3 px-4 font-semibold text-right">MARPPU</th>
                                                <th className="py-3 px-4 font-semibold text-right">MARPU</th>
                                                <th className="py-3 px-4 font-semibold text-right">新規登録ユーザー数内訳</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-850">
                                            {(data.monthlyKPI || []).slice().reverse().map(m => {
                                                const mpur = m.mau > 0 ? ((m.mpu / m.mau) * 100).toFixed(2) + '%' : '0.00%';
                                                const marppu = m.mpu > 0 ? Math.round(m.revenue / m.mpu).toLocaleString() + ' 円' : '0 円';
                                                const marpu = m.mau > 0 ? Math.round(m.revenue / m.mau).toLocaleString() + ' 円' : '0 円';
                                                const totalNew = m.newUsersRegistered + m.newUsersGuest;
                                                return (
                                                    <tr key={m.month} className="hover:bg-gray-800/20 text-gray-300">
                                                        <td className="py-3 px-4 text-left font-mono font-semibold">{m.month}</td>
                                                        <td className="py-3 px-4 text-right text-yellow-400 font-bold">{m.revenue.toLocaleString()} 円</td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{m.mau.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-right text-amber-500 font-semibold">{m.mpu.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-right text-indigo-400 font-semibold">{mpur}</td>
                                                        <td className="py-3 px-4 text-right font-medium">{marppu}</td>
                                                        <td className="py-3 px-4 text-right font-medium">{marpu}</td>
                                                        <td className="py-3 px-4 text-right text-gray-400">
                                                            <span className="font-bold text-gray-250">{totalNew} 名</span>
                                                            <span className="text-[10px] text-gray-500 block">(本登録: {m.newUsersRegistered} / ゲスト: {m.newUsersGuest})</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {parentTab === 'monthly' && childTab === 'colosseum' && colosseum && (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                                <th className="py-3 px-4 font-semibold text-left">対象月</th>
                                                <th className="py-3 px-4 font-semibold text-right">総挑戦数 (Easy/Norm/Hard)</th>
                                                <th className="py-3 px-4 font-semibold text-right">総制覇数 (Easy/Norm/Hard)</th>
                                                <th className="py-3 px-4 font-semibold text-right">総放棄数 (Easy/Norm/Hard)</th>
                                                <th className="py-3 px-4 font-semibold text-right">回収ゴールド</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-850">
                                            {(colosseum?.monthly || []).slice().reverse().map(m => {
                                                const totalStarts = (m.starts?.easy || 0) + (m.starts?.normal || 0) + (m.starts?.hard || 0);
                                                const totalCompletes = (m.completes?.easy || 0) + (m.completes?.normal || 0) + (m.completes?.hard || 0);
                                                const totalAbandons = (m.abandons?.easy || 0) + (m.abandons?.normal || 0) + (m.abandons?.hard || 0);
                                                return (
                                                    <tr key={m.month} className="hover:bg-gray-800/20 text-gray-300">
                                                        <td className="py-3 px-4 text-left font-mono font-semibold">{m.month}</td>
                                                        <td className="py-3 px-4 text-right text-blue-400 font-bold">
                                                            {totalStarts.toLocaleString()} 回
                                                            <span className="text-[10px] text-gray-500 block">({m.starts.easy} / {m.starts.normal} / {m.starts.hard})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                                                            {totalCompletes.toLocaleString()} 回
                                                            <span className="text-[10px] text-gray-500 block">({m.completes.easy} / {m.completes.normal} / {m.completes.hard})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-red-400 font-bold">
                                                            {totalAbandons.toLocaleString()} 回
                                                            <span className="text-[10px] text-gray-500 block">({m.abandons.easy} / {m.abandons.normal} / {m.abandons.hard})</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-yellow-500 font-bold">{m.goldSpent.toLocaleString()} G</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {parentTab === 'monthly' && childTab === 'academy' && academy && (
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                                <th className="py-3 px-4 font-semibold text-left">対象月</th>
                                                <th className="py-3 px-4 font-semibold text-right">パック開封数 (混沌と反逆)</th>
                                                <th className="py-3 px-4 font-semibold text-right">消費ゴールド</th>
                                                <th className="py-3 px-4 font-semibold text-right">返還ゴールド</th>
                                                <th className="py-3 px-4 font-semibold text-right">実質消費ゴールド</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-850">
                                            {(academy?.monthly || []).slice().reverse().map(m => {
                                                const packs = m.packs?.chaos_and_rebellion || 0;
                                                const goldSpent = m.goldSpent?.chaos_and_rebellion || 0;
                                                const refundGold = m.refundGold?.chaos_and_rebellion || 0;
                                                const netSpent = goldSpent;
                                                const grossSpent = goldSpent + refundGold;
                                                return (
                                                    <tr key={m.month} className="hover:bg-gray-800/20 text-gray-300">
                                                        <td className="py-3 px-4 text-left font-mono font-semibold">{m.month}</td>
                                                        <td className="py-3 px-4 text-right text-indigo-400 font-bold">{packs.toLocaleString()} パック</td>
                                                        <td className="py-3 px-4 text-right font-medium">{grossSpent.toLocaleString()} G</td>
                                                        <td className="py-3 px-4 text-right text-yellow-500 font-semibold">{refundGold.toLocaleString()} G</td>
                                                        <td className="py-3 px-4 text-right text-emerald-400 font-bold">{netSpent.toLocaleString()} G</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                        </div>
                    </div>

                    {/* 右: 課金モデル割合 & レベル分布 */}
                    <div className="space-y-6">
                        {/* 売上・課金集計 */}
                        <div className="p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-2 mb-4 text-gray-300">
                                <Coins size={16} className="text-yellow-400" />
                                <h2 className="text-sm font-semibold tracking-wide">売上・課金集計</h2>
                            </div>
                            
                            <div className="space-y-3 text-xs text-gray-400">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="font-semibold text-gray-300">総売上金額</span>
                                    <span className="text-lg font-bold text-yellow-400">{(summary.totalRevenue || 0).toLocaleString()} 円</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>サブスク売上</span>
                                    <span className="text-gray-200">{(summary.subscriptionRevenue || 0).toLocaleString()} 円 ({(summary.subscriptionCount || 0)} 件)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>追加ゴールド売上</span>
                                    <span className="text-gray-200">{(summary.goldPurchaseRevenue || 0).toLocaleString()} 円 ({(summary.goldPurchaseCount || 0)} 件)</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-800 pt-2">
                                    <span>総チャージゴールド</span>
                                    <span className="text-emerald-400 font-semibold">{(summary.totalGoldCharged || 0).toLocaleString()} G</span>
                                </div>
                            </div>
                        </div>

                        {/* 課金モデル割合 (サブスク) */}
                        <div className="p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-2 mb-4 text-gray-300">
                                <CreditCard size={16} className="text-yellow-400" />
                                <h2 className="text-sm font-semibold tracking-wide">サブスクリプション加入状況</h2>
                            </div>
                            
                            <div className="space-y-4">
                                {Object.entries(subscriptionDistribution || {}).map(([tier, count]) => {
                                    const total = Object.values(subscriptionDistribution || {}).reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                    
                                    let color = 'from-gray-500 to-gray-600';
                                    let label = '無料メンバー (Free)';
                                    if (tier === 'basic') {
                                        color = 'from-blue-500 to-indigo-500';
                                        label = 'ベーシック (Basic)';
                                    } else if (tier === 'premium') {
                                        color = 'from-yellow-500 to-amber-500';
                                        label = 'プレミアム (Premium)';
                                    }

                                    return (
                                        <div key={tier} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-gray-400 font-semibold">{label}</span>
                                                <span className="text-gray-300">{count} 名 ({percentage}%)</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#070d19] rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* レベル分布 */}
                        <div className="p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-2 mb-4 text-gray-300">
                                <Trophy size={16} className="text-blue-400" />
                                <h2 className="text-sm font-semibold tracking-wide">プレイヤーレベル分布</h2>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(levelDistribution || {}).map(([range, count]) => {
                                    const total = Object.values(levelDistribution || {}).reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                    return (
                                        <div key={range} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-gray-400 font-semibold">Lv {range}</span>
                                                <span className="text-gray-300">{count} 名 ({percentage}%)</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#070d19] rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 詳細分析テーブル（アクティブタブ別） */}
                {childTab === 'academy' ? (
                    <div className="p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-semibold tracking-wide text-gray-300 flex items-center gap-2">
                                <Coins size={16} className="text-indigo-400" />
                                魔術学院 シリーズ別詳細分析（パック購入数・消費ゴールド・返還ゴールド）
                            </h2>
                        </div>

                        <div className="overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                        <th className="py-3 px-4 font-semibold">シリーズ名</th>
                                        <th className="py-3 px-4 font-semibold text-right w-32">総パック購入数</th>
                                        <th className="py-3 px-4 font-semibold text-right w-36">累計消費ゴールド</th>
                                        <th className="py-3 px-4 font-semibold text-right w-36">累計返還ゴールド</th>
                                        <th className="py-3 px-4 font-semibold text-right w-40">1パック当り実質消費</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-850">
                                    {academySeriesList.length > 0 ? (
                                        academySeriesList.map((s) => {
                                            const avgSpent = s.packs > 0 ? Math.round(s.goldSpent / s.packs) : 0;
                                            return (
                                                <tr key={s.series} className="hover:bg-gray-800/20 transition-colors text-gray-300">
                                                    <td className="py-3 px-4 font-semibold text-indigo-300">
                                                        {getSeriesDisplayName(s.series)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-blue-400">
                                                        {s.packs.toLocaleString()} パック
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                                                        {s.goldSpent.toLocaleString()} G
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-yellow-500">
                                                        {s.refundGold.toLocaleString()} G
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-gray-400">
                                                        {avgSpent.toLocaleString()} G / パック
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-500">
                                                選択された期間内に購入データがありません。
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-semibold tracking-wide text-gray-300 flex items-center gap-2">
                                <Trophy size={16} className="text-yellow-400" />
                                全クエスト別詳細分析（実行数・クリア数・クリア率）
                            </h2>
                            <button
                                onClick={exportQuestStatsCsv}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#070d19] hover:bg-gray-800 border border-gray-800 text-[10px] font-semibold rounded-lg transition-all text-gray-300 hover:text-white"
                            >
                                <Download size={12} />
                                CSV出力
                            </button>
                        </div>

                        {data.questStats && data.questStats.length > 0 ? (
                            <div className="overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0a1628] z-10">
                                            <th className="py-3 px-4 font-semibold w-16">ID</th>
                                            <th className="py-3 px-4 font-semibold w-24">種別</th>
                                            <th className="py-3 px-4 font-semibold">クエスト名 / シナリオタイトル</th>
                                            <th className="py-3 px-4 font-semibold text-right w-24">実行数</th>
                                            <th className="py-3 px-4 font-semibold text-right w-24">クリア数</th>
                                            <th className="py-3 px-4 font-semibold text-right w-24">放棄数</th>
                                            <th className="py-3 px-4 font-semibold text-right w-28">クリア率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-850">
                                        {data.questStats.map((q) => {
                                            let typeLabel = 'メイン';
                                            let typeColor = 'text-blue-400 bg-blue-950/40 border border-blue-900/30';
                                            if (q.quest_type === 'sub') {
                                                typeLabel = 'サブ';
                                                typeColor = 'text-purple-400 bg-purple-950/40 border border-purple-900/30';
                                            } else if (q.quest_type === 'ugc') {
                                                typeLabel = 'UGC';
                                                typeColor = 'text-pink-400 bg-pink-950/40 border border-pink-900/30';
                                            } else if (q.quest_type === 'event') {
                                                typeLabel = 'イベント';
                                                typeColor = 'text-yellow-400 bg-yellow-950/40 border border-yellow-900/30';
                                            } else if (q.quest_type === 'colosseum') {
                                                typeLabel = '闘技場';
                                                typeColor = 'text-amber-400 bg-amber-950/40 border border-amber-900/30';
                                            }

                                            return (
                                                <tr key={q.id} className="hover:bg-gray-800/20 transition-colors text-gray-300">
                                                    <td className="py-3 px-4 text-gray-500 font-mono">#{q.id}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${typeColor}`}>
                                                            {typeLabel}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold">{q.title}</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-gray-400">{q.startCount} 回</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">{q.completeCount} 回</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-red-400">{q.abandonCount} 回</td>
                                                    <td className="py-3 px-4 text-right font-semibold">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            q.clearRate >= 80 ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30' :
                                                            q.clearRate >= 50 ? 'text-yellow-400 bg-yellow-950/40 border border-yellow-900/30' :
                                                            q.startCount > 0 ? 'text-red-400 bg-red-950/40 border border-red-900/30' : 'text-gray-500 bg-gray-900/40'
                                                        }`}>
                                                            {q.startCount > 0 ? `${q.clearRate}%` : '未挑戦'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-xs">
                                現在、クエスト統計データが存在しません。
                            </div>
                        )}
                    </div>
                )}
            </main>


        </div>
    );
}
