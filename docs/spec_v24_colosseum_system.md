# spec_v24: コロシアム（闘技場）システム仕様書

**Version**: 1.1
**Date**: 2026-06-18
**Status**: Implemented & Verified

---

## 1. 概要

エンドコンテンツとして、Hub（名もなき旅人の拠所）を除くすべての通常拠点において「コロシアム（闘技場）」機能を実装する。
プレイヤーはゴールドを消費して難易度別の勝ち抜きエネミーバトルに挑戦し、希少な報酬の獲得や他のプレイヤーとのランキング競走（勝利数・最多連勝数）を楽しむことができる。

### 1.1 基本ルール

| 難易度 | 総戦数 | エネミーパターン数 | 挑戦費用（ゴールド） | 獲得報酬量（抽選プールより） |
|:---|:---|:---|:---|:---|
| **Easy** | 5戦 | 15種類 | プレイヤーレベル × 10 G | アイテムまたはスキル1点 |
| **Normal** | 10戦 | 30種類 | プレイヤーレベル × 30 G | アイテムまたはスキル1点 |
| **Hard** | 10戦 | 30種類 | プレイヤーレベル × 50 G | アイテム1点 ＆ スキル1点 |

- **ゴールド消費**: 受注（挑戦）時に即時引き去られる。ゴールドが不足している場合は挑戦できない。
- **デッキロック**: クエスト開始時にデッキがロックされ、挑戦中はスキルの変更や装備の変更が不可となる（一般クエストと同様のQuestEngine統合）。
- **戦闘構成**: 各戦闘は難易度ごとに定義された `colosseum_enemy_groups` プールからランダムに敵グループが選出される。
- **進行ノード**: シナリオは「1戦目」「2戦目」...と進行し、最終戦に勝利すると「クリア」、途中で敗北すると「失敗」となる。
- **敗北・ギブアップ時の処理**: 敗北または途中でクエストを「ギブアップ（リタイア）」した場合、現在の連勝数（`current_streak`）は即座に `0` にリセットされ、敗北数（`losses`）が `+1` 加算される（※バトルの敗北と同一の戦績ペナルティが適用される）。

---

## 2. データベース設計 (Schema)

コロシアムの進行、統計、ランキング、および報酬制御のために以下のテーブルを追加した。

### 2.1 `colosseum_user_stats`（ユーザー戦績）
各プレイヤーのコロシアム戦績（勝利数、敗北数、現在の連勝数、過去最多連勝数）を記録する。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 `ranking_colosseum_cache`（ランキングキャッシュ）
パフォーマンスとリアルタイム更新の負荷低減のため、最大500位までのランキング情報を保持するキャッシュテーブル。

```sql
CREATE TABLE IF NOT EXISTS public.ranking_colosseum_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    avatar_url TEXT, -- ユーザーアバター画像URL
    wins INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    rank_by_wins INTEGER,
    rank_by_streak INTEGER,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3 `colosseum_enemy_groups`（出現エネミープール）
各難易度に出現する敵グループのスラッグを紐づけるマスタテーブル。Easyは15種、Normalは30種、Hardはユニークボスを含めた30種が登録される。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_enemy_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    difficulty TEXT NOT NULL, -- 'easy', 'normal', 'hard'
    enemy_group_slug TEXT NOT NULL
);
```

