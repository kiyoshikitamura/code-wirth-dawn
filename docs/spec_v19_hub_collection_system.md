# spec_v19: ハブ施設拡張仕様（コレクション/クエストリスト/ランキング）

**Version**: 1.0
**Date**: 2026-05-15
**Status**: Approved & Implemented (Collection/Quest Log), In Progress (Ranking)

---

## 1. 概要

名もなき旅人の拠所（ハブ）に以下3つの閲覧機能を追加する。
いずれも **閲覧専用**（ゲーム進行への影響なし）の情報表示施設。

| 施設 | FacilityType | 目的 |
|:---|:---|:---|
| コレクション | `collection` | エネミー/アイテム/スキル図鑑 |
| クエスト記録 | `questLog` | 全クエストの達成状況一覧 |
| ランキング | `ranking` | 名声/アライメント競争ランキング |

### 1.1 拡張性

ハブ施設は `FacilityGrid.tsx` の `hubFacilities` 配列に追加するだけで動的に増やせる設計。
新規施設追加時のチェックリスト:
1. `FacilityType` union型に追加
2. `hubFacilities` 配列にエントリ追加
3. `inn/page.tsx` の `handleSelectFacility` と modal rendering に分岐追加
4. 対応するモーダルコンポーネントを作成

---

## 2. コレクション（図鑑）

### 2.1 API

**`GET /api/collection`** — 認証必須

エネミー/アイテム/スキルのマスターデータと、ユーザーの解放状況を返す。

| データ | マスターテーブル | 解放判定テーブル |
|:---|:---|:---|
| エネミー | `enemies` | `user_bestiary` (enemy_id) |
| アイテム | `items` | `user_item_history` (item_id) |
| スキル | `skills` | `user_skills` (skill_id) |

**解放ルール**: 未解放エントリはID + slugのみ返却。名前・詳細・ステータスは `null`。

### 2.2 記録タイミング

| イベント | テーブル | 実装箇所 |
|:---|:---|:---|
| バトル開始 | `user_bestiary` | `api/battle/start/route.ts` |
| ショップ購入 | `user_item_history` | `api/shop/route.ts` |
| クエスト報酬 | `user_item_history` | `api/quest/complete/route.ts` (rewards + loot_pool) |
| スキル習得 | `user_skills` | 既存テーブル流用 |

**設計原則**: 記録処理は全て `try/catch` で囲み、失敗しても本処理を妨げない。

### 2.3 UI

- **3タブ**: エネミー / アイテム / スキル
- 各タブに達成率バー（解放数/全数）
- テキストリスト形式。解放済みはタップで詳細ポップアップ、未解放は `─────` 表記
- エネミー詳細: ステータス表 + 画像（`/images/enemies/{slug}.webp`）
- アイテム/スキル詳細: 既存ShopModalのアイテム表示を流用

### 2.4 DBテーブル

```sql
-- user_bestiary: エネミー遭遇記録
CREATE TABLE public.user_bestiary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enemy_id INT NOT NULL,
  first_encountered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, enemy_id)
);

-- user_item_history: アイテム入手記録
CREATE TABLE public.user_item_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id INT NOT NULL,
  first_obtained_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);
```

RLS: SELECT は `auth.uid() = user_id`、INSERT/DELETE は service_role。

---

## 3. クエスト記録

### 3.1 API

**`GET /api/quest-log`** — 認証必須

全非UGCクエスト (`quest_type IN ('normal','special')` かつ `slug NOT LIKE 'ugc_%'`) のマスターと、ユーザーの完了状態を返す。

| フィールド | 完了済み | 未完了 |
|:---|:---|:---|
| id, slug, quest_type, category, rec_level | ✅ | ✅ |
| title, description, rewards, client_name | ✅ | `null` |

**category分類**:
- `main` = `slug LIKE 'main_ep%'`
- `special` = `quest_type === 'special'` かつ非main
- `normal` = `quest_type === 'normal'`

**追加テーブル不要**: `scenarios` + `user_completed_quests` で完結。

### 3.2 UI

- **3タブ**: メイン / スペシャル / ノーマル（各タブに達成数/全数）
- テキストリスト形式。`No.{id}` 左端表示
- 達成済み: タイトル + フレーバー表示 → タップで `QuestDetailPopup`（閲覧専用、受注ボタンなし）
- 未達成: `─────` シークレット表記、タップ不可

---

## 4. ランキング

### 4.1 概要

| ランキング | ソース | 集計頻度 | リセット条件 |
|:---|:---|:---|:---|
| 名声ランキング | `reputations` SUM(score) | 6時間ごと（世界の変換時） | 世代継承（profile/reset） |
| アライメントランキング | `user_profiles` の `*_pts` - ベースライン | 15分ごと | 6時間サイクルごとにリセット |

### 4.2 API

**`GET /api/ranking`** — 認証必須

**on-demand集計方式**: リクエスト時にキャッシュの鮮度を確認し、期限切れなら再集計。

**集計ロック**: 再集計開始前に `aggregated_at` を即座に更新し、同時リクエストの重複集計を防止。

