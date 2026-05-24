# spec_v22_admin_dashboard.md: 管理者用ダッシュボード（管理画面）仕様書

## 1. 基本仕様 & アクセス制御

### 1.1 アクセスURL
* **ダッシュボード画面**: `/admin/dashboard`
* **ログイン画面**: `/admin/login`

### 1.2 認証・認可フロー
* ログイン画面にて入力された管理用秘密鍵（Admin Key）は、クライアントブラウザの `localStorage`（キー名: `adminKey`）に保存されます。
* ダッシュボードからのすべてのAPIリクエストのカスタムヘッダー `x-admin-key` にこの鍵が付与されます。
* サーバーサイドのAPIルートにおいて、受信したヘッダー値と環境変数 `ADMIN_SECRET_KEY` を照合し、一致しない場合は `401 Unauthorized` を返します。

---

## 2. 画面構成とUIコンポーネント

管理画面はダークモード（`#070d19`）を基調としたガラスモルフィズム風のプレミアムデザインを採用しています。

### 2.1 ヘッダー (Header)
* **戻るボタン**: タイトル画面（`/title`）へ遷移します。
* **ダッシュボードタイトル**: 現在稼働中のゲーム名「Code: Wirth-Dawn — Admin Dashboard」を表示。
* **テストデータ初期化ボタン**: データベースのゲーム進行関連・認証関連テーブルのレコードを一括消去する確認モーダルを起動します。
* **ログアウトボタン**: ローカルの `adminKey` を消去し、ログイン画面へリダイレクトします。

### 2.2 サマリーカード (6枚の主要指標カード)
1. **登録ユーザー**: 累計プレイヤー数（平均レベルを表示）。
2. **アクティブ状況 (DAU/MAU)**: 当日のDAUと直近30日のMAU（アクティブ率を表示）。
3. **課金ユニーク (DPU/MPU)**: 当日の課金者数と直近30日の課金者数（課金者率を表示）。
4. **総クエスト回数**: クエスト行動ログから算出された、これまでに開始された全クエスト数。
5. **総戦闘回数**: これまでに行われた全戦闘数（平均プレイヤー勝率を表示）。
6. **ゴールド流通**: 全プレイヤーが所持しているゴールドの総量（1人あたりの平均所持ゴールドを表示）。

### 2.3 チャート・セクション (Main Charts)
* **期間選択セレクトボックス**: 表示およびCSV出力の集計日数範囲を切り替えます。
  * 選択可能範囲: **30日間**（デフォルト） / **90日間** / **180日間** / **365日間**
* **メトリクス切り替えタブ**:
  * **ユーザー登録**: 日別の新規登録ユーザー数推移（青色・折れ線グラフ）
  * **バトル統計**: 日別の戦闘結果割合（勝利:緑、敗北:赤、逃亡:紫の積み上げ棒グラフ）
  * **アクティブUU**: 日別のDAU（緑色・実線）およびMAU（ there 6366f1 の紫色・破線）の同時推移（折れ線グラフ）
  * **課金決済**: 日別のStripe決済売上総額推移（黄色・棒グラフ）
* **CSV出力ボタン**: 現在選択している期間分（30〜365行）のデータをCSVファイルで出力します。
* **ツールチップ (Tooltip)**: グラフ上にマウスカーソルを移動させると、その日付の具体的な実数値（新規ユーザー数、DAU/MAU、戦闘内訳、売上金額とDPU/MPUなど）が浮かび上がります。

### 2.4 サイド・パネル (Side Cards)
* **売上・課金集計カード**:
  * 総売上金額（円）
  * サブスクリプション売上総額および決済件数
  * 追加ゴールド都度購入売上総額および決済件数
  * 総チャージゴールド（ユーザーに付与された有償ゴールド総額）
* **サブスクリプション加入状況**:
  * プレイヤーのサブスクプラン（Free / Basic / Premium）の分布人数と割合バー。
* **プレイヤーレベル分布**:
  * プレイヤーの現在レベル帯（1-5 / 6-10 / 11-15 / 16+）の分布人数と割合バー。

### 2.5 全クエスト詳細分析テーブル
* システム内の全クエスト（シナリオ）におけるアクティビティを集計し、開始回数が多い順にソートしてスクロール可能なテーブルで一覧表示します。
  * **カラム**: ID、クエスト種別（メイン/サブ/UGC/イベント等）、タイトル、実行数（開始数）、クリア数（成功数）、放棄数（失敗/リタイア数）、クリア率（成功数 ÷ 開始数 %）
  * クリア率に応じて視覚的な色分けバッジを表示します（80%以上: 緑、50%以上: 黄、50%未満: 赤、未挑戦: グレー）。

---

## 3. データベース設計（KPI関連）

ダッシュボードで正確なアクティビティおよび決済分析を行うため、以下の2つの行動・トランザクション履歴テーブルを使用します。

### 3.1 `quest_activity_logs` (クエスト行動ログ)
クエストのライフサイクルログを記録し、クエスト別のクリア率の算出に使用します。
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key -> auth.users)
* `scenario_id` (BIGINT, Foreign Key -> scenarios)
* `action` (TEXT) : `'start'` (受注時), `'complete'` (クリア時), `'abandon'` (放棄/ゲームオーバー時)
* `created_at` (TIMESTAMP WITH TIME ZONE)

