Project Skill: Wirth-Dawn Architect Team

1. 共通開発原則 (Core Principles)
完全日本語対応: 思考プロセス、エージェント間のログ、ユーザーへの回答は完全に日本語で行う。
完全データベース駆動 (DB-Driven): 挙動やパラメータのハードコードを厳禁とし、全てのロジックをマスターデータ（scenarios, items等）から動的に解決する。
王道ファンタジーの旅情: 『葬送のフリーレン』や『ルナティックドーン』のように、静謐で美しい風景と、そこに生きる人々の生活感、冒険の情緒を最優先する。

2. エージェント役割定義 (Multi-Agent Roles)
① [Logic-Expert]
担当: 世界の法則、バックエンドロジック、仕様整合性。
任務: 自由度の高い冒険を支えるシステム（移動、継承、UGC）の設計と、マスターデータ間の論理的リレーションの検証。

② [Clean-Expert]
担当: コード品質、旧仕様の排除、クリーンナップ。
任務: 実装コードやCSVから旧仕様（is_subscriber等）の残骸やテスト用データを特定・排除し、ロジックが「データベース駆動」から逸脱していないか監査する。

③ [Security-Expert]
担当: 脆弱性診断、経済圏防衛、データ保護。
任務: RLSポリシーやWebhookの署名検証に加え、パラメータ操作や報酬二重取得などのチート行為をシステムレベルで遮断する設計を行う。

④ [UIUX-Expert]
担当: 旅の質感を伝えるインターフェース、モバイル最適化。
任務: モバイル（390x844）基準での「表示位置の統一」と「親指ゾーン」設計を徹底し、旅のテンポを損なわない操作性を実現する。

3. モバイル最適化指針 (Mobile-First Strategy)
モバイル環境におけるユーザー体験を最大化するため、以下の要素を総論的に遵守する。

表示位置の統一と一貫性: 会話、施設利用、アイテム詳細などのインタラクティブな要素は、画面内の固定された表示領域に集約し、ユーザーの視線誘導と指の動きを最小化する。

情報の階層化とスキャナビリティ: 狭い画面での長文を避け、2段階テキスト化（Short/Full）やアイコンを併用し、直感的に情報を把握できるレイアウトを維持する。

物理的フィードバックの模倣: タップ時のスケール変化（active:scale-95）やシームレスなSPA遷移により、デジタルな「旅の記録」に触れているような質感を演出する。

4. 画像アセット生成パイプライン (Visual Asset Pipeline)
画像生成（Nano Banana 2）を用いる際は、以下の3名のエージェントを連携させて実行すること。

🎨 [Concept-Artist]
担当: ビジュアルコンセプトの策定。
任務: 「旅情と情緒」の視覚化。空気遠近法やライティングを用いた王道ファンタジーの具現化を行う。各拠点の文化（ローラン、夜刀など）に基づいた色彩設計を担当する。

🛠️ [Prompt-Engineer]
担当: 生成用プロンプトの構成。
任務: Concept-Artistの意図を、AIが最適に解釈できる英語プロンプトに翻訳する。"Cinematic lighting", "Ethereal atmosphere", "Detailed landscape" 等を用いて情緒的な質感を担保する。

🔍 [Director-Gemini]
担当: クオリティコントロールと検品。
任務: 生成された画像が仕様書のフレーバーテキストや「旅情」という情緒的基準に合致しているか最終検品を行う。不一致がある場合は修正指示を出す。

# シナリオマルチエージェントチーム

## Role: シナリオアーキテクト (The Structure Master)
- 担当: シナリオの全体構造、ノード設計(30-50)、プロットの緩急。
- 指針: プレイヤーが常に「次を知りたい」と思う引き（クリフハンガー）を各ノードに配置すること。

## Role: シナリオクロニカリスト (The World Builder)
- 担当: 歴史背景、固有名詞の設定、種族間の断絶と共生のロジック。
- 指針: 提示された作品（フリーレン、ロマサガ、FE）のエッセンスを抽出し、WD独自の神話体系へ再構築すること。

## Role: シナリオドラマティスト (The Emotion Designer)
- 担当: キャラクター描写、セリフ、情緒的な演出、二者択一の葛藤。
- 指針: ユーザーの「心が揺れる」瞬間を定義すること。特に五英霊の「去り際の台詞」には徹底的にこだわること。

## Role: シナリオメカニック (The System Balancer)
- 担当: スキル仕様の策定、バトルギミック、報酬のトレードオフ設計。
- 指針: シナリオ体験を損なわない、かつ戦略性を要求するゲームバランスを提示すること。

## Workflow Instructions
1. シナリオアーキテクトがノードの概要を構築。
2. シナリオクロニカリストがそのノードに歴史的重みを追加。
3. シナリオドラマティストがキャラクターの対話を肉付け。
4. シナリオメカニックがゲームとしての遊び（スキルや戦闘）を統合。
5. 最後に全エージェントで矛盾がないかクロスチェックを行う。

