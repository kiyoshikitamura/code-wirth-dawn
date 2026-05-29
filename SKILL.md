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

## DB 接続の教訓

- **直接DB接続 (`db.*.supabase.co:5432`) はIPv6のみ**: このネットワーク環境では `getaddrinfo ENOTFOUND` エラーが出る。Node.js の `dns.setDefaultResultOrder('ipv4first')` や `--dns-result-order=verbatim` でも解決しない（IPv4 Aレコード自体が存在しない）
- **Supabase Pooler (`aws-0-ap-northeast-1.pooler.supabase.com`) も利用不可**: `(ENOTFOUND) tenant/user not found` エラー。開発プロジェクトではPoolerが有効化されていない可能性
- **マイグレーション実行手順**: ネットワーク制約により、`Supabase Dashboard → SQL Editor` での手動実行が最も確実。ファイルをクリップボードにコピーして貼り付ける方式を採用
- **DB URL 情報**: 
  - 本番: `postgresql://postgres:[PASS]@db.zvoroixjuypnintkpmux.supabase.co:5432/postgres`
  - 開発: `postgresql://postgres:[PASS]@db.drbqnpzxgcbicpritcpi.supabase.co:5432/postgres`

## Supabase SQL Editor の教訓

- **Partial Index (`WHERE` 句付き `CREATE INDEX`) がパースエラーになる場合がある**: `WHERE status = 'published'` のような構文で `syntax error at or near "published"` が発生。原因は SQL Editor のパーサーのクォート処理の互換性問題
- **回避策**: Partial Index を使わず、複合インデックス `(status, column)` に変更する。例: `CREATE INDEX idx ON tbl(status, published_at DESC)` — パフォーマンスは若干劣るが互換性が高い
- **クリップボードコピー時**: `[System.IO.File]::ReadAllText(path, [System.Text.Encoding]::UTF8) | Set-Clipboard` でUTF-8を明示してコピーする。PowerShell の `Get-Content | Set-Clipboard` ではエンコーディングが変わる場合がある

## UGC v2 アーキテクチャの教訓

- **完全テーブル分離**: `ugc_scenarios`, `ugc_enemies`, `ugc_items`, `ugc_cards`, `ugc_npcs`, `ugc_rate_limits` の6テーブル。公式テーブル (`scenarios`, `enemies` 等) とは JOIN しない設計
- **UGCクエスト識別**: クエスト開始/完了APIで公式 `scenarios` → UGC `ugc_scenarios` の順にフォールバック検索。`is_ugc_v2` フラグで識別
- **UGCエネミー解決**: `ScenarioEngine` の battle ノードで `enemyData` (インライン定義) を JSON 文字列化 → `QuestPage` の `startBattle` で JSON パースして `Enemy` オブジェクトを直接構築（DB参照なし）
- **RPC関数**: `increment_ugc_play_count`, `increment_ugc_clear_count` — `SECURITY DEFINER` でRLSをバイパスし、APIサーバーからService Role Keyで呼び出す
- **コレクション機能への影響**: UGCテーブルは完全分離のため、既存のコレクション機能は改修不要

## Supabase PostgREST JOIN の教訓

- **FK が存在しない JOIN は PGRST200 エラーになる**: `user_skills → cards!inner(name)` のように、テーブル間に直接的な Foreign Key が存在しない JOIN を指定すると `PGRST200: Could not find a relationship between 'X' and 'Y' in the schema cache` エラーが返る。正しい FK 経路を経由する必要がある（例: `user_skills → skills!inner(cards!inner(name))`）
- **Vercel サーバーレス環境ではエラーの伝播が異なる場合がある**: ローカルでは `{ data: null, error: {...} }` として静かに返るエラーが、Vercel ランタイムでは例外として throw され、`try/catch` の想定範囲を超えて上位の処理全体をクラッシュさせることがある。結果として、エラーと無関係に見える機能（例: NPC表示）が巻き添えで動作しなくなる
- **サイレントエラーの防止**: `Promise.all` で並列取得した結果の `.error` プロパティを必ずチェックし、ログに出力する。片方のクエリ失敗がもう片方の正常データも巻き込んで消失させるパターンに注意

