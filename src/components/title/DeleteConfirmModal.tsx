'use client';

import React, { useState } from 'react';

interface DeleteConfirmModalProps {
    /** モーダルのタイトル */
    title: string;
    /** 説明文（JSX可） */
    description: React.ReactNode;
    /** 確定ボタンテキスト */
    confirmText: string;
    /** ボタンローディングテキスト */
    confirmLoadingText?: string;
    /** 確定時のコールバック */
    onConfirm: () => void | Promise<void>;
    /** キャンセル時のコールバック */
    onCancel: () => void;
    /** アイコン絵文字 */
    icon?: string;
    /** ローディング中 */
    isLoading?: boolean;
    /** 追加の下部リンク */
    footerAction?: React.ReactNode;
}

/**
 * 2つのチェックボックス必須の削除確認モーダル（タイトル画面で共通利用）
 */
export default function DeleteConfirmModal({
    title,
    description,
    confirmText,
    confirmLoadingText = '処理中...',
    onConfirm,
    onCancel,
    icon = '⚠️',
    isLoading = false,
    footerAction,
}: DeleteConfirmModalProps) {
    const [check1, setCheck1] = useState(false);
    const [check2, setCheck2] = useState(false);

    const handleCancel = () => {
        setCheck1(false);
        setCheck2(false);
        onCancel();
    };

    const handleConfirm = async () => {
        setCheck1(false);
        setCheck2(false);
        await onConfirm();
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={handleCancel}
        >
            <div
                className="bg-[#100808] border-2 border-red-800/70 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="text-4xl mb-3">{icon}</div>
                    <h3 className="text-xl font-serif text-red-400 tracking-widest mb-2">{title}</h3>
                    <div className="text-red-300/80 text-xs leading-relaxed">
                        {description}
                    </div>
                </div>

                <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={check1}
                            onChange={e => setCheck1(e.target.checked)}
                            className="mt-0.5 accent-red-600 w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-red-300/80 text-xs leading-relaxed group-hover:text-red-200 transition-colors">
                            キャラクターに紐づく<strong>全ての資産・履歴が削除される</strong>ことを理解しました
                        </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={check2}
                            onChange={e => setCheck2(e.target.checked)}
                            className="mt-0.5 accent-red-600 w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-red-300/80 text-xs leading-relaxed group-hover:text-red-200 transition-colors">
                            この操作は<strong>絶対に元に戻せない</strong>ことを理解しました
                        </span>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-3 border border-slate-700 text-slate-400 font-serif rounded-lg text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!check1 || !check2 || isLoading}
                        className="flex-1 py-3 bg-red-900/40 border border-red-700 text-red-300 font-serif font-bold rounded-lg text-sm hover:bg-red-900/60 hover:border-red-500 hover:text-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isLoading ? confirmLoadingText : confirmText}
                    </button>
                </div>

                {footerAction}
            </div>
        </div>
    );
}
