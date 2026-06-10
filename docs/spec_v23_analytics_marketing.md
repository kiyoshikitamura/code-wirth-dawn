# spec_v23_analytics_marketing.md: X (Twitter) 広告 & Google Analytics (GA4) 計測・OGP 仕様書

本ゲーム「Code: Wirth-Dawn」における、X (Twitter) 広告コンバージョン計測（X Pixel）、Google Analytics (GA4) によるアクセス解析、およびX上での画像付きリンクカード（Website Card）表示に関する統合仕様書です。

---

## 1. 目的と基本仕様

本仕様の導入目的は、プロモーションおよびユーザー獲得効果を測定・分析し、ゲーム運営とマーケティングキャンペーンを最適化することです。

### 1.1 X (Twitter) 広告コンバージョン計測 (X Pixel)
ブラウザ（Webサイト）向けのユニバーサルウェブタグ（X Pixel）を使用し、クライアントサイドでのイベント発火をベースとして動作します。
* **PageView**: 全ページで共通してページビュー計測を自動実行します。
* **Sign Up**: ユーザー登録（キャラクター新規作成完了）のタイミングでイベントを送信します。
* **Purchase**: Stripeを介した決済完了（有償サブスク加入またはゴールド購入）のタイミングで、決済金額データを含めてイベントを送信します。
* **二重送信防止**: 決済完了URLリロード等による二重計上を防ぐため、イベント発火後に即座にURLのクエリパラメータをクリーンアップします。

### 1.2 Google Analytics (GA4) 計測
Next.js公式の `@next/third-parties/google` ライブラリを使用してGA4タグ（Google タグ）を導入し、アクセス解析を行います。
* **PageView / セッション**: GA4タグが自動的にSPA（シングルページアプリケーション）のルーティング遷移を検知し、PageView やアクティブユーザー数、セッション、滞在時間などを自動計測します。

### 1.3 X リンクカード表示 (OGPメタデータ)
X上でゲームのURLが投稿された際、または広告出稿時に、大きな画像付きのカード（`summary_large_image`）として表示されるようにメタデータを設定します。

---

## 2. 測定コンバージョン・イベントの定義

### 2.1 X (Twitter) 広告計測イベント
| イベント名称 | X Ads イベント種別 | 送信契機 | 送信パラメータ |
| :--- | :--- | :--- | :--- |
| **PageView** (ベース) | PageView (標準) | 全ページ読み込み時 | なし |
| **Sign Up** | カスタム (Sign Up) | キャラクターの新規作成API成功後、`/inn` に遷移する直前 | なし |
| **Purchase** | カスタム (Purchase) | 決済成功後の `/inn` 遷移時（URLクエリパラメータ `billing` が存在する時） | `value` (決済金額の文字列), `currency`: `'JPY'` |

#### Purchase イベント時の `value`（金額）算出ルール
* **サブスクリプション (Basicプラン)**: `billing=success&tier=basic` -> 固定値 `500` (円)
* **サブスクリプション (Premiumプラン)**: `billing=success&tier=premium` -> 固定値 `1000` (円)
* **ゴールドの都度購入**: `billing=gold_success&amount=XXX` -> クエリパラメータ `amount` の値（例: `330` または `1460` 等の数値）

### 2.2 Google Analytics (GA4) 計測イベント
現在、標準のトラッキングコードのみが導入されており、以下の自動収集イベントが追加設定なしで計測されます。
* **page_view**: ユーザーがページを閲覧したとき（Next.js App Routerの遷移も自動で含む）。
* **first_visit**: ユーザーが初めてサイトにアクセスしたとき。
* **session_start**: 新しいセッションが開始されたとき。
* **user_engagement**: ユーザーが一定時間ページに滞在し、スクロールやクリック操作を行ったとき。

> [!NOTE]  
> 将来的に登録や決済などのカスタムコンバージョンをGA4でも明示的にトラッキングする場合は、`@next/third-parties/google` の `sendGAEvent` 関数を利用したカスタムイベントの実装を推奨します（後述の「7. 将来的なGA4拡張案」を参照）。

---

## 3. システム構成・環境変数

各計測に必要な測定IDは環境変数から動的に読み込みます。

### 3.1 必要となる環境変数
本番環境（Vercel）および開発ローカル環境（`.env.local`）に以下のキーを設定します。