```
レスポンス:
{
  reputation: {
    status: "ready" | "aggregating",
    aggregated_at: ISO8601,
    top_desc: [{ rank, name, value }],  // 上位20名（名声高い順）
    top_asc:  [{ rank, name, value }],  // 上位20名（名声低い順 = 悪名）
    my_value: number                    // リアルタイム計算
  },
  alignment: {
    status: "ready" | "aggregating",
    aggregated_at: ISO8601,
    cycle_started_at: ISO8601,
    cycle_ends_at: ISO8601,
    top: [{ rank, name, order, chaos, justice, evil, total }],  // 上位20名
    my_values: { order, chaos, justice, evil, total }           // リアルタイム計算
  }
}
```

### 4.3 集計ロジック

#### 名声ランキング
```sql
SELECT user_id, SUM(score) AS total_reputation
FROM reputations
GROUP BY user_id
ORDER BY total_reputation DESC
LIMIT 20;
```

#### アライメントランキング
```
今期間の貢献量 = user_profiles.*_pts - alignment_baseline.*_pts
total_gained = order_gained + chaos_gained + justice_gained + evil_gained
```

#### 6時間サイクルリセット時の処理
1. `alignment_baseline` を全ユーザーの現在のアライメント値で上書き
2. `ranking_alignment_cache` をクリア
3. 次回アクセス時に新サイクルの集計が走る

### 4.4 DBテーブル

```sql
-- 名声ランキングキャッシュ
CREATE TABLE public.ranking_reputation_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    total_reputation INT NOT NULL DEFAULT 0,
    rank_asc INT,
    rank_desc INT,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アライメントランキングキャッシュ
CREATE TABLE public.ranking_alignment_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    order_gained INT NOT NULL DEFAULT 0,
    chaos_gained INT NOT NULL DEFAULT 0,
    justice_gained INT NOT NULL DEFAULT 0,
    evil_gained INT NOT NULL DEFAULT 0,
    total_gained INT NOT NULL DEFAULT 0,
    rank INT,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cycle_started_at TIMESTAMPTZ
);

-- アライメントベースライン
CREATE TABLE public.alignment_baseline (
    user_id UUID PRIMARY KEY,
    order_pts INT NOT NULL DEFAULT 0,
    chaos_pts INT NOT NULL DEFAULT 0,
    justice_pts INT NOT NULL DEFAULT 0,
    evil_pts INT NOT NULL DEFAULT 0,
    cycle_started_at TIMESTAMPTZ NOT NULL
);
```

### 4.5 UX注意事項

> **ポイント消失なし**: 集計処理中にプレイヤーが獲得したアライメント値やクエスト報酬は、`user_profiles` にリアルタイムで加算されます。集計はスナップショットの作成に過ぎず、**プレイヤーのデータが消失・減少することはありません**。次回集計（最大15分後）で正しくランキングに反映されます。

> **画面停止の防止**: 集計はサーバー側で非同期的に完了します。集計中はランキング画面に「集計中...」のアニメーションを表示し、前回のキャッシュデータを併せて表示します。画面がフリーズしたり操作不能になることはありません。

> **自分の値はリアルタイム**: ランキング内の他プレイヤーの順位は最大15分遅れる場合がありますが、画面下部に表示される「あなたの値」は常にDBの最新値を直接読み取るため、タイムラグはありません。

### 4.6 UI

- **2タブ**: 名声 / アライメント
- **名声タブ**:
  - サブ切替: 「名声高い順」「悪名高い順」（トグルボタン）
  - 上位20名リスト（ランク・名前・値）
  - 自分の現在値
  - 最終集計日時
- **アライメントタブ**:
  - 世界の変換カウントダウン（`HH:MM:SS`、リアルタイム更新）
  - 上位20名リスト（ランク・名前・秩序/混沌/正義/悪/合計）
  - 自分の現在値（4軸 + 合計）
  - 最終集計日時

### 4.7 スケーリング指針

| ユーザー規模 | 推奨 |
|:---|:---|
| ~1,000人 | on-demand方式で十分 |
| 1,000~10,000人 | Vercel Cron Jobに移行（集計ロジックは分離済み） |
| 10,000人超 | PostgreSQL関数/マテリアライズドビューに移行 |

---

## 5. 共通: profile/reset 対応

世代継承（キャラクターリセット）時に以下のテーブルから該当ユーザーのデータを削除:

```typescript
// コレクション
await safeDelete('user_bestiary', 'user_id');
await safeDelete('user_item_history', 'user_id');
// ランキング
await safeDelete('ranking_reputation_cache', 'user_id');
await safeDelete('ranking_alignment_cache', 'user_id');
await safeDelete('alignment_baseline', 'user_id');
```

---

## 6. ファイル構成

```
src/
├── app/api/
│   ├── collection/route.ts          # コレクションAPI
│   ├── quest-log/route.ts           # クエストリストAPI
│   └── ranking/route.ts             # ランキングAPI
├── components/collection/
│   ├── CollectionModal.tsx           # コレクションモーダル
│   ├── EnemyDetailPopup.tsx          # エネミー詳細ポップアップ
│   ├── QuestLogModal.tsx             # クエストリストモーダル
│   ├── QuestDetailPopup.tsx          # クエスト詳細ポップアップ
│   └── RankingModal.tsx              # ランキングモーダル
├── components/inn/
│   └── FacilityGrid.tsx              # ハブ施設グリッド
└── app/inn/page.tsx                  # ハブページ（モーダル接続）
```
