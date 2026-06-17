'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Coins, Sword, ArrowLeft, CreditCard, Activity, Trophy, Compass, Landmark, Download, RefreshCw } from 'lucide-react';

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
    totalQuests: number;

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
    '1-5': number;
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
    totalBattles: number;
    victories: number;
    defeats: number;
    fleds: number;
    winRate: number;
    dau: number;
    mau: number;
    revenue: number;
    dpu: number;
    mpu: number;
}

interface KPIData {
    summary: KPISummary;
    levelDistribution: LevelDistribution;
    subscriptionDistribution: SubscriptionDistribution;
    questRanking: QuestRanking[];
    questStats: QuestStats[];
    dailyKPI: DailyKPI[];
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'battles' | 'dau' | 'payments'>('users');
    const [daysRange, setDaysRange] = useState<number>(30);
    

    
    // CSVエクスポート処理 (日別KPI)
    const exportDailyKPICsv = () => {
        if (!data || !data.dailyKPI) return;
        
        // ヘッダー定義
        const headers = ['日付', '新規ユーザー登録数', '総戦闘数', '勝利数', '敗北数', '逃亡数', '勝率(%)', 'DAU (日間アクティブ)', 'MAU (月間アクティブ)', '売上金額(円)', 'DPU (日間課金者数)', 'MPU (月間課金者数)'];
        
        // データ行構築
        const rows = data.dailyKPI.map(d => [
            d.date,
            d.newUsers,
            d.totalBattles,
            d.victories,
            d.defeats,
            d.fleds,
            `${d.winRate}%`,
            d.dau,
            d.mau,
            d.revenue,
            d.dpu,
            d.mpu
        ]);
        
        // CSV文字列の生成
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // UTF-8 BOM を追加して Excel での文字化けを防止
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `game_daily_kpi_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSVエクスポート処理 (全クエスト統計)
    const exportQuestStatsCsv = () => {
        if (!data || !data.questStats) return;
        
        // ヘッダー定義
        const headers = ['クエストID', 'クエスト名', '種別', '総実行数', 'クリア数', '放棄数', 'クリア率(%)'];
        
        // データ行構築
        const rows = data.questStats.map(q => {
            let typeLabel = 'メイン';
            if (q.quest_type === 'sub') typeLabel = 'サブ';
            else if (q.quest_type === 'ugc') typeLabel = 'UGC';
            else if (q.quest_type === 'event') typeLabel = 'イベント';

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
        
        // CSV文字列の生成
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // UTF-8 BOM を追加して Excel での文字化けを防止
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
        const adminKey = localStorage.getItem('adminKey');
        if (!adminKey) {
            router.push('/admin/login');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/kpi?days=${daysRange}`, {
                headers: {
                    'x-admin-key': adminKey
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('adminKey');
                router.push('/admin/login');
                return;
            }

            if (!res.ok) {
                throw new Error('データの取得に失敗しました');
            }

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
        localStorage.removeItem('adminKey');
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

    const { summary, levelDistribution, subscriptionDistribution, questRanking, dailyKPI } = data;

    // 自前SVGグラフ用の座標計算
    const svgWidth = 800;
    const svgHeight = 250;
    const padding = 40;
    const divisor = dailyKPI.length > 1 ? dailyKPI.length - 1 : 1;
    const colWidth = (svgWidth - padding * 2) / Math.max(1, dailyKPI.length);

    // A. 折れ線グラフ用: 新規ユーザー数
    const maxUsers = Math.max(...dailyKPI.map(d => d.newUsers), 5);
    const userPoints = dailyKPI.map((d, i) => {
        const x = padding + (i / divisor) * (svgWidth - padding * 2);
        const y = svgHeight - padding - (d.newUsers / maxUsers) * (svgHeight - padding * 2);
        return { x, y };
    });
    const userLinePath = userPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const userAreaPath = userPoints.length > 0 
        ? `${userLinePath} L ${userPoints[userPoints.length - 1].x} ${svgHeight - padding} L ${userPoints[0].x} ${svgHeight - padding} Z`
        : '';

    // B. 棒グラフ用: 総バトル数
    const maxBattles = Math.max(...dailyKPI.map(d => d.totalBattles), 5);

    // C. 折れ線グラフ用: アクティブユーザー数 (DAU / MAU)
    const maxActive = Math.max(...dailyKPI.map(d => Math.max(d.dau, d.mau)), 5);
    const dauPoints = dailyKPI.map((d, i) => {
        const x = padding + (i / divisor) * (svgWidth - padding * 2);
        const y = svgHeight - padding - (d.dau / maxActive) * (svgHeight - padding * 2);
        return { x, y };
    });
    const dauLinePath = dauPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const dauAreaPath = dauPoints.length > 0 
        ? `${dauLinePath} L ${dauPoints[dauPoints.length - 1].x} ${svgHeight - padding} L ${dauPoints[0].x} ${svgHeight - padding} Z`
        : '';

    const mauPoints = dailyKPI.map((d, i) => {
        const x = padding + (i / divisor) * (svgWidth - padding * 2);
        const y = svgHeight - padding - (d.mau / maxActive) * (svgHeight - padding * 2);
        return { x, y };
    });
    const mauLinePath = mauPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const mauAreaPath = mauPoints.length > 0 
        ? `${mauLinePath} L ${mauPoints[mauPoints.length - 1].x} ${svgHeight - padding} L ${mauPoints[0].x} ${svgHeight - padding} Z`
        : '';

    // D. 棒グラフ用: 課金売上金額推移 (Stripe)
    const maxRevenue = Math.max(...dailyKPI.map(d => d.revenue), 1000);

    return (
        <div className="min-h-screen bg-[#070d19] text-gray-100 font-sans p-6 relative">
            
            {/* ヘッダー */}
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
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/40 text-blue-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        データの更新
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-xs font-semibold rounded-lg transition-all"
                    >
                        ログアウト
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                {/* サマリーカードグリッド */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                    {/* 累計登録ユーザー */}
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">登録ユーザー</span>
                            <div className="p-1.5 bg-blue-950/40 rounded-lg text-blue-400 border border-blue-900/30">
                                <Users size={16} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-blue-400 tracking-tight">{summary.totalUsers} 名</div>
                        <p className="text-[10px] text-gray-500 mt-2">平均レベル: {summary.avgLevel}</p>
                    </div>

                    {/* 月間アクティブ (MAU) */}
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">月間アクティブ (MAU)</span>
                            <div className="p-1.5 bg-emerald-950/40 rounded-lg text-emerald-400 border border-emerald-900/30">
                                <Activity size={16} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-emerald-400 tracking-tight">{summary.mau} 名</div>
                        <p className="text-[10px] text-gray-500 mt-2">
                            アクティビティ率: {((summary.mau / Math.max(1, summary.totalUsers)) * 100).toFixed(1)}%
                        </p>
                    </div>

                    {/* 月間課金者 (MPU) */}
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-yellow-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">月間課金者 (MPU)</span>
                            <div className="p-1.5 bg-yellow-950/40 rounded-lg text-yellow-400 border border-yellow-900/30">
                                <CreditCard size={16} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-yellow-400 tracking-tight">{summary.mpu} 名</div>
                        <p className="text-[10px] text-gray-500 mt-2">
                            課金転換率: {((summary.mpu / Math.max(1, summary.totalUsers)) * 100).toFixed(1)}%
                        </p>
                    </div>

                    {/* 総クエスト回数 */}
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">総クエスト回数</span>
                            <div className="p-1.5 bg-indigo-950/40 rounded-lg text-indigo-400 border border-indigo-900/30">
                                <Compass size={16} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-indigo-400 tracking-tight">{summary.totalQuests || 0} 回</div>
                        <p className="text-[10px] text-gray-500 mt-2">開始された全クエスト数</p>
                    </div>

                    {/* 戦闘回数 */}
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">総戦闘回数</span>
                            <div className="p-1.5 bg-purple-950/40 rounded-lg text-purple-400 border border-purple-900/30">
                                <Sword size={16} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-purple-400 tracking-tight">{summary.totalBattles} 回</div>
                        <p className="text-[10px] text-gray-500 mt-2">勝率: {summary.winRate}%</p>
                    </div>

                    {/* ゴールド流通 */}
                    <div className="p-5 bg-[#0a1628] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">ゴールド流通</span>
                            <div className="p-1.5 bg-red-950/40 rounded-lg text-red-400 border border-red-900/30">
                                <Coins size={16} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-red-400 tracking-tight">{summary.totalGold.toLocaleString()} G</div>
                        <p className="text-[10px] text-gray-500 mt-2">平均: {summary.avgGold.toLocaleString()} G</p>
                    </div>
                </div>

                {/* メインチャート領域 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左・中: チャートカード */}
                    <div className="lg:col-span-2 p-6 bg-[#0a1628] border border-gray-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
                            <h2 className="text-sm font-semibold tracking-wide text-gray-300">アクティビティ・決済推移 (直近 {daysRange} 日間)</h2>
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={daysRange}
                                    onChange={(e) => setDaysRange(Number(e.target.value))}
                                    className="bg-[#070d19] border border-gray-800 text-gray-300 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all hover:border-gray-700"
                                >
                                    <option value={30}>直近 30 日間</option>
                                    <option value={90}>直近 90 日間</option>
                                    <option value={180}>直近 180 日間</option>
                                    <option value={365}>直近 365 日間</option>
                                </select>
                                <div className="flex flex-wrap bg-[#070d19] border border-gray-800 rounded-lg p-0.5 text-[10px]">
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        ユーザー登録
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('battles')}
                                        className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeTab === 'battles' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        バトル統計
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('dau')}
                                        className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeTab === 'dau' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        アクティブUU
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('payments')}
                                        className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeTab === 'payments' ? 'bg-yellow-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        課金決済
                                    </button>
                                </div>
                                <button
                                    onClick={exportDailyKPICsv}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#070d19] hover:bg-gray-800 border border-gray-800 text-[10px] font-semibold rounded-lg transition-all text-gray-300 hover:text-white"
                                >
                                    <Download size={12} />
                                    CSV出力
                                </button>
                            </div>
                        </div>

                        {/* 自前SVGグラフ */}
                        <div className="relative">
                            {/* 折れ線グラフ: ユーザー登録 & アクティブUU */}
                            {(activeTab === 'users' || activeTab === 'dau') && (
                                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={activeTab === 'users' ? '#3b82f6' : '#10b981'} stopOpacity="0.3" />
                                            <stop offset="100%" stopColor={activeTab === 'users' ? '#3b82f6' : '#10b981'} stopOpacity="0" />
                                        </linearGradient>
                                        <linearGradient id="mauGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* グリッド横線 */}
                                    {[0, 1, 2, 3, 4].map((n) => {
                                        const y = padding + (n / 4) * (svgHeight - padding * 2);
                                        const currentMax = activeTab === 'users' ? maxUsers : maxActive;
                                        const label = Math.round(currentMax - (n / 4) * currentMax);
                                        return (
                                            <g key={n} opacity="0.15">
                                                <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#fff" strokeDasharray="3" />
                                                <text x={padding - 10} y={y + 4} fill="#fff" fontSize="10" textAnchor="end">{label}</text>
                                            </g>
                                        );
                                    })}

                                    {/* 塗りつぶし領域 */}
                                    {activeTab === 'users' && userAreaPath && <path d={userAreaPath} fill="url(#chartGrad)" />}
                                    {activeTab === 'dau' && mauAreaPath && <path d={mauAreaPath} fill="url(#mauGrad)" />}
                                    {activeTab === 'dau' && dauAreaPath && <path d={dauAreaPath} fill="url(#chartGrad)" />}
                                    
                                    {/* 折れ線本体 */}
                                    {activeTab === 'users' && userLinePath && <path d={userLinePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    {activeTab === 'dau' && mauLinePath && <path d={mauLinePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />}
                                    {activeTab === 'dau' && dauLinePath && <path d={dauLinePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                                    {/* ガイドホバー */}
                                    {dailyKPI.map((d, i) => {
                                        const x = padding + (i / divisor) * (svgWidth - padding * 2);
                                        return (
                                            <g key={i}>
                                                <rect
                                                    x={x - colWidth / 2}
                                                    y={padding}
                                                    width={colWidth}
                                                    height={svgHeight - padding * 2}
                                                    fill="transparent"
                                                    className="cursor-pointer"
                                                    onMouseEnter={() => setHoveredIdx(i)}
                                                    onMouseLeave={() => setHoveredIdx(null)}
                                                />
                                                {hoveredIdx === i && (
                                                    <g>
                                                        <line x1={x} y1={padding} x2={x} y2={svgHeight - padding} stroke="#fff" strokeWidth="1" strokeDasharray="2" opacity="0.4" />
                                                        {activeTab === 'users' && userPoints[i] && (
                                                            <circle cx={userPoints[i].x} cy={userPoints[i].y} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                                                        )}
                                                        {activeTab === 'dau' && dauPoints[i] && mauPoints[i] && (
                                                            <>
                                                                <circle cx={mauPoints[i].x} cy={mauPoints[i].y} r="5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                                                                <circle cx={dauPoints[i].x} cy={dauPoints[i].y} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                                                            </>
                                                        )}
                                                    </g>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>
                            )}

                            {/* 棒グラフ: バトル統計 & 課金決済 */}
                            {(activeTab === 'battles' || activeTab === 'payments') && (
                                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
                                    {/* グリッド横線 */}
                                    {[0, 1, 2, 3, 4].map((n) => {
                                        const y = padding + (n / 4) * (svgHeight - padding * 2);
                                        const currentMax = activeTab === 'battles' ? maxBattles : maxRevenue;
                                        const label = activeTab === 'battles' ? Math.round(currentMax - (n / 4) * currentMax) : `${Math.round(currentMax - (n / 4) * currentMax).toLocaleString()} 円`;
                                        return (
                                            <g key={n} opacity="0.15">
                                                <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#fff" strokeDasharray="3" />
                                                <text x={padding - 10} y={y + 4} fill="#fff" fontSize="10" textAnchor="end">{label}</text>
                                            </g>
                                        );
                                    })}

                                    {/* 棒の描画 */}
                                    {dailyKPI.map((d, i) => {
                                        const x = padding + (i / divisor) * (svgWidth - padding * 2);
                                        const barWidth = Math.max(1, colWidth - Math.max(1, colWidth * 0.2));
                                        const yStart = svgHeight - padding;

                                        if (activeTab === 'battles') {
                                            const heightTotal = (d.totalBattles / maxBattles) * (svgHeight - padding * 2);
                                            const heightVictory = d.totalBattles > 0 ? (d.victories / d.totalBattles) * heightTotal : 0;
                                            const heightDefeat = d.totalBattles > 0 ? (d.defeats / d.totalBattles) * heightTotal : 0;
                                            const heightFled = d.totalBattles > 0 ? (d.fleds / d.totalBattles) * heightTotal : 0;

                                            const yVictory = yStart - heightVictory;
                                            const yDefeat = yVictory - heightDefeat;
                                            const yFled = yDefeat - heightFled;

                                            return (
                                                <g key={i}>
                                                    {heightVictory > 0 && <rect x={x - barWidth / 2} y={yVictory} width={barWidth} height={heightVictory} fill="#10b981" opacity="0.85" rx="0.5" />}
                                                    {heightDefeat > 0 && <rect x={x - barWidth / 2} y={yDefeat} width={barWidth} height={heightDefeat} fill="#ef4444" opacity="0.85" rx="0.5" />}
                                                    {heightFled > 0 && <rect x={x - barWidth / 2} y={yFled} width={barWidth} height={heightFled} fill="#a855f7" opacity="0.85" rx="0.5" />}
                                                    <rect x={x - colWidth / 2} y={padding} width={colWidth} height={svgHeight - padding * 2} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} />
                                                </g>
                                            );
                                        } else {
                                            // 課金売上金額の単一バー（黄）
                                            const heightRevenue = (d.revenue / maxRevenue) * (svgHeight - padding * 2);
                                            const yRevenue = yStart - heightRevenue;
                                            return (
                                                <g key={i}>
                                                    {heightRevenue > 0 && <rect x={x - barWidth / 2} y={yRevenue} width={barWidth} height={heightRevenue} fill="#f59e0b" opacity="0.85" rx="0.5" />}
                                                    <rect x={x - colWidth / 2} y={padding} width={colWidth} height={svgHeight - padding * 2} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} />
                                                </g>
                                            );
                                        }
                                    })}
                                </svg>
                            )}

                            {/* ツールチップ */}
                            {hoveredIdx !== null && (
                                <div 
                                    className="absolute bg-[#0f1d3a] border border-gray-700 p-3 rounded-lg shadow-xl text-xs space-y-1 pointer-events-none transition-all z-20"
                                    style={{
                                        left: `${Math.min((hoveredIdx / divisor) * 100, 80)}%`,
                                        top: '10%'
                                    }}
                                >
                                    <div className="font-bold border-b border-gray-800 pb-1 text-gray-300">{dailyKPI[hoveredIdx].date}</div>
                                    {activeTab === 'users' && <div className="text-blue-400">新規ユーザー: {dailyKPI[hoveredIdx].newUsers} 名</div>}
                                    {activeTab === 'dau' && (
                                        <>
                                            <div className="text-emerald-400 font-bold">DAU (日間): {dailyKPI[hoveredIdx].dau} UU</div>
                                            <div className="text-indigo-400">MAU (月間): {dailyKPI[hoveredIdx].mau} UU</div>
                                        </>
                                    )}
                                    {activeTab === 'payments' && (
                                        <>
                                            <div className="text-yellow-400 font-bold">売上金額: {dailyKPI[hoveredIdx].revenue.toLocaleString()} 円</div>
                                            <div className="text-amber-500">課金者数 (DPU): {dailyKPI[hoveredIdx].dpu} UU</div>
                                            <div className="text-purple-400">課金者数 (MPU): {dailyKPI[hoveredIdx].mpu} UU</div>
                                        </>
                                    )}
                                    {activeTab === 'battles' && (
                                        <>
                                            <div className="text-gray-400">総戦闘: {dailyKPI[hoveredIdx].totalBattles} 回</div>
                                            <div className="text-emerald-400">勝利: {dailyKPI[hoveredIdx].victories}</div>
                                            <div className="text-red-400">敗北: {dailyKPI[hoveredIdx].defeats}</div>
                                            <div className="text-purple-400">逃亡: {dailyKPI[hoveredIdx].fleds}</div>
                                            <div className="text-blue-400 font-bold border-t border-gray-800/55 pt-1 mt-1">勝率: {dailyKPI[hoveredIdx].winRate}%</div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 凡例 */}
                        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                            {activeTab === 'users' && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded" />
                                    <span className="text-gray-400">新規ユーザー登録数</span>
                                </div>
                            )}
                            {activeTab === 'dau' && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                                        <span className="text-gray-400">日間アクティブ (DAU)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-0.5 border-t-2 border-dashed border-[#6366f1]" />
                                        <span className="text-gray-400">月間アクティブ (MAU)</span>
                                    </div>
                                </>
                            )}
                            {activeTab === 'payments' && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                                    <span className="text-gray-400">売上総額 (円)</span>
                                </div>
                            )}
                            {activeTab === 'battles' && (
                                <>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded" /><span className="text-gray-400">勝利</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded" /><span className="text-gray-400">敗北</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded" /><span className="text-gray-400">逃亡</span></div>
                                </>
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
                                {Object.entries(subscriptionDistribution).map(([tier, count]) => {
                                    const total = Object.values(subscriptionDistribution).reduce((a, b) => a + b, 0);
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
                                {Object.entries(levelDistribution).map(([range, count]) => {
                                    const total = Object.values(levelDistribution).reduce((a, b) => a + b, 0);
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

                {/* 全クエスト詳細分析テーブル */}
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
            </main>


        </div>
    );
}
