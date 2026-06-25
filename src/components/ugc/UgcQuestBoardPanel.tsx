'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Shield, Swords, Star, User, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UGC_MIN_PLAY_LEVEL } from '@/lib/ugc/ugcConfig';

interface UgcQuest {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  difficulty: number;
  rec_level: number;
  scenario_type: string;
  creator_id: string;
  creator_name: string;
  play_count: number;
  clear_count: number;
  published_at: string;
}

interface UgcQuestBoardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: number;
  onAccept: (quest: UgcQuest) => void;
}

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export default function UgcQuestBoardPanel({ isOpen, onClose, userLevel, onAccept }: UgcQuestBoardPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [quests, setQuests] = useState<UgcQuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<UgcQuest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const limit = 20;

  const canAccept = userLevel >= UGC_MIN_PLAY_LEVEL;

  const fetchQuests = useCallback(async (searchQuery: string, pageNum: number) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        q: searchQuery,
        page: pageNum.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/ugc/v2/search?${params}`, { headers });
      const json = await res.json();
      if (res.ok) {
        setQuests(json.data || []);
        setTotal(json.total || 0);
        setHasMore(json.has_more || false);
      }
    } catch (e) {
      console.error('UGC search error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchQuests(query, 1);
      setPage(1);
    }
  }, [isOpen]);

  const handleSearch = () => {
    setPage(1);
    fetchQuests(query, 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchQuests(query, newPage);
  };

  if (!isOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-4xl h-[85vh] flex flex-col rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] relative overflow-hidden">
        {(loading || isAccepting) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-amber-500/70 font-serif tracking-widest animate-pulse">
              {isAccepting ? '依頼を受注中…' : '読み込み中…'}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-2 border-[#8b5a2b] bg-[#3e2723] text-[#e3d5b8]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-serif font-bold tracking-widest text-amber-400">クエストボード</h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">UGC</span>
            </div>
            <p className="text-[10px] text-[#a38b6b] mt-0.5 font-serif italic">― 冒険者たちが紡いだ物語に挑め ―</p>
          </div>
          <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 p-3 bg-[#2c1e1a] border-b border-[#5c3c2a]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b5a2b]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="クエスト名 or 制作者名で検索..."
              className="w-full pl-9 pr-3 py-2 bg-[#1a120e] border border-[#5c3c2a] rounded text-sm text-[#e3d5b8] placeholder-[#6d4c3d] focus:outline-none focus:border-amber-600"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-[#8b5a2b] text-white text-sm font-bold rounded hover:bg-[#6b4522] transition-colors"
          >
            検索
          </button>
        </div>

        {/* Level warning */}
        {!canAccept && (
          <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            <span>レベル{UGC_MIN_PLAY_LEVEL}以上で受注可能です（現在 Lv.{userLevel}）。閲覧のみ可能です。</span>
          </div>
        )}

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-[url('/textures/aged-paper.png')] bg-repeat">
          {loading ? (
            <div className="h-full flex items-center justify-center text-[#5c4033] font-serif animate-pulse">
              クエストを読み込み中...
            </div>
          ) : quests.length === 0 ? (
            <div className="text-center py-12 text-[#8b5a2b]/70 font-serif">
              {query ? `「${query}」に一致するクエストが見つかりません。` : '現在公開中のUGCクエストはありません。'}
            </div>
          ) : (
            <div className="space-y-2">
              {quests.map(q => {
                const isDangerous = q.rec_level > userLevel + 1;
                const clearRate = q.play_count > 0 ? Math.round((q.clear_count / q.play_count) * 100) : 0;
                return (
                  <div
                    key={q.id}
                    className={`group p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isDangerous
                        ? 'bg-red-900/10 border-red-400/40 hover:border-red-500'
                        : 'bg-[#fdfbf7] border-[#c2b280] hover:border-[#a38b6b]'
                    }`}
                    onClick={() => setSelectedQuest(q)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#3e2723] text-sm font-serif truncate flex-1 min-w-0">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isDangerous && <span className="text-red-500 text-sm font-bold animate-pulse">❗</span>}
                        <span className="text-[10px] w-[38px] text-center py-0.5 rounded font-bold bg-[#a38b6b] text-white">
                          Lv.{q.rec_level}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#a38b6b] opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8b6f4e] leading-relaxed line-clamp-1">{q.short_description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#a38b6b]">
                      <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{q.creator_name}</span>
                      <span className="flex items-center gap-0.5"><Swords className="w-3 h-3" />{q.play_count}回</span>
                      {q.play_count > 0 && (
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />突破率{clearRate}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center items-center gap-2 p-3 bg-[#2c1e1a] border-t border-[#5c3c2a]">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1 text-xs bg-[#3e2723] text-[#a38b6b] rounded disabled:opacity-30 hover:bg-[#4e342e]"
            >
              ← 前
            </button>
            <span className="text-xs text-[#a38b6b]">{page} / {Math.ceil(total / limit)}</span>
            <button
              disabled={!hasMore}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1 text-xs bg-[#3e2723] text-[#a38b6b] rounded disabled:opacity-30 hover:bg-[#4e342e]"
            >
              次 →
            </button>
          </div>
        )}
      </div>

      {/* Quest Detail Modal */}
      {selectedQuest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedQuest(null)}>
          <div className="bg-[#fdfbf7] text-[#2c241b] w-full max-w-md rounded-lg shadow-2xl border-2 border-[#8b5a2b] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#3e2723] p-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-serif font-bold text-amber-400">{selectedQuest.title}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-700 text-amber-200">Lv.{selectedQuest.rec_level}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">UGC</span>
                  <span className="text-[10px] text-[#a38b6b]">{selectedQuest.scenario_type}</span>
                </div>
              </div>
              <button onClick={() => setSelectedQuest(null)} className="text-[#a38b6b] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm leading-relaxed text-[#3e2723] whitespace-pre-wrap font-serif">
                {selectedQuest.short_description}
              </p>
              <div className="bg-[#f5deb3]/60 border border-[#c2b280] rounded p-3">
                <div className="text-[11px] font-bold text-[#5d4037] mb-2 tracking-wider">報酬（固定）</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-bold border border-yellow-300">💰 50G</span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">✨ 30 Exp</span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">🎁 カスタム報酬</span>
                </div>
              </div>
              <div className="bg-[#f5deb3]/40 p-3 rounded text-xs text-[#5d4037] space-y-1">
                <div><span className="font-bold">制作者:</span> {selectedQuest.creator_name}</div>
                <div><span className="font-bold">挑戦者数:</span> {selectedQuest.play_count}人</div>
                {selectedQuest.play_count > 0 && (
                  <div><span className="font-bold">突破率:</span> {Math.round((selectedQuest.clear_count / selectedQuest.play_count) * 100)}%</div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  disabled={!canAccept}
                  className={`text-sm px-6 py-2.5 rounded-lg shadow-lg transition-all transform tracking-wide font-bold flex items-center gap-2 ${
                    canAccept
                      ? 'bg-[#8b5a2b] text-white hover:bg-[#6b4522] active:scale-95'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    setIsAccepting(true);
                    onAccept(selectedQuest);
                  }}
                >
                  <Swords size={16} /> この依頼を受ける
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
