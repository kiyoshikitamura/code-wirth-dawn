'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, 
    BookOpen, 
    ChevronRight, 
    ChevronLeft, 
    ArrowLeft, 
    Shield, 
    UserPlus, 
    Users, 
    Award, 
    Home, 
    Map, 
    Scroll, 
    Swords, 
    Coins, 
    CreditCard, 
    Compass,
    X
} from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface PlayGuideSection {
    id: number;
    title: string;
    content: string;
}

interface PlayGuideViewProps {
    introduction: string;
    sections: PlayGuideSection[];
}

// セクションごとのアイコンマッピング
const getSectionIcon = (title: string) => {
    if (title.includes('アカウント') || title.includes('データ')) return <Shield className="w-4 h-4" />;
    if (title.includes('キャラクター') || title.includes('作成')) return <UserPlus className="w-4 h-4" />;
    if (title.includes('残影') || title.includes('Shadow')) return <Users className="w-4 h-4" />;
    if (title.includes('タイトル') || title.includes('称号')) return <Award className="w-4 h-4" />;
    if (title.includes('宿屋') || title.includes('施設') || title.includes('拠点') || title.includes('街')) return <Home className="w-4 h-4" />;
    if (title.includes('マップ') || title.includes('移動') || title.includes('旅行')) return <Map className="w-4 h-4" />;
    if (title.includes('クエスト')) return <Scroll className="w-4 h-4" />;
    if (title.includes('バトル') || title.includes('戦闘') || title.includes('デッキ')) return <Swords className="w-4 h-4" />;
    if (title.includes('サブスク')) return <Coins className="w-4 h-4" />;
    if (title.includes('ゴールド') || title.includes('購入')) return <CreditCard className="w-4 h-4" />;
    return <Compass className="w-4 h-4" />;
};

