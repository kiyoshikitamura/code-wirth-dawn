'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/title');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-gray-300 font-sans">
            <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="text-amber-500 hover:text-amber-400 transition-colors flex items-center justify-center cursor-pointer"
                        aria-label="戻る"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-serif text-amber-500/80 tracking-widest">Code: Wirth-Dawn</h1>
                </div>
            </header>
            <main className="max-w-2xl mx-auto px-4 py-8">
                {children}
            </main>
            <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
                <div className="flex justify-center gap-4 flex-wrap">
                    <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">利用規約</Link>
                    <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">プライバシーポリシー</Link>
                    <Link href="/legal/tokusho" className="hover:text-slate-400 transition-colors">特定商取引法</Link>
                    <Link href="/legal/credits" className="hover:text-slate-400 transition-colors">権利表記</Link>
                </div>
                <div className="mt-2 text-slate-700">© 2026 Code: Wirth-Dawn. All rights reserved.</div>
            </footer>
        </div>
    );
}
