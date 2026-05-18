import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '利用規約 | Code: Wirth-Dawn',
    description: 'Code: Wirth-Dawn の利用規約',
};

export default function TermsPage() {
    return (
        <article className="prose prose-invert prose-amber max-w-none space-y-6">
            <h1 className="text-2xl font-serif text-amber-400 tracking-widest border-b border-amber-900/30 pb-4">
                利用規約
            </h1>

            <p className="text-xs text-slate-500">最終更新日: 2026年5月18日</p>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第1条（適用）</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    本規約は、[サービス運営者名]（以下「運営者」）が提供するブラウザゲーム「Code: Wirth-Dawn」（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第2条（アカウント）</h2>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>本サービスのアカウントはGoogleアカウント認証（OAuth 2.0）によって作成されます。</li>
                    <li>テストプレイ（匿名認証）は7日間限定で提供され、期間経過後にデータが自動削除されます。</li>
                    <li>アカウントの譲渡、共有、売買は禁止します。</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第3条（禁止事項）</h2>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>本サービスの正常な運営を妨害する行為</li>
                    <li>不正な手段によるゲームデータの改変・複製</li>
                    <li>他のユーザーへの嫌がらせ、誹謗中傷</li>
                    <li>本サービスを利用した営利活動（運営者が許可したものを除く）</li>
                    <li>リバースエンジニアリング、データスクレイピング</li>
                    <li>その他、運営者が不適切と判断する行為</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第4条（サービスの変更・中断）</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    運営者は、事前の通知なく本サービスの内容を変更し、または一時的もしくは永続的に中断・終了することがあります。これによりユーザーに生じた損害について、運営者は一切の責任を負いません。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第5条（有料サービス）</h2>
                <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>有料サービス（サブスクリプション等）の決済はStripe経由で処理されます。</li>
                    <li>購入された仮想通貨・アイテムは、法令に定める場合を除き、返金いたしません。</li>
                    <li>サブスクリプションの解約は、次回更新日の前日までにユーザー自身で行うものとします。</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第6条（免責事項）</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    運営者は、本サービスの利用によりユーザーに生じた損害について、運営者の故意または重過失による場合を除き、一切の責任を負いません。ゲームデータの消失・破損についても同様です。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第7条（知的財産権）</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    本サービスに含まれるすべてのコンテンツ（テキスト、画像、音楽、プログラム等）に関する知的財産権は、運営者または正当な権利者に帰属します。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第8条（規約の変更）</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    運営者は、必要と判断した場合、ユーザーに通知することなく本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点で効力を生じます。
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-serif text-amber-500/80">第9条（準拠法・管轄裁判所）</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                    本規約は日本法に準拠し、本サービスに関する紛争については、[管轄裁判所名]を第一審の専属的合意管轄裁判所とします。
                </p>
            </section>

            <div className="border-t border-slate-800 pt-4 mt-8">
                <p className="text-xs text-slate-600 text-center">
                    ※ 本規約はテンプレートです。正式運用前に法的レビューを受けてください。
                </p>
            </div>
        </article>
    );
}
