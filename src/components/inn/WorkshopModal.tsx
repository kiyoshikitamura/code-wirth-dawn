import React from 'react';
import { PenTool, X, FolderKanban, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorkshopModalProps {
    onClose: () => void;
}

export default function WorkshopModal({ onClose }: WorkshopModalProps) {
    const router = useRouter();

    const handleCreate = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        setTimeout(() => router.push('/editor'), 50);
    };

    const handleManage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        // TODO: 作品管理画面実装後にルート変更
        setTimeout(() => router.push('/editor'), 50);
    };

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-start pt-28 justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm bg-slate-900 border border-amber-900/50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top duration-300">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                    <h2 className="text-amber-500 text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                        <PenTool size={14} className="text-amber-500" /> クリエイターズ工房
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors focus:outline-none">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <button
                        onClick={handleCreate}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-600/50 rounded-xl transition-all active:scale-95 group"
                    >
                        <div className="flex items-center gap-3">
                            <PlusCircle className="text-amber-500 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <span className="font-bold text-slate-200 block text-sm">新規クエスト作成</span>
                                <span className="text-[10px] text-slate-500">シナリオを一から構築</span>
                            </div>
                        </div>
                        <span className="text-amber-900/50 group-hover:text-amber-500/80">→</span>
                    </button>

                    <button
                        onClick={handleManage}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-600/50 rounded-xl transition-all active:scale-95 group"
                    >
                        <div className="flex items-center gap-3">
                            <FolderKanban className="text-slate-400 group-hover:text-amber-500 group-hover:scale-110 transition-all" />
                            <div className="text-left">
                                <span className="font-bold text-slate-400 group-hover:text-slate-200 transition-colors block text-sm">作品管理</span>
                                <span className="text-[10px] text-slate-600">下書き・公開中のクエスト</span>
                            </div>
                        </div>
                        <span className="text-slate-700 group-hover:text-amber-500/80">→</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition-colors uppercase tracking-widest active:scale-95"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
