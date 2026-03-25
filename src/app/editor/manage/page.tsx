'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, ArrowLeft, ScrollText, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UGCScenario {
    id: number;
    title: string;
    description: string;
    status: string;
    nodeCount: number;
    created_at: string;
}

export default function ManagePage() {
    const router = useRouter();
    const [scenarios, setScenarios] = useState<UGCScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);

    const getAuthHeaders = async (): Promise<HeadersInit> => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
    };

    const fetchList = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/ugc/list', { headers });
            const data = await res.json();
            if (data.scenarios) {
                setScenarios(data.scenarios);
            }
        } catch (e) {
            console.error('Failed to fetch UGC list', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`「${title}」を削除しますか？\nこの操作は取り消せません。`)) return;
        
        setDeleting(id);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/ugc/list?id=${id}`, {
                method: 'DELETE',
                headers,
            });
            const data = await res.json();
            if (data.success) {
                setScenarios(prev => prev.filter(s => s.id !== id));
            } else {
                alert('削除に失敗しました: ' + data.error);
            }
        } catch (e) {
            alert('通信エラーが発生しました');
        } finally {
            setDeleting(null);
        }
    };

    const handleEdit = (id: number) => {
        router.push(`/editor?id=${id}`);
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'draft': return { text: '下書き', color: 'text-slate-400 bg-slate-800' };
            case 'published': return { text: '公開中', color: 'text-green-400 bg-green-900/30' };
            case 'pending_review': return { text: '審査中', color: 'text-amber-400 bg-amber-900/30' };
            case 'unpublished': return { text: '非公開', color: 'text-red-400 bg-red-900/30' };
            default: return { text: status, color: 'text-slate-400 bg-slate-800' };
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none overflow-hidden text-slate-200">
            <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-slate-950">

                {/* HEADER */}
                <div className="relative z-40 bg-slate-950/90 border-b border-amber-900/30 px-4 pt-[env(safe-area-inset-top,10px)] pb-3 flex items-center gap-3 backdrop-blur-sm">
                    <button
                        onClick={() => router.push('/inn')}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <ScrollText size={14} className="text-amber-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-amber-400 tracking-widest uppercase truncate">作品管理</span>
                    </div>
                    <button
                        onClick={fetchList}
                        className="text-slate-500 hover:text-amber-400 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-sm text-slate-500 animate-pulse">読み込み中...</p>
                        </div>
                    ) : scenarios.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <ScrollText size={32} className="text-slate-700" />
                            <p className="text-sm text-slate-600">作品がありません</p>
                            <button
                                onClick={() => router.push('/editor')}
                                className="text-xs text-amber-500 underline"
                            >
                                新規作成する
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-[10px] text-slate-600 text-right">
                                {scenarios.length}件の作品
                            </div>
                            {scenarios.map(s => {
                                const sl = statusLabel(s.status);
                                return (
                                    <div
                                        key={s.id}
                                        className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 space-y-2"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-white truncate">{s.title || '(無題)'}</h3>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    {s.description || 'クエストの説明なし'}
                                                </p>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sl.color} flex-shrink-0`}>
                                                {sl.text}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[10px] text-slate-600">
                                                <span>ID: {s.id}</span>
                                                <span>ノード: {s.nodeCount}</span>
                                                <span>{new Date(s.created_at).toLocaleDateString('ja-JP')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleDelete(s.id, s.title)}
                                                    disabled={deleting === s.id}
                                                    className="p-1.5 rounded-lg bg-red-950/30 border border-red-800/30 text-red-400 hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                                    title="削除"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </main>

                {/* FOOTER */}
                <div className="border-t border-slate-800 p-3 flex gap-2">
                    <button
                        onClick={() => router.push('/editor')}
                        className="flex-1 py-2.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 rounded-xl text-xs font-bold text-amber-300 transition-colors"
                    >
                        + 新規作成
                    </button>
                    <button
                        onClick={() => router.push('/inn')}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                    >
                        拠点に戻る
                    </button>
                </div>

                <div className="w-32 h-1 bg-slate-800 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2" />
            </div>
        </div>
    );
}
