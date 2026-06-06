'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Eye, Send, ArchiveRestore, Clock, CheckCircle, XCircle, FileEdit, Loader2, Play, ShieldCheck, ShieldAlert } from 'lucide-react';

interface MyWork {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  difficulty: number;
  rec_level: number;
  scenario_type: string;
  play_count: number;
  clear_count: number;
  tested_at: string | null;
  published_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

const getAuthHeaders = async () => {
  const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const STATUS_CONFIG = {
  draft: { label: '下書き', color: 'bg-gray-600', icon: FileEdit },
  pending_review: { label: '審査中', color: 'bg-amber-600', icon: Clock },
  published: { label: '公開中', color: 'bg-emerald-600', icon: CheckCircle },
  rejected: { label: '却下', color: 'bg-red-600', icon: XCircle },
} as const;

export default function MyWorksPanel() {
  const [works, setWorks] = useState<MyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ugc/v2/list', { headers });
      const json = await res.json();
      if (res.ok) setWorks(json.data || []);
    } catch (e) {
      console.error('Fetch works error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorks(); }, [fetchWorks]);

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ugc/v2/publish', {
        method: 'POST', headers,
        body: JSON.stringify({ scenario_id: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || '公開申請に失敗しました。');
      } else {
        await fetchWorks();
        window.dispatchEvent(new CustomEvent('ugc-status-updated'));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('このクエストをアーカイブ（非公開化）しますか？')) return;
    setActionLoading(id);
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/ugc/v2/archive', {
        method: 'POST', headers,
        body: JSON.stringify({ scenario_id: id }),
      });
      await fetchWorks();
      window.dispatchEvent(new CustomEvent('ugc-status-updated'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この作品を完全に削除しますか？この操作は取り消せません。')) return;
    setActionLoading(id);
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/ugc/v2/list', {
        method: 'DELETE', headers,
        body: JSON.stringify({ scenario_id: id }),
      });
      await fetchWorks();
      window.dispatchEvent(new CustomEvent('ugc-status-updated'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#a38b6b] animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> 読み込み中...
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12 text-[#8b5a2b]/70 font-serif">
        まだ作品がありません。<br />
        「テンプレート」タブからテンプレートをダウンロードし、「インポート」タブから取り込みましょう。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {works.map(work => {
        const config = STATUS_CONFIG[work.status];
        const StatusIcon = config.icon;
        const isActioning = actionLoading === work.id;

        return (
          <div key={work.id} className="bg-[#fdfbf7] border border-[#c2b280] rounded-lg p-3 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-[#3e2723] text-sm font-serif truncate">{work.title || '（無題）'}</h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${config.color} flex items-center gap-0.5`}>
                  <StatusIcon className="w-3 h-3" /> {config.label}
                </span>
              </div>
              <span className="text-[10px] text-[#a38b6b]">Lv.{work.rec_level}</span>
            </div>

            {/* Description */}
            <p className="text-[11px] text-[#8b6f4e] line-clamp-1 mb-2">{work.short_description || '説明なし'}</p>

            {/* Rejected reason */}
            {work.status === 'rejected' && work.rejected_reason && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 mb-2">
                却下理由: {work.rejected_reason}
              </div>
            )}

            {/* Meta + Actions */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] text-[#a38b6b] flex items-center gap-2 flex-wrap">
                {work.status === 'draft' && (
                  work.tested_at
                    ? <span className="flex items-center gap-0.5 text-emerald-600 font-bold"><ShieldCheck className="w-3 h-3" /> テスト済み</span>
                    : <span className="flex items-center gap-0.5 text-amber-600 font-bold"><ShieldAlert className="w-3 h-3" /> 要テストプレイ</span>
                )}
                {work.play_count > 0 && <span>プレイ {work.play_count}回</span>}
                <span>{new Date(work.updated_at).toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {work.status === 'draft' && (
                  <>
                    <button
                      onClick={() => { window.location.href = `/quest/${work.id}?test_play=true`; }}
                      disabled={isActioning}
                      className="text-[10px] px-2 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-30 flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <Play className="w-3 h-3" /> テスト
                    </button>
                    <button
                      onClick={() => handlePublish(work.id)}
                      disabled={isActioning || !work.tested_at}
                      title={!work.tested_at ? 'テストプレイ完了後に申請可能' : '審査申請'}
                      className="text-[10px] px-2 py-1 rounded bg-[#8b5a2b] text-white hover:bg-[#6b4522] disabled:opacity-30 flex items-center gap-0.5 whitespace-nowrap"
                    >
                      {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} 申請
                    </button>
                    <button
                      onClick={() => handleDelete(work.id)}
                      disabled={isActioning}
                      className="text-[10px] px-2 py-1 rounded bg-red-700 text-white hover:bg-red-800 disabled:opacity-30 flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <Trash2 className="w-3 h-3" /> 削除
                    </button>
                  </>
                )}
                {(work.status === 'published' || work.status === 'pending_review') && (
                  <button
                    onClick={() => handleArchive(work.id)}
                    disabled={isActioning}
                    className="text-[10px] px-2 py-1 rounded bg-[#3e2723] text-[#a38b6b] hover:bg-[#4e342e] disabled:opacity-30 flex items-center gap-0.5 whitespace-nowrap"
                  >
                    <ArchiveRestore className="w-3 h-3" /> 取り下げ
                  </button>
                )}
                {work.status === 'rejected' && (
                  <button
                    onClick={() => handleDelete(work.id)}
                    disabled={isActioning}
                    className="text-[10px] px-2 py-1 rounded bg-red-700 text-white hover:bg-red-800 disabled:opacity-30 flex items-center gap-0.5 whitespace-nowrap"
                  >
                    <Trash2 className="w-3 h-3" /> 削除
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