export default function PlayGuideView({ introduction, sections }: PlayGuideViewProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSectionId, setActiveSectionId] = useState<number | 'intro'>('intro');
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    const modalBodyRef = useRef<HTMLDivElement>(null);

    // セクション切り替え時にモバイルモーダルのスクロールを上部にリセット
    useEffect(() => {
        const resetScroll = () => {
            if (modalBodyRef.current) {
                modalBodyRef.current.scrollTop = 0;
            }
        };

        // 即時リセットの実行に加え、DOM描画完了後にも確実に実行されるように二重でリセット
        resetScroll();
        const timer = setTimeout(resetScroll, 0);
        const raf = requestAnimationFrame(resetScroll);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(raf);
        };
    }, [activeSectionId]);

    // 初期化時にSEを再生
    useEffect(() => {
        soundManager?.init();
        soundManager?.playSE('se_modal_open');
    }, []);

    // モバイル用モーダル表示時のスクロール制御
    useEffect(() => {
        if (isMobileModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileModalOpen]);

    // 検索ワードのエスケープ
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 簡易Markdown to HTML変換関数
    const renderMarkdownToHtml = (markdown: string, query: string = ''): string => {
        let html = markdown.replace(/\r\n/g, '\n');

        // HTMLエスケープ (XSS対策)
        html = html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 行ごとの処理
        const lines = html.split('\n');
        let inTable = false;
        let tableRows: string[] = [];
        const outputLines: string[] = [];

        const parseTable = (rows: string[]): string => {
            if (rows.length === 0) return '';
            let tHtml = '<div class="overflow-x-auto my-6 border border-slate-800/80 rounded-lg"><table class="w-full text-left border-collapse text-sm">';
            
            // ヘッダー
            const headerCols = rows[0].split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            tHtml += '<thead class="bg-slate-900/90 text-amber-400 border-b border-slate-800"><tr>';
            headerCols.forEach(col => {
                tHtml += `<th class="px-4 py-3 font-semibold">${col}</th>`;
            });
            tHtml += '</tr></thead>';

            // ボディ
            tHtml += '<tbody class="divide-y divide-slate-800/50 bg-slate-950/20">';
            for (let i = 2; i < rows.length; i++) {
                const cols = rows[i].split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                if (cols.length === 0) continue;
                tHtml += '<tr class="hover:bg-slate-900/20 transition-colors">';
                cols.forEach(col => {
                    tHtml += `<td class="px-4 py-3 text-slate-300">${col}</td>`;
                });
                tHtml += '</tr>';
            }
            tHtml += '</tbody></table></div>';
            return tHtml;
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // テーブル
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else {
                if (inTable) {
                    outputLines.push(parseTable(tableRows));
                    inTable = false;
                }
            }

            // 水平線
            if (line === '---') {
                outputLines.push('<hr class="border-slate-800/60 my-6" />');
                continue;
            }

            // 見出し (###)
            if (line.startsWith('### ')) {
                const headingText = line.replace('### ', '');
                outputLines.push(`<h3 class="text-lg font-bold text-amber-400 mt-6 mb-3 border-l-2 border-amber-500 pl-2 pb-0.5">${headingText}</h3>`);
                continue;
            }

            // リスト (* または -)
            if (line.startsWith('* ') || line.startsWith('- ')) {
                const listText = line.substring(2);
                outputLines.push(`<li class="list-disc list-inside ml-2 mb-1.5 text-slate-300 leading-relaxed">${listText}</li>`);
                continue;
            }

            // 通常の段落 (空行以外)
            if (line) {
                outputLines.push(`<p class="text-slate-300 leading-relaxed mb-3">${line}</p>`);
            } else {
                outputLines.push('<div class="h-2"></div>');
            }
        }

        if (inTable) {
            outputLines.push(parseTable(tableRows));
        }

        html = outputLines.join('\n');

        // インライン要素のパース (太字・リンク)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-amber-200">$1</strong>');
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-sky-400 hover:text-sky-300 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // 警告ブロック (特定の注意喚起を自動的に警告ボックスとして装飾)
        // 「警告」「注意」「不可逆」「自動削除」「削除制限」「ペナルティ」「代償」を含む行
        html = html.replace(
            /(<(?:p|li)[^>]*>)(.*?(?:警告|注意|不可逆|自動削除|削除制限|ペナルティ|代償).*?)(<\/(?:p|li)>)/g,
            '<div class="warning-box my-4 p-3.5 bg-red-950/20 border border-red-900/50 rounded-lg text-red-200/90 text-sm leading-relaxed flex gap-2.5 items-start"><span class="inline-flex items-center justify-center bg-red-900/40 text-red-400 rounded-full w-5 h-5 text-xs font-bold shrink-0 mt-0.5">!</span><div>$2</div></div>'
        );

        // 検索ワードのハイライト (タグの外側にあるテキストのみを対象)
        if (query) {
            const escapedQuery = escapeRegExp(query);
            const regex = new RegExp(`(?<!<[^>]*)(${escapedQuery})`, 'gi');
            html = html.replace(regex, '<mark class="bg-amber-500/40 text-white rounded px-0.5 font-medium">$1</mark>');
        }

        return html;
    };

    // 検索処理
    const filteredSections = useMemo(() => {
        if (!searchQuery) return sections;
        const lowerQuery = searchQuery.toLowerCase();
        
        return sections.filter(sec => 
            sec.title.toLowerCase().includes(lowerQuery) || 
            sec.content.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, sections]);

    // 検索結果が変化したときに、アクティブセクションが候補外なら最初の候補を選択
    useEffect(() => {
        if (searchQuery) {
            if (filteredSections.length > 0) {
                const hasActive = filteredSections.some(s => s.id === activeSectionId);
                if (!hasActive && activeSectionId !== 'intro') {
                    setTimeout(() => {
                        setActiveSectionId(filteredSections[0].id);
                    }, 0);
                }
            } else if (activeSectionId !== 'intro') {
                setTimeout(() => {
                    setActiveSectionId('intro');
                }, 0);
            }
        }
    }, [filteredSections, searchQuery, activeSectionId]);

    // セクション切り替え処理
    const handleSelectSection = (id: number | 'intro') => {
        setActiveSectionId(id);
        setIsMobileModalOpen(true);
        soundManager?.playSE('se_click');
    };

    // 前のセクションへ
    const handlePrev = () => {
        if (activeSectionId === 'intro') return;
        soundManager?.playSE('se_click');
        
        const currentIndex = filteredSections.findIndex(s => s.id === activeSectionId);
        if (currentIndex === 0) {
            setActiveSectionId('intro');
        } else if (currentIndex > 0) {
            setActiveSectionId(filteredSections[currentIndex - 1].id);
        }
    };

    // 次のセクションへ
    const handleNext = () => {
        soundManager?.playSE('se_click');
        if (activeSectionId === 'intro') {
            if (filteredSections.length > 0) {
                setActiveSectionId(filteredSections[0].id);
            }
            return;
        }

        const currentIndex = filteredSections.findIndex(s => s.id === activeSectionId);
        if (currentIndex !== -1 && currentIndex < filteredSections.length - 1) {
            setActiveSectionId(filteredSections[currentIndex + 1].id);
        }
    };

    // ゲームに戻る (戻るボタン)
    const handleBack = () => {
        soundManager?.playSE('se_cancel');
        // 前の画面へ戻る、またはデフォルトで `/inn` へ
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/inn');
        }
    };

    // クリア検索
    const handleClearSearch = () => {
        setSearchQuery('');
        soundManager?.playSE('se_cancel');
    };

    // 現在表示中のコンテンツ取得
    const activeContent = useMemo(() => {
        if (activeSectionId === 'intro') {
            // タイトルと導入文のパース
            const titleMatch = introduction.match(/^# (.*?)$/m);
            const title = titleMatch ? titleMatch[1] : 'プレイガイド';
            const body = introduction.replace(/^# .*?$/m, '');
            
            return {
                title,
                html: renderMarkdownToHtml(body, searchQuery)
            };
        }

        const sec = sections.find(s => s.id === activeSectionId);
        if (!sec) return { title: '', html: '' };

        return {
            title: sec.title,
            html: renderMarkdownToHtml(sec.content, searchQuery)
        };
    }, [activeSectionId, introduction, sections, searchQuery]);

    // 進行方向のボタン制御
    const hasPrev = activeSectionId !== 'intro';
    const hasNext = useMemo(() => {
        if (filteredSections.length === 0) return false;
        if (activeSectionId === 'intro') return true;
        const currentIndex = filteredSections.findIndex(s => s.id === activeSectionId);
        return currentIndex !== -1 && currentIndex < filteredSections.length - 1;
    }, [activeSectionId, filteredSections]);

    return (
        <div className="bg-noise-pattern bg-[#070b13] min-h-screen text-slate-100 font-sans pb-12">
            {/* 上部ヘッダー */}
            <header className="sticky top-0 z-30 bg-[#070b13]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBack}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all duration-200"
                        title="ゲームに戻る"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-amber-500" />
                        <h1 className="text-xl font-bold tracking-wider text-slate-200">
                            プレイガイド
                        </h1>
                    </div>
                </div>

                {/* 検索バー */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="キーワードで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* メインレイアウト */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
                
                {/* 左サイドバー */}
                <aside className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 lg:max-h-[calc(100vh-140px)] overflow-y-auto lg:sticky lg:top-24">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">目次</h2>
                    <nav className="space-y-1">
                        <button
                            onClick={() => handleSelectSection('intro')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5 ${
                                activeSectionId === 'intro'
                                ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 border-l-2 border-amber-500 font-medium'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>はじめに</span>
                        </button>
 
                        <div className="h-px bg-slate-800/50 my-2" />
 
                        {filteredSections.length > 0 ? (
                            filteredSections.map((sec) => (
                                <button
                                    key={sec.id}
                                    onClick={() => handleSelectSection(sec.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-start gap-2.5 ${
                                        activeSectionId === sec.id
                                        ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 border-l-2 border-amber-500 font-medium'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                                    }`}
                                >
                                    <span className="mt-0.5 shrink-0 text-slate-500">
                                        {getSectionIcon(sec.title)}
                                    </span>
                                    <span className="line-clamp-2">{sec.title}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500 px-3 py-4 text-center">
                                検索結果が見つかりません
                            </div>
                        )}
                    </nav>
                </aside>
 
                {/* 右詳細コンテンツ (デスクトップ向け) */}
                <article className="hidden lg:flex bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-xl p-6 md:p-8 min-h-[calc(100vh-140px)] lg:max-h-[calc(100vh-140px)] lg:sticky lg:top-24 flex-col justify-between">
                    <div className="flex-1 lg:overflow-y-auto lg:pr-4 min-h-0 mb-6">
                        {/* セクション見出し */}
                        <div className="border-b border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-bold tracking-wide text-slate-100">
                                {activeContent.title}
                            </h2>
                        </div>
 
                        {/* 本文 (パースされたHTML) */}
                        <div 
                            className="prose prose-invert max-w-none prose-amber"
                            dangerouslySetInnerHTML={{ __html: activeContent.html }}
                        />
                    </div>
 
                    {/* 下部ナビゲーションボタン */}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-6 gap-4 shrink-0">
                        <button
                            onClick={handlePrev}
                            disabled={!hasPrev}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                                hasPrev 
                                ? 'bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50' 
                                : 'text-slate-600 cursor-not-allowed opacity-40'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>前ページ</span>
                        </button>
 
                        <button
                            onClick={handleBack}
                            className="px-5 py-2 bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 font-bold rounded-lg text-sm hover:from-amber-400 hover:to-amber-500 transition-all border border-amber-600/30 shadow-md shadow-amber-950/20 flex items-center gap-1"
                        >
                            <span>ゲームに戻る</span>
                        </button>
 
                        <button
                            onClick={handleNext}
                            disabled={!hasNext}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                                hasNext 
                                ? 'bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50' 
                                : 'text-slate-600 cursor-not-allowed opacity-40'
                            }`}
                        >
                            <span>次のページ</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </article>
            </main>

            {/* モバイル向け詳細モーダル */}
            {isMobileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
                        onClick={() => {
                            setIsMobileModalOpen(false);
                            soundManager?.playSE('se_cancel');
                        }}
                    />
                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl bg-[#0c1220] border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10 bg-noise-pattern">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
                            <h3 className="text-sm font-bold text-amber-400 tracking-wide line-clamp-1">
                                {activeContent.title}
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsMobileModalOpen(false);
                                    soundManager?.playSE('se_cancel');
                                }}
                                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div ref={modalBodyRef} className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                            <div 
                                className="prose prose-sm prose-invert max-w-none prose-amber text-[13px] leading-relaxed [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-amber-400 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:border-l-2 [&_h3]:border-amber-500 [&_h3]:pl-2 [&_p]:text-[13px] [&_p]:mb-2 [&_li]:text-[13px] [&_li]:mb-1.5 [&_td]:text-xs [&_td]:py-1.5 [&_th]:text-xs [&_th]:py-1.5 [&_.warning-box]:text-xs [&_.warning-box]:p-3 [&_.warning-box]:my-3"
                                dangerouslySetInnerHTML={{ __html: activeContent.html }}
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 bg-slate-950/40 gap-3">
                            <button
                                onClick={handlePrev}
                                disabled={!hasPrev}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
                                    hasPrev 
                                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800' 
                                    : 'text-slate-600 cursor-not-allowed opacity-40 border border-transparent'
                                }`}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>前へ</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsMobileModalOpen(false);
                                    soundManager?.playSE('se_cancel');
                                }}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition-all border border-slate-750"
                            >
                                <span>閉じる</span>
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={!hasNext}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
                                    hasNext 
                                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800' 
                                    : 'text-slate-600 cursor-not-allowed opacity-40 border border-transparent'
                                }`}
                            >
                                <span>次へ</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