### 3.2 `payment_logs` (決済ログ)
決済成功時にStripeのWebhookから書き込まれ、売上および有償UUの算出に使用します。
* `id` (TEXT, Primary Key - StripeのセッションID等)
* `user_id` (UUID, Foreign Key -> auth.users)
* `amount` (INTEGER) : 決済日本円金額
* `gold_amount` (INTEGER) : 付与された有償ゴールド数
* `type` (TEXT) : `'subscription'` (サブスク加入), `'gold_purchase'` (都度購入)
* `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 4. バックエンド API 仕様

### 4.1 `GET /api/admin/kpi`
管理者向けKPIおよび集計データを返却するメインAPI。

* **クエリパラメータ**:
  * `days` (数値, 任意) : 過去何日分の日別データを取得するか（デフォルト: `30`）。
* **ヘッダー制限**:
  * `x-admin-key` の照合が必須。
* **主要処理ロジック**:
  1. `user_profiles` から全ユーザーのアクティブ判定（`updated_at`）、サブスクプラン、所持ゴールド、レベルを集計。
  2. `battle_sessions` から日別の戦闘回数および勝敗数を集計。
  3. `quest_activity_logs` から日別のクエスト開始UU・回数、およびクエストごとの完了状況を集計。
  4. `payment_logs` から日別の決済総額、決済タイプ別件数、および日別の課金UUを集計。
  5. 過去 `days` 日間の日付リストを作成し、各日付ごとにDAU、MAU、売上額、DPU、MPU等をマッピングして返却。
* **月間アクティブ (MAU/MPU) の算出**:
  各日付において、**「その日を含めた過去30日間のユニークユーザー数」**を以下のヘルパー関数でスライディングウィンドウ方式で集計します。
  ```typescript
  const getUniqueUsersInWindow = (activityMap: { [key: string]: Set<string> }, targetDateStr: string, windowDays: number = 30): number => {
      const targetDate = new Date(targetDateStr);
      const uniqueUsers = new Set<string>();
      for (let i = 0; i < windowDays; i++) {
          const d = new Date(targetDate);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const usersOnDay = activityMap[dateStr];
          if (usersOnDay) {
              usersOnDay.forEach(uid => uniqueUsers.add(uid));
          }
      }
      return uniqueUsers.size;
  };
  ```

### 4.2 `POST /api/admin/reset`
テストデータを一括初期化し、開発環境のリセットを行うためのAPI。

* **物理削除の順序（外部キー制約の回避）**:
  テーブル間のリレーション（`Foreign Key Constraint`）により、親テーブルを先に消去しようとするとエラーが発生します。そのため、以下の順序で依存関係の深い子テーブルから順に物理削除を実行します。
  1. `quest_activity_logs` (クエスト行動ログ - 子)
  2. `payment_logs` (決済ログ - 子)
  3. `prayer_logs` (お祈りログ - 子)
  4. `party_members` (パーティメンバー - 子)
  5. `adventurer_parties` (パーティ - 親/子)
  6. `character_skills` (キャラスキル - 子)
  7. `character_equipments` (キャラ装備 - 子)
  8. `character_items` (キャラアイテム - 子)
  9. `adventurer_characters` (キャラクター - 親/子)
  10. `user_profiles` (ユーザープロフィール - 親)

---

## 5. Key Information (KI) / 実装上の重要ナレッジ

### 5.1 Excel 文字化け防止対策 (UTF-8 BOM)
日本語Windows環境のMicrosoft Excelは、通常のUTF-8で出力されたCSVを開くとマルチバイト文字（日本語）が文字化け（Mojibake）します。これを完全に防ぐため、JavaScript側でCSVファイルを生成する際、ファイルの先頭に **BOM（Byte Order Mark）: `0xEF, 0xBB, 0xBF`** を手動で付与します。
```typescript
// UTF-8 BOM を配列の先頭に追加して Blob を作成
const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
```

### 5.2 SVGグラフの動的リサイズ＆ホバー重複回避
表示日数が「30日」「365日」と大きく変動するため、静的な位置指定（`x - 10` 等）ではガイドホバーの当たり判定が重複し、カーソルを合わせた日付とは別の日付のツールチップが表示されてしまいます。これを解決するため、以下の動的計算式を導入しています。

1. **カラム全体の等幅分割 (`colWidth`)**:
   グラフの描画可能領域幅（`svgWidth - padding * 2`）をデータ数で等割し、ホバー当たり判定用の透明な `rect` の幅および基準点に使用します。
   ```typescript
   const colWidth = (svgWidth - padding * 2) / Math.max(1, dailyKPI.length);
   // ガイドホバーの当たり判定領域
   <rect
       x={x - colWidth / 2}
       y={padding}
       width={colWidth}
       height={svgHeight - padding * 2}
       fill="transparent"
   />
   ```
2. **棒グラフの幅 (`barWidth`) の極小スケーリング**:
   データ数が多くなると棒がはみ出る・重なる問題を回避するため、カラム幅から20%（最大）の余白を引き、かつ最低 `1px` の幅を保証するように動的スケーリングさせます。これにより、365日表示でも1ピクセルの極細バーとして綺麗に描画されます。
   ```typescript
   const barWidth = Math.max(1, colWidth - Math.max(1, colWidth * 0.2));
   ```
3. **ゼロ除算回避 (`divisor`)**:
   データ数が1個以下の極端な状況下で `(dailyKPI.length - 1)` が `0` となり `Infinity` が発生するのを防ぐため、除数を安全にフォールバックします。
   ```typescript
   const divisor = dailyKPI.length > 1 ? dailyKPI.length - 1 : 1;
   const x = padding + (i / divisor) * (svgWidth - padding * 2);
   ```
