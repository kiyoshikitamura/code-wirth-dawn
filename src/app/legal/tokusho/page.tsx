import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '特定商取引法に基づく表記 | Code: Wirth-Dawn',
    description: 'Code: Wirth-Dawn の特定商取引法に基づく表記',
};

export default function TokushoPage() {
    return (
        <article className="prose prose-invert prose-amber max-w-none space-y-6">
            <h1 className="text-2xl font-serif text-amber-400 tracking-widest border-b border-amber-900/30 pb-4">
                特定商取引法に基づく表記
            </h1>

            <p className="text-xs text-slate-500">最終更新日: 2026年5月18日</p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {[
                            ['販売事業者', '[事業者名]'],
                            ['代表者', '[代表者名]'],
                            ['所在地', '[所在地]'],
                            ['連絡先', 'メール: [メールアドレス]'],
                            ['電話番号', '[電話番号] ※お問い合わせはメールにてお願いします'],
                            ['販売価格', '各サービスページに表示された価格（税込）'],
                            ['追加料金', '通信料等はユーザー負担となります'],
                            ['支払方法', 'クレジットカード（Stripe経由）'],
                            ['支払時期', 'サブスクリプション: 申込時に初回決済、以降毎月自動更新'],
                            ['商品の引渡し時期', '決済完了後、即時にサービスが有効化されます'],
                            ['返品・キャンセル', 'デジタルコンテンツの性質上、購入後の返品・返金はお受けできません。ただし、法令に定める場合はこの限りではありません'],
                            ['動作環境', 'モダンブラウザ（Chrome, Safari, Firefox, Edge の最新版）'],
                            ['解約方法', 'ゲーム内の設定画面、またはStripeカスタマーポータルから解約可能です。解約後も現在の契約期間終了まで特典を利用できます'],
                        ].map(([label, value]) => (
                            <tr key={label} className="border-b border-slate-800">
                                <th className="text-left py-3 px-4 text-amber-500/80 font-serif font-normal w-1/3 align-top bg-slate-900/30">
                                    {label}
                                </th>
                                <td className="py-3 px-4 text-slate-400">
                                    {value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-8">
                <p className="text-xs text-slate-600 text-center">
                    ※ 本表記はテンプレートです。[ ] 内の情報は事業者の正式情報に置き換えてください。
                </p>
            </div>
        </article>
    );
}