```env
# X (Twitter) Ads Conversion Pixel
NEXT_PUBLIC_X_PIXEL_ID="YOUR_X_PIXEL_ID"
NEXT_PUBLIC_X_CONVERSION_SIGNUP_ID="YOUR_SIGNUP_EVENT_ID"
NEXT_PUBLIC_X_CONVERSION_PURCHASE_ID="YOUR_PURCHASE_EVENT_ID"

# Google Analytics (GA4)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

* **ローカル検証時**: 値が存在する場合のみ各SDKがロードされます。検証時は `NEXT_PUBLIC_X_PIXEL_ID` に `"tw-dummy-xxx"` 等のダミー文字列を設定し、GA用の `NEXT_PUBLIC_GA_ID` は空欄（無効化）にして動作確認を行います。
* **本番時**: それぞれ本番用のIDに差し替えます。

---

## 4. プログラム設計と実装詳細

### 4.1 計測ユーティリティ (`src/utils/xads.ts`)
X Ads SDKの非同期ロードを行う関数（`initXPixel`）と、カスタムイベントの送信関数（`trackXEvent`）を提供します。

```typescript
/**
 * X (Twitter) Ads Conversion Pixel Utility
 */

export function initXPixel(pixelId: string) {
  if (typeof window === 'undefined') return;

  // すでにロード済みの場合は多重読み込みを防ぐ
  if (!(window as any).twq) {
    (function(e: any, t: any, n: string, s?: any, u?: any, a?: any) {
      e.twq || (s = e.twq = function() {
        s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
      }, s.version = '1.1', s.queue = [], u = t.createElement(n), u.async = !0, u.src = 'https://static.ads-twitter.com/uwt.js',
      a = t.getElementsByTagName(n)[0], a.parentNode.insertBefore(u, a))
    })(window, document, 'script');

    (window as any).twq('config', pixelId);
    (window as any).twq('track', 'PageView');
    console.log('[X Ads] Base pixel initialized.');
  }
}

export function trackXEvent(eventId: string, data?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const twq = (window as any).twq;
  if (twq) {
    twq('event', eventId, data);
    console.log('[X Ads] Tracked event:', eventId, data);
  } else {
    console.warn('[X Ads] twq is not defined. Track failed for event:', eventId, data);
  }
}
```

### 4.2 トラッカーコンポーネント (`src/components/analytics/XPixelTracker.tsx`)
クライアントサイドのマウント時に環境変数からピクセルIDを読み込み、初期化を実行します。

```tsx
'use client';

import { useEffect } from 'react';
import { initXPixel } from '@/utils/xads';

export default function XPixelTracker() {
  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_X_PIXEL_ID;
    if (pixelId) {
      initXPixel(pixelId);
    }
  }, []);

  return null;
}
```

### 4.3 共通レイアウトへの組み込みとGAロード (`src/app/layout.tsx`)
`RootLayout` 内に、X Adsのトラッカーと Next.js 公式の `<GoogleAnalytics />` コンポーネントをそれぞれ環境変数が存在する場合のみレンダリングされるように配置します。

```tsx
import XPixelTracker from "@/components/analytics/XPixelTracker";
import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <SoundProvider />
        {children}
        
        {/* X Ads Pixel Tracker */}
        {process.env.NEXT_PUBLIC_X_PIXEL_ID && <XPixelTracker />}
        
        {/* Google Analytics (GA4) Tag */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
```

### 4.4 新規登録（キャラクター作成完了）計測 (`src/app/title/page.tsx`)
プロフィール作成成功後、宿屋への遷移直前で `Sign Up` イベントを発火します。

```typescript
// /api/profile/init 成功時の処理
setIsUploading(false);
await new Promise(r => setTimeout(r, 2000));
await fetchUserProfile();
setGameStarted();

// X Ads Conversion Tracking: Sign Up
const signupId = process.env.NEXT_PUBLIC_X_CONVERSION_SIGNUP_ID;
if (signupId) {
    const { trackXEvent } = await import('@/utils/xads');
    trackXEvent(signupId);
}

router.push('/inn');
```

### 4.5 Stripe決済成功（Purchase）計測 & URLクリーンアップ (`src/hooks/useInnPageState.ts`)
決済完了パラメータを検知したタイミングで `Purchase` イベントを送信し、送信完了後に即座にパラメータをクリーンアップします。

```typescript
useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success' || billing === 'gold_success') {
        const purchaseId = process.env.NEXT_PUBLIC_X_CONVERSION_PURCHASE_ID;
        if (purchaseId) {
            import('@/utils/xads').then(({ trackXEvent }) => {
                const tier = searchParams.get('tier');
                const amount = Number(searchParams.get('amount') || 0);
                
                const value = billing === 'success' 
                    ? (tier === 'premium' ? 1000 : 500)
                    : amount;

                trackXEvent(purchaseId, {
                    value: String(value),
                    currency: 'JPY'
                });
            });
        }

        // 二重送信防止のためにクエリパラメータを即時削除してURLを書き換え
        const url = new URL(window.location.href);
        url.searchParams.delete('billing');
        url.searchParams.delete('tier');
        url.searchParams.delete('amount');
        window.history.replaceState({}, '', url.pathname + url.search);
    }
}, [searchParams]);
```

---

## 5. X リンクカード (OGP) 対応

広告出稿時やSNSシェア時の視認性を高めるため、以下の仕様でメタデータを設定します。

```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://code-wirth-dawn.com";

