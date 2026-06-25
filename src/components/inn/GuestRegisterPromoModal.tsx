import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/soundManager';

interface Props {
    onClose: () => void;
}

export default function GuestRegisterPromoModal({ onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLinkGoogle = async () => {
        setLoading(true);
        setErrorMsg(null);
        soundManager?.playSE('se_click');

        try {
            // 本登録完了後に自動でパックプロモーションを開くため、sessionStorageにフラグを保存
            try {
                sessionStorage.setItem('wirth_dawn_just_registered', 'true');
            } catch (err) {
                console.warn('[GuestRegisterPromoModal] sessionStorage setItem failed:', err);
            }

            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/inn`,
                    queryParams: {
                        prompt: 'select_account consent'
                    }
                },
            });
            if (error) throw error;
        } catch (e: any) {
            console.error('[GuestRegisterPromoModal] Google Link Error:', e);
            setErrorMsg(`Google連携に失敗しました: ${e.message}`);
            setLoading(false);
            try {
                sessionStorage.removeItem('wirth_dawn_just_registered');
            } catch (err) {}
        }
    };

    const handleCancel = () => {
        setIsCancelling(true);
        soundManager?.playSE('se_click');
        setTimeout(() => {
            onClose();
        }, 250);
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 pointer-events-none" />
            <div className="relative z-10 w-full max-w-lg bg-[#0b0d19]/95 border border-amber-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* ヘッダー画像エリア */}
                <div className="relative w-full h-44 sm:h-48 bg-slate-950 border-b border-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                        src="/images/promos/promo_guest_register.png" 
                        alt="Guest Register Banner" 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/35" />
                    
                    {/* 右上の閉じるボタン */}
                    <button 
                        onClick={handleCancel}
                        disabled={loading || isCancelling}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all z-20 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>

                    <div className="absolute bottom-4 left-6 right-6 text-left">
                        <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase border border-amber-500/20 px-2 py-0.5 rounded bg-black/40">冒険の記録</span>
                        <h2 className="text-xl font-black text-white mt-1.5 tracking-wider drop-shadow-md">歴史書に名を刻む</h2>
                    </div>
                </div>

                {/* コンテンツ */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                    {/* 世界観に沿ったテキスト */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                        <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed whitespace-pre-line tracking-wide">
                            {`「旅人よ、素晴らしい活躍であった。だが、忘れてはならない。\n\n署名なき冒険譚は風に消えゆく宿命にある。\n\nお前の歩んだ確かな軌跡を、この世界の歴史書に深く刻み込むのだ。\n\nさすれば、お前の冒険の記録は永遠に失われることはないだろう……」`}
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center">
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* 操作エリア */}
                <div className="p-6 border-t border-slate-900 bg-slate-950 flex flex-col sm:flex-row gap-3 shrink-0">
                    <button
                        onClick={handleLinkGoogle}
                        disabled={loading || isCancelling}
                        className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 border border-amber-400/20 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.15)] active:scale-98 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                                記録手続き中...
                            </>
                        ) : (
                            <>
                                <LogIn size={14} />
                                Googleアカウントで冒険の記録を残す
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={loading || isCancelling}
                        className="py-3.5 px-6 bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-slate-350 border border-slate-800 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                準備中...
                            </>
                        ) : (
                            '今は保留して旅を続ける'
                        )}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
