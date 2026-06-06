import React, { useState, useRef } from 'react';
import { Upload, Copy, Check, FileCode, Music, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/authToken';

export default function AssetUploaderPanel() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [assetType, setAssetType] = useState<'image' | 'audio' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setUploadedUrl(null);
        setPreviewUrl(null);
        setAssetType(null);
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            const sizeLimit = selectedFile.type.startsWith('audio/') ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB / 2MB
            if (selectedFile.size > sizeLimit) {
                setError(`ファイルサイズが大きすぎます。${selectedFile.type.startsWith('audio/') ? '音声は10MB' : '画像は2MB'}以内のファイルを指定してください。`);
                setFile(null);
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const authHeaders = await getAuthHeaders();
            
            const res = await fetch('/api/ugc/upload', {
                method: 'POST',
                headers: {
                    ...authHeaders
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setUploadedUrl(data.ugcUrl || data.url);
                setPreviewUrl(data.url);
                setAssetType(data.type);
                setFile(null);
                window.dispatchEvent(new CustomEvent('ugc-status-updated'));
            } else {
                setError(data.error || 'アップロード中にエラーが発生しました');
            }
        } catch (err: any) {
            setError(err.message || '通信エラーが発生しました');
        } finally {
            setUploading(false);
        }
    };

    const handleCopy = () => {
        if (!uploadedUrl) return;
        navigator.clipboard.writeText(uploadedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!uploadedUrl) return;
        if (!confirm("本当にこのアセットを削除しますか？\n※テンプレートで使用している場合は表示できなくなります。")) return;

        setDeleting(true);
        setError(null);

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/ugc/upload', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ url: uploadedUrl })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setUploadedUrl(null);
                setPreviewUrl(null);
                setAssetType(null);
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                window.dispatchEvent(new CustomEvent('ugc-status-updated'));
            } else {
                setError(data.error || '削除中にエラーが発生しました');
            }
        } catch (err: any) {
            setError(err.message || '通信エラーが発生しました');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="bg-[#120a07] border border-[#5c3c2a] rounded-xl p-4 md:p-5 space-y-4 shadow-xl text-left">
            <div>
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>アセットアップローダー</span>
                </h3>
                <p className="text-[10px] text-[#8b6d5c] mt-1 leading-relaxed">
                    オリジナルエネミー/スキル/アイテム用の画像（PNG, JPG, WEBP, GIF等）や、オリジナルのBGM（MP3, WAV, OGG等）をアップロードして、UGCクエストテンプレート内に仕込むことができます。
                </p>
            </div>

            <div className="space-y-3">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#5c3c2a] hover:border-amber-500/50 bg-[#1e1510] hover:bg-[#251b15] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,audio/*"
                        className="hidden"
                    />
                    {file ? (
                        <div className="flex flex-col items-center gap-2">
                            {file.type.startsWith('audio/') ? (
                                <Music className="w-10 h-10 text-cyan-400" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-amber-400" />
                            )}
                            <span className="text-xs font-bold text-slate-200 text-center max-w-[250px] truncate">{file.name}</span>
                            <span className="text-[9px] text-[#8b6d5c]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-[#8b6d5c] animate-pulse" />
                            <span className="text-xs font-bold text-amber-300/80">クリックしてファイルを選択</span>
                            <span className="text-[9px] text-[#8b6d5c]">画像: 最大2MB / 音声: 最大10MB</span>
                        </div>
                    )}
                </div>

                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg text-xs shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>アップロード中...</span>
                            </>
                        ) : (
                            <span>アップロードを実行する</span>
                        )}
                    </button>
                )}

                {error && (
                    <div className="bg-red-950/30 border border-red-500/40 rounded-lg p-3 text-[10px] text-red-300 leading-normal font-sans">
                        ⚠️ {error}
                    </div>
                )}

                {uploadedUrl && (
                    <div className="border border-emerald-500/30 bg-[#091a10]/60 rounded-lg p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>アップロード完了</span>
                        </div>

                        {/* プレビュー表示 */}
                        {assetType === 'image' && previewUrl && (
                            <div className="w-full max-h-36 rounded border border-[#5c3c2a] overflow-hidden flex items-center justify-center bg-black/40">
                                <img src={previewUrl} alt="Preview" className="object-contain max-h-36 max-w-full" />
                            </div>
                        )}
                        {assetType === 'audio' && previewUrl && (
                            <div className="w-full p-2 bg-black/30 rounded border border-[#5c3c2a] flex flex-col items-center justify-center gap-2">
                                <Music className="w-6 h-6 text-cyan-400 animate-bounce" />
                                <audio src={previewUrl} controls className="w-full h-8" />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="flex-1 bg-black/50 border border-[#3e2723] rounded px-2.5 py-2 font-mono text-[9px] text-slate-300 select-all overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center">
                                {uploadedUrl}
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`px-3 flex items-center justify-center rounded border transition-colors shrink-0 ${
                                    copied 
                                        ? 'border-emerald-600 bg-emerald-950/40 text-emerald-400' 
                                        : 'border-[#5c3c2a] hover:border-amber-500/40 bg-[#1e1510] hover:bg-[#251b15] text-amber-300'
                                }`}
                                title="URLをコピー"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-3 flex items-center justify-center rounded border border-red-900/50 hover:border-red-500 bg-red-950/20 hover:bg-red-900/40 text-red-400 transition-colors shrink-0 disabled:opacity-50"
                                title="アセットを削除"
                            >
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <p className="text-[8px] text-[#8c7a6b] leading-normal leading-relaxed">
                            ※ 上記URLをコピーし、UGCテンプレート（JSON/Markdown）内の画像URL (`image_url` 等) またはBGMのURLフィールドに貼り付けて使用してください。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