## テーブルスキーマとクエリの整合性の教訓

- **`acquired_at` vs `created_at` のカラム名不一致**: マイグレーションで定義したカラム名（`created_at`）と、APIクエリで参照するカラム名（`acquired_at`）が一致しないと、Supabase は `42703: column does not exist` エラーを返す。このエラーは `{ data: null }` として静かに処理され、関連データが丸ごと消失する
- **マイグレーション作成時のルール**: テーブル作成・再作成のマイグレーションを書いた後は、そのテーブルを SELECT するすべての API ルートを grep で洗い出し、カラム名の整合性を必ず確認する。特に `INSERT` 側で修正したカラム名が `SELECT` 側に反映漏れするケースが多い
- **国名表記の統一**: 「マーカンド連邦」は誤り。常に「砂塵の王国マルカンド」で統一すること

## NPC シード運用の教訓

- **シードデータの投入方法**: Vercel プレビュー環境は認証保護されているため、`/api/debug/seed-npcs` を外部から `curl` / `Invoke-WebRequest` で呼べない。代替として Supabase クライアントで直接DBに upsert するスクリプト（`scratch/` 配下）を使用する
- **シードスクリプトの upsert キー**: `npcs` テーブルは `slug` を `onConflict` キーとして upsert する。`id` は UUID のため CSV の連番とは一致しない
- **本番 / プレビュー DB の両方にシード必要**: 環境分離により DB が異なるため、シードは各環境ごとに個別実行する。実行後は一時スクリプトと `.env.production.local` を必ず削除する

## コレクション機能とスキーマ不一致の教訓

- **スキーマ定義の厳密な確認**: `enemies` テーブル等で `reward_exp` / `reward_gold` カラムが実装されており、API側で `exp_reward` / `gold_reward` を誤って参照していると、DBエラー（カラム未存在）によりAPI全体が 500 エラーとなる。クエリ作成時は実際のデータベーススキーマと正確に比較すること。
- **リレーション未定義カラムの動的ルックアップ**: テーブルに直接含まれていない情報（例: エネミーのドロップアイテムの「名前」など、DB内には `drop_item_slug` のみが存在し `drop_item_name` カラムが存在しないケース）を返却する場合、DBレベルの複雑なJOINやスキーマ追加を避けるため、同じリクエストで取得したマスタデータ（`items` 等）のマップをメモリ上に構築し、`drop_item_slug` をキーに動的ルックアップするアプローチが安全かつ効率的である。

## 暗色テーマUIの視認性（コントラスト）の教訓

- **可読性の確保**: 暗色の背景（`#0d1a2e` など）において、`text-gray-600` や `text-gray-700` を用いた文字・記号（`No.0001` や `─────` などのプレースホルダー）は、PCディスプレイなどの環境でコントラスト比が極めて低くなり視認困難になる。これらは `text-slate-400` や `text-slate-500` のような一段階明るいカラーに変更し、アクセシビリティと可読性を確保すること。

## プレイガイド機能の動的マークダウンレンダリングの教訓

- **共通レイアウト・ロジックの再利用**:
  - 新たなプレイガイドページ（例: `/play-guide/ugc`）を追加する際、個別のページでマークダウンパーサーを独自実装するのではなく、既存の `PlayGuideView` コンポーネントに `docs/*.md` を読み込んで渡す方式を採用することで、スタイルの一貫性（スクロール追従、リストやテーブルのCSS、検索キーワードハイライトなど）が自動的に維持される。
  - `PlayGuideView` は `content` と `searchQuery` を受け取り、内部で適切にサニタイズ・レンダリングを行うため、新規ページ側ではサーバーサイドで `fs.readFileSync` を用いてファイルを読み込み、それを props で渡すだけで完結する。
