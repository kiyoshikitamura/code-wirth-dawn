'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, ClipboardPaste, X } from 'lucide-react';

interface ImportResult {
  success: boolean;
  scenario_id?: string;
  errors?: Array<{ field?: string; message: string; code: string }>;
  warnings?: Array<{ field?: string; message: string }>;
  balance?: unknown;
}

const getAuthHeaders = async () => {
  const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * テキスト内容からフォーマット（json / md）を自動判定する。
 * - `---` で始まる → MD（YAML frontmatter）
 * - `{` で始まる → JSON
 * - それ以外 → MD（キー:値形式もMDとして扱う）
 */
function detectFormat(text: string): 'json' | 'md' {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'md';
}

type InputMode = 'file' | 'paste';

export default function TemplateImportPanel({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);

  const detectedFormat = content.trim() ? detectFormat(content) : null;

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setContent(text);
    setResult(null);
  }, []);

  const handleClear = () => {
    setContent('');
    setFileName('');
    setResult(null);
  };

  const handleImport = async (dryRun: boolean) => {
    if (!content.trim()) return;
    setLoading(true);
    setIsDryRun(dryRun);
    setResult(null);

    try {
      const headers = await getAuthHeaders();
      const endpoint = dryRun ? '/api/ugc/v2/validate' : '/api/ugc/v2/import';

      // ファイル選択時は拡張子優先、テキスト貼り付け時は内容から自動判定
      const format = inputMode === 'file' && fileName
        ? (fileName.endsWith('.md') ? 'md' : 'json')
        : detectFormat(content);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, format }),
      });
      const json = await res.json();
      setResult(json);

      if (!dryRun && json.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (e) {
      setResult({ success: false, errors: [{ message: '通信エラーが発生しました。', code: 'NETWORK_ERROR' }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Mode Tabs */}
      <div className="flex rounded-lg overflow-hidden border border-[#5c3c2a]">
        <button
          onClick={() => { setInputMode('paste'); handleClear(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
            inputMode === 'paste'
              ? 'bg-[#8b5a2b] text-amber-100'
              : 'bg-[#1a120e] text-[#6d4c3d] hover:text-[#a38b6b]'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" /> テキスト貼り付け
        </button>
        <button
          onClick={() => { setInputMode('file'); handleClear(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
            inputMode === 'file'
              ? 'bg-[#8b5a2b] text-amber-100'
              : 'bg-[#1a120e] text-[#6d4c3d] hover:text-[#a38b6b]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> ファイル選択
        </button>
      </div>

      {/* Paste Mode */}
      {inputMode === 'paste' && (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setResult(null); }}
              placeholder={"AIが生成したJSON/MDテンプレートをここに貼り付けてください。\n\n例:\n---\nversion: \"1.0\"\ntype: enemy\n---\n\n## エネミー定義\n\n名前: フォレストウルフ\nレベル: 8\n..."}
              className="w-full h-48 bg-[#1a120e] border border-[#5c3c2a] rounded-lg px-3 py-2.5 text-xs text-[#e3d5b8] font-mono placeholder:text-[#4a3528] focus:border-amber-600 focus:outline-none resize-y"
              spellCheck={false}
            />
            {content && (
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 rounded bg-[#3e2723]/80 text-[#6d4c3d] hover:text-amber-400 transition-colors"
                title="クリア"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Format indicator */}
          {detectedFormat && (
            <div className="flex items-center gap-2 text-[10px] text-[#6d4c3d]">
              <span className="px-1.5 py-0.5 rounded bg-[#2c1e1a] text-amber-400 font-bold">
                {detectedFormat.toUpperCase()}
              </span>
              <span>形式として自動検出されました</span>
            </div>
          )}
        </div>
      )}

      {/* File Mode */}
      {inputMode === 'file' && (
        <>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#5c3c2a] rounded-lg cursor-pointer hover:border-amber-600 transition-colors bg-[#1a120e]/50">
            <Upload className="w-8 h-8 text-[#8b5a2b] mb-2" />
            <span className="text-sm text-[#a38b6b] font-bold">テンプレートファイルを選択</span>
            <span className="text-[10px] text-[#6d4c3d] mt-1">JSON / MD 対応</span>
            <input type="file" accept=".json,.md,.txt" onChange={handleFileSelect} className="hidden" />
          </label>

          {fileName && (
            <div className="flex items-center gap-2 text-sm text-[#e3d5b8] bg-[#2c1e1a] px-3 py-2 rounded">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="truncate flex-1">{fileName}</span>
              <button onClick={handleClear} className="text-[#6d4c3d] hover:text-amber-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Content Preview (collapsible) — only for file mode since paste mode already shows content */}
      {inputMode === 'file' && content && (
        <details className="bg-[#1a120e] rounded border border-[#5c3c2a]">
          <summary className="px-3 py-2 text-xs text-[#a38b6b] cursor-pointer hover:text-amber-400">
            テンプレート内容をプレビュー ({content.length.toLocaleString()} 文字)
          </summary>
          <pre className="px-3 pb-3 text-[10px] text-[#8b6f4e] max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
            {content.slice(0, 3000)}
            {content.length > 3000 && '\n...（省略）'}
          </pre>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleImport(true)}
          disabled={!content.trim() || loading}
          className="flex-1 py-2.5 bg-[#3e2723] text-[#e3d5b8] font-bold rounded hover:bg-[#4e342e] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-30"
        >
          {loading && isDryRun ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          バリデーションのみ
        </button>
        <button
          onClick={() => handleImport(false)}
          disabled={!content.trim() || loading}
          className="flex-1 py-2.5 bg-[#8b5a2b] text-white font-bold rounded hover:bg-[#6b4522] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-30"
        >
          {loading && !isDryRun ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          インポート
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded p-4 border ${result.success ? 'bg-emerald-900/20 border-emerald-600/50' : 'bg-red-900/20 border-red-600/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success
              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
              : <AlertCircle className="w-5 h-5 text-red-400" />
            }
            <span className="text-sm font-bold text-[#e3d5b8]">
              {result.success
                ? (isDryRun ? 'バリデーション成功' : 'インポート成功')
                : 'エラーが見つかりました'}
            </span>
          </div>

          {result.scenario_id && (
            <div className="text-xs text-emerald-400 mb-2">シナリオID: {result.scenario_id}</div>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="space-y-1 mt-2">
              {result.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <div>
                    {err.field && <span className="text-red-400/70 font-mono">[{err.field}] </span>}
                    {err.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="space-y-1 mt-2">
              {result.warnings.map((warn, i) => (
                <div key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <div>
                    {warn.field && <span className="text-amber-400/70 font-mono">[{warn.field}] </span>}
                    {warn.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
