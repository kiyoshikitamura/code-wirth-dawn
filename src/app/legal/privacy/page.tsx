import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'プライバシーポリシー | Code: Wirth-Dawn',
    description: 'Code: Wirth-Dawn のプライバシーポリシー',
};

export default function PrivacyPage() {
    return (
        <article className="prose prose-invert prose-amber max-w-none space-y-6">
            <h1 className="text-2xl font-serif text-amber-400 tracking-widest border-b border-amber-900/30 pb-4">
                プライバシーポリシー
            </h1>

            <p className="text-xs text-slate-500">最終更新日: 2026年5月28日</p>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">1. 収集する情報</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    本サービスでは、以下の情報を収集します。
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li><strong className="text-slate-300">Google アカウント情報</strong>: メールアドレス、表示名、プロフィール画像URL（OAuth 2.0 経由）</li>
                    <li><strong className="text-slate-300">ゲームデータ</strong>: キャラクター名、ステータス、クエスト履歴、所持品等のプレイデータ</li>
                    <li><strong className="text-slate-300">アップロード画像</strong>: アバター画像（任意）</li>
                    <li><strong className="text-slate-300">決済情報</strong>: Stripe 経由で処理。カード番号等は当社サーバーに保存されません</li>
                    <li><strong className="text-slate-300">利用ログ</strong>: アクセス日時、IPアドレス、ブラウザ情報（サーバーログ）</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">2. 利用目的</h2>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>本サービスの提供・運営・改善</li>
                    <li>ユーザー認証およびアカウント管理</li>
                    <li>不正利用の防止</li>
                    <li>有料サービスの決済処理</li>
                    <li>お問い合わせへの対応</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">3. 第三者提供</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    以下の場合を除き、ユーザーの個人情報を第三者に提供いたしません。
                </p>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>ユーザーの同意がある場合</li>
                    <li>法令に基づく場合</li>
                    <li>本サービスの運営に必要な業務委託先（Supabase, Vercel, Stripe 等）への提供</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">4. 外部サービスの利用</h2>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li><strong className="text-slate-300">Supabase</strong>: データベース・認証基盤（データは Supabase のサーバーに保存されます）</li>
                    <li><strong className="text-slate-300">Vercel</strong>: ホスティング・サーバーレス関数の実行環境</li>
                    <li><strong className="text-slate-300">Stripe</strong>: 決済処理（PCI DSS 準拠）</li>
                    <li><strong className="text-slate-300">Google OAuth</strong>: ユーザー認証</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">5. データの保管と削除</h2>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>テストプレイ（匿名認証）のデータは作成から7日後に自動削除されます。</li>
                    <li>通常アカウントのデータは、ユーザーが「キャラクター削除」を実行するまで保管されます。</li>
                    <li>アカウント削除時、関連する全データ（18テーブル分）が完全に削除されます。</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">6. Cookie の使用</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    本サービスでは、認証セッション管理のためにCookieおよびlocalStorageを使用します。ブラウザの設定でCookieを無効にした場合、本サービスの一部機能が利用できなくなる場合があります。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">7. お問い合わせ</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    プライバシーに関するお問い合わせは、以下までご連絡ください。<br />
                    メール: code.writh.dawn@gmail.com
                </p>
            </section>
        </article>
    );
}