- **ナビゲーションとUIデザインの一貫性**:
  - ページ間（例: クリエイターズ工房 `/workshop` からのUGCプレイガイド）の導線を追加する際、既存の共通ヘッダー等のレイアウトを崩さないよう配置する。
  - ナビゲーションボタンはゲーム世界観に合わせたカラーパレット（ブラウン `#4e2f1d` / ゴールド `border-[#a38b6b]/40` など）を用い、視覚的に浮かないようにする。

## パフォーマンス最適化の教訓

- **ウォーターフォール・フェッチの回避**:
  - クライアント側で複数のAPIを逐次呼び出す（`await fetchA(); await fetchB(); await fetchC();`）パターンは、各リクエストのRTTが累積し深刻な遅延を招く。独立したデータ取得は `Promise.all` で並列化するか、サーバーサイド統合API（`/api/init-page` 等）で1リクエストにまとめること。
  - 特にInnページのような多数のデータソースを必要とするページでは、統合APIパターンが最も効果的。

- **コード分割（Code Splitting）の徹底**:
  - モーダルやダイアログ等、ユーザー操作時にのみ表示されるコンポーネントは、`next/dynamic` + `{ ssr: false }` で遅延ロードすること。静的importは初期バンドルサイズを不必要に肥大化させる。
  - デバッグ用パネル（QuestTestPanel等）は本番ビルドに含めないか、`next/dynamic` で完全に分離すること。

- **APIルートの認証パターン**:
  - すべてのユーザー固有データを扱うAPIルートでは、`createAuthClient(req)` でJWTからユーザーIDを取得すること。リクエストBody/クエリパラメータからのユーザーID受け取りは認証として無効であり、他ユーザーのデータ操作を許してしまう。
  - APIルート内でのDB操作は、`select('*')` を避け、必要なカラムのみを明示的に `select('col1, col2, col3')` で取得すること。特に `script_data` 等のJSON blobカラムを含むテーブルでは転送量に大きな差が出る。

- **N+1クエリの回避**:
  - ループ内での個別DB更新（`for (const item of items) { await db.update(...).eq('id', item.id); }`）は、`.in('id', ids)` を用いたバッチ更新に置き換えること。

## Google認証後のセッション確立遅延とAPI認証の教訓 (v27.3)
- **非同期セッション確立のタイムラグとクライアントガードの設計**: Google OAuth認証直後、SDKが認可コード（`code`）をセッションに交換し `localStorage` へ永続化するまでには微小な遅延がある。この過渡期にクライアント側ガード（`useAuthGuard`）で `supabase.auth.getUser()` (Authサーバーへの通信検証) を実行すると、競合により一時的に検証に失敗し、タイトル画面へ誤リダイレクトされる原因となる。
- **クライアント側ガードには getAuthToken を使用**: `useAuthGuard` のようなフロントエンド用の遷移ガードは、生の `supabase.auth.getSession()` を直接呼ぶと、App Router移行期等のハイドレーション時に `localStorage` 同期が間に合わず一時的に `null` を返す競合が起きる。APIコールと完全に一元化された **`getAuthToken()`** を呼び出すことで、メモリ内の有効なセッション（JWTキャッシュ）を直接参照して競合を防ぐ設計にすること。
- **サーバーサイドでの明示的トークン検証**: サーバーサイドAPI（`/api/init-page` 等）で `createAuthClient` を用いる際、 `supabase.auth.getUser(token)` のようにAuthorizationヘッダーから取得したトークンを明示的に引数に渡して呼び出すこと。引数なしで呼び出すと、サーバーレス環境のメモリ内にセッションが存在しないため、認証を誤判定することがある。
- **認証エラー判定の緩和**: 認証確立の過渡期に発生する、動作に影響のない警告エラーなどでAPIを遮断してタイトルに戻してしまわないよう、認証可否の最終判断は `!user`（ユーザーの存在有無）のみを基準とすること。


