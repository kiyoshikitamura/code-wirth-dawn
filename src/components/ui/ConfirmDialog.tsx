'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    /** ダイアログのタイトル */
    title: string;
    /** 確認メッセージ（文字列またはJSX） */
    message: React.ReactNode;
    /** 確認ボタンのテキスト */
    confirmText?: string;
    /** キャンセルボタンのテキスト */
    cancelText?: string;
    /** 確認ボタンのスタイル variant */
    variant?: 'danger' | 'warning' | 'default';
    /** 確認時コールバック */
    onConfirm: () => void;
    /** キャンセル時コールバック */
    onCancel?: () => void;
    /** ローディング中 */
    loading?: boolean;
    /** ボタンを1つだけ（確認のみ）にするか */
    singleButton?: boolean;
}

/**
 * 汎用確認ダイアログ
 * ゲームUI内でwindow.confirm()の代替として使用。
 * 世界観に合わせたダークファンタジーUI。
 */
export default function ConfirmDialog({
    title,
    message,
    confirmText = '確認',
    cancelText = 'キャンセル',
    variant = 'default',
    onConfirm,
    onCancel,
    loading = false,
    singleButton = false,
}: ConfirmDialogProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const variantStyles = {
        danger: {
            border: 'border-red-700/60',
            confirmBtn: 'bg-red-900/40 border-red-600 text-red-300 hover:bg-red-900/60',
            icon: <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />,
        },
        warning: {
            border: 'border-amber-700/60',
            confirmBtn: 'bg-amber-900/40 border-amber-600 text-amber-200 hover:bg-amber-900/60',
            icon: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
        },
        default: {
            border: 'border-[#a38b6b]/60',
            confirmBtn: 'bg-amber-900/40 border-amber-600 text-amber-200 hover:bg-amber-900/60',
            icon: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />,
        },
    };

    const styles = variantStyles[variant];

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => { if (e.target === e.currentTarget && onCancel) onCancel(); }}
        >
            <div className={`bg-[#1a120b] border-2 ${styles.border} w-full max-w-sm shadow-2xl p-5 animate-in zoom-in-95 duration-200`}>
                {/* タイトル */}
                <div className="flex items-center gap-2 mb-4 border-b border-[#3e2723] pb-3">
                    {styles.icon}
                    <h3 className="text-lg font-serif font-bold text-[#e3d5b8]">{title}</h3>
                </div>

                {/* メッセージ */}
                <div className="text-sm text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap">
                    {message}
                </div>

                {/* ボタン */}
                <div className="flex gap-3">
                    {!singleButton && onCancel && (
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 py-2.5 text-sm font-bold bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-40"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2.5 text-sm font-bold border rounded transition-colors disabled:opacity-40 ${styles.confirmBtn}`}
                    >
                        {loading ? '処理中...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
