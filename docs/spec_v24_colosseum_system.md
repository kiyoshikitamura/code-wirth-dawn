# spec_v24: コロシアム（闘技場）システム仕様書

**Version**: 1.0
**Date**: 2026-06-18
**Status**: Implemented & Verified

---

## 1. 概要

エンドコンテンツとして、Hub（名もなき旅人の拠所）を除くすべての通常拠点において「コロシアム（闘技場）」機能を実装する。
プレイヤーはゴールドを消費して難易度別の勝ち抜き3連戦〜20連戦に挑戦し、報酬の獲得や他のプレイヤーとのランキング競走（勝利数・最多連勝数）を楽しむことができる。

### 1.1 基本ルール

| 難易度 | 総戦数 | 挑戦費用（ゴールド） | 報酬 |
|:---|:---|:---|:---|
| **Easy** | 5戦 | プレイヤーレベル × 10 G | 報酬プールからランダムなアイテム/スキル (1個) |
| **Normal** | 10戦 | プレイヤーレベル × 30 G | 報酬プールからランダムなアイテム/スキル (1個) |
| **Hard** | 20戦 | プレイヤーレベル × 50 G | 報酬プールからランダムなアイテム/スキル (2個) |

- **ゴールド消費**: 受注（挑戦）時に即時引き去られる。ゴールドが不足している場合は挑戦できない。
- **デッキロック**: クエスト開始時にデッキがロックされ、挑戦中はスキルの変更や装備の変更が不可となる（一般クエストと同様のQuestEngine統合）。
- **戦闘構成**: 各戦闘は難易度ごとに定義された `colosseum_enemy_groups` プールからランダムに敵グループが選出される。
- **進行ノード**: シナリオは「1戦目」「2戦目」...と進行し、最終戦に勝利すると「クリア」、途中で敗北すると「失敗」となる。

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

- **RLS**:
  - `SELECT`: 誰でも参照可能（ランキング表示のため）。
  - `ALL`: `service_role` またはシステム側からのみ。

### 2.2 `ranking_colosseum_cache`（ランキングキャッシュ）
パフォーマンスとリアルタイム更新の負荷低減のため、最大500位までのランキング情報を保持するキャッシュテーブル。

```sql
CREATE TABLE IF NOT EXISTS public.ranking_colosseum_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    wins INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    rank_by_wins INTEGER,
    rank_by_streak INTEGER,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **集計処理**: `aggregate_colosseum_ranking()` 関数により、勝敗数が1以上のユーザーから上位500件を抽出し、勝利数順および最多連勝数順の順位を割り当ててキャッシュを更新する。

### 2.3 `colosseum_enemy_groups`（出現エネミープール）
各難易度に出現する敵グループのスラッグを紐づけるマスタテーブル。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_enemy_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    difficulty TEXT NOT NULL, -- 'easy', 'normal', 'hard'
    enemy_group_slug TEXT NOT NULL
);
```

### 2.4 `colosseum_reward_pool`（クリア報酬プール）
コロシアムをクリアした際に抽選されるレア・限定アイテム及びスキルのマスタテーブル。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_reward_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_type TEXT NOT NULL, -- 'item', 'skill'
    reward_id TEXT NOT NULL,   -- 各マスタのID（文字列または数値文字）
    name TEXT
);
```

---

## 3. API エンドポイント

### 3.1 `POST /api/colosseum/start`
コロシアムの挑戦を開始する。
- **処理**:
  1. ユーザーのアライメントや現在値の読み込み。
  2. 難易度に応じた挑戦ゴールド（レベル × 倍率）の算出と不足チェック。
  3. `increment_gold` RPC等を用いてアトミックにゴールドを引き去る。
  4. ユーザーのデッキをロック (`current_quest_id` に `colosseum_easy` 等を設定)。
  5. `user_chronicles` に開始記録を追加。

### 3.2 `GET /api/ranking/colosseum`
コロシアムランキングと現在ユーザーの順位をフェッチする。
- **返却データ**:
  - `top_by_wins`: 勝利数上位500名
  - `top_by_streak`: 連勝数上位500名
  - `my_rank`: 現在ユーザーのリアルタイム順位（勝利数、最多連勝数の順位）

### 3.3 `POST /api/battle/validate-result`（既存拡張）
戦闘終了検証時、コロシアム中のバトルであれば戦績を更新する。
- **処理**:
  - 勝利時: `wins = wins + 1`, `current_streak = current_streak + 1` とし、`current_streak > max_streak` であれば `max_streak` を更新。
  - 敗北時: `losses = losses + 1`, `current_streak = 0` にリセット。

### 3.4 `POST /api/quest/complete`（既存拡張）
コロシアム終了ノード（クリア）到達時の報酬付与処理。
- **処理**:
  - `colosseum_reward_pool` から難易度に応じた個数の報酬（アイテムまたはスキル）をランダムに抽選し、ユーザーのインベントリ/スキル習得データに直接付与する。

---

## 4. フロントエンド UI/UX

### 4.1 拠点への配置
ハブを除く拠点の `FacilityGrid.tsx` に「コロシアム (`colosseum`)」施設を追加。ルーン風の剣アイコン（`Swords`）で表示され、躍動感のあるホバーアクションを備える。

### 4.2 コロシアムメインモーダル (`ColosseumModal.tsx`)
- **受付NPC**: 歴戦の戦士「バルガス」のバストアップ立ち絵と歓迎セリフを表示。
- **難易度選択**: Easy / Normal / Hard の3つの選択肢を提供し、各ボタンの下部に現在のプレイヤーレベルから算出した消費ゴールド（例: `350 G`）を表示。
- **ゴールド不足ガード**: 所持ゴールドが足りない難易度のボタンは無効化（disabled）され、不足警告を表示。
- **ランキングアクセス**: モーダル右上から「ランキング」モーダルへワンタップで遷移可能。

### 4.3 コロシアムランキングモーダル (`ColosseumRankingModal.tsx`)
- **最大500位表示**: 勝利数、最多連勝数の2つのタブ構成で上位500名のランキングを表示。
- **現在の順位表示**: ランキングモーダルの最上部に、現在のユーザーの順位およびスコアを強調表示（未挑戦時は「未挑戦」と表示）。
- **未挑戦除外**: 勝敗数が0のユーザーはランキングのインデックスから自動除外。

### 4.4 背景グラフィック
闘技場専用の背景画像アセット `bg_colosseum.png` を新規に生成し、宿屋や一般拠点背景とは異なる、観衆の熱気と砂埃が舞う闘技場のビジュアルを適用した。
