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
1. **登録ユーザー**: 累計プレイヤー数（平均レベルを表示）[初期ロード]。
2. **月間アクティブ (MAU)**: 直近30日間のユニークアクティブユーザー数（対登録ユーザーのアクティビティ率を表示）[初期ロード]。
3. **月間課金者 (MPU)**: 直近30日間のユニーク課金ユーザー数（対登録ユーザーの課金転換率を表示）[初期ロード]。
4. **総クエスト回数**: クエスト行動ログから算出された、これまでに開始された全クエスト数 [遅延ロード (個別取得ボタンによる非同期フェッチ)]。
5. **総戦闘回数**: これまでに行われた全戦闘数（平均プレイヤー勝率を表示）[遅延ロード (個別取得ボタンによる非同期フェッチ)]。
6. **ゴールド流通**: 全プレイヤーが所持しているゴールドの総量（1人あたりの平均所持ゴールドを表示）[遅延ロード (個別取得ボタンによる非同期フェッチ)]。

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

### 3.3 `colosseum_activity_logs` (コロシアム行動ログ)
コロシアムの挑戦ライフサイクル（開始、完了、放棄/失敗）を記録し、ダッシュボードのコロシアム集計、クリア率の算出、およびDAU/MAU集計に使用します。
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key -> auth.users)
* `difficulty` (TEXT) : `'easy'`, `'normal'`, `'hard'`
* `action` (TEXT) : `'start'` (受注時), `'complete'` (制覇クリア時), `'abandon'` (途中リタイア・戦闘敗北時)
* `gold_cost` (INTEGER) : 挑戦時に消費されたゴールド額（`action = 'start'` の時のみ記録）
* `created_at` (TIMESTAMP WITH TIME ZONE)

