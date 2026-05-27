'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TermsOfServiceModalProps {
    /** 同意した時のコールバック */
    onAgree: () => void;
    /** キャンセルした時のコールバック */
    onCancel: () => void;
}

/**
 * 利用規約およびプライバシーポリシー同意モーダル
 */
export default function TermsOfServiceModal({
    onAgree,
    onCancel,
}: TermsOfServiceModalProps) {
    const [agreed, setAgreed] = useState(false);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="bg-[#100b08] border-2 border-amber-800/70 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto relative animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* 装飾用の内線 */}
                <div className="absolute inset-1.5 border border-amber-900/30 pointer-events-none rounded-lg"></div>

                <div className="text-center relative z-10">
                    <div className="text-4xl mb-3">📜</div>
                    <h3 className="text-xl font-serif text-amber-500 tracking-widest mb-2">利用規約の同意</h3>
                    <p className="text-amber-100/60 text-xs leading-relaxed">
                        ゲームを開始する前に、利用規約とプライバシーポリシーをご確認いただき、同意をお願いいたします。
                    </p>
                </div>

                {/* 規約リンクパネル */}
                <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4 space-y-3 relative z-10">
                    <p className="text-amber-100/80 text-xs leading-relaxed text-center">
                        アカウントを作成することにより、ユーザーは以下の規約に同意したものとみなされます。
                    </p>
                    <div className="flex justify-around items-center pt-1">
                        <Link
                            href="/legal/terms"
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('cwd_show_tos', '1');
                                }
                            }}
                            className="text-amber-400 hover:text-amber-300 transition-colors text-xs font-serif underline decoration-amber-500/50 hover:decoration-amber-400 font-bold"
                        >
                            利用規約
                        </Link>
                        <div className="w-px h-3 bg-amber-900/40"></div>
                        <Link
                            href="/legal/privacy"
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('cwd_show_tos', '1');
                                }
                            }}
                            className="text-amber-400 hover:text-amber-300 transition-colors text-xs font-serif underline decoration-amber-500/50 hover:decoration-amber-400 font-bold"
                        >
                            プライバシーポリシー
                        </Link>
                    </div>
                </div>

                {/* 同意チェックボックス */}
                <div className="relative z-10 px-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                            className="mt-0.5 accent-amber-600 w-4 h-4 flex-shrink-0 cursor-pointer"
                        />
                        <span className="text-amber-100/80 text-xs leading-relaxed group-hover:text-amber-500 transition-colors select-none">
                            利用規約およびプライバシーポリシーの内容を理解し、これに同意します。
                        </span>
                    </label>
                </div>

                {/* アクションボタン */}
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 border border-slate-700 text-slate-400 font-serif rounded-lg text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onAgree}
                        disabled={!agreed}
                        className="flex-1 py-3 bg-amber-900/40 border border-amber-700 text-amber-400 font-serif font-bold rounded-lg text-sm hover:bg-amber-900/60 hover:border-amber-500 hover:text-amber-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        同意して進む
                    </button>
                </div>
            </div>
        </div>
    );
}