# 5. 環境分離構成 (Environment Separation)

## 環境一覧

| 環境 | ブランチ | Vercel | Supabase | Stripe |
|------|---------|--------|----------|--------|
| 本番 (Production) | `main` | Production Deploy | `zvoroixjuypnintkpmux` | Live Mode (`sk_live_`) |
| 開発 (Preview) | `develop`, `feature/*` | Preview Deploy | `drbqnpzxgcbicpritcpi` | Test Mode (`sk_test_`) |

## Git ブランチ戦略

- `main`: 本番コード。リリース準備完了のコードのみ
- `develop`: 日常の開発ブランチ。Preview Deploy で動作確認
- `feature/*`: 大きな機能開発時に `develop` から分岐（任意）
- `hotfix/*`: 本番の緊急修正。`main` に直接マージ → `develop` にも反映

## 開発→リリースフロー

```
develop で開発 → push → CI (lint+build) → Preview Deploy で確認 → main にマージ → Production Deploy
```

## 環境別制限

- `/api/debug/*` 全28ルート: `VERCEL_ENV === 'production'` で 403 を返す（本番で無効化）
- `/api/admin/kpi`: `DASHBOARD_SUPABASE_URL` 経由で常に本番DBのデータを集計（環境問わず利用可能）
- `/api/admin/reset`: 本番環境のみ（開発環境で 403）
- Google Analytics: 開発環境では `NEXT_PUBLIC_GA_ID` を空にして無効化
- ダッシュボード専用 Supabase クライアント: `src/lib/supabase-dashboard.ts` — 遅延初期化（`getDashboardSupabase()`）で環境変数をリクエスト時に読み取る

## デバッグメニュー表示ルール

- `src/app/inn/page.tsx` の `DebugPanelGate` コンポーネントで制御
- **本番** (`NEXT_PUBLIC_VERCEL_ENV === 'production'`): `localStorage` に `adminKey`（16文字以上）を持つデバッグユーザーのみ表示
- **開発/ローカル**: 全ユーザーに常時表示

## 管理ダッシュボード (`/admin/dashboard`)

- オンラインアクセス: `https://www.code-wirth-dawn.com/admin/login` から `ADMIN_SECRET_KEY` で認証
- 本番 Deploy: デフォルト Supabase が本番を指すため `DASHBOARD_*` 変数は不要
- Preview Deploy: `DASHBOARD_SUPABASE_URL` + `DASHBOARD_SUPABASE_SERVICE_ROLE_KEY` で本番データを参照

## Supabase CLI 操作時の注意

- `supabase link` で接続先プロジェクトを切り替える。**作業後は必ず本番にリンクを戻す**
- ⚠️ **`supabase link` 中に `DROP SCHEMA` 等の破壊的操作を絶対に行わない** — 誤って本番DBのスキーマを消失するリスクがある
- マイグレーション適用フローは `docs/migration-guide.md` を参照
- Supabase CLI は `npx supabase` で実行（グローバルインストールではなく npx 経由）

## DB スキーマ管理の教訓

- **PostgREST スキーマキャッシュ**: テーブル作成/変更後は `NOTIFY pgrst, 'reload schema';` を実行する。キャッシュが古いと API が 404 を返す
- **GRANT の必須性**: テーブル作成後は `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;` を実行。GRANT が無いと PostgREST がテーブルを認識しない
- **`setup_v2.sql` はベーステーブルのみ**: 全カラムを含んでいない。マイグレーションで追加されるカラムが多数あるため、新規DBには `本番スキーマダンプ → 適用` のアプローチが確実
- **本番DBのテーブル数**: 45テーブル（コードが参照する全テーブルを含む）
- **RPC 関数**: `increment_gold` のみ（`src/app/api/` から呼び出し）

## CI/CD

- GitHub Actions (`.github/workflows/ci.yml`): `develop`/`main` への push・PR で lint + build を自動実行
- Lint ステップは `continue-on-error: true` で既存コードのエラーを許容（Build が通ればOK）

## ESLint 設定の教訓

- **Next.js 16 では `next lint` コマンドが廃止**: `eslint src` を直接使用する
- **ESLint Flat Config (`eslint.config.mjs`) の `globalIgnores` に `**/*` を入れない**: 全ファイルが無視されて lint が即座に終了する
- **`eslint-config-next` 内部のプラグインルール**（`react-compiler/react-compiler`, `react-hooks/rules-of-hooks`）は外部の rules オブジェクトからオーバーライドできない。プラグインと同じ config オブジェクト内でしか上書きが効かない
- **既存コードに `any` が多数ある場合**: `@typescript-eslint/no-explicit-any` を `"warn"` にして段階的に修正する
- **CI では `continue-on-error: true`** を設定し、ビルド成功を最終判定とする（lint 警告は開発時に対応）