### 3.4 `academy_pack_logs` (魔術学院パック購入ログ)
魔術学院でのパック（スキルカード）購入ライフサイクルログを記録し、ダッシュボードでのゴールド回収およびパック回転数分析に使用します。
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key -> auth.users)
* `pack_series` (TEXT) : パックのシリーズ識別名（例: `'chaos_and_rebellion'`）
* `gold_spent` (INTEGER) : 重複によるキャッシュバック返還後の実質消費ゴールド額
* `refund_gold` (INTEGER) : 重複カードによるキャッシュバック（返還）ゴールド額
* `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 4. バックエンド API 仕様

### 4.1 `GET /api/admin/kpi`
管理者向けKPIおよび集計データを返却するメインAPI。データベース負荷によるタイムアウトを回避するため、カテゴリ別の遅延非同期ロードに対応しています。

* **クエリパラメータ**:
  * `days` (数値, 任意) : 過去何日分の日別データを取得するか（デフォルト: `30`）。
  * `category` (文字列, 必須) : 取得対象のKPIカテゴリ。
    - `summary` : アカウント基本概要（登録数、MAU/MPU、サブスク/レベル分布、直近売上）
    - `daily` : 日次時系列KPI（チャート・数値テーブル用）
    - `quests` : クエスト受注/クリア統計（総クエスト回数 `totalQuests` も内包）
    - `colosseum` : 闘技場（コロシアム）アクティビティ統計
    - `academy` : 魔術学院パック購入統計
    - `monthly` : 月次時系列KPI（月次テーブル用）
    - `battles` : 全期間の累計戦闘回数および勝率のオンデマンド取得
    - `gold` : 全期間のゴールド流通総量および平均所持高のオンデマンド取得
* **ヘッダー制限**:
  * `x-admin-key` の照合が必須。
* **主要処理ロジック**:
  1. `category` ごとに独立したデータベースアクセスブロックへルーティング。必要な軽量クエリのみをピンポイントで実行。
  2. `category = summary` では、重い `SUM(gold)` や `SUM(total_battles)` 等の全件集計をスキップし、レスポンス速度をミリ秒に維持。
  3. `category = battles` または `gold` のリクエスト時にのみ、対応するビューに対する集計クエリを実行して返却。
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
* **コロシアム統計 (Colosseum KPI) の算出**:
  - `get_colosseum_summary_stats()` RPCを使用して、全期間の累計挑戦プレイヤー数 (`total_players`)、総挑戦数 (`total_battles` = 挑戦数)、総クリア数 (`total_wins` = クリア数)、今期最高連勝 (`max_streak`)、累計回収ゴールド (`total_gold_spent`) を一括でフェッチし、制覇率（クリア率）を `total_wins / total_battles * 100` で計算します。
  - `get_colosseum_daily_stats(days_limit)` RPCを使用して、直近 `days` 日間の日別・難易度別の開始数・クリア数・放棄数・回収ゴールドを集計します。
* **魔術学院統計 (Academy KPI) の算出**:
  - `get_academy_summary_stats()` RPCを使用して、全期間の累計購入プレイヤー数 (`total_players`)、総パック購入数 (`total_packs`)、累計回収ゴールド (`total_gold_spent` = 実質消費ゴールド)、累計返還ゴールド (`total_refund_gold`) を一括でフェッチします。
  - `get_academy_daily_stats(days_limit)` RPCを使用して、直近 `days` 日間の日別・シリーズ別の購入数・実質消費ゴールド・返還ゴールドを集計します。

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

### 5.3 Stripe決済連携とダッシュボード集計改善における教訓
* **Webhookの冪等性完了コミット化**: Stripe WebhookでのイベントID挿入タイミングは処理の「最後」に行うことで、途中エラー時の再試行を阻害しない設計とする。
* **外部決済ID格納用主キーのデータ型整合性**: StripeセッションID等の文字列を格納するため、`payment_logs.id` は `TEXT` 型として定義する。
* **JST（UTC+9）タイムゾーン考慮**: 日付集計時はUTC日時に対して9時間の加算処理を行ってからグループ化を行い、午前中の売上や登録数が前日扱いになる不整合を防ぐ。
* **Supabase 1000行上限の回避**: KPI集計APIでは `.range` を用いた `fetchAll` 再帰取得ロジックを用いて、1000件以上のデータが正しく取得できるようにする。
* **トップサマリーのMAU/MPU集約**: 日次（DAU/DPU）のブレに左右されない経営判断のため、トップの主要指標には「月間アクティブ (MAU)」と「月間課金者 (MPU)」を採用し、デイリーは下部の詳細分析チャート等で確認するUI構成とする。
* **クエスト進捗（完了・失敗）ログの記録網羅性**: ユーザー個人用履歴（`user_chronicles`）とは別に、ダッシュボード集計用の行動ログ（`quest_activity_logs`）に対しても、受注時（`start`）だけでなく完了時（`complete` での成功、あるいは戦闘敗北やリタイアによる `abandon`）のログ書き込みを漏れなく実装し、ダッシュボードの集計値に不整合が生じないようにする。また、この KPI ログの書き込み失敗によってゲーム本編の完了処理（報酬付与等）がクラッシュしないよう、適切な try-catch によるエラーハンドリングを適用する。

### 5.4 6時間周期リセット下でのコロシアム集計とインデックス最適化
* **リセットを考慮したソース選定**: 6時間ごとに `colosseum_user_stats` のレコードがリセット（全削除）される仕様となったため、累計指標（総プレイヤー数、挑戦数、クリア数など）を `colosseum_user_stats` から集計するとデータが消失します。そのため、これらの累計指標は永続的なログテーブルである `colosseum_activity_logs` から集計する方式に変更し、連勝数のみリセット後の値として `colosseum_user_stats` から取得します。
* **Index Only Scanによる負荷削減**: DAU/MAUやダッシュボードでの開始/完了アクションの頻繁な集計において、DBスキャン負荷を最小化するため、`colosseum_activity_logs` に `(action, created_at)` の複合インデックスを追加します。これにより、テーブルのテーブルフルスキャンを避け、インデックス内の情報のみでスピーディに集計を完了させる設計とします。
* **データ不在難易度の表示保証**: ログテーブルを直接 `GROUP BY` すると、ログが1件もない難易度（例: 実装直後のHardなど）が表示されなくなります。これを防ぐため、固定の難易度リスト（Easy/Normal/Hard）にログテーブルを `LEFT JOIN` するビュー定義を採用し、常に全難易度がダッシュボードに0件から表示されるようにします。
* **失敗ログの網羅記録**: コロシアム挑戦中の戦闘で敗北して終了した際にも、`/api/quest/complete` の失敗パスにおいて `colosseum_activity_logs` に `action: 'abandon'` のログを書き込むよう実装します。これにより、ダッシュボードの「総挑戦数」と「完了数＋放棄数」の不整合（開始数だけが異常に増え続ける不具合）を完全に防ぎます。

### 5.5 魔術学院の重複返還考慮とインデックス最適化
* **実質消費とキャッシュバックの分離**: 魔術学院では、すでに所持しているスキルカードが重複して排出された場合、1枚あたり 500 G がその場でキャッシュバック（返還）されます。このため、ダッシュボードで正確な「実質ゴールド消費（ゲーム内からのゴールド回収）」を追跡できるよう、ログには額面上の価格ではなく、キャッシュバック返還後の純粋なゴールド消費額（`gold_spent`）と、返還されたキャッシュバック額（`refund_gold`）を分けて記録し、合算・可視化を行っています。
* **複合インデックスによるIndex Only Scan**: 日次およびシリーズ別のパック購入数推移を無駄なテーブルスキャンなしで高速に処理するため、`(pack_series, created_at)` に対する複合インデックスを適用しています。これにより、レコード件数が増大した場合でも、テーブル実データへのアクセスをスキップし、インデックス内の情報だけで高速に `GROUP BY` 集計（Index Only Scan）を終わらせることができ、DB負荷の増加を完全に防ぐことができます。