export const metadata: Metadata = {
  title: "Code: Wirth-Dawn — Chronicles of the Unnamed",
  description: "名もなき旅人の物語。ブラウザで遊べるJRPG風テキストアドベンチャー。",
  openGraph: {
    title: "Code: Wirth-Dawn — Chronicles of the Unnamed",
    description: "名もなき旅人の物語。ブラウザで遊べるJRPG風テキストアドベンチャー。",
    url: siteUrl,
    siteName: "Code: Wirth-Dawn",
    images: [
      {
        url: `${siteUrl}/ogp-image.png`, // 1200x630 推奨
        width: 1200,
        height: 630,
        alt: "Code: Wirth-Dawn",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image", // 画像を大きく表示するX用の指定
    title: "Code: Wirth-Dawn — Chronicles of the Unnamed",
    description: "名もなき旅人の物語。ブラウザで遊べるJRPG風テキストアドベンチャー。",
    images: [`${siteUrl}/ogp-image.png`],
  },
};
```

---

## 6. テスト・動作検証手順

### 6.1 ローカル開発環境での検証 (X Ads)
1. `.env.local` にダミーのIDを設定します。
2. 開発サーバー（`npm run dev`）を起動し、ブラウザで開発者ツールの「コンソール」を開きます。
3. 以下の各アクションに対応するログが出力されることを確認します。
   * **PageView**: ページを開いた際、`[X Ads] Base pixel initialized.` と出力されること。
   * **Sign Up**: 新規キャラクター作成完了し、宿屋画面に遷移する直前に `[X Ads] Tracked event: tw-dummy-signup-id undefined` と出力されること。
   * **Purchase**: `http://localhost:3000/inn?billing=success&tier=premium` にアクセスした際、`[X Ads] Tracked event: tw-dummy-purchase-id { value: '1000', currency: 'JPY' }` と出力されること。
   * **URLの書き換え**: 同時にブラウザのアドレスバーのURLが自動で `http://localhost:3000/inn` に書き換わり、リロードしてもコンソールログに追跡イベントが出力されないこと（二重送信防止）。

### 6.2 Google Analytics (GA4) の接続確認
1. 本番環境または検証環境に `NEXT_PUBLIC_GA_ID` を設定してデプロイします。
2. ブラウザでアクセスし、開発者ツールのネットワークタブ（F12 > Network）で `google-analytics.com/g/collect` 宛ての通信が発生していることを確認します。
3. GA4の管理画面にある「リアルタイム レポート（Real-time Report）」を開き、自分のアクセス（ページ遷移やアクティブユーザー）がリアルタイムに検知されていることを確認します。

---

## 7. 将来的なGA4拡張案（カスタムイベントの導入）

今後、GA4でも登録や課金のコンバージョンを厳密に測定・分析する場合、以下の手順でカスタムイベントを仕込みます。

### 7.1 追加モジュールの実装
`@next/third-parties/google` の `sendGAEvent` 関数をインポートし、イベントを送信します。

```typescript
// 実装例: src/utils/analytics.ts などの汎用トラッカーを作成する
import { sendGAEvent } from '@next/third-parties/google';

// 登録完了時
export function trackGaSignUp() {
  sendGAEvent({
    event: 'sign_up',
    method: 'GoogleOAuth', // または 'Anonymous'
  });
}

// 決済完了時
export function trackGaPurchase(value: number, transactionId: string) {
  sendGAEvent({
    event: 'purchase',
    value: value,
    currency: 'JPY',
    transaction_id: transactionId, // 重複排除用の一意のID (StripeセッションID等)
  });
}
```
