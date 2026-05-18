import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '権利表記 / Credits | Code: Wirth-Dawn',
    description: 'Code: Wirth-Dawn の権利表記・使用ライブラリ情報',
};

export default function CreditsPage() {
    return (
        <article className="prose prose-invert prose-amber max-w-none space-y-6">
            <h1 className="text-2xl font-serif text-amber-400 tracking-widest border-b border-amber-900/30 pb-4">
                権利表記 / Credits
            </h1>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">ゲーム本体</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    © 2026 Code: Wirth-Dawn. All rights reserved.<br />
                    本ゲームのシナリオ、キャラクター、世界観設定は全てオリジナルです。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">使用技術・フレームワーク</h2>
                <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
                    <li><strong className="text-slate-300">Next.js</strong> — MIT License (Vercel)</li>
                    <li><strong className="text-slate-300">React</strong> — MIT License (Meta)</li>
                    <li><strong className="text-slate-300">Tailwind CSS</strong> — MIT License</li>
                    <li><strong className="text-slate-300">Supabase</strong> — Apache 2.0 License</li>
                    <li><strong className="text-slate-300">Stripe</strong> — 決済基盤</li>
                    <li><strong className="text-slate-300">Zustand</strong> — MIT License</li>
                    <li><strong className="text-slate-300">Lucide Icons</strong> — ISC License</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">フォント</h2>
                <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
                    <li><strong className="text-slate-300">Geist Sans / Geist Mono</strong> — SIL Open Font License (Vercel)</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">テクスチャ素材</h2>
                <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
                    <li><strong className="text-slate-300">Transparent Textures</strong> — "Dark Leather", "Old Wall" パターン</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">画像生成</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    一部の画像素材はAI画像生成ツールを使用して制作しています。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">BGM / 効果音</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    [BGM・SE素材の出典を記載]
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">Special Thanks</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    本作品をプレイしてくださるすべての旅人に感謝いたします。
                </p>
            </section>

            <div className="border-t border-slate-800 pt-4 mt-8">
                <p className="text-xs text-slate-600 text-center">
                    ※ 権利表記に記載漏れがある場合はお問い合わせください。速やかに対応いたします。
                </p>
            </div>
        </article>
    );
}