### 2.4 `colosseum_reward_pool`（クリア報酬プール）
コロシアムをクリアした際に抽選されるレア・限定アイテム及びスキルのマスタテーブル。各報酬には `rarity` (希少度) が定義され、排出率が重み付け制御される。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_reward_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_type TEXT NOT NULL, -- 'item', 'skill'
    reward_id TEXT NOT NULL,   -- 各マスタのID（文字列または数値文字）
    name TEXT,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'super_rare'))
);
```

---

## 3. 報酬確率システム (Weighted Probability)

ドロップアイテムおよびスキルは、難易度（Easy / Normal / Hard）ごとの確率ウェイトに基づいて個別にランダム抽選される。高難度になるほど、レア・超レア報酬の排出確率が上がる。

| 難易度 | Common（コモン） | Rare（レア） | Super Rare（スーパーレア） |
|:---|:---|:---|:---|
| **Easy** | 70% (ウェイト: 70) | 25% (ウェイト: 25) | 5% (ウェイト: 5) |
| **Normal** | 40% (ウェイト: 40) | 50% (ウェイト: 50) | 10% (ウェイト: 10) |
| **Hard** | 30% (ウェイト: 30) | 40% (ウェイト: 40) | 30% (ウェイト: 30) |

- **抽選ロジック**: `/api/quest/complete` 内にて、難易度に応じたウェイトマップを使用し、対応する報酬タイプの全プールからウェイトの総和を算出して境界値による抽選を行う。
- **Hard 2倍報酬**: Hardクリア時は、この抽選処理をアイテム・スキルそれぞれにおいて2回ずつ反復実行して付与する。

---

## 4. API エンドポイント

### 4.1 `POST /api/colosseum/start`
コロシアムの挑戦を開始する。

### 4.2 `GET /api/ranking/colosseum`
コロシアムランキングと現在ユーザーの順位をフェッチする。

### 4.3 `POST /api/battle/validate-result`（既存拡張）
戦闘終了検証時、コロシアム中のバトルであれば戦績 (`colosseum_user_stats`) を更新する。

### 4.4 `POST /api/quest/complete`（既存拡張）
- **報酬付与**: コロシアム制覇時に、報酬プールからウェイトに基づいてアイテム・スキルを抽選してユーザーに付与する。
- **戦闘検証（セキュリティ強化）**: コロシアム完了時においても、バトル検証トークン（`battle_completion_token`）による戦闘検証が必須化される。API側では、難易度（Easy/Normal/Hard）に応じた連続戦闘ノード（`colosseum_battle_1` から `colosseum_battle_N`）をモックとして構築して検証ロジックを通すことで、チートによるクリアワープや改ざんを確実に遮断する。

---

## 5. フロントエンド UI/UX

### 5.1 クエストリワードへの直接表示 (Crest integration)
獲得したランダムアイテム・スキルは、個別にバックグラウンド処理するだけでなく、ユーザーに獲得の達成感を与えるため、**クエスト完了リザルトモーダル (`QuestResultModal.tsx`) のメイン報酬枠 (ゴールドや経験値と同列のグリッドカード) として表示される**。
- 紫色のボーダーと輝くシャドウ、および種別に応じたブックアイコン (`BookOpen`) やバッグアイコン (`ShoppingBag`) を使用したカードデザインで描画される。
- クエストのリワードにアイテム・スキルしか存在しない場合であっても、報酬枠の表示がスキップされないようにハイドレーションガードを拡張した。

### 5.2 アバター表示と自己紹介ポップアップ
- ランキング一覧画面において、各プレイヤーの丸型アバター画像を表示する。
- アバター画像または名前のタップ時に、非同期で該当ユーザーのプロフィール（通り名、名前、アバター、自己紹介文）をロードし、共通コンポーネント `SimpleUserProfilePopup` をオーバーレイ表示する。

---

## 6. 6時間ごとのランキング報酬と戦績リセット (Ranking Rewards & Reset)

世界シミュレーションの更新（JST 6:00, 12:00, 18:00, 24:00）と同期して実行される Vercel Cron `/api/cron/daily-update` 内にて、コロシアムランキングの上位入賞者に対して自動で報酬を付与し、戦績をクリアする。

### 6.1 報酬体系
- **勝利数ランキング (Wins Ranking)**:
  - 1位: 10000 G
  - 2位: 5000 G
  - 3位: 1000 G
- **連勝数ランキング (Streaks Ranking)**:
  - 1位: 10000 G
  - 2位: 5000 G
  - 3位: 1000 G

*※両方のランキングで入賞した場合は、報酬が累積して付与される。*

### 6.2 順位の決定とタイ解決
- キャッシュテーブル `ranking_colosseum_cache` は集計時に PostgreSQL の `ROW_NUMBER()` 関数によって一意な順位が割り当てられており、同点（タイ）であっても重複のない「1位、2位、3位」が厳密に決定される。
- Cron 処理内では、このキャッシュテーブルから `rank_by_wins` (1〜3位) および `rank_by_streak` (1〜3位) を取得して対象ユーザーに報酬を付与する。

### 6.3 処理内容と戦績リセット
1. **ゴールド付与**: `increment_gold` RPCを使用して、アトミックにゴールドを加算。
2. **システム通知**: `notifications` テーブルに、「コロシアムランキング報酬」として付与ゴールドを明記した未読通知をインサートする。
3. **年代記記録**: プレイヤーの個人タイムライン (`user_chronicles`) に、イベントタイプ `system_reward` として「コロシアムランキング入賞」の記録をインサートする。
4. **戦績の自動リセットと表示キャッシュクリア**:
   - 報酬の配布完了直後、その時点の `ranking_colosseum_cache` の全内容を監査・問い合わせ対応用として **`colosseum_ranking_history` （履歴テーブル）に退避・コピー**する。
   - その後、`ranking_colosseum_cache`（表示キャッシュ）と `colosseum_user_stats`（戦績）のデータを全削除してクリアする。
   - これにより、リセット直後にプレイヤーがアクセスした瞬間にオンデマンドで新サイクルの集計が即座に行われる。
5. **履歴テーブルの30日保管と自動削除**:
   - 履歴テーブル `colosseum_ranking_history` のデータは、集計日時から **1ヶ月間（30日間）保存**され、Cron実行時にそれ以上古い過去レコードは自動クリーンアップされる。
6. **リセット開始時間ガード**: 誤って古い集計データを消去しないよう、現在日時が **JST 2026-06-19 12:00:00 (JST)** 以降の場合のみ、上記の削除クエリ（リセット）を実行するガード条件を設ける。

---

## 7. 環境分離と露出制御 (Environment Separation)

コロシアム機能の一般公開前の検証および先行運用のための露出制御を行う。

### 7.1 表示フィルタリング
- **プレビュー・開発環境** (`NEXT_PUBLIC_VERCEL_ENV === 'preview'` または `process.env.NODE_ENV === 'development'`):
  - 拠点（宿屋）の施設グリッドに「コロシアム」ボタンを表示し、アクセス可能とする。
- **本番環境** (`NEXT_PUBLIC_VERCEL_ENV === 'production'`):
  - 拠点（宿屋）の施設グリッドから「コロシアム」ボタンを完全に排除（非表示）し、一般ユーザーからのアクセスを遮断する。

---

## 8. 重複スキル報酬の交易品置き換え (Duplicate Skill Replacement)

コロシアムのクリア報酬（および一般クエスト報酬）において、既に習得済みのスキルが抽選で出た場合の救済措置。

### 8.1 置き換えロジック
- クエスト完了処理内にて、抽選されたスキルIDが既に `user_skills` に登録されているかを検証。
- 登録済み（重複）の場合：
  - 該当スキルの登録およびリザルトモーダルへのそのままの表示をスキップ。
  - データベースの `items` テーブルから `type = 'trade_good'` (交易品) のアイテムをランダムに1点抽選。
  - 抽選された交易品をインベントリに 1 個付与し、図鑑登録履歴 (`user_item_history`) に記録。
  - クエスト結果画面 (`QuestResultModal.tsx`) での表示用配列 `lootSaved` に対し、名称を `[交易品名] (スキル重複変換)`、タイプを `item` としてプッシュし、プレイヤーに重複変換されたことを視覚的にフィードバックする。

---

## 9. 拠点UIの再配置とチュートリアルアピール (UI Layout & Gossip Iconification)

コロシアムの導線を確保しつつ、初心者向けチュートリアルの視認性を維持するためのUI再配置。

### 9.1 レイアウト変更
- **施設グリッド (FacilityGrid)**:
  - 従来の「街の噂話」スロットから噂話ボタンを撤去し、代わりに「コロシアム」ボタンを配置する（本番環境では前述の環境分離フィルタリングにより非表示となるため空スロット化または他ボタンで埋める）。
- **キービジュアルエリア (MainVisualArea)**:
  - 街の噂話（Gossip）は、キービジュアル（背景イラスト）の右下に浮かぶ地図（コンパス）アイコンの「左隣」に、吹き出し風アイコン (`MessageSquare`等) を用いた丸型フローティングボタンとして再配置する。

### 9.2 チュートリアルアピール (Onboarding Highlight)
- 新規プレイヤー作成直後のチュートリアル中、システムが「街の噂話」を推奨しているフラグ（`recommendedFacility === 'gossip_and_map'` または `recommendedFacility === 'gossip'`）を検知した場合、キービジュアル内に新設された「街の噂話」アイコンも、地図アイコンと同時にバウンス（弾むアニメーション）および光るエフェクト（パルス）を適用し、ユーザーに対して強力にアピールする。これにより、チュートリアル導線の実装漏れを防ぎ、確実に進行をナビゲートする。

---

## 10. 検証用アカウントのランキング除外 (Verification Account Exclusion)

本番環境の機能検証に使用される管理者・検証用アカウント（きたむアカウント）は、一般のプレイヤー同士のランキング競争を阻害しないため、コロシアムランキングの集計対象から除外される。

### 10.1 対象アカウントID
- **新ID**: `5ad434ec-763f-473e-939f-14a5e9e1cc93`
- **旧ID**: `c1cf67dd-527a-497e-bf88-ce10c2cb516f`

### 10.2 除外処理の実装
1. **APIフィルタリング**:
   - `/api/ranking/colosseum` API のレスポンス返却前に、`winsRanking` と `streakRanking` から対象の `userId` を配列フィルタリングで排除する。
2. **データベース上のレコードクリア**:
   - テスト運用の過程で一時的に作成された `colosseum_user_stats` および `ranking_colosseum_cache` 内の該当IDの戦績・キャッシュレコードは、データベースメンテナンス用スクリプト等を通じて完全に削除する。